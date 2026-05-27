/**
 * Voice-parser system prompt — ISSUE-073.
 *
 * Used by `POST /api/ai/parse-task` after STT to extract a structured
 * activity preview from natural-language dictation. The prompt:
 *   - Pins the model to Spanish OR English (per user pref).
 *   - Embeds the user's project list so Claude can match by name.
 *   - Embeds today's date in the user's TZ so relative-date parsing
 *     ("mañana", "el viernes que viene") resolves correctly.
 *   - Requires a tool_use call to `create_activity_preview` — never
 *     accepts free-text output (AI-9).
 *
 * Linked: AI-9, FT-073, FT-100, R-P-005.
 */

import type { PreferredLanguage } from './agent-base';

export interface VoiceParserContext {
  preferredLanguage: PreferredLanguage;
  /** YYYY-MM-DD in the user's TZ. Used for relative-date resolution. */
  todayLocal: string;
  /** User's IANA TZ — surfaced in the prompt so the LLM knows the frame. */
  timezone: string;
  /**
   * Active projects the user owns. Embedded so the LLM can match
   * "personal" to project id `xyz`. Cap at ~50 to keep prompt small.
   */
  projects: Array<{ id: string; name: string; categoryName?: string }>;
}

function projectListBlock(
  projects: VoiceParserContext['projects'],
  lang: PreferredLanguage
): string {
  if (projects.length === 0) {
    return lang === 'es'
      ? 'El usuario no tiene proyectos. Usa `project_id_suggestion: null` y deja `project_name_match: null`.'
      : 'User has no projects. Use `project_id_suggestion: null` and leave `project_name_match: null`.';
  }
  const header = lang === 'es' ? 'Proyectos del usuario:' : "User's projects:";
  const rows = projects
    .map(
      (p) =>
        `  - id: ${p.id} · name: "${p.name}"${p.categoryName ? ` · category: "${p.categoryName}"` : ''}`
    )
    .join('\n');
  return `${header}\n${rows}`;
}

export function renderVoiceParser(ctx: VoiceParserContext): string {
  const lang = ctx.preferredLanguage;
  const block = projectListBlock(ctx.projects, lang);
  if (lang === 'en') {
    return `# VOICE PARSER

You convert a single dictated sentence into a structured activity. You MUST
call the \`create_activity_preview\` tool exactly once with the parsed
fields. Do NOT respond with free text.

## TODAY (user TZ ${ctx.timezone}): ${ctx.todayLocal}

Resolve relative dates against this date:
  - "today"           → ${ctx.todayLocal}
  - "tomorrow"        → next day
  - "next Friday"     → the next Friday strictly after today
  - "in 3 days"       → today + 3
If no date implied, leave \`scheduled_date\` null.

## PROJECT MATCHING

${block}

If the user mentions a project name (or a fragment), pick the closest
match by id. If unclear, leave \`project_id_suggestion\` null and add
up to 3 \`alternatives\` with a confidence in [0,1].

## PRIORITY

Map words → 1..5:
  - "low" / "baja"         → 2
  - (nothing)              → 3
  - "high" / "alta"        → 4
  - "urgent" / "urgente"   → 5

## OUTPUT

Always call \`create_activity_preview\` once. Required: \`title\`. All
other fields optional (null when not implied by the dictation).`;
  }

  // Spanish (default)
  return `# VOICE PARSER

Convertí UNA frase dictada en una actividad estructurada. DEBÉS llamar la
herramienta \`create_activity_preview\` exactamente una vez con los campos
extraídos. NO respondas con texto libre.

(Nota: este prompt usa "vos" sólo en el imperativo del instructor; tu
output al usuario sigue la regla AI-1 — neutral LatAm con "tú".)

## HOY (TZ usuario ${ctx.timezone}): ${ctx.todayLocal}

Resolvé fechas relativas contra esta fecha:
  - "hoy"                 → ${ctx.todayLocal}
  - "mañana"              → día siguiente
  - "el viernes que viene" → próximo viernes estricto
  - "en 3 días"           → hoy + 3
Si no hay fecha implícita, \`scheduled_date\` = null.

## MATCHING DE PROYECTOS

${block}

Si el usuario menciona un nombre de proyecto (completo o parcial), elegí
el id más cercano. Si no hay match claro, dejá \`project_id_suggestion\`
en null y agregá hasta 3 \`alternatives\` con confidence ∈ [0,1].

## PRIORIDAD

Mapeá palabras → 1..5:
  - "baja" / "low"          → 2
  - (sin mención)           → 3
  - "alta" / "high"         → 4
  - "urgente" / "urgent"    → 5

## OUTPUT

Siempre llamá \`create_activity_preview\` una vez. Obligatorio: \`title\`.
El resto opcional (null cuando no surja del dictado).`;
}

/**
 * Tool schema for `create_activity_preview` — return-only (NO db write).
 * The route emits this back to the client; the user confirms before any
 * `create_activity` is persisted.
 */
export const CREATE_ACTIVITY_PREVIEW_TOOL = {
  name: 'create_activity_preview',
  description:
    'Returns the structured activity extracted from the dictation. Does not write to the DB. Caller confirms before persisting.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string' as const },
      project_id_suggestion: { type: 'string' as const, nullable: true },
      project_name_match: { type: 'string' as const, nullable: true },
      project_match_confidence: { type: 'number' as const, minimum: 0, maximum: 1 },
      scheduled_date: {
        type: 'string' as const,
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        nullable: true,
      },
      scheduled_time: {
        type: 'string' as const,
        pattern: '^\\d{2}:\\d{2}$',
        nullable: true,
      },
      duration_minutes: { type: 'integer' as const, minimum: 1, nullable: true },
      priority: { type: 'integer' as const, minimum: 1, maximum: 5 },
      deadline: {
        type: 'string' as const,
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        nullable: true,
      },
      alternatives: {
        type: 'array' as const,
        items: { type: 'object' as const, properties: {} },
      },
    },
    required: ['title', 'priority'],
  },
} as const;
