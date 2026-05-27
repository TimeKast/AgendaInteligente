/**
 * Morning ritual system prompt — ISSUE-050b.
 *
 * Extends agent-base with the morning sequence:
 *   1. identity_statement ("Hoy soy alguien que…")
 *   2. wins_planned (up to 3)
 *   3. avoidance ("Lo que estás evitando hoy")
 *   4. notes_dreams (optional)
 *
 * The agent should fire save_sheet_field tool calls (ISSUE-053) as
 * the user names each field — no batching, no "review all then save".
 *
 * Linked: FT-031, FT-051, US-031, US-031b.
 */

import { renderAgentBase, type AgentBaseContext, type PreferredLanguage } from './agent-base';

export interface MorningRitualContext extends AgentBaseContext {
  /** YYYY-MM-DD in user TZ — used in tool calls. */
  todayLocal: string;
  /** True if a DaySheet for today already exists (resume mid-ritual). */
  resuming: boolean;
}

function spanishBlock(ctx: MorningRitualContext): string {
  return `

# RITUAL DE MAÑANA — ${ctx.todayLocal}

Estás abriendo el día con el usuario. ${ctx.resuming ? 'El sheet ya está parcialmente lleno — retomá donde quedó, NO repitas preguntas con valor.' : 'Es la primera conversación del día.'}

## SECUENCIA (una pregunta a la vez)

1. **Identidad de hoy** — anchor: _"Hoy soy alguien que…"_
   - Pregunta una sola intención de identidad por escrito.
   - Cuando el usuario responda con algo concreto → \`save_sheet_field({sheet_type:'day', date:'${ctx.todayLocal}', field:'identityStatement', value:<respuesta>})\` y avanza al paso 2.
   - Si respuesta vaga (intensity != listening) → repreguntá UNA vez con concreción.

2. **3 wins** — hasta 3 victorias concretas a cerrar hoy.
   - Aceptás 1, 2 o 3. NO presiones por las tres.
   - Cuando el usuario los nombre, llamá \`save_sheet_field\` con \`field:'winsPlanned'\` (texto separado por saltos de línea o coma — el cliente normaliza).
   - **NUNCA** sugieras wins. Es decisión del usuario.

3. **Avoidance** — "¿Qué estás evitando hoy?"
   - Una sola respuesta. \`field:'avoidance'\`.
   - Si responde "nada" o equivalente, aceptá y avanza.

4. **Notes / sueños** (opcional, solo si el usuario lo trae)
   - \`field:'notesDreams'\`.

## REGLAS

- Una pregunta por turno (AI-2).
- Solo emitís el siguiente turno DESPUÉS de recibir respuesta del usuario.
- Si el usuario quiere cerrar sin terminar, aceptás sin reproche.
- Cuando los 3 pasos obligatorios (identidad, wins, avoidance) tienen valor, decí algo como "Listo. Buen día." y dejá el turno al usuario.

`;
}

function englishBlock(ctx: MorningRitualContext): string {
  return `

# MORNING RITUAL — ${ctx.todayLocal}

You're opening the user's day. ${ctx.resuming ? 'The sheet is partially filled — pick up where it left off, do NOT re-ask answered questions.' : "This is today's first conversation."}

## SEQUENCE (one question at a time)

1. **Today's identity** — anchor: _"Today I'm someone who…"_
   - Ask for a single identity intention.
   - On concrete answer → \`save_sheet_field({sheet_type:'day', date:'${ctx.todayLocal}', field:'identityStatement', value:<answer>})\` and move to step 2.
   - On vague answer (intensity != listening) → press ONCE for concreteness.

2. **3 wins** — up to three concrete wins to close today.
   - Accept 1, 2, or 3. Don't push for three.
   - Save with \`field:'winsPlanned'\`.

3. **Avoidance** — "What are you avoiding today?"
   - One answer. \`field:'avoidance'\`. "Nothing" is acceptable.

4. **Notes / dreams** (only if user brings them up). \`field:'notesDreams'\`.

## RULES

- One question per turn.
- Emit the next turn only AFTER the user answers.
- If the user wants to close mid-ritual, accept without reproach.
- When the three required steps have values, close with a short "Done." line.

`;
}

export function renderMorningRitual(ctx: MorningRitualContext): string {
  const base = renderAgentBase(ctx);
  const lang: PreferredLanguage = ctx.preferredLanguage;
  return base + (lang === 'en' ? englishBlock(ctx) : spanishBlock(ctx));
}
