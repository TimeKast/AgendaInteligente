/**
 * Pure-function tests for DaySheet completion predicates (ISSUE-030).
 */

import { describe, it, expect } from 'vitest';
import { isMorningCompleted, isEveningCompleted } from '@/lib/domain/day-sheet-completion';

describe('isMorningCompleted', () => {
  it('true when identity + wins (≥1 non-empty) + avoidance are set', () => {
    expect(
      isMorningCompleted({
        identityStatement: 'Soy alguien que entrega.',
        winsPlanned: ['Llamar a Juan'],
        avoidance: 'No abro Twitter hasta cerrar mediodía.',
      })
    ).toBe(true);
  });

  it('accepts 3 wins (the cap)', () => {
    expect(
      isMorningCompleted({
        identityStatement: 'X',
        winsPlanned: ['a', 'b', 'c'],
        avoidance: 'No procrastinar.',
      })
    ).toBe(true);
  });

  it('false when identity is empty / whitespace-only', () => {
    expect(
      isMorningCompleted({
        identityStatement: '   ',
        winsPlanned: ['x'],
        avoidance: 'y',
      })
    ).toBe(false);
  });

  it('false when wins is null', () => {
    expect(
      isMorningCompleted({
        identityStatement: 'x',
        winsPlanned: null,
        avoidance: 'y',
      })
    ).toBe(false);
  });

  it('false when wins is empty array', () => {
    expect(
      isMorningCompleted({
        identityStatement: 'x',
        winsPlanned: [],
        avoidance: 'y',
      })
    ).toBe(false);
  });

  it('false when all wins are whitespace', () => {
    expect(
      isMorningCompleted({
        identityStatement: 'x',
        winsPlanned: ['   ', '\t\n'],
        avoidance: 'y',
      })
    ).toBe(false);
  });

  it('false when avoidance is missing', () => {
    expect(
      isMorningCompleted({
        identityStatement: 'x',
        winsPlanned: ['a'],
        avoidance: null,
      })
    ).toBe(false);
  });

  it('false on an empty object', () => {
    expect(isMorningCompleted({})).toBe(false);
  });
});

describe('isEveningCompleted', () => {
  it('true when close_summary has content', () => {
    expect(isEveningCompleted({ closeSummary: 'Buen día. Mañana sigo.' })).toBe(true);
  });

  it('false when close_summary is null / undefined / empty', () => {
    expect(isEveningCompleted({ closeSummary: null })).toBe(false);
    expect(isEveningCompleted({ closeSummary: undefined })).toBe(false);
    expect(isEveningCompleted({})).toBe(false);
    expect(isEveningCompleted({ closeSummary: '   ' })).toBe(false);
  });
});
