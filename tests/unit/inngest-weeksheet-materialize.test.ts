/**
 * Tests for the `weekly.materialize.next` handler — ISSUE-034.
 *
 * Locks in:
 *   - Empty user table → early return with zeros.
 *   - Fan-out invokes `tryCreateWeekSheet` once per active user with the
 *     PER-USER next-Sunday (resolved in that user's TZ).
 *   - Mix of created vs skipped counts correctly.
 *   - One user's failure does NOT tumble the batch (allSettled).
 *   - Per-user `step.run` IDs are `materialize-<userId>` for retry
 *     granularity.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const tryCreateMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/db/queries/sheets', () => ({
  tryCreateWeekSheet: tryCreateMock,
}));

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
    createFunction: vi.fn(() => ({ id: () => 'weeksheet-materialize-friday' })),
  }),
}));

interface FakeStep {
  run: ReturnType<typeof vi.fn>;
}

function makeStep(listResult: { id: string; timezone: string }[]): FakeStep {
  const runImpl = async (id: string, fn: () => unknown) => {
    if (id === 'list-active-users') return listResult;
    return await fn();
  };
  return { run: vi.fn(runImpl) };
}

function makeLogger() {
  return { info: vi.fn(), error: vi.fn() };
}

// Cast helper — the FakeStep + run-typed-vi.fn combo doesn't satisfy the
// real generic StepLike at compile time; the test only needs call recording.
function cast(
  step: FakeStep
): Parameters<
  typeof import('@/lib/inngest/functions/weeksheet-materialize').runWeeksheetMaterialize
>[0]['step'] {
  return step as unknown as Parameters<
    typeof import('@/lib/inngest/functions/weeksheet-materialize').runWeeksheetMaterialize
  >[0]['step'];
}

describe('runWeeksheetMaterialize', () => {
  beforeEach(() => {
    tryCreateMock.mockReset();
  });

  it('returns zeros and short-circuits when no active users', async () => {
    const { runWeeksheetMaterialize } =
      await import('@/lib/inngest/functions/weeksheet-materialize');
    const step = makeStep([]);
    const logger = makeLogger();

    const result = await runWeeksheetMaterialize({ step: cast(step), logger });

    expect(result).toEqual({ users: 0, created: 0, skipped: 0, failed: 0 });
    expect(tryCreateMock).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('no active users'));
  });

  it('fans out one tryCreate call per user with each user TZ', async () => {
    tryCreateMock.mockResolvedValue({ created: true });

    const { runWeeksheetMaterialize } =
      await import('@/lib/inngest/functions/weeksheet-materialize');
    // Friday 2026-05-22 18:00 UTC. Next Sunday in MX is 2026-05-24.
    // Next Sunday in Tokyo is also 2026-05-24 (Tokyo is +9, so Fri 18:00
    // UTC is Sat 03:00 Tokyo — still in the same week).
    const now = new Date(Date.UTC(2026, 4, 22, 18, 0));
    const step = makeStep([
      { id: 'u-mx', timezone: 'America/Mexico_City' },
      { id: 'u-tok', timezone: 'Asia/Tokyo' },
    ]);
    const logger = makeLogger();

    const result = await runWeeksheetMaterialize({ step: cast(step), logger, now });

    expect(result).toEqual({ users: 2, created: 2, skipped: 0, failed: 0 });
    expect(tryCreateMock).toHaveBeenCalledTimes(2);
    expect(tryCreateMock).toHaveBeenNthCalledWith(1, 'u-mx', '2026-05-24');
    expect(tryCreateMock).toHaveBeenNthCalledWith(2, 'u-tok', '2026-05-24');
  });

  it('counts skipped when sheet already exists (idempotent re-run)', async () => {
    tryCreateMock
      .mockResolvedValueOnce({ created: true }) // u1 — fresh
      .mockResolvedValueOnce({ created: false }) // u2 — already had one
      .mockResolvedValueOnce({ created: false }); // u3 — already had one

    const { runWeeksheetMaterialize } =
      await import('@/lib/inngest/functions/weeksheet-materialize');
    const now = new Date(Date.UTC(2026, 4, 22, 18, 0));
    const step = makeStep([
      { id: 'u1', timezone: 'UTC' },
      { id: 'u2', timezone: 'UTC' },
      { id: 'u3', timezone: 'UTC' },
    ]);

    const result = await runWeeksheetMaterialize({ step: cast(step), logger: makeLogger(), now });

    expect(result).toEqual({ users: 3, created: 1, skipped: 2, failed: 0 });
  });

  it('isolates per-user failures (one user breaks, the rest succeed)', async () => {
    tryCreateMock
      .mockResolvedValueOnce({ created: true })
      .mockRejectedValueOnce(new Error('DB blip for u2'))
      .mockResolvedValueOnce({ created: true });

    const { runWeeksheetMaterialize } =
      await import('@/lib/inngest/functions/weeksheet-materialize');
    const now = new Date(Date.UTC(2026, 4, 22, 18, 0));
    const step = makeStep([
      { id: 'u1', timezone: 'UTC' },
      { id: 'u2', timezone: 'UTC' },
      { id: 'u3', timezone: 'UTC' },
    ]);
    const logger = makeLogger();

    const result = await runWeeksheetMaterialize({ step: cast(step), logger, now });

    expect(result).toEqual({ users: 3, created: 2, skipped: 0, failed: 1 });
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('userId=u2'),
      expect.any(Error)
    );
  });

  it('wraps each per-user materialize in its own step.run for retry granularity', async () => {
    tryCreateMock.mockResolvedValue({ created: true });

    const { runWeeksheetMaterialize } =
      await import('@/lib/inngest/functions/weeksheet-materialize');
    const now = new Date(Date.UTC(2026, 4, 22, 18, 0));
    const step = makeStep([
      { id: 'alpha', timezone: 'UTC' },
      { id: 'beta', timezone: 'UTC' },
    ]);

    await runWeeksheetMaterialize({ step: cast(step), logger: makeLogger(), now });

    const stepIds = step.run.mock.calls.map((c) => c[0]);
    expect(stepIds).toContain('list-active-users');
    expect(stepIds).toContain('materialize-alpha');
    expect(stepIds).toContain('materialize-beta');
  });
});
