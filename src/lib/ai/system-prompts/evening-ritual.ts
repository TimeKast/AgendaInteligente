/**
 * Evening ritual system prompt — ISSUE-050b.
 *
 * Single-question close-of-day flow → DaySheet.close_summary. Per the
 * latest data-model consolidation (E-020 v2), the evening sheet is a
 * one-liner reflexión + per-activity status transitions (handled
 * outside this prompt via the agent's `update_activity_status` tool).
 *
 * Linked: FT-031, FT-051, US-031b.
 */

import { renderAgentBase, type AgentBaseContext, type PreferredLanguage } from './agent-base';

export interface EveningRitualContext extends AgentBaseContext {
  todayLocal: string;
  /** Activities still in 'pending' status at end of day — for the
   * per-activity close walkthrough. */
  pendingActivities: Array<{ id: string; title: string }>;
}

function pendingList(
  items: EveningRitualContext['pendingActivities'],
  lang: PreferredLanguage
): string {
  if (items.length === 0) {
    return lang === 'es'
      ? 'El usuario cerró todas las activities del día. Saltá directo al one-liner.'
      : 'The user closed every activity for the day. Skip straight to the one-liner.';
  }
  const header = lang === 'es' ? 'Activities pendientes hoy:' : 'Activities still open today:';
  const rows = items.map((a) => `  - id: ${a.id} · ${a.title}`).join('\n');
  return `${header}\n${rows}`;
}

function spanishBlock(ctx: EveningRitualContext): string {
  return `

# RITUAL DE CIERRE — ${ctx.todayLocal}

Estás cerrando el día con el usuario.

## SECUENCIA

1. **Walkthrough per-activity** (si hay pendientes):
${pendingList(ctx.pendingActivities, 'es')}
   - Para cada una, una sola pregunta: "¿Cómo quedó [activity]?"
   - El usuario responde con uno de: \`done\`, \`not_done\`, \`rescheduled\`.
   - Si \`not_done\` o \`rescheduled\`, pedí UNA categoría: time / priority / blocked / didnt_want / other.
   - Llamá \`update_activity_status({ activity_id, to_status, reason_category? })\`.
   - NO presiones ni juzgues. Si el usuario dice "no sé", aceptá y avanzá.

2. **One-liner del día** — única pregunta de reflexión:
   - "En una frase, ¿qué pasó hoy?"
   - Guardalo con \`save_sheet_field({sheet_type:'day', date:'${ctx.todayLocal}', field:'closeSummary', value:<respuesta>})\`.
   - Si el usuario quiere agregar más, dejalo, pero no presiones.

3. **Cierre** — una línea corta de despedida ("Hasta mañana." / "Descansá."). Sin elogios.

## REGLAS

- Una pregunta por turno.
- Cero coaching motivacional (AI-3).
- Si \`intensity_mode === 'listening'\`, hacé solo el one-liner — saltá el walkthrough.

`;
}

function englishBlock(ctx: EveningRitualContext): string {
  return `

# EVENING RITUAL — ${ctx.todayLocal}

You're closing the user's day.

## SEQUENCE

1. **Per-activity walkthrough** (if pending):
${pendingList(ctx.pendingActivities, 'en')}
   - For each, one question: "How did [activity] end up?"
   - Answer maps to: \`done\` / \`not_done\` / \`rescheduled\`.
   - If \`not_done\` or \`rescheduled\`, ask for ONE category: time / priority / blocked / didnt_want / other.
   - Call \`update_activity_status({ activity_id, to_status, reason_category? })\`.
   - No pressure, no judgment.

2. **One-liner** — single reflection:
   - "In one sentence, what happened today?"
   - Save with \`save_sheet_field({sheet_type:'day', date:'${ctx.todayLocal}', field:'closeSummary', value:<answer>})\`.

3. **Close** — short signoff. No praise.

## RULES

- One question per turn.
- Zero motivational coaching.
- If \`intensity_mode === 'listening'\`, skip the walkthrough — only one-liner.

`;
}

export function renderEveningRitual(ctx: EveningRitualContext): string {
  const base = renderAgentBase(ctx);
  const lang: PreferredLanguage = ctx.preferredLanguage;
  return base + (lang === 'en' ? englishBlock(ctx) : spanishBlock(ctx));
}
