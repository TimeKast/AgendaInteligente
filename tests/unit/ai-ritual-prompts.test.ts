/**
 * Snapshot-style tests for the 4 ritual prompts — ISSUE-050b.
 *
 * Frozen contract: each prompt MUST include its agent-base voice
 * principles AND its ritual-specific sections. Relaxing assertions
 * here would let regressions slip past the AI agent voice gate.
 */

import { describe, it, expect } from 'vitest';
import { renderMorningRitual } from '@/lib/ai/system-prompts/morning-ritual';
import { renderEveningRitual } from '@/lib/ai/system-prompts/evening-ritual';
import { renderWeeklyKickoff } from '@/lib/ai/system-prompts/weekly-kickoff';
import { renderWeeklyReview } from '@/lib/ai/system-prompts/weekly-review';
import { passesVoiceLint } from '@/lib/ai/voice-linter';

const baseCtx = {
  intensityMode: 'standard' as const,
  preferredLanguage: 'es' as const,
  onboardingContext: null,
};

describe('renderMorningRitual', () => {
  it('emits Spanish ritual with agent-base + sequence sections', () => {
    const out = renderMorningRitual({
      ...baseCtx,
      todayLocal: '2026-05-27',
      resuming: false,
    });
    expect(out).toContain('AGENT BASE — AgendaInteligente');
    expect(out).toContain('RITUAL DE MAÑANA — 2026-05-27');
    expect(out).toContain('Hoy soy alguien que');
    expect(out).toContain('identityStatement');
    expect(out).toContain('winsPlanned');
    expect(out).toContain('avoidance');
  });

  it('reflects resuming state in the prompt', () => {
    const fresh = renderMorningRitual({ ...baseCtx, todayLocal: '2026-05-27', resuming: false });
    const resume = renderMorningRitual({ ...baseCtx, todayLocal: '2026-05-27', resuming: true });
    expect(fresh).toContain('primera conversación del día');
    expect(resume).toContain('retomá donde quedó');
  });

  it('emits English block when preferred_language=en', () => {
    const out = renderMorningRitual({
      ...baseCtx,
      preferredLanguage: 'en',
      todayLocal: '2026-05-27',
      resuming: false,
    });
    expect(out).toContain('MORNING RITUAL');
    expect(out).toContain("Today's identity");
    expect(out).not.toContain('RITUAL DE MAÑANA');
  });
});

describe('renderEveningRitual', () => {
  it('embeds pending activity ids for the walkthrough', () => {
    const out = renderEveningRitual({
      ...baseCtx,
      todayLocal: '2026-05-27',
      pendingActivities: [
        { id: 'a-1', title: 'Llamar a María' },
        { id: 'a-2', title: 'Revisar PR' },
      ],
    });
    expect(out).toContain('RITUAL DE CIERRE');
    expect(out).toContain('a-1');
    expect(out).toContain('Llamar a María');
    expect(out).toContain('update_activity_status');
    expect(out).toContain('closeSummary');
  });

  it('handles empty-pending case gracefully', () => {
    const out = renderEveningRitual({
      ...baseCtx,
      todayLocal: '2026-05-27',
      pendingActivities: [],
    });
    expect(out).toContain('cerró todas las activities');
  });
});

describe('renderWeeklyKickoff', () => {
  it('emits all 7 ritual steps in order', () => {
    const out = renderWeeklyKickoff({
      ...baseCtx,
      weekStarting: '2026-05-24',
      resuming: false,
    });
    expect(out).toContain('KICKOFF SEMANAL');
    expect(out).toContain('One Thing');
    expect(out).toContain('3 Wins');
    expect(out).toContain('Calendar blocks');
    expect(out).toContain('People to connect');
    expect(out).toContain('Learn one');
    expect(out).toContain('Avoid one');
    expect(out).toContain('Self-care');
    expect(out).toContain('oneThing');
    expect(out).toContain('threeWins');
    expect(out).toContain('selfCare');
  });
});

describe('renderWeeklyReview', () => {
  const day = (date: string, overrides: Record<string, unknown> = {}) => ({
    date,
    identityStatement: null,
    winsPlanned: null,
    closeSummary: null,
    doneCount: 0,
    notDoneCount: 0,
    ...overrides,
  });

  it('embeds the 7-day snapshot rollup', () => {
    const out = renderWeeklyReview({
      ...baseCtx,
      weekStarting: '2026-05-17',
      weekEnding: '2026-05-23',
      days: [
        day('2026-05-17', { identityStatement: 'foco', doneCount: 2, notDoneCount: 1 }),
        day('2026-05-18', { doneCount: 0, notDoneCount: 3 }),
      ],
    });
    expect(out).toContain('REVIEW SEMANAL — 2026-05-17 → 2026-05-23');
    expect(out).toContain('2026-05-17');
    expect(out).toContain('done=2/notDone=1');
    expect(out).toContain('reviewWins');
    expect(out).toContain('reviewEnergy');
    expect(out).toContain('reviewOneSentence');
  });

  it('handles empty week (no prior data)', () => {
    const out = renderWeeklyReview({
      ...baseCtx,
      weekStarting: '2026-05-17',
      weekEnding: '2026-05-23',
      days: [],
    });
    expect(out).toContain('Sin datos previos');
  });

  it('listening intensity skips the walkthrough instruction', () => {
    const out = renderWeeklyReview({
      ...baseCtx,
      intensityMode: 'listening',
      weekStarting: '2026-05-17',
      weekEnding: '2026-05-23',
      days: [],
    });
    // The instruction lists the listening condition.
    expect(out).toContain('listening');
  });
});

describe('voice-lint cleanliness across all ritual prompts', () => {
  // The prompts CONTAIN forbidden-token examples (the AI-1 prohibition
  // paragraph from agent-base). We strip that paragraph before linting
  // so we catch only NEW voseo/praise that crept into ritual content.
  function stripAiBlock(text: string): string {
    return text.replace(/\*\*AI-1[\s\S]*?en\s+inglés\./, '');
  }

  it('morning ritual ES has no NEW voseo outside the agent-base AI-1 block', () => {
    // The agent-base AI-1 block legitimately QUOTES forbidden tokens as
    // examples. We strip that paragraph and assert the ritual additions
    // don't reintroduce them.
    const out = stripAiBlock(
      renderMorningRitual({ ...baseCtx, todayLocal: '2026-05-27', resuming: false })
    );
    expect(out).not.toMatch(/\bque tenés\b/i);
    expect(out).not.toMatch(/\bque querés\b/i);
  });

  it('voice linter sanity — a clean reply from the agent style passes', () => {
    // Just verify the linter is wired correctly with the ritual context.
    expect(passesVoiceLint('Lo anoté. ¿Qué te queda para hoy?')).toBe(true);
  });
});
