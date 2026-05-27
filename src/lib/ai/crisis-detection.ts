/**
 * Crisis trigger detection + crisis line lookup — ISSUE-056 (Slice A1).
 *
 * Two-layer safety:
 *   1. **Regex pre-filter** (this file): cheap, deterministic, runs on
 *      every user message BEFORE the LLM. False-positive tolerant —
 *      better to wrongly redirect to a crisis line than to miss one.
 *   2. **LLM tool call** (ISSUE-056b): the agent can also emit
 *      `crisis_exit_protocol` for cases the regex missed (depression +
 *      hopelessness combinations, indirect ideation).
 *
 * AI-8: when EITHER layer fires, the chat route replaces the response
 * with the crisis exit panel (CMP-078 in ISSUE-056b). Conversation row
 * gets `crisis_exit_at = now` for downstream telemetry.
 *
 * Privacy: telemetry NEVER includes the matched phrase or message
 * content. Only `{ country, intensity_mode_at_time, timestamp }`.
 *
 * Linked: AI-8, R-O-003, FT-056, BLOCKING for v1 ship.
 */

import crisisLinesData from './crisis-lines.json';

interface CrisisLine {
  name: string;
  phone_display: string;
  phone_tel: string;
  hours: string;
  language: string;
}

interface CrisisLinesFile {
  lines: Record<string, CrisisLine>;
  fallback: CrisisLine;
}

const FILE = crisisLinesData as unknown as CrisisLinesFile;

/**
 * Phrases that fire the regex pre-filter. Lower-cased + Unicode-folded
 * before matching. Keep this list curated: every entry has a clear
 * suicide / self-harm semantic. Vague phrases like "this is killing me"
 * are intentionally OUT — those rely on the LLM layer (ISSUE-056b).
 */
const TRIGGER_PHRASES = [
  // Spanish — direct ideation
  'suicidarme',
  'suicidarse',
  'me quiero matar',
  'quiero matarme',
  'matarme',
  'quitarme la vida',
  'acabar con mi vida',
  'terminar con mi vida',
  'no quiero seguir viviendo',
  'no quiero vivir',
  'ya no aguanto vivir',
  'no aguanto vivir',
  'no aguanto mas',
  'ya no aguanto mas',
  'no veo salida',
  'preferiria estar muerto',
  'preferiria estar muerta',
  'mejor estaria muerto',
  'mejor estaria muerta',
  // Spanish — self-harm
  'hacerme dano',
  'lastimarme',
  'cortarme',
  // English — direct ideation
  'kill myself',
  'killing myself',
  'suicide',
  'end my life',
  'take my own life',
  'taking my own life',
  'taking my life',
  "don't want to live",
  'do not want to live',
  'no reason to live',
  'no way out',
  'better off dead',
  // English — self-harm
  'hurt myself',
  'harm myself',
  'cut myself',
] as const;

/**
 * Normalize a string for matching: lowercase, strip accents, collapse
 * whitespace. Spanish "queré" → "quere", "díganle" → "diganle", etc.
 * We intentionally keep punctuation (so "kill myself." still matches).
 */
function normalize(input: string): string {
  return input.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * True iff the user message contains a crisis trigger phrase. Substring
 * match on the normalized string — false positives are acceptable here
 * because the CMP-078 panel offers a "back to chat" affordance.
 */
export function detectCrisisTrigger(message: string): boolean {
  if (!message || typeof message !== 'string') return false;
  const haystack = normalize(message);
  for (const phrase of TRIGGER_PHRASES) {
    if (haystack.includes(phrase)) return true;
  }
  return false;
}

/**
 * Best-effort country inference from IANA TZ. Returns ISO country code
 * (e.g. 'MX', 'US'). Falls back to inferring by continent prefix when
 * the exact TZ isn't mapped — the worst case is showing the fallback
 * line. NEVER guesses based on browser locale alone (too easily wrong).
 */
const TZ_COUNTRY_MAP: Record<string, string> = {
  'America/Mexico_City': 'MX',
  'America/Tijuana': 'MX',
  'America/Cancun': 'MX',
  'America/Monterrey': 'MX',
  'America/Merida': 'MX',
  'America/Hermosillo': 'MX',
  'America/Mazatlan': 'MX',
  'America/Chihuahua': 'MX',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Phoenix': 'US',
  'America/Los_Angeles': 'US',
  'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',
  'Europe/Madrid': 'ES',
  'Europe/London': 'GB',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Edmonton': 'CA',
  'America/Halifax': 'CA',
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Argentina/Cordoba': 'AR',
  'America/Argentina/Mendoza': 'AR',
  'America/Bogota': 'CO',
  'America/Santiago': 'CL',
  'America/Lima': 'PE',
  'America/Sao_Paulo': 'BR',
  'America/Recife': 'BR',
  'America/Manaus': 'BR',
  'America/Montevideo': 'UY',
};

export function countryFromTimezone(tz: string): string | null {
  return TZ_COUNTRY_MAP[tz] ?? null;
}

/** Look up the crisis line for a country code, falling back to international. */
export function crisisLineForCountry(countryCode: string | null | undefined): CrisisLine {
  if (countryCode && FILE.lines[countryCode]) {
    return FILE.lines[countryCode];
  }
  return FILE.fallback;
}

/** Convenience: TZ → crisis line in one call. */
export function crisisLineForTimezone(tz: string): CrisisLine {
  return crisisLineForCountry(countryFromTimezone(tz));
}

/** Exported for tests + downstream tooling. */
export type { CrisisLine };
export const _internals = { TRIGGER_PHRASES, TZ_COUNTRY_MAP };
