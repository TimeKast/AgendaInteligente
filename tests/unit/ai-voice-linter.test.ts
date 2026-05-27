/**
 * Tests for the voice-principles linter — ISSUE-055.
 *
 * Frozen contract: relaxing any assertion requires explicit sign-off,
 * since these are the AI-agent voice guarantees the product is built on.
 */

import { describe, it, expect } from 'vitest';
import { lintAgentReply, passesVoiceLint } from '@/lib/ai/voice-linter';

describe('AI-1 — Argentinian voseo prohibition', () => {
  const forbidden = [
    '¿Qué tenés pensado hoy?',
    'Vos sabés cómo cerrar este día.',
    '¿Podés decirme cuándo?',
    'Listá las prioridades.',
    'Incluí la reunión.',
    'Che, ¿cómo vas?',
    'Dale, terminemos.',
    'Sos capaz de esto.',
  ];

  it.each(forbidden)('flags: %s', (text) => {
    const violations = lintAgentReply(text);
    expect(violations.some((v) => v.principle === 'AI-1')).toBe(true);
  });

  it('accepts neutral LatAm Spanish', () => {
    const ok = '¿Qué tienes pensado para hoy?';
    expect(passesVoiceLint(ok)).toBe(true);
  });
});

describe('AI-2 — one question per turn', () => {
  it('flags 2 questions', () => {
    const violations = lintAgentReply('¿Cómo estás? ¿Qué tienes pendiente?');
    expect(violations.some((v) => v.principle === 'AI-2')).toBe(true);
  });

  it('flags 3 questions', () => {
    const violations = lintAgentReply('¿X? ¿Y? ¿Z?');
    expect(violations.some((v) => v.principle === 'AI-2')).toBe(true);
  });

  it('accepts exactly 1 question', () => {
    const violations = lintAgentReply('¿Qué cerraste hoy?');
    expect(violations.some((v) => v.principle === 'AI-2')).toBe(false);
  });

  it('accepts zero questions (reflection / statement)', () => {
    const violations = lintAgentReply('Lo anoté.');
    expect(violations.some((v) => v.principle === 'AI-2')).toBe(false);
  });
});

describe('AI-3 — no automatic praise', () => {
  const praise = [
    '¡Excelente!',
    'Qué increíble.',
    '¡Buena idea!',
    'Tú puedes.',
    'Perfecto, sigue así.',
    'Amazing work.',
    'You got this.',
  ];

  it.each(praise)('flags: %s', (text) => {
    const violations = lintAgentReply(text);
    expect(violations.some((v) => v.principle === 'AI-3')).toBe(true);
  });

  it('accepts neutral acknowledgment', () => {
    expect(passesVoiceLint('Lo anoté.')).toBe(true);
    expect(passesVoiceLint('Entiendo.')).toBe(true);
  });
});

describe('AI-4 — decorative emojis', () => {
  it('flags decorative emojis', () => {
    const violations = lintAgentReply('Hoy va a ser un día 🚀');
    expect(violations.some((v) => v.principle === 'AI-4')).toBe(true);
  });

  it('allows semantic status emojis (✓ ⏸ ⚠)', () => {
    expect(passesVoiceLint('✓ Anotado.')).toBe(true);
    expect(passesVoiceLint('⏸ Pausado.')).toBe(true);
    expect(passesVoiceLint('⚠ Cuidado con el deadline.')).toBe(true);
  });

  it('multiple decorative emojis each flag', () => {
    const violations = lintAgentReply('🎉🔥💪');
    const ai4 = violations.filter((v) => v.principle === 'AI-4');
    expect(ai4.length).toBeGreaterThanOrEqual(3);
  });
});

describe('AI-6 — sentence-count budget', () => {
  it('flags 4+ sentences', () => {
    const text = 'Uno. Dos. Tres. Cuatro.';
    const violations = lintAgentReply(text);
    expect(violations.some((v) => v.principle === 'AI-6')).toBe(true);
  });

  it('accepts 1-3 sentences', () => {
    expect(passesVoiceLint('Una sola.')).toBe(true);
    expect(passesVoiceLint('Dos cosas. La segunda.')).toBe(true);
    expect(passesVoiceLint('Una. Dos. Tres.')).toBe(true);
  });
});

describe('combined / regression cases', () => {
  it('accepts a typical well-formed reply', () => {
    const text = 'Lo anoté. ¿Qué te queda para hoy?';
    expect(passesVoiceLint(text)).toBe(true);
  });

  it('reports multiple violations independently', () => {
    const text = '¡Excelente, vos podés con esto! ¿Qué tenés? ¿Cómo vas?';
    const violations = lintAgentReply(text);
    const principles = new Set(violations.map((v) => v.principle));
    expect(principles.has('AI-1')).toBe(true);
    expect(principles.has('AI-2')).toBe(true);
    expect(principles.has('AI-3')).toBe(true);
  });
});
