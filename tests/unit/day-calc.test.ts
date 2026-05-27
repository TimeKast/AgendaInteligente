import { describe, it, expect } from 'vitest';
import { todayInTimezone, todayLabelEs, userInitial } from '@/lib/domain/day-calc';

describe('day-calc', () => {
  it('todayInTimezone returns the date in the given TZ', () => {
    // 2026-05-27T05:00:00Z = 23:00 on 2026-05-26 in MX (UTC-6).
    const d = new Date('2026-05-27T05:00:00Z');
    expect(todayInTimezone(d, 'America/Mexico_City')).toBe('2026-05-26');
    expect(todayInTimezone(d, 'Europe/Madrid')).toBe('2026-05-27');
  });

  it('todayLabelEs renders weekday and month in Spanish', () => {
    // 2026-05-27 was a Wednesday.
    const d = new Date('2026-05-27T12:00:00Z');
    expect(todayLabelEs(d, 'America/Mexico_City')).toBe('Miércoles, 27 de mayo');
  });

  it('todayLabelEs respects TZ when the calendar day differs from UTC', () => {
    // UTC says 2026-05-27 but in Tokyo it is already 2026-05-28 (Thursday).
    const d = new Date('2026-05-27T18:00:00Z');
    expect(todayLabelEs(d, 'Asia/Tokyo')).toBe('Jueves, 28 de mayo');
  });

  it('userInitial returns uppercase first char or middle dot', () => {
    expect(userInitial('Federico Levi')).toBe('F');
    expect(userInitial('fede@example.com')).toBe('F');
    expect(userInitial('')).toBe('·');
    expect(userInitial(null)).toBe('·');
    expect(userInitial(undefined)).toBe('·');
  });
});
