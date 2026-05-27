/**
 * Tests for listening-mode-expired + gentle-default-expired crons — ISSUE-054.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { state } = vi.hoisted(() => ({
  state: {
    selectResult: [] as unknown[],
    updateInvoked: false,
  },
}));

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(async () => state.selectResult),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(async () => {
          state.updateInvoked = true;
          return undefined;
        }),
      })),
    })),
  },
}));

vi.mock('@/lib/inngest/client', () => ({
  getInngest: () => ({
    createFunction: vi.fn(() => ({ id: () => 'cron' })),
  }),
}));

interface FakeStep {
  run: ReturnType<typeof vi.fn>;
}

function makeStep(): FakeStep {
  return {
    run: vi.fn(async (id: string, fn: () => unknown) => {
      if (id === 'list-expired-listening-users' || id === 'list-expired-gentle-users') {
        return state.selectResult;
      }
      return await fn();
    }),
  };
}

function makeLogger() {
  return { info: vi.fn(), error: vi.fn() };
}

beforeEach(() => {
  state.selectResult = [];
  state.updateInvoked = false;
});

describe('runListeningModeExpired', () => {
  it('returns reverted=0 + no UPDATE when no users expired', async () => {
    const { runListeningModeExpired } =
      await import('@/lib/inngest/functions/listening-mode-expired');
    const result = await runListeningModeExpired({
      step: makeStep() as never,
      logger: makeLogger(),
    });

    expect(result).toEqual({ reverted: 0 });
    expect(state.updateInvoked).toBe(false);
  });

  it('reverts batch when expired users found', async () => {
    state.selectResult = [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }];

    const { runListeningModeExpired } =
      await import('@/lib/inngest/functions/listening-mode-expired');
    const result = await runListeningModeExpired({
      step: makeStep() as never,
      logger: makeLogger(),
    });

    expect(result).toEqual({ reverted: 3 });
    expect(state.updateInvoked).toBe(true);
  });
});

describe('runGentleDefaultExpired', () => {
  it('returns migrated=0 + no UPDATE when no users past 14d', async () => {
    const { runGentleDefaultExpired } =
      await import('@/lib/inngest/functions/gentle-default-expired');
    const result = await runGentleDefaultExpired({
      step: makeStep() as never,
      logger: makeLogger(),
    });

    expect(result).toEqual({ migrated: 0 });
    expect(state.updateInvoked).toBe(false);
  });

  it('migrates batch when users past intensity_default_until', async () => {
    state.selectResult = [{ id: 'u-new' }];

    const { runGentleDefaultExpired } =
      await import('@/lib/inngest/functions/gentle-default-expired');
    const result = await runGentleDefaultExpired({
      step: makeStep() as never,
      logger: makeLogger(),
    });

    expect(result).toEqual({ migrated: 1 });
    expect(state.updateInvoked).toBe(true);
  });
});
