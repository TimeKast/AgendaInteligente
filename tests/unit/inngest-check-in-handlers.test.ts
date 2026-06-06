/**
 * Tests for the 5 check-in event handlers — ISSUE-083, 084, 085.
 *
 * Each handler is the same shape — load language, build a localized
 * push, route through enqueueAndSend with the right type + payload.
 * Midday adds a CONDITIONAL gate (`shouldFireMidday`).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { state } = vi.hoisted(() => ({
  state: {
    lang: 'es' as 'es' | 'en',
    daySheetRow: null as { winsPlanned: string[] | null } | null,
    pendingActivities: [] as Array<{ title: string }>,
  },
}));

const enqueueMock = vi.fn();
vi.mock('@/lib/notifications/proactive', () => ({
  enqueueAndSend: enqueueMock,
}));

vi.mock('@/lib/inngest/client', () => ({
  getInngest: () => ({
    createFunction: vi.fn(() => ({ id: () => 'handler' })),
  }),
}));

const { fromOrder } = vi.hoisted(() => ({ fromOrder: { i: 0 } }));

/**
 * Mock strategy: we don't care which `select()` call we're in, only
 * which table the `from(<table>)` call references. We tag every
 * Drizzle table with a Symbol(drizzle:Name) so we can pattern-match.
 * Simpler: identify by index but read the *whole chain* eagerly per
 * call sequence — morning/evening do (lang). Midday does (daySheet
 * → activities[limit] → lang).
 */
vi.mock('@/lib/db/drizzle', () => {
  return {
    db: {
      select: vi.fn(() => ({
        from: vi.fn(() => {
          const turn = fromOrder.i++;
          // Build a thenable that also exposes `.limit(...)` so either
          // chain shape works (`where()` awaited OR `where().limit()`).
          const buildResult = () => {
            // Midday ordering: 0=daySheet, 1=activities, 2=lang.
            // Morning/evening/weekly: 0=lang.
            // We expose state for ALL three; consumers read the right slot.
            if (turn === 0) {
              // Could be lang (morning/evening/weekly) OR daySheet (midday).
              // We return BOTH a lang row AND a daySheet row — drizzle
              // mocks pick one based on which select.from() was called
              // first. In practice morning/evening only ever go through
              // ONE select per call, so we lean on the daySheetRow being
              // null for them.
              if (state.daySheetRow !== null) return [state.daySheetRow];
              return [{ preferredLanguage: state.lang }];
            }
            if (turn === 1) {
              // Midday: activities pending query.
              return state.pendingActivities;
            }
            // Subsequent (midday lang lookup):
            return [{ preferredLanguage: state.lang }];
          };
          const buildLimitResult = () => state.pendingActivities;
          const whereResult = {
            then(resolve: (v: unknown) => unknown) {
              return resolve(buildResult());
            },
            limit: vi.fn(async () => buildLimitResult()),
          };
          return {
            where: vi.fn(() => whereResult),
          };
        }),
      })),
    },
  };
});

interface FakeStep {
  run: ReturnType<typeof vi.fn>;
}

function makeStep(): FakeStep {
  return {
    run: vi.fn(async (_id: string, fn: () => unknown) => fn()),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.lang = 'es';
  state.daySheetRow = null;
  state.pendingActivities = [];
  fromOrder.i = 0;
  enqueueMock.mockResolvedValue({ status: 'sent', taskId: 't' });
});

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('runMorningCheckIn', () => {
  it('enqueues morning_open with Spanish copy by default', async () => {
    vi.resetModules();
    const { runMorningCheckIn } = await import('@/lib/inngest/functions/check-in-handlers');
    const result = await runMorningCheckIn({
      step: makeStep() as never,
      event: { data: { userId: USER, date: '2026-05-27' } },
    });

    expect(result.status).toBe('sent');
    expect(enqueueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER,
        type: 'morning_open',
        title: 'Buenos días',
        url: '/chat?context=morning_check&date=2026-05-27',
      })
    );
  });

  it('emits English copy when preferred_language=en', async () => {
    vi.resetModules();
    state.lang = 'en';
    const { runMorningCheckIn } = await import('@/lib/inngest/functions/check-in-handlers');
    await runMorningCheckIn({
      step: makeStep() as never,
      event: { data: { userId: USER, date: '2026-05-27' } },
    });
    expect(enqueueMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'Good morning' }));
  });
});

describe('runEveningCheckIn', () => {
  it('enqueues evening_close with date in the deep-link', async () => {
    vi.resetModules();
    const { runEveningCheckIn } = await import('@/lib/inngest/functions/check-in-handlers');
    await runEveningCheckIn({
      step: makeStep() as never,
      event: { data: { userId: USER, date: '2026-05-27' } },
    });
    expect(enqueueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'evening_close',
        url: '/chat?context=evening_close&date=2026-05-27',
      })
    );
  });
});

describe('runMiddayCheckIn — always fires', () => {
  it('fires with the planned win substituted into {win}', async () => {
    vi.resetModules();
    state.daySheetRow = { winsPlanned: ['cerrar el reporte', 'almorzar'] };
    state.pendingActivities = [{ title: 'cerrar el reporte' }];
    const { runMiddayCheckIn } = await import('@/lib/inngest/functions/check-in-handlers');
    const result = await runMiddayCheckIn({
      step: makeStep() as never,
      event: { data: { userId: USER, date: '2026-05-27' } },
    });
    expect(result.status).toBe('sent');
    expect(enqueueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'midday_check',
        body: expect.stringContaining('cerrar el reporte'),
      })
    );
  });

  it('fires when there is no planned win — {win} placeholder is stripped', async () => {
    vi.resetModules();
    state.daySheetRow = null;
    state.pendingActivities = [];
    const { runMiddayCheckIn } = await import('@/lib/inngest/functions/check-in-handlers');
    const result = await runMiddayCheckIn({
      step: makeStep() as never,
      event: { data: { userId: USER, date: '2026-05-27' } },
    });
    expect(result.status).toBe('sent');
    expect(enqueueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'midday_check',
        // Default Spanish midday body without the {win} substitution
        // would have left a dangling "ibas a ." — the resolver strips
        // the token + the trailing dot cleanly.
        body: expect.not.stringContaining('{win}'),
      })
    );
  });

  it('falls back to a pending activity title when no winsPlanned but pending exists', async () => {
    vi.resetModules();
    state.daySheetRow = null;
    state.pendingActivities = [{ title: 'enviar email' }];
    const { runMiddayCheckIn } = await import('@/lib/inngest/functions/check-in-handlers');
    const result = await runMiddayCheckIn({
      step: makeStep() as never,
      event: { data: { userId: USER, date: '2026-05-27' } },
    });
    expect(result.status).toBe('sent');
    expect(enqueueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'midday_check',
        body: expect.stringContaining('enviar email'),
      })
    );
  });
});

describe('runWeeklyKickoff + runWeeklyReview', () => {
  it('kickoff enqueues with weekStarting payload', async () => {
    vi.resetModules();
    const { runWeeklyKickoff } = await import('@/lib/inngest/functions/check-in-handlers');
    await runWeeklyKickoff({
      step: makeStep() as never,
      event: { data: { userId: USER, weekStarting: '2026-05-24' } },
    });
    expect(enqueueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'weekly_kickoff',
        url: '/chat?context=weekly_kickoff&weekStarting=2026-05-24',
        payload: { context: 'weekly_kickoff', weekStarting: '2026-05-24' },
      })
    );
  });

  it('review enqueues with weekStarting payload', async () => {
    vi.resetModules();
    const { runWeeklyReview } = await import('@/lib/inngest/functions/check-in-handlers');
    await runWeeklyReview({
      step: makeStep() as never,
      event: { data: { userId: USER, weekStarting: '2026-05-17' } },
    });
    expect(enqueueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'weekly_review',
        payload: { context: 'weekly_review', weekStarting: '2026-05-17' },
      })
    );
  });
});
