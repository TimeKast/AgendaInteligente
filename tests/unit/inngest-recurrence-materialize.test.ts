/**
 * Tests for the `recurrence.materialize.due` handler — ISSUE-080.
 *
 * We exercise the exported `runRecurrenceMaterialize` body directly with
 * a hand-rolled `step` (executes its callback immediately) and a mock
 * logger. Mocks block the real DB and the per-user materializer.
 *
 * Locks in:
 *   - Empty user table → early return with zeros.
 *   - Fan-out invokes `materializeUserRecurrences` once per active user.
 *   - One user's failure does NOT tumble the batch (allSettled).
 *   - Failures are logged with userId for ops visibility.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const materializeMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/cron/recurrence', () => ({
  materializeUserRecurrences: materializeMock,
}));

// We don't exercise drizzle SQL — the user list comes from the mocked
// `step.run('list-active-users', ...)` callback, which we substitute below.
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    })),
  },
}));

// Stub the Inngest client so module load doesn't try to call createFunction.
vi.mock('@/lib/inngest/client', () => ({
  getInngest: () => ({
    createFunction: vi.fn(() => ({ id: () => 'recurrence-materialize-daily' })),
  }),
}));

interface FakeStep {
  run: ReturnType<typeof vi.fn>;
}

function makeStep(listResult: { id: string }[]): FakeStep {
  const runImpl = async (id: string, fn: () => unknown) => {
    if (id === 'list-active-users') return listResult;
    return await fn();
  };
  // Cast: the real step.run signature is generic; the test only needs the
  // call-recording surface plus the immediate-execution semantics.
  return { run: vi.fn(runImpl) };
}

function makeLogger() {
  return { info: vi.fn(), error: vi.fn() };
}

describe('runRecurrenceMaterialize', () => {
  beforeEach(() => {
    materializeMock.mockReset();
  });

  it('returns zeros and short-circuits when no active users', async () => {
    const { runRecurrenceMaterialize } =
      await import('@/lib/inngest/functions/recurrence-materialize');
    const step = makeStep([]);
    const logger = makeLogger();

    const result = await runRecurrenceMaterialize({
      step: step as unknown as Parameters<typeof runRecurrenceMaterialize>[0]['step'],
      logger,
    });

    expect(result).toEqual({ users: 0, ok: 0, failed: 0 });
    expect(materializeMock).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('no active users'));
  });

  it('fans out one materialize call per active user', async () => {
    materializeMock.mockResolvedValue({ created: 3, skipped: 0, parentCount: 1 });

    const { runRecurrenceMaterialize } =
      await import('@/lib/inngest/functions/recurrence-materialize');
    const userList = [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }];
    const step = makeStep(userList);
    const logger = makeLogger();

    const result = await runRecurrenceMaterialize({
      step: step as unknown as Parameters<typeof runRecurrenceMaterialize>[0]['step'],
      logger,
    });

    expect(result).toEqual({ users: 3, ok: 3, failed: 0 });
    expect(materializeMock).toHaveBeenCalledTimes(3);
    expect(materializeMock).toHaveBeenNthCalledWith(1, 'u1');
    expect(materializeMock).toHaveBeenNthCalledWith(2, 'u2');
    expect(materializeMock).toHaveBeenNthCalledWith(3, 'u3');
  });

  it('isolates per-user failures (one user breaks, the rest succeed)', async () => {
    materializeMock
      .mockResolvedValueOnce({ created: 1, skipped: 0, parentCount: 1 })
      .mockRejectedValueOnce(new Error('DB blip for u2'))
      .mockResolvedValueOnce({ created: 2, skipped: 0, parentCount: 1 });

    const { runRecurrenceMaterialize } =
      await import('@/lib/inngest/functions/recurrence-materialize');
    const step = makeStep([{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }]);
    const logger = makeLogger();

    const result = await runRecurrenceMaterialize({
      step: step as unknown as Parameters<typeof runRecurrenceMaterialize>[0]['step'],
      logger,
    });

    expect(result).toEqual({ users: 3, ok: 2, failed: 1 });
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('userId=u2'),
      expect.any(Error)
    );
  });

  it('wraps each per-user materialize in its own step.run for retry granularity', async () => {
    materializeMock.mockResolvedValue({ created: 0, skipped: 0, parentCount: 0 });

    const { runRecurrenceMaterialize } =
      await import('@/lib/inngest/functions/recurrence-materialize');
    const step = makeStep([{ id: 'alpha' }, { id: 'beta' }]);

    await runRecurrenceMaterialize({
      step: step as unknown as Parameters<typeof runRecurrenceMaterialize>[0]['step'],
      logger: makeLogger(),
    });

    const stepIds = step.run.mock.calls.map((c) => c[0]);
    expect(stepIds).toContain('list-active-users');
    expect(stepIds).toContain('materialize-alpha');
    expect(stepIds).toContain('materialize-beta');
  });
});
