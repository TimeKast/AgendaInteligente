/**
 * Tests for the 3 proactive Inngest crons — ISSUE-087.
 *
 * Strategy: mock enqueueAndSend + the db query layer. Each cron handler
 * has the same shape — list candidates, fan out, update meter on
 * success. We verify: empty input short-circuits, candidates trigger
 * enqueueAndSend, and the post-send write-back happens (silence stamp,
 * project kill_suggested_at).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { state } = vi.hoisted(() => ({
  state: {
    candidates: [] as unknown[],
    priorRows: [] as unknown[],
    updateInvoked: false as boolean,
  },
}));

const enqueueMock = vi.fn();
vi.mock('@/lib/notifications/proactive', () => ({
  enqueueAndSend: enqueueMock,
}));

vi.mock('@/lib/inngest/client', () => ({
  getInngest: () => ({
    createFunction: vi.fn(() => ({ id: () => 'cron' })),
  }),
}));

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => {
        const chain = {
          where: vi.fn(async () => state.candidates),
          // For the risk-alert "prior task" dedupe query (uses .limit).
          // We return priorRows from that.
          limit: vi.fn(async () => state.priorRows),
        };
        // Hook a `where().limit()` chain.
        const where = vi.fn(() => ({
          limit: chain.limit,
          then: (r: (x: unknown) => unknown) => r(state.candidates),
        }));
        return { ...chain, where };
      }),
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

interface FakeStep {
  run: ReturnType<typeof vi.fn>;
}

function makeStep(): FakeStep {
  return {
    run: vi.fn(async (_id: string, fn: () => unknown) => fn()),
  };
}

const makeLogger = () => ({ info: vi.fn(), error: vi.fn() });

beforeEach(() => {
  vi.clearAllMocks();
  state.candidates = [];
  state.priorRows = [];
  state.updateInvoked = false;
  enqueueMock.mockResolvedValue({ status: 'sent', taskId: 't-1', reason: 'ok' });
});

describe('runSilenceDetection', () => {
  it('returns zeros when no silent users', async () => {
    const { runSilenceDetection } = await import('@/lib/inngest/functions/silence-detection');
    const result = await runSilenceDetection({
      step: makeStep() as never,
      logger: makeLogger(),
    });
    expect(result).toEqual({ users: 0, sent: 0, skipped: 0 });
    expect(enqueueMock).not.toHaveBeenCalled();
  });

  it('enqueues silence_re_entry per candidate', async () => {
    state.candidates = [
      { id: 'u1', preferredLanguage: 'es' },
      { id: 'u2', preferredLanguage: 'en' },
    ];
    const { runSilenceDetection } = await import('@/lib/inngest/functions/silence-detection');
    const result = await runSilenceDetection({
      step: makeStep() as never,
      logger: makeLogger(),
    });

    expect(result.users).toBe(2);
    expect(result.sent).toBe(2);
    expect(enqueueMock).toHaveBeenCalledTimes(2);
    expect(enqueueMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', type: 'silence_re_entry' })
    );
  });

  it('stamps silence_re_entry_sent_at only when enqueue succeeded', async () => {
    state.candidates = [{ id: 'u1', preferredLanguage: 'es' }];
    enqueueMock.mockResolvedValueOnce({
      status: 'cancelled_anti_spam',
      taskId: 't',
      reason: 'over_24h_limit',
    });

    const { runSilenceDetection } = await import('@/lib/inngest/functions/silence-detection');
    const result = await runSilenceDetection({
      step: makeStep() as never,
      logger: makeLogger(),
    });

    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(1);
    expect(state.updateInvoked).toBe(false);
  });
});

describe('runRiskAlert', () => {
  it('returns zeros when no at-risk activities', async () => {
    const { runRiskAlert } = await import('@/lib/inngest/functions/risk-alert');
    const result = await runRiskAlert({
      step: makeStep() as never,
      logger: makeLogger(),
    });
    expect(result).toEqual({ activities: 0, sent: 0, skipped: 0 });
  });

  it('enqueues risk_alert per activity + dedupes via prior task lookup', async () => {
    state.candidates = [
      {
        id: 'a1',
        userId: 'u1',
        title: 'Reporte Q4',
        deadline: new Date('2026-06-01T00:00:00Z'),
      },
    ];
    state.priorRows = [];

    const { runRiskAlert } = await import('@/lib/inngest/functions/risk-alert');
    const result = await runRiskAlert({ step: makeStep() as never, logger: makeLogger() });

    expect(result.activities).toBe(1);
    expect(result.sent).toBe(1);
    expect(enqueueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'risk_alert',
        title: 'Reporte Q4',
        payload: expect.objectContaining({ activity_id: 'a1' }),
      })
    );
  });

  it('skips an activity that already has a prior risk_alert task', async () => {
    state.candidates = [
      {
        id: 'a-dup',
        userId: 'u1',
        title: 'X',
        deadline: new Date('2026-06-01T00:00:00Z'),
      },
    ];
    state.priorRows = [{ id: 'prior-task' }];

    const { runRiskAlert } = await import('@/lib/inngest/functions/risk-alert');
    const result = await runRiskAlert({ step: makeStep() as never, logger: makeLogger() });

    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(1);
    expect(enqueueMock).not.toHaveBeenCalled();
  });
});

describe('runProjectKillSuggestion', () => {
  it('returns zeros when no stale projects', async () => {
    const { runProjectKillSuggestion } =
      await import('@/lib/inngest/functions/project-kill-suggestion');
    const result = await runProjectKillSuggestion({
      step: makeStep() as never,
      logger: makeLogger(),
    });
    expect(result).toEqual({ projects: 0, sent: 0, skipped: 0 });
  });

  it('enqueues + stamps kill_suggested_at when sent succeeded', async () => {
    state.candidates = [{ id: 'p1', userId: 'u1', name: 'Side hustle' }];

    const { runProjectKillSuggestion } =
      await import('@/lib/inngest/functions/project-kill-suggestion');
    const result = await runProjectKillSuggestion({
      step: makeStep() as never,
      logger: makeLogger(),
    });

    expect(result.sent).toBe(1);
    expect(enqueueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'project_kill_suggestion',
        title: 'Side hustle',
        payload: expect.objectContaining({ project_id: 'p1' }),
      })
    );
    expect(state.updateInvoked).toBe(true);
  });

  it('does NOT stamp kill_suggested_at when enqueue was cancelled', async () => {
    state.candidates = [{ id: 'p1', userId: 'u1', name: 'X' }];
    enqueueMock.mockResolvedValueOnce({
      status: 'cancelled_anti_spam',
      taskId: 't',
      reason: 'over_24h_limit',
    });

    const { runProjectKillSuggestion } =
      await import('@/lib/inngest/functions/project-kill-suggestion');
    const result = await runProjectKillSuggestion({
      step: makeStep() as never,
      logger: makeLogger(),
    });

    expect(result.skipped).toBe(1);
    expect(state.updateInvoked).toBe(false);
  });
});
