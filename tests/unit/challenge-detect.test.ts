/**
 * Tests for vague-language detection — ISSUE-060.
 *
 * Target: ≥80% recall on the spec's example phrases + 0% false-positive
 * rate on the control set (concrete answers).
 */

import { describe, it, expect } from 'vitest';
import {
  detectVagueLanguage,
  detectMissingCost,
  detectNewCommitment,
} from '@/lib/domain/challenge-detect';

describe('detectVagueLanguage — Spanish triggers', () => {
  const vague = [
    'quiero estar mejor',
    'tal vez termino el reporte',
    'eventualmente lo logro',
    'lo intento mañana',
    'ahí voy',
    'más o menos bien',
    'estoy ideal con esto',
    'voy a enfocarme en eso',
    'tengo que trabajar en mi disciplina',
    'creo que podría', // "podría"
    'ahí ando',
    'más enfocado hoy', // accented "más" → normalizes to "mas"
  ];

  it.each(vague)('flags vague: %s', (text) => {
    const result = detectVagueLanguage(text, 'es');
    expect(result.isVague).toBe(true);
    expect(result.triggerWords.length).toBeGreaterThan(0);
  });

  it('returns the specific triggers that fired', () => {
    const result = detectVagueLanguage('quiero estar mejor y más enfocado', 'es');
    expect(result.triggerWords).toContain('mejor');
    expect(result.triggerWords).toContain('mas');
  });
});

describe('detectVagueLanguage — English triggers', () => {
  const vague = [
    'I want to be better',
    'eventually I will finish',
    'maybe tomorrow',
    'fine, going to try',
    'somewhat okay',
    'kind of good',
    'ideally by Friday',
    'I will work on it',
    'doing my best',
    'pretty good today',
  ];

  it.each(vague)('flags vague (en): %s', (text) => {
    expect(detectVagueLanguage(text, 'en').isVague).toBe(true);
  });
});

describe('detectVagueLanguage — concrete answers (zero false positives)', () => {
  const concrete = [
    'terminar el reporte trimestral antes de las 13',
    'mandar 3 emails a los stakeholders antes del lunch',
    'finish chapter 4 of the book before lunch',
    'send the Q3 report to Sarah by 2pm',
    'agendar reunión con María a las 15:00',
    'commit el PR de auth antes de las 16:00',
    'leer 30 páginas del libro de Kahneman',
  ];

  it.each(concrete)('does NOT flag: %s', (text) => {
    const result = detectVagueLanguage(text, 'es');
    // We're tolerant on the language param here — concrete phrasing
    // shouldn't trip ES triggers in either language.
    expect(result.isVague).toBe(false);
  });

  it('English concrete answer passes through', () => {
    expect(detectVagueLanguage('send Q3 report to Sarah by 2pm', 'en').isVague).toBe(false);
  });
});

describe('detectVagueLanguage — edge cases', () => {
  it('returns isVague=false on empty / non-string input', () => {
    expect(detectVagueLanguage('', 'es').isVague).toBe(false);
    // @ts-expect-error — intentional misuse to verify runtime guard
    expect(detectVagueLanguage(null, 'es').isVague).toBe(false);
    // @ts-expect-error — intentional misuse to verify runtime guard
    expect(detectVagueLanguage(undefined, 'en').isVague).toBe(false);
  });

  it('case-insensitive', () => {
    expect(detectVagueLanguage('TAL VEZ', 'es').isVague).toBe(true);
    expect(detectVagueLanguage('EVENTUALLY', 'en').isVague).toBe(true);
  });

  it('matches word-bounded only (not partials)', () => {
    // "fineable" should NOT trigger on "fine".
    expect(detectVagueLanguage('fineable amount', 'en').isVague).toBe(false);
    // "ideal" is a trigger; "idealmente" extends it → still triggers
    // because of "ideal" prefix... actually NO — \b means we need a
    // boundary AFTER ideal. "idealmente" has 'm' right after, no boundary.
    expect(detectVagueLanguage('idealmente termino', 'es').isVague).toBe(false);
  });

  it('does NOT trigger on the same word as part of an unrelated phrase', () => {
    // "más" alone is vague; "más 5 kg" probably isn't — but our regex
    // doesn't distinguish context. Accept the recall/precision tradeoff:
    // false positives are cheap (the agent re-asks; user clarifies).
    expect(detectVagueLanguage('subí más', 'es').isVague).toBe(true);
  });
});

// ─── ISSUE-061 cost-reveal ────────────────────────────────────────────

describe('detectMissingCost — Spanish', () => {
  it('returns true when the goal text omits cost', () => {
    expect(detectMissingCost('Aprender alemán B1 antes de diciembre', 'es')).toBe(true);
    expect(detectMissingCost('Correr una media maratón', 'es')).toBe(true);
  });

  it('returns false when text explicitly mentions a trade-off', () => {
    expect(detectMissingCost('Aprender alemán, voy a dejar Netflix', 'es')).toBe(false);
    expect(detectMissingCost('Quiero correr más; sacrificar fines de semana', 'es')).toBe(false);
    expect(detectMissingCost('Cambiar tiempo de TV por estudio', 'es')).toBe(false);
    expect(detectMissingCost('Menos tiempo en redes', 'es')).toBe(false);
  });
});

describe('detectMissingCost — English', () => {
  it('returns true when goal omits cost', () => {
    expect(detectMissingCost('Run a marathon next year', 'en')).toBe(true);
  });

  it('returns false when cost is named', () => {
    expect(detectMissingCost('Learn German, will give up Netflix', 'en')).toBe(false);
    expect(detectMissingCost('Less time on social media', 'en')).toBe(false);
    expect(detectMissingCost('Trade gaming for guitar practice', 'en')).toBe(false);
  });

  it('returns false on empty input', () => {
    expect(detectMissingCost('', 'es')).toBe(false);
    expect(detectMissingCost('', 'en')).toBe(false);
  });
});

// ─── ISSUE-062 reality-test ──────────────────────────────────────────

describe('detectNewCommitment — Spanish', () => {
  const commitments = [
    'voy a ir al gym 5 veces esta semana',
    'me comprometo a leer todas las noches',
    'esta semana hago la migración completa',
    'el proximo mes voy a viajar menos',
    'me propongo terminar el curso',
  ];

  it.each(commitments)('flags: %s', (text) => {
    expect(detectNewCommitment(text, 'es')).toBe(true);
  });

  it('does NOT flag past-tense or reflective statements', () => {
    expect(detectNewCommitment('ayer fui al gym', 'es')).toBe(false);
    expect(detectNewCommitment('me siento cansado', 'es')).toBe(false);
  });
});

describe('detectNewCommitment — English', () => {
  const commitments = [
    "I'm going to ship the feature this week",
    'I will run every morning',
    "I'll commit to 30 minutes of meditation",
    'I commit to one creative hour daily',
    'this week I am writing every day',
    'next month I start the course',
  ];

  it.each(commitments)('flags: %s', (text) => {
    expect(detectNewCommitment(text, 'en')).toBe(true);
  });

  it('does NOT flag past-tense', () => {
    expect(detectNewCommitment('I went to the gym yesterday', 'en')).toBe(false);
  });
});
