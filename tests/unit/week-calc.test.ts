/**
 * Tests for week-calc — ISSUE-032 (BR-7 + U-003 DST coverage).
 *
 * Pure function — exhaustive coverage of the 7-day mapping + DST edges +
 * cross-month boundary.
 */

import { describe, it, expect } from 'vitest';
import { weekStartingFor, weekEndingFor, getNextWeekStarting } from '@/lib/domain/week-calc';

// Helper — build a UTC date for test inputs.
function utc(y: number, m: number, d: number, h = 12, min = 0): Date {
  return new Date(Date.UTC(y, m - 1, d, h, min));
}

describe('weekStartingFor — 7-day mapping (week starts Sunday)', () => {
  // 2026-05-17 is a Sunday. Test every weekday of that week maps back to 17.
  it.each([
    ['2026-05-17 Sun', utc(2026, 5, 17), '2026-05-17'],
    ['2026-05-18 Mon', utc(2026, 5, 18), '2026-05-17'],
    ['2026-05-19 Tue', utc(2026, 5, 19), '2026-05-17'],
    ['2026-05-20 Wed', utc(2026, 5, 20), '2026-05-17'],
    ['2026-05-21 Thu', utc(2026, 5, 21), '2026-05-17'],
    ['2026-05-22 Fri', utc(2026, 5, 22), '2026-05-17'],
    ['2026-05-23 Sat', utc(2026, 5, 23), '2026-05-17'],
  ])('%s → 2026-05-17', (_label, input, expected) => {
    expect(weekStartingFor(input, 'America/Mexico_City')).toBe(expected);
  });
});

describe('weekStartingFor — cross-month boundary', () => {
  it('Mon Jun 1 2026 belongs to the week starting Sun May 31', () => {
    expect(weekStartingFor(utc(2026, 6, 1), 'America/Mexico_City')).toBe('2026-05-31');
  });

  it('Sat May 30 2026 belongs to the week starting Sun May 24', () => {
    expect(weekStartingFor(utc(2026, 5, 30), 'America/Mexico_City')).toBe('2026-05-24');
  });

  it('Sun May 31 2026 returns itself', () => {
    expect(weekStartingFor(utc(2026, 5, 31), 'America/Mexico_City')).toBe('2026-05-31');
  });
});

describe('weekStartingFor — TZ behavior', () => {
  it('resolves in user TZ when UTC and local fall on different days', () => {
    // 2026-05-18 03:00 UTC = 2026-05-17 21:00 in CST (UTC-6) — Sunday.
    // Asking from this instant in Mexico_City should return Sunday May 17.
    const date = new Date('2026-05-18T03:00:00Z');
    expect(weekStartingFor(date, 'America/Mexico_City')).toBe('2026-05-17');
  });

  it('same instant in different TZ can yield a different week', () => {
    // 2026-05-18 03:00 UTC = 2026-05-18 04:00 in CEST (UTC+2) — Monday.
    // Same instant interpreted in Europe/Madrid → previous Sunday is May 17.
    const date = new Date('2026-05-18T03:00:00Z');
    expect(weekStartingFor(date, 'Europe/Madrid')).toBe('2026-05-17');
  });
});

describe('weekStartingFor — DST edge weeks (U-003)', () => {
  it('US Pacific spring-forward week (Mar 2026)', () => {
    // DST springs forward 2026-03-08 02:00 → 03:00 local.
    // Mar 9 2026 is Monday — its week starts Sun Mar 8.
    const date = new Date('2026-03-09T15:00:00Z'); // 07:00 PDT
    expect(weekStartingFor(date, 'America/Los_Angeles')).toBe('2026-03-08');
  });

  it('US Pacific fall-back week (Nov 2026)', () => {
    // DST falls back 2026-11-01 02:00 → 01:00.
    // Mon Nov 2 → week starts Sun Nov 1.
    const date = new Date('2026-11-02T17:00:00Z');
    expect(weekStartingFor(date, 'America/Los_Angeles')).toBe('2026-11-01');
  });

  it('Spain DST transition (last Sunday of October)', () => {
    // DST falls back last Sun October at 03:00 → 02:00 in Europe/Madrid.
    // 2026 transition: Oct 25 03:00 CEST → 02:00 CET. That Sunday IS the
    // start of its own week.
    const date = utc(2026, 10, 25, 10);
    expect(weekStartingFor(date, 'Europe/Madrid')).toBe('2026-10-25');
  });
});

describe('weekStartingFor — boundary instants', () => {
  it('Saturday 23:59 local belongs to the OLD week', () => {
    // Sat May 23 2026 23:59 CST = Sun May 24 05:59 UTC.
    const date = new Date('2026-05-24T05:59:00Z');
    expect(weekStartingFor(date, 'America/Mexico_City')).toBe('2026-05-17');
  });

  it('Sunday 00:01 local belongs to the NEW week', () => {
    // Sun May 24 2026 00:01 CST = Sun May 24 06:01 UTC.
    const date = new Date('2026-05-24T06:01:00Z');
    expect(weekStartingFor(date, 'America/Mexico_City')).toBe('2026-05-24');
  });
});

describe('weekEndingFor', () => {
  it('returns the Saturday 6 days after the Sunday', () => {
    expect(weekEndingFor('2026-05-17')).toBe('2026-05-23');
  });

  it('handles cross-month spans', () => {
    expect(weekEndingFor('2026-05-31')).toBe('2026-06-06');
  });

  it('handles cross-year spans (Dec → Jan)', () => {
    expect(weekEndingFor('2026-12-27')).toBe('2027-01-02');
  });

  it('handles leap-year February correctly', () => {
    // Sunday Feb 27 2028 → Saturday Mar 4 2028 (Feb has 29 days in 2028).
    expect(weekEndingFor('2028-02-27')).toBe('2028-03-04');
  });
});

describe('getNextWeekStarting — ISSUE-034 Friday cron', () => {
  // Reference week in MX: 2026-05-17 Sun … 2026-05-23 Sat
  // Next week MX:         2026-05-24 Sun … 2026-05-30 Sat
  const TZ = 'America/Mexico_City';

  it('Friday → next Sunday', () => {
    // Friday 2026-05-22 in MX (job target day) → next Sunday 2026-05-24.
    expect(getNextWeekStarting(utc(2026, 5, 22, 18), TZ)).toBe('2026-05-24');
  });

  it('Sunday → following Sunday (not same day)', () => {
    // The cron may run on Sunday in some edge timezones — make sure we
    // always advance to NEXT week, never return the current week's start.
    expect(getNextWeekStarting(utc(2026, 5, 17, 12), TZ)).toBe('2026-05-24');
  });

  it('Saturday → next Sunday (next day)', () => {
    expect(getNextWeekStarting(utc(2026, 5, 23, 12), TZ)).toBe('2026-05-24');
  });

  it('cross-month boundary', () => {
    // Friday 2026-05-29 MX → next Sunday 2026-05-31 MX.
    expect(getNextWeekStarting(utc(2026, 5, 29, 18), TZ)).toBe('2026-05-31');
  });

  it('cross-year boundary', () => {
    // Friday 2026-12-25 MX → next Sunday 2026-12-27 (still 2026).
    expect(getNextWeekStarting(utc(2026, 12, 25, 18), TZ)).toBe('2026-12-27');
    // Friday 2026-12-31 18:00 MX (= 2027-01-01 00:00 UTC) → next Sunday 2027-01-03.
    expect(getNextWeekStarting(utc(2027, 1, 1, 0), TZ)).toBe('2027-01-03');
  });

  it('DST-safe across Pacific spring-forward (Mar 8 2026)', () => {
    // Friday Mar 6 2026 (before DST) → next Sunday Mar 8 2026 (DST day).
    // Despite the missing hour, the math must still land on Sun Mar 8.
    expect(getNextWeekStarting(utc(2026, 3, 6, 18), 'America/Los_Angeles')).toBe('2026-03-08');
  });
});
