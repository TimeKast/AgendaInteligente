/**
 * Tests for the agent-base system prompt renderer — ISSUE-050.
 *
 * Locks in: language switch + intensity calibration + onboarding embed.
 */

import { describe, it, expect } from 'vitest';
import { renderAgentBase } from '@/lib/ai/system-prompts/agent-base';

describe('renderAgentBase', () => {
  it('emits Spanish block when preferredLanguage="es"', () => {
    const out = renderAgentBase({
      preferredLanguage: 'es',
      intensityMode: 'standard',
    });
    expect(out).toContain('AGENT BASE — AgendaInteligente');
    expect(out).toContain('Español neutro LatAm');
    expect(out).toContain('INTENSIDAD ACTUAL: STANDARD');
  });

  it('emits English block when preferredLanguage="en"', () => {
    const out = renderAgentBase({
      preferredLanguage: 'en',
      intensityMode: 'sharp',
    });
    expect(out).toContain('AGENT BASE — AgendaInteligente');
    expect(out).toContain('Match the user');
    expect(out).toContain('INTENSIDAD ACTUAL: SHARP');
    // Spanish-only specifics must NOT leak into the English render.
    expect(out).not.toContain('Español neutro LatAm');
  });

  it('embeds onboarding context as its own section when provided', () => {
    const out = renderAgentBase({
      preferredLanguage: 'es',
      intensityMode: 'gentle',
      onboardingContext: 'olvido las cosas, no termino lo que empiezo',
    });
    expect(out).toContain('CONTEXTO DEL USUARIO');
    expect(out).toContain('olvido las cosas');
  });

  it('omits the onboarding section when context is null/empty/whitespace', () => {
    const a = renderAgentBase({
      preferredLanguage: 'es',
      intensityMode: 'gentle',
      onboardingContext: null,
    });
    const b = renderAgentBase({
      preferredLanguage: 'es',
      intensityMode: 'gentle',
      onboardingContext: '   ',
    });
    expect(a).not.toContain('CONTEXTO DEL USUARIO');
    expect(b).not.toContain('CONTEXTO DEL USUARIO');
  });

  it.each(['sharp', 'standard', 'gentle', 'listening'] as const)(
    'renders the %s intensity guide',
    (mode) => {
      const out = renderAgentBase({ preferredLanguage: 'es', intensityMode: mode });
      // Each intensity has distinct phrasing — assert the expected anchor.
      const anchors: Record<typeof mode, string> = {
        sharp: 'cortas y directas',
        standard: 'Equilibra empatía',
        gentle: 'cálido, paciente',
        listening: 'Solo escucha',
      };
      expect(out).toContain(anchors[mode]);
    }
  );

  it('NEVER includes Argentinian voseo or argentinismos in the Spanish block', () => {
    const out = renderAgentBase({ preferredLanguage: 'es', intensityMode: 'standard' });
    // Document the rule in code: prohibited words list lives here so a
    // future edit of agent-base accidentally adding "vos"/"tenés"/"che"
    // fails the suite.
    const FORBIDDEN = ['"vos"', '"tenés"', '"querés"', '"che"', '"dale"'];
    for (const word of FORBIDDEN) {
      // The forbidden tokens APPEAR in the prompt as quoted examples
      // ("NUNCA uses..."), so we check they appear ONLY there. We
      // strip the prohibition paragraph and assert no other occurrence.
      const cleaned = out.replace(
        /\*\*AI-1[\s\S]*?Si el usuario te escribe en inglés, responde en\s+inglés\./,
        ''
      );
      expect(cleaned).not.toContain(word);
    }
  });
});
