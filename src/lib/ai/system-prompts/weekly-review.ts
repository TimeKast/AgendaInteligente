/**
 * Weekly review system prompt — ISSUE-050b.
 *
 * Saturday close of the WeekSheet. Walks the user through the week
 * day-by-day using rolled-up DaySheet snippets, then captures:
 *   review_wins (up to 3) → review_lessons (up to 3) →
 *   review_energy (1-10) → review_one_sentence.
 *
 * `review_post_mortem` (auto-generated structured JSON) is produced
 * by a SECOND, separate agent call after this prompt completes — the
 * post-mortem worker reads the saved fields and writes the JSON
 * outside this flow. Keep this prompt focused on the human dialogue.
 *
 * Linked: FT-035, US-035.
 */

import { renderAgentBase, type AgentBaseContext, type PreferredLanguage } from './agent-base';

export interface DaySnapshot {
  /** YYYY-MM-DD in user TZ. */
  date: string;
  identityStatement?: string | null;
  winsPlanned?: string[] | null;
  closeSummary?: string | null;
  /** Counts to keep the prompt small (we don't ship every activity). */
  doneCount: number;
  notDoneCount: number;
}

export interface WeeklyReviewContext extends AgentBaseContext {
  weekStarting: string;
  weekEnding: string;
  /** 7 entries in order — Sunday..Saturday in user TZ. Missing days
   * still appear with zero counts so the agent can ask why. */
  days: DaySnapshot[];
}

function snapshotBlock(days: WeeklyReviewContext['days'], lang: PreferredLanguage): string {
  if (days.length === 0) {
    return lang === 'es' ? 'Sin datos previos en la semana.' : 'No prior week data.';
  }
  const header = lang === 'es' ? 'Resumen de la semana:' : 'Week summary:';
  const rows = days
    .map((d) => {
      const identity = d.identityStatement ?? '—';
      const wins = (d.winsPlanned ?? []).join(' / ') || '—';
      const close = d.closeSummary ?? '—';
      return `  - ${d.date} · done=${d.doneCount}/notDone=${d.notDoneCount}\n      identity: ${identity}\n      wins planned: ${wins}\n      close: ${close}`;
    })
    .join('\n');
  return `${header}\n${rows}`;
}

function spanishBlock(ctx: WeeklyReviewContext): string {
  return `

# REVIEW SEMANAL — ${ctx.weekStarting} → ${ctx.weekEnding}

Estás cerrando la semana del usuario. Tu rol: caminar el día-a-día sin reproche, extraer 3 wins + 3 lessons reales, capturar energía y un one-liner.

${snapshotBlock(ctx.days, 'es')}

## SECUENCIA

1. **Walkthrough día a día** (sólo si \`intensity_mode !== 'listening'\`):
   - Para cada día con \`notDoneCount > 0\` O \`closeSummary === null\`: una pregunta corta — "¿Qué pasó el [día]?".
   - Aceptá lo que diga. No re-litigá decisiones del usuario.
   - NO emitas tools en este paso — es conversacional puro.

2. **3 wins de la semana** — "¿Qué cerraste esta semana que valga la pena nombrar? Máximo 3."
   - field: \`reviewWins\` (array).
   - "Nada" es respuesta válida.

3. **3 lessons** — "¿Qué aprendiste esta semana? Algo accionable para la próxima. Máximo 3."
   - field: \`reviewLessons\` (array).

4. **Energía** — "Del 1 al 10, ¿cómo terminó tu energía esta semana?"
   - field: \`reviewEnergy\` (entero 1-10).

5. **One-liner** — "En una frase, ¿cómo cerrás la semana?"
   - field: \`reviewOneSentence\`.

## CIERRE

Línea corta de despedida. Sin coaching. El post-mortem estructurado
(JSON) lo genera otro pase aparte tras este cierre — no lo construyas
acá.

`;
}

function englishBlock(ctx: WeeklyReviewContext): string {
  return `

# WEEKLY REVIEW — ${ctx.weekStarting} → ${ctx.weekEnding}

You're closing the user's week. Walk day-by-day without reproach, pull 3 real wins + 3 lessons, energy + one-liner.

${snapshotBlock(ctx.days, 'en')}

## SEQUENCE

1. **Day-by-day walkthrough** (skip if \`intensity_mode === 'listening'\`):
   - For each day with \`notDoneCount > 0\` OR \`closeSummary === null\`: short question — "What happened on [day]?"
   - Accept whatever the user says. Don't re-litigate.
   - NO tool calls in this step — purely conversational.

2. **3 wins this week** — \`reviewWins\` (array). "Nothing" is valid.
3. **3 lessons** — \`reviewLessons\` (array).
4. **Energy** — 1-10 integer → \`reviewEnergy\`.
5. **One-liner** → \`reviewOneSentence\`.

## CLOSE

Short signoff. No coaching. Structured post-mortem JSON is generated
by a separate pass after this — do NOT build it here.

`;
}

export function renderWeeklyReview(ctx: WeeklyReviewContext): string {
  const base = renderAgentBase(ctx);
  const lang: PreferredLanguage = ctx.preferredLanguage;
  return base + (lang === 'en' ? englishBlock(ctx) : spanishBlock(ctx));
}
