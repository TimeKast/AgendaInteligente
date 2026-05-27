/**
 * Tests for the check-in schedule resolver — ISSUE-080b.
 *
 * Pure-function coverage of every AC scenario (TZ-aware fire, pref
 * change reflects immediately, weekend_skip, muted_until, days_off,
 * DST edges). The fan-out crons consume these in production; tests
 * lock the contract without hitting Inngest.
 */

import { describe, it, expect } from 'vitest';
import {
  shouldFireDailyCheckIn,
  shouldFireWeeklyCheckIn,
  localPartsAt,
  type CheckInPrefs,
} from '@/lib/domain/checkin-schedule';

const MX = 'America/Mexico_City';
const TOKYO = 'Asia/Tokyo';
const MADRID = 'Europe/Madrid';

const basePrefs: CheckInPrefs = {
  morningTime: '08:00',
  middayTime: '13:00',
  eveningTime: '21:00',
  weeklyKickoffDow: 0, // Sunday
  weeklyKickoffTime: '18:00',
  weeklyReviewDow: 6, // Saturday
  weeklyReviewTime: '20:00',
  weekendSkip: false,
  daysOff: [],
  mutedUntil: null,
};

// Helper — build UTC date.
function utc(y: number, m: number, d: number, h = 0, min = 0): Date {
  return new Date(Date.UTC(y, m - 1, d, h, min));
}

describe('localPartsAt', () => {
  it('emits MX-local components from a UTC instant', () => {
    // 2026-05-26 14:02 UTC == 08:02 MX (UTC-6, no DST in MX City)
    const p = localPartsAt(utc(2026, 5, 26, 14, 2), MX);
    expect(p.isoDate).toBe('2026-05-26');
    expect(p.hour).toBe(8);
    expect(p.minute).toBe(2);
    expect(p.weekday).toBe(2); // Tue
  });

  it('emits Tokyo-local components (UTC+9)', () => {
    const p = localPartsAt(utc(2026, 5, 26, 14, 0), TOKYO);
    expect(p.isoDate).toBe('2026-05-26');
    expect(p.hour).toBe(23);
    expect(p.weekday).toBe(2);
  });

  it('rolls the date when local time crosses midnight', () => {
    // 2026-05-26 23:30 UTC → 2026-05-27 08:30 in Tokyo.
    const p = localPartsAt(utc(2026, 5, 26, 23, 30), TOKYO);
    expect(p.isoDate).toBe('2026-05-27');
    expect(p.hour).toBe(8);
  });
});

describe('shouldFireDailyCheckIn — happy path', () => {
  it('fires morning check-in when local time is within the 5-min window', () => {
    // 14:02 UTC == 08:02 MX, within [08:00, 08:05).
    const result = shouldFireDailyCheckIn('morning', basePrefs, MX, utc(2026, 5, 26, 14, 2));
    expect(result).toEqual({ isoDate: '2026-05-26' });
  });

  it('does NOT fire at 14:05 UTC (08:05 MX — exit boundary)', () => {
    expect(shouldFireDailyCheckIn('morning', basePrefs, MX, utc(2026, 5, 26, 14, 5))).toBeNull();
  });

  it('does NOT fire at 13:59 UTC (07:59 MX — pre-slot)', () => {
    expect(shouldFireDailyCheckIn('morning', basePrefs, MX, utc(2026, 5, 26, 13, 59))).toBeNull();
  });

  it('fires midday at the configured time in user TZ', () => {
    // midday = 13:00 MX == 19:00 UTC.
    const result = shouldFireDailyCheckIn('midday', basePrefs, MX, utc(2026, 5, 26, 19, 1));
    expect(result).toEqual({ isoDate: '2026-05-26' });
  });

  it('fires evening for the user-local DATE even when UTC date is next day', () => {
    // 21:00 MX == 03:00 UTC the FOLLOWING day. The user-local date is
    // the day-before-UTC — and that's what the event payload should
    // carry (the user's day, not ours).
    const result = shouldFireDailyCheckIn('evening', basePrefs, MX, utc(2026, 5, 27, 3, 1));
    expect(result).toEqual({ isoDate: '2026-05-26' });
  });
});

describe('shouldFireDailyCheckIn — pref changes reflect immediately', () => {
  it('user with morningTime 07:30 fires at 13:31 UTC (07:31 MX), NOT at 14:02 UTC', () => {
    const earlier: CheckInPrefs = { ...basePrefs, morningTime: '07:30' };
    expect(shouldFireDailyCheckIn('morning', earlier, MX, utc(2026, 5, 26, 13, 31))).toEqual({
      isoDate: '2026-05-26',
    });
    expect(shouldFireDailyCheckIn('morning', earlier, MX, utc(2026, 5, 26, 14, 2))).toBeNull();
  });
});

describe('shouldFireDailyCheckIn — weekend_skip', () => {
  it('skips Saturday when weekend_skip = true', () => {
    // Sat 2026-05-23 14:02 UTC == 08:02 MX
    const prefs: CheckInPrefs = { ...basePrefs, weekendSkip: true };
    expect(shouldFireDailyCheckIn('morning', prefs, MX, utc(2026, 5, 23, 14, 2))).toBeNull();
  });

  it('skips Sunday when weekend_skip = true', () => {
    const prefs: CheckInPrefs = { ...basePrefs, weekendSkip: true };
    expect(shouldFireDailyCheckIn('morning', prefs, MX, utc(2026, 5, 24, 14, 2))).toBeNull();
  });

  it('fires Saturday when weekend_skip = false', () => {
    expect(shouldFireDailyCheckIn('morning', basePrefs, MX, utc(2026, 5, 23, 14, 2))).toEqual({
      isoDate: '2026-05-23',
    });
  });
});

describe('shouldFireDailyCheckIn — days_off', () => {
  it('skips when local date is in days_off (vacation day)', () => {
    const prefs: CheckInPrefs = { ...basePrefs, daysOff: ['2026-12-25'] };
    // 2026-12-25 14:02 UTC == 08:02 MX
    expect(shouldFireDailyCheckIn('morning', prefs, MX, utc(2026, 12, 25, 14, 2))).toBeNull();
  });

  it('respects per-TZ local date when checking days_off', () => {
    // 2026-12-26 03:02 UTC == 2026-12-25 21:02 MX (still vacation)
    const prefs: CheckInPrefs = {
      ...basePrefs,
      eveningTime: '21:00',
      daysOff: ['2026-12-25'],
    };
    expect(shouldFireDailyCheckIn('evening', prefs, MX, utc(2026, 12, 26, 3, 1))).toBeNull();
  });
});

describe('shouldFireDailyCheckIn — muted_until', () => {
  it('skips when mutedUntil is in the future', () => {
    const prefs: CheckInPrefs = {
      ...basePrefs,
      mutedUntil: utc(2026, 5, 28),
    };
    expect(shouldFireDailyCheckIn('morning', prefs, MX, utc(2026, 5, 26, 14, 2))).toBeNull();
  });

  it('fires when mutedUntil is in the past', () => {
    const prefs: CheckInPrefs = {
      ...basePrefs,
      mutedUntil: utc(2026, 5, 20),
    };
    expect(shouldFireDailyCheckIn('morning', prefs, MX, utc(2026, 5, 26, 14, 2))).toEqual({
      isoDate: '2026-05-26',
    });
  });
});

describe('shouldFireDailyCheckIn — DST edges', () => {
  it('survives Pacific spring-forward (Mar 8 2026, lose 1h)', () => {
    // After spring-forward, 8:02 local PT is 15:02 UTC (not 16:02).
    const result = shouldFireDailyCheckIn(
      'morning',
      basePrefs,
      'America/Los_Angeles',
      utc(2026, 3, 8, 15, 2)
    );
    expect(result).toEqual({ isoDate: '2026-03-08' });
  });

  it('survives Madrid fall-back (Oct 25 2026, gain 1h)', () => {
    // After fall-back, 8:02 local Madrid is 07:02 UTC.
    const result = shouldFireDailyCheckIn('morning', basePrefs, MADRID, utc(2026, 10, 25, 7, 2));
    expect(result).toEqual({ isoDate: '2026-10-25' });
  });
});

describe('shouldFireWeeklyCheckIn', () => {
  it('fires Sunday kickoff at the configured local time', () => {
    // Sun 2026-05-24 18:30 MX == 00:30 UTC Mon. weeklyKickoffDow=0
    // (Sun), weeklyKickoffTime=18:00 → fires within hour window.
    const result = shouldFireWeeklyCheckIn('kickoff', basePrefs, MX, utc(2026, 5, 25, 0, 30));
    expect(result?.weekStarting).toBe('2026-05-24');
  });

  it('fires Saturday review at the configured time', () => {
    // Sat 2026-05-23 20:30 MX == 02:30 UTC Sun.
    // weeklyReviewDow=6 (Sat) → must be Sat in user TZ.
    const result = shouldFireWeeklyCheckIn('review', basePrefs, MX, utc(2026, 5, 24, 2, 30));
    expect(result?.weekStarting).toBe('2026-05-17');
  });

  it('does NOT fire on the wrong day-of-week', () => {
    // Mon 2026-05-25 at the right time of day still doesn't fire kickoff
    // because kickoff is Sunday-only.
    expect(shouldFireWeeklyCheckIn('kickoff', basePrefs, MX, utc(2026, 5, 26, 0, 30))).toBeNull();
  });

  it('respects weekend_skip even for weekly kickoff (Sunday)', () => {
    const prefs: CheckInPrefs = { ...basePrefs, weekendSkip: true };
    expect(shouldFireWeeklyCheckIn('kickoff', prefs, MX, utc(2026, 5, 25, 0, 30))).toBeNull();
  });

  it('respects muted_until', () => {
    const prefs: CheckInPrefs = {
      ...basePrefs,
      mutedUntil: utc(2026, 5, 30),
    };
    expect(shouldFireWeeklyCheckIn('kickoff', prefs, MX, utc(2026, 5, 25, 0, 30))).toBeNull();
  });

  it('fires within the 60-min hourly window but not 61 min later', () => {
    // 18:00 MX == 00:00 UTC Mon. Tick at 00:59 (still in window):
    const a = shouldFireWeeklyCheckIn('kickoff', basePrefs, MX, utc(2026, 5, 25, 0, 59));
    expect(a).not.toBeNull();
    // Tick at 01:00 UTC Mon = 19:00 MX Sun → past window:
    const b = shouldFireWeeklyCheckIn('kickoff', basePrefs, MX, utc(2026, 5, 25, 1, 0));
    expect(b).toBeNull();
  });
});
