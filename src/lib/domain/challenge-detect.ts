/**
 * Challenge detection — ISSUE-060 (vague-language) + extensible for
 * cost-reveal / reality-test / etc.
 *
 * The most-fired challenge is vague-language: when a user's answer
 * uses words that hide concreteness ("mejor", "más enfocado", "fine"),
 * the agent presses for a definition observable-from-outside. The
 * agent gets a boolean signal from here + the list of triggers; the
 * actual pressing copy lives in the ritual prompts (ISSUE-050b).
 *
 * Design:
 *   - Word-boundary regex with accent normalization (so "más" and
 *     "mas" both trigger).
 *   - Returns `{ isVague, triggerWords }` so analytics / UI can
 *     render the specific words that fired.
 *   - Caller skips the challenge when `intensity_mode === 'listening'`
 *     — handled outside this function (the detector itself is pure).
 *
 * Linked: AI-2, FT-060, FT-065, US-060.
 */

export type ChallengeLanguage = 'es' | 'en';

export interface VagueDetection {
  isVague: boolean;
  triggerWords: string[];
}

// Spanish triggers. Cover voseo-free LatAm neutral; the voice-linter
// (ISSUE-055) catches voseo separately.
const ES_TRIGGERS: string[] = [
  'mejor',
  'mas', // "más" — we normalize accents before matching
  'pronto',
  'eventualmente',
  'tal vez',
  'quiza',
  'quizas',
  'tal vez',
  'podria',
  'intente',
  'bien',
  'ideal',
  'trabajar en',
  'enfocar en',
  'enfocarme en',
  'mas o menos',
  'ahi voy',
  'ahi ando',
  'lo intento',
  'tratando',
];

const EN_TRIGGERS: string[] = [
  'better',
  'more',
  'soon',
  'eventually',
  'try',
  'trying',
  'fine',
  'okay',
  'good',
  'ideally',
  'maybe',
  'work on',
  'focus on',
  'properly',
  'really',
  'kind of',
  'sort of',
  'somewhat',
  'pretty good',
  'doing my best',
];

/** Strip accents + lowercase + collapse whitespace for matching. */
function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

function buildPattern(trigger: string): RegExp {
  // Escape regex metas; word-boundary on either side (works because
  // we always normalize to ASCII before matching).
  const esc = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${esc}\\b`, 'g');
}

const ES_PATTERNS = ES_TRIGGERS.map(buildPattern);
const EN_PATTERNS = EN_TRIGGERS.map(buildPattern);

/**
 * Returns `{ isVague, triggerWords }` for the given user reply.
 * `triggerWords` lists the matched (normalized) tokens — useful for
 * the agent's repregunta + for analytics dashboards.
 */
export function detectVagueLanguage(text: string, lang: ChallengeLanguage): VagueDetection {
  if (!text || typeof text !== 'string') {
    return { isVague: false, triggerWords: [] };
  }
  const normalized = normalize(text);
  const triggers = lang === 'es' ? ES_TRIGGERS : EN_TRIGGERS;
  const patterns = lang === 'es' ? ES_PATTERNS : EN_PATTERNS;

  const hits: string[] = [];
  for (let i = 0; i < patterns.length; i++) {
    // Reset regex state for the global flag.
    patterns[i].lastIndex = 0;
    if (patterns[i].test(normalized)) {
      hits.push(triggers[i]);
    }
  }
  return { isVague: hits.length > 0, triggerWords: hits };
}

// ─── ISSUE-061: cost-reveal challenge ─────────────────────────────────

const COST_KEYWORDS_ES = [
  'dejar de',
  'sacrificar',
  'menos tiempo',
  'cambiar',
  'soltar',
  'renunciar',
  'dejar',
  'a cambio de',
];
const COST_KEYWORDS_EN = [
  'give up',
  'sacrifice',
  'less time',
  'trade',
  'in exchange',
  'drop',
  'stop doing',
];

const COST_PATTERNS_ES = COST_KEYWORDS_ES.map(buildPattern);
const COST_PATTERNS_EN = COST_KEYWORDS_EN.map(buildPattern);

/**
 * True iff the text DOES NOT mention a cost / trade-off. The signal
 * for the cost-reveal agent prompt to fire (user named a goal but
 * didn't name what they'll trade).
 *
 * Linked: FT-061, US-061.
 */
export function detectMissingCost(text: string, lang: ChallengeLanguage): boolean {
  if (!text || typeof text !== 'string') return false;
  const normalized = normalize(text);
  const patterns = lang === 'es' ? COST_PATTERNS_ES : COST_PATTERNS_EN;
  for (const p of patterns) {
    p.lastIndex = 0;
    if (p.test(normalized)) return false; // cost IS mentioned → no challenge
  }
  return true; // no cost keyword → fire challenge
}

// ─── ISSUE-062: reality-test challenge ────────────────────────────────

const COMMITMENT_PATTERNS_ES: RegExp[] = [
  /\bvoy a\s+\w+/i,
  /\bme comprometo\b/i,
  /\besta semana\s+(voy|hago|empiezo|termino)\b/i,
  /\bel proximo mes\b/i,
  /\bme propongo\b/i,
  /\beste mes voy a\b/i,
];

const COMMITMENT_PATTERNS_EN: RegExp[] = [
  /\bi'?m going to\b/i,
  /\bi will\b/i,
  /\bi'?ll\b/i,
  /\bi commit to\b/i,
  /\bthis week i (will|am|am going)\b/i,
  /\bnext month i\b/i,
];

/**
 * True iff the text contains commitment phrasing ("voy a", "i will",
 * "me comprometo a"). Caller pipes this into the reality-test prompt
 * which asks for probability + offers scope-down.
 *
 * Linked: FT-062, US-062.
 */
export function detectNewCommitment(text: string, lang: ChallengeLanguage): boolean {
  if (!text || typeof text !== 'string') return false;
  const normalized = normalize(text);
  const patterns = lang === 'es' ? COMMITMENT_PATTERNS_ES : COMMITMENT_PATTERNS_EN;
  for (const p of patterns) {
    if (p.test(normalized)) return true;
  }
  return false;
}

/** Exported for tests + tooling. */
export const _internals = {
  ES_TRIGGERS,
  EN_TRIGGERS,
  COST_KEYWORDS_ES,
  COST_KEYWORDS_EN,
  COMMITMENT_PATTERNS_ES,
  COMMITMENT_PATTERNS_EN,
};
