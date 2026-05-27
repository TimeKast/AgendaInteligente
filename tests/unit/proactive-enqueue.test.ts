/**
 * Tests for enqueueAndSend — ISSUE-082 (OPS-1 / OPS-2 / mute / listening).
 *
 * Verifies the 4-gate cascade by staging mocked count + select results.
 * Every gate writes a row (success OR cancellation) — we assert both
 * the returned status AND that sendPush was/wasn't called.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { state } = vi.hoisted(() => ({
  state: {
    sentCount: 0 as number,
    recentChallenge: [] as unknown[],
    prefRow: null as { mutedUntil: Date | null; intensityMode: string } | null,
    insertedRows: [] as Array<{ status: string; type: string }>,
    updates: [] as Array<{ id: string; set: unknown }>,
  },
}));

const sendPushMock = vi.fn();
vi.mock('@/lib/notifications/push', () => ({
  sendPush: sendPushMock,
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/db/drizzle', () => {
  const selectCallCount = { i: 0 };

  return {
    db: {
      select: vi.fn((cols?: Record<string, unknown>) => {
        const turn = selectCallCount.i++;
        return {
          from: vi.fn(() => {
            // The `where()` either resolves a Promise (Gate 1 count, Gate 3
            // prefs after innerJoin) OR returns a builder with `.limit()`
            // (Gate 2 challenge lookup). We return BOTH shapes — a thenable
            // that also has a `.limit()` method — so either chain compiles.
            const buildResult = () => {
              if (cols && 'c' in cols) return [{ c: state.sentCount }];
              if (turn === 1) return state.recentChallenge;
              return state.prefRow ? [state.prefRow] : [];
            };
            const whereResult = {
              then(resolve: (v: unknown) => unknown) {
                return resolve(buildResult());
              },
              limit: vi.fn(async () => state.recentChallenge),
            };
            return {
              where: vi.fn(() => whereResult),
              innerJoin: vi.fn(() => ({
                where: vi.fn(async () => (state.prefRow ? [state.prefRow] : [])),
              })),
            };
          }),
        };
      }),
      insert: vi.fn(() => ({
        values: vi.fn((vals: { status: string; type: string }) => {
          state.insertedRows.push(vals);
          return {
            returning: vi.fn(async () => [{ id: `task-${state.insertedRows.length}` }]),
          };
        }),
      })),
      update: vi.fn(() => ({
        set: vi.fn((set: unknown) => ({
          where: vi.fn(async () => {
            state.updates.push({ id: 'last', set });
            return undefined;
          }),
        })),
      })),
    },
  };
});

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

beforeEach(() => {
  vi.clearAllMocks();
  state.sentCount = 0;
  state.recentChallenge = [];
  state.prefRow = { mutedUntil: null, intensityMode: 'standard' };
  state.insertedRows = [];
  state.updates = [];
});

describe('enqueueAndSend — happy path', () => {
  it('sends + records sent status when all gates pass', async () => {
    const { enqueueAndSend } = await import('@/lib/notifications/proactive');
    const result = await enqueueAndSend({
      userId: USER,
      type: 'morning_open',
      title: 'Buenos días',
      body: 'Cómo arrancamos?',
    });

    expect(result.status).toBe('sent');
    expect(result.reason).toBe('ok');
    expect(sendPushMock).toHaveBeenCalledOnce();
    // Row inserted as pending then updated to sent.
    expect(state.insertedRows[0].status).toBe('pending');
    expect((state.updates[0].set as { status: string }).status).toBe('sent');
  });
});

describe('enqueueAndSend — OPS-1 24h limit', () => {
  it('cancels when ≥4 sent tasks in last 24h', async () => {
    state.sentCount = 4;
    const { enqueueAndSend } = await import('@/lib/notifications/proactive');
    const result = await enqueueAndSend({
      userId: USER,
      type: 'midday_check',
      title: 'x',
      body: 'y',
    });

    expect(result.status).toBe('cancelled_anti_spam');
    expect(result.reason).toBe('over_24h_limit');
    expect(sendPushMock).not.toHaveBeenCalled();
    expect(state.insertedRows[0].status).toBe('cancelled_anti_spam');
  });

  it('allows the 4th task when count is exactly 3', async () => {
    state.sentCount = 3;
    const { enqueueAndSend } = await import('@/lib/notifications/proactive');
    const result = await enqueueAndSend({
      userId: USER,
      type: 'evening_close',
      title: 'x',
      body: 'y',
    });
    expect(result.status).toBe('sent');
  });
});

describe('enqueueAndSend — OPS-2 weekly challenge limit', () => {
  it('cancels challenge when one was already sent in the last 7 days', async () => {
    state.recentChallenge = [{ id: 'pre-existing' }];
    const { enqueueAndSend } = await import('@/lib/notifications/proactive');
    const result = await enqueueAndSend({
      userId: USER,
      type: 'pattern_challenge',
      title: 'x',
      body: 'y',
    });

    expect(result.status).toBe('cancelled_anti_spam');
    expect(result.reason).toBe('challenge_within_week');
    expect(sendPushMock).not.toHaveBeenCalled();
  });

  it('non-challenge type bypasses the weekly window', async () => {
    state.recentChallenge = [{ id: 'pre' }]; // would block challenges
    const { enqueueAndSend } = await import('@/lib/notifications/proactive');
    const result = await enqueueAndSend({
      userId: USER,
      type: 'morning_open',
      title: 'x',
      body: 'y',
    });
    expect(result.status).toBe('sent');
  });

  it('first-ever challenge fires (no prior in window)', async () => {
    state.recentChallenge = [];
    const { enqueueAndSend } = await import('@/lib/notifications/proactive');
    const result = await enqueueAndSend({
      userId: USER,
      type: 'risk_alert',
      title: 'x',
      body: 'y',
    });
    expect(result.status).toBe('sent');
  });
});

describe('enqueueAndSend — muted_until + listening', () => {
  it('cancels when muted_until is in the future', async () => {
    state.prefRow = {
      mutedUntil: new Date(Date.now() + 3600_000),
      intensityMode: 'standard',
    };
    const { enqueueAndSend } = await import('@/lib/notifications/proactive');
    const result = await enqueueAndSend({
      userId: USER,
      type: 'morning_open',
      title: 'x',
      body: 'y',
    });
    expect(result.status).toBe('cancelled_muted');
    expect(sendPushMock).not.toHaveBeenCalled();
  });

  it('allows non-listening user (challenge) through', async () => {
    state.prefRow = { mutedUntil: null, intensityMode: 'sharp' };
    const { enqueueAndSend } = await import('@/lib/notifications/proactive');
    const result = await enqueueAndSend({
      userId: USER,
      type: 'pattern_challenge',
      title: 'x',
      body: 'y',
    });
    expect(result.status).toBe('sent');
  });

  it('skips challenge when user is in listening mode', async () => {
    state.prefRow = { mutedUntil: null, intensityMode: 'listening' };
    const { enqueueAndSend } = await import('@/lib/notifications/proactive');
    const result = await enqueueAndSend({
      userId: USER,
      type: 'pattern_challenge',
      title: 'x',
      body: 'y',
    });
    expect(result.status).toBe('cancelled_listening');
    expect(sendPushMock).not.toHaveBeenCalled();
  });

  it('listening mode does NOT block non-challenge check-ins', async () => {
    state.prefRow = { mutedUntil: null, intensityMode: 'listening' };
    const { enqueueAndSend } = await import('@/lib/notifications/proactive');
    const result = await enqueueAndSend({
      userId: USER,
      type: 'evening_close',
      title: 'x',
      body: 'y',
    });
    expect(result.status).toBe('sent');
  });
});

describe('enqueueAndSend — sendPush failure isolation', () => {
  it('still marks task as sent + does not throw when sendPush errors', async () => {
    sendPushMock.mockRejectedValueOnce(new Error('transient web-push outage'));
    const { enqueueAndSend } = await import('@/lib/notifications/proactive');
    const result = await enqueueAndSend({
      userId: USER,
      type: 'morning_open',
      title: 'x',
      body: 'y',
    });
    expect(result.status).toBe('sent');
    expect((state.updates[0].set as { status: string }).status).toBe('sent');
  });
});

describe('markResponded', () => {
  it('updates status + responded_at when task is sent', async () => {
    const { markResponded } = await import('@/lib/notifications/proactive');
    await markResponded('task-1');
    expect(state.updates[0].set).toMatchObject({
      status: 'responded',
      respondedAt: expect.any(Date),
    });
  });
});
