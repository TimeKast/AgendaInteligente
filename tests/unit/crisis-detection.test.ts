/**
 * Tests for crisis trigger detection — ISSUE-056 (Slice A1).
 *
 * **Safety-critical**: false negatives can endanger users. Every test
 * here is a frozen contract — do NOT relax assertions without a
 * clinical-review sign-off.
 */

import { describe, it, expect } from 'vitest';
import {
  detectCrisisTrigger,
  countryFromTimezone,
  crisisLineForCountry,
  crisisLineForTimezone,
} from '@/lib/ai/crisis-detection';

describe('detectCrisisTrigger — Spanish triggers', () => {
  const cases = [
    'ya no quiero seguir viviendo',
    'estoy pensando en suicidarme',
    'creo que voy a matarme',
    'me quiero matar',
    'quiero quitarme la vida',
    'no veo salida',
    'no aguanto vivir',
    'preferiría estar muerto',
    'mejor estaría muerta',
    'he pensado en hacerme daño',
    'a veces quiero cortarme',
    'estoy pensando en lastimarme',
  ];

  it.each(cases)('triggers on: %s', (msg) => {
    expect(detectCrisisTrigger(msg)).toBe(true);
  });

  it('matches Spanish with accents (preferiría)', () => {
    expect(detectCrisisTrigger('Preferiría estar muerto')).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(detectCrisisTrigger('YA NO QUIERO VIVIR.')).toBe(true);
  });

  it('matches inside a longer message', () => {
    expect(
      detectCrisisTrigger(
        'Tuve un día horrible y la verdad es que ya no quiero seguir viviendo. ¿Qué hago?'
      )
    ).toBe(true);
  });
});

describe('detectCrisisTrigger — English triggers', () => {
  const cases = [
    'I want to kill myself',
    "I don't want to live anymore",
    'thinking about suicide',
    "I think I'll end my life soon",
    'no reason to live',
    'no way out',
    'better off dead',
    'I want to hurt myself',
    'I might cut myself',
    'I keep thinking about taking my own life',
  ];

  it.each(cases)('triggers on: %s', (msg) => {
    expect(detectCrisisTrigger(msg)).toBe(true);
  });
});

describe('detectCrisisTrigger — does NOT fire on benign / figurative phrases', () => {
  const benign = [
    'this report is killing me',
    'tengo hambre',
    'me siento triste pero ahí voy',
    'ese chiste me mató de risa',
    'i feel stressed about work',
    'I want to kill this bug',
    '', // empty
  ];

  it.each(benign)('does not trigger on: %s', (msg) => {
    expect(detectCrisisTrigger(msg)).toBe(false);
  });

  it('does not trigger on non-string input', () => {
    // @ts-expect-error — intentional misuse to verify runtime guard
    expect(detectCrisisTrigger(undefined)).toBe(false);
    // @ts-expect-error — intentional misuse to verify runtime guard
    expect(detectCrisisTrigger(123)).toBe(false);
  });
});

describe('countryFromTimezone', () => {
  it('resolves common MX timezones', () => {
    expect(countryFromTimezone('America/Mexico_City')).toBe('MX');
    expect(countryFromTimezone('America/Tijuana')).toBe('MX');
  });

  it('resolves US zones', () => {
    expect(countryFromTimezone('America/New_York')).toBe('US');
    expect(countryFromTimezone('America/Los_Angeles')).toBe('US');
    expect(countryFromTimezone('Pacific/Honolulu')).toBe('US');
  });

  it('resolves Spain and UK', () => {
    expect(countryFromTimezone('Europe/Madrid')).toBe('ES');
    expect(countryFromTimezone('Europe/London')).toBe('GB');
  });

  it('returns null for unmapped TZ', () => {
    expect(countryFromTimezone('Antarctica/Vostok')).toBeNull();
  });
});

describe('crisisLineForCountry', () => {
  it('returns SAPTEL for MX', () => {
    const line = crisisLineForCountry('MX');
    expect(line.name).toBe('SAPTEL');
    expect(line.phone_display).toBe('800 911 2000');
  });

  it('returns 988 for US', () => {
    const line = crisisLineForCountry('US');
    expect(line.phone_display).toBe('988');
  });

  it('falls back to international when country unknown', () => {
    const line = crisisLineForCountry('ZZ'); // not in table
    expect(line.name).toContain('International');
  });

  it('falls back when country is null/undefined', () => {
    expect(crisisLineForCountry(null).name).toContain('International');
    expect(crisisLineForCountry(undefined).name).toContain('International');
  });
});

describe('crisisLineForTimezone — convenience', () => {
  it('chains TZ → country → line', () => {
    expect(crisisLineForTimezone('America/Mexico_City').name).toBe('SAPTEL');
    expect(crisisLineForTimezone('Europe/Madrid').name).toContain('Esperanza');
    expect(crisisLineForTimezone('Antarctica/Vostok').name).toContain('International');
  });
});
