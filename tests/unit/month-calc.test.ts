/**
 * Tests for month-calc helpers — ISSUE-131 (BR-19).
 */

import { describe, it, expect } from 'vitest';
import {
  monthStartingFor,
  normalizeToMonthStarting,
  nextMonthStartingFor,
} from '@/lib/domain/month-calc';

const MX = 'America/Mexico_City';
const TOKYO = 'Asia/Tokyo';

function utc(y: number, m: number, d: number, h = 12): Date {
  return new Date(Date.UTC(y, m - 1, d, h));
}

describe('monthStartingFor', () => {
  it('returns YYYY-MM-01 for a mid-month date', () => {
    expect(monthStartingFor(utc(2026, 5, 19), MX)).toBe('2026-05-01');
  });

  it('returns same first-of-month when input is already day 1', () => {
    expect(monthStartingFor(utc(2026, 5, 1), MX)).toBe('2026-05-01');
  });

  it('respects user TZ when the UTC date is in a different month', () => {
    // 2026-06-01 00:30 UTC = 2026-05-31 18:30 MX → MX month is May.
    expect(monthStartingFor(utc(2026, 6, 1, 0), MX)).toBe('2026-05-01');
    // 2026-05-31 23:00 UTC = 2026-06-01 08:00 Tokyo → Tokyo is June.
    expect(monthStartingFor(utc(2026, 5, 31, 23), TOKYO)).toBe('2026-06-01');
  });

  it('handles December → January roll without bugs', () => {
    expect(monthStartingFor(utc(2026, 12, 31, 12), MX)).toBe('2026-12-01');
  });
});

describe('normalizeToMonthStarting', () => {
  it('truncates any YYYY-MM-DD to YYYY-MM-01', () => {
    expect(normalizeToMonthStarting('2026-05-19')).toBe('2026-05-01');
    expect(normalizeToMonthStarting('2026-05-01')).toBe('2026-05-01');
    expect(normalizeToMonthStarting('2026-12-31')).toBe('2026-12-01');
  });

  it('throws on malformed input', () => {
    expect(() => normalizeToMonthStarting('05/19/2026')).toThrow();
    expect(() => normalizeToMonthStarting('2026-5-19')).toThrow();
    expect(() => normalizeToMonthStarting('not a date')).toThrow();
  });
});

describe('nextMonthStartingFor', () => {
  it('walks forward one month within a year', () => {
    expect(nextMonthStartingFor('2026-05-01')).toBe('2026-06-01');
    expect(nextMonthStartingFor('2026-01-01')).toBe('2026-02-01');
  });

  it('rolls Dec → next year Jan', () => {
    expect(nextMonthStartingFor('2026-12-01')).toBe('2027-01-01');
  });

  it('zero-pads month numbers correctly', () => {
    expect(nextMonthStartingFor('2026-09-01')).toBe('2026-10-01');
    expect(nextMonthStartingFor('2026-08-01')).toBe('2026-09-01');
  });
});
