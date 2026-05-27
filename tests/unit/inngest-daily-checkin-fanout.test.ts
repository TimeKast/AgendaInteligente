/**
 * Tests for the daily check-in fan-out handler — ISSUE-080b.
 *
 * Locks in:
 *   - Empty user table → no events emitted.
 *   - User with matching slot → exactly 1 event with the right payload.
 *   - User with NO matching slot → no events.
 *   - Multi-user, multi-TZ → each gets its own event timed to their TZ.
 *   - Dedupe step.run ids contain `<userId>-<isoDate>-<slot>`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { state } = vi.hoisted(() => ({
  state: {
    userRows: [] as unknown[],
    published: [] as Array<{ name: string; data: unknown }>,
    stepIds: [] as string[],
  },
}));

const publishMock = vi.fn(async (name: string, data: unknown) => {
  state.published.push({ name, data });
});

vi.mock('@/lib/inngest/publish', () => ({
  publish: publishMock,
}));

vi.mock('@/lib/inngest/client', () => ({
  getInngest: () => ({
    createFunction: vi.fn(() => ({ id: () => 'daily-checkin-fanout' })),
  }),
}));

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(async () => state.userRows),
        })),
      })),
    })),
  },
}));

interface FakeStep {
  run: ReturnType<typeof vi.fn>;
}

function makeStep(rows: unknown[]): FakeStep {
  const runImpl = async (id: string, fn: () => unknown) => {
    state.stepIds.push(id);
    if (id === 'list-active-users-with-prefs') return rows;
    return await fn();
  };
  return { run: vi.fn(runImpl) };
}

function makeLogger() {
  return { info: vi.fn(), error: vi.fn() };
}

function cast(step: FakeStep) {
  return step as unknown as Parameters<
    typeof import('@/lib/inngest/functions/daily-checkin-fanout').runDailyCheckinFanout
  >[0]['step'];
}

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u1',
    timezone: 'America/Mexico_City',
    morningTime: '08:00',
    middayTime: '13:00',
    eveningTime: '21:00',
    weeklyKickoffDow: 0,
    weeklyKickoffTime: '18:00',
    weeklyReviewDow: 6,
    weeklyReviewTime: '20:00',
    weekendSkip: false,
    daysOff: [] as string[],
    mutedUntil: null,
    ...overrides,
  };
}

beforeEach(() => {
  state.userRows = [];
  state.published = [];
  state.stepIds = [];
  publishMock.mockClear();
});

describe('runDailyCheckinFanout', () => {
  it('returns zeros + emits nothing on empty user table', async () => {
    state.userRows = [];

    const { runDailyCheckinFanout } = await import('@/lib/inngest/functions/daily-checkin-fanout');
    const result = await runDailyCheckinFanout({
      step: cast(makeStep([])),
      logger: makeLogger(),
    });

    expect(result).toEqual({ users: 0, emitted: 0 });
    expect(publishMock).not.toHaveBeenCalled();
  });

  it('emits morning.check_in.due when local time is in the morning slot window', async () => {
    state.userRows = [userRow()];
    // 14:02 UTC == 08:02 MX → fires morning slot.
    const now = new Date(Date.UTC(2026, 4, 26, 14, 2));

    const { runDailyCheckinFanout } = await import('@/lib/inngest/functions/daily-checkin-fanout');
    const step = makeStep(state.userRows);
    const result = await runDailyCheckinFanout({
      step: cast(step),
      logger: makeLogger(),
      now,
    });

    expect(result).toEqual({ users: 1, emitted: 1 });
    expect(state.published).toEqual([
      { name: 'morning.check_in.due', data: { userId: 'u1', date: '2026-05-26' } },
    ]);
    expect(state.stepIds).toContain('publish-u1-2026-05-26-morning');
  });

  it('emits NO events when no slot windows match', async () => {
    state.userRows = [userRow()];
    // 16:00 UTC == 10:00 MX → between morning and midday, no slot.
    const now = new Date(Date.UTC(2026, 4, 26, 16, 0));

    const { runDailyCheckinFanout } = await import('@/lib/inngest/functions/daily-checkin-fanout');
    const result = await runDailyCheckinFanout({
      step: cast(makeStep(state.userRows)),
      logger: makeLogger(),
      now,
    });

    expect(result).toEqual({ users: 1, emitted: 0 });
    expect(publishMock).not.toHaveBeenCalled();
  });

  it('fans out per-user per-TZ: MX user fires AT 14:02 UTC, Tokyo user does not', async () => {
    state.userRows = [
      userRow({ id: 'u-mx', timezone: 'America/Mexico_City' }), // 08:02 local → fires
      userRow({ id: 'u-tok', timezone: 'Asia/Tokyo' }), // 23:02 local → no slot
    ];
    const now = new Date(Date.UTC(2026, 4, 26, 14, 2));

    const { runDailyCheckinFanout } = await import('@/lib/inngest/functions/daily-checkin-fanout');
    const result = await runDailyCheckinFanout({
      step: cast(makeStep(state.userRows)),
      logger: makeLogger(),
      now,
    });

    expect(result).toEqual({ users: 2, emitted: 1 });
    expect(state.published).toHaveLength(1);
    expect(state.published[0].data).toMatchObject({ userId: 'u-mx' });
  });

  it('emits both midday and evening for the same user when their times coincide (synthetic test)', async () => {
    // Pathological prefs: midday and evening both at 13:00.
    state.userRows = [userRow({ middayTime: '13:00', eveningTime: '13:00' })];
    // 19:02 UTC == 13:02 MX → both midday + evening windows.
    const now = new Date(Date.UTC(2026, 4, 26, 19, 2));

    const { runDailyCheckinFanout } = await import('@/lib/inngest/functions/daily-checkin-fanout');
    const result = await runDailyCheckinFanout({
      step: cast(makeStep(state.userRows)),
      logger: makeLogger(),
      now,
    });

    expect(result.emitted).toBe(2);
    const names = state.published.map((p) => p.name).sort();
    expect(names).toEqual(['evening.check_in.due', 'midday.check_in.due']);
  });

  it('respects weekend_skip + days_off + muted_until', async () => {
    state.userRows = [
      userRow({ id: 'u-mute', mutedUntil: new Date(Date.UTC(2026, 4, 30)) }),
      userRow({ id: 'u-off', daysOff: ['2026-05-26'] }),
      userRow({ id: 'u-weekend', weekendSkip: true }),
    ];
    const now = new Date(Date.UTC(2026, 4, 23, 14, 2)); // Sat morning MX

    const { runDailyCheckinFanout } = await import('@/lib/inngest/functions/daily-checkin-fanout');
    const result = await runDailyCheckinFanout({
      step: cast(makeStep(state.userRows)),
      logger: makeLogger(),
      now,
    });

    // u-mute filtered (mutedUntil future)
    // u-off — not in days_off (today is 2026-05-23, days_off is 26)
    // u-weekend — Saturday + weekend_skip → filtered
    // → only u-off fires
    expect(result.emitted).toBe(1);
    expect(state.published[0].data).toMatchObject({ userId: 'u-off', date: '2026-05-23' });
  });
});
