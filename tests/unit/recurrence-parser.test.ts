/**
 * Tests for the recurrence DSL parser (ISSUE-024, BR-11).
 *
 * Pure function — no mocks needed. Coverage of valid + invalid shapes.
 */

import { describe, it, expect } from 'vitest';
import { parseRecurrenceRule } from '@/lib/domain/recurrence';

describe('parseRecurrenceRule — valid shapes', () => {
  it('parses "daily"', () => {
    expect(parseRecurrenceRule('daily')).toEqual({ kind: 'daily' });
  });

  it('parses "weekly:MO" (single day)', () => {
    const r = parseRecurrenceRule('weekly:MO');
    expect(r?.kind).toBe('weekly');
    if (r?.kind === 'weekly') {
      expect(Array.from(r.days)).toEqual(['MO']);
    }
  });

  it('parses "weekly:MO,WE,FR" (multi-day)', () => {
    const r = parseRecurrenceRule('weekly:MO,WE,FR');
    expect(r?.kind).toBe('weekly');
    if (r?.kind === 'weekly') {
      expect(new Set(r.days)).toEqual(new Set(['MO', 'WE', 'FR']));
    }
  });

  it('parses "weekly:MO,TU,WE,TH,FR,SA,SU" (full week)', () => {
    const r = parseRecurrenceRule('weekly:MO,TU,WE,TH,FR,SA,SU');
    expect(r?.kind).toBe('weekly');
    if (r?.kind === 'weekly') expect(r.days.size).toBe(7);
  });

  it('parses "monthly:1"', () => {
    expect(parseRecurrenceRule('monthly:1')).toEqual({ kind: 'monthly_day', day: 1 });
  });

  it('parses "monthly:28" (boundary)', () => {
    expect(parseRecurrenceRule('monthly:28')).toEqual({ kind: 'monthly_day', day: 28 });
  });

  it('parses "monthly:last"', () => {
    expect(parseRecurrenceRule('monthly:last')).toEqual({ kind: 'monthly_last' });
  });
});

describe('parseRecurrenceRule — invalid shapes', () => {
  it.each([
    '',
    '   ',
    'Daily', // case-sensitive
    'WEEKLY:MO',
    'weekly:', // empty list
    'weekly:XX',
    'weekly:MO,XX',
    'weekly:MO,MO', // duplicates
    'weekly:Mo,We', // wrong case
    'monthly:', // empty value
    'monthly:0',
    'monthly:29', // BR-11 — out of safe range
    'monthly:31',
    'monthly:100',
    'monthly:-1',
    'monthly:1a',
    'monthly:LAST', // case-sensitive
    'monthly:01', // leading zero
    'monthly: 1', // whitespace
    'yearly:1',
    'every-other-tuesday',
    'FREQ=WEEKLY;BYDAY=MO',
    'FREQ=DAILY',
    'freq=daily', // legacy lowercase
  ])('rejects %j → null', (input) => {
    expect(parseRecurrenceRule(input)).toBeNull();
  });

  it.each([null, undefined, 123, {}, [], true])('rejects non-string input %j → null', (input) => {
    expect(parseRecurrenceRule(input)).toBeNull();
  });
});

describe('parseRecurrenceRule — legacy iCal hint', () => {
  it('rejects FREQ= variants so callers can show a migration message', () => {
    expect(parseRecurrenceRule('FREQ=WEEKLY')).toBeNull();
    expect(parseRecurrenceRule('FREQ=DAILY;COUNT=10')).toBeNull();
    expect(parseRecurrenceRule('freq=daily')).toBeNull();
  });
});
