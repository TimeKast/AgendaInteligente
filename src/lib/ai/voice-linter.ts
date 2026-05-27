/**
 * Voice-principles linter — ISSUE-055.
 *
 * Deterministic checks over a candidate agent response. Used by the
 * eval harness (ISSUE-050c) + as a defense-in-depth in tests against
 * agent regressions.
 *
 * NOT a runtime gate on every chat turn — false positives would block
 * legitimate replies. The system prompt itself enforces these rules at
 * generation time; the linter is post-hoc verification.
 *
 * Principles:
 *   - AI-1: idioma — no Argentinian voseo / argentinismos in Spanish.
 *   - AI-2: one question per turn.
 *   - AI-3: no automatic praise ("¡excelente!", "¡tú puedes!").
 *   - AI-4: no decorative emojis.
 *   - AI-6: short sentences, max ~2 sentences per turn.
 *
 * Linked: AI-1..7, FT-054, FT-055.
 */

export type VoicePrinciple = 'AI-1' | 'AI-2' | 'AI-3' | 'AI-4' | 'AI-6';

export interface VoiceLintViolation {
  principle: VoicePrinciple;
  /** Short human-readable description of what was detected. */
  reason: string;
  /** Optional snippet of the offending substring (lowercased). */
  match?: string;
}

// AI-1: forbidden Argentinian voseo + argentinismos.
const VOSEO_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bvos\b/i, reason: 'voseo: "vos" prohibited (use "tú")' },
  { pattern: /\bten[eé]s\b/i, reason: 'voseo: "tenés"' },
  { pattern: /\bquer[eé]s\b/i, reason: 'voseo: "querés"' },
  { pattern: /\bpod[eé]s\b/i, reason: 'voseo: "podés"' },
  { pattern: /\bsab[eé]s\b/i, reason: 'voseo: "sabés"' },
  { pattern: /\bdec[ií]s\b/i, reason: 'voseo: "decís"' },
  { pattern: /\bve[ií]s\b/i, reason: 'voseo: "veís"' },
  { pattern: /\bsos\b/i, reason: 'voseo: "sos" (use "eres")' },
  // Imperatives with vos. JS `\b` treats accented chars as non-word
  // (no transition after á / í), so we use an explicit trailing-boundary
  // lookahead. The leading `\b` still works because the imperative
  // starts with an ASCII letter.
  { pattern: /\blistá(?=\s|$|[.,!?])/i, reason: 'argentinian imperative: "listá"' },
  { pattern: /\bincluí(?=\s|$|[.,!?])/i, reason: 'argentinian imperative: "incluí"' },
  // Argentinismos
  { pattern: /\bche\b/i, reason: 'argentinismo: "che"' },
  { pattern: /\bdale\b/i, reason: 'argentinismo: "dale"' },
];

// AI-3: praise patterns (case-insensitive; word-bounded where possible).
const PRAISE_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bexcelente\b/i, reason: 'praise: "excelente"' },
  { pattern: /\bincre[ií]ble\b/i, reason: 'praise: "increíble"' },
  { pattern: /\bperfecto\b/i, reason: 'praise: "perfecto"' },
  { pattern: /\bgenial\b/i, reason: 'praise: "genial"' },
  { pattern: /\bbu[eé]n[a-z]*\s+idea\b/i, reason: 'praise: "buena idea"' },
  {
    pattern: /\b(t[uú]\s+puedes|you\s+(got|can\s+do)\s+(this|it))\b/i,
    reason: 'praise: "tú puedes / you can do this"',
  },
  { pattern: /\bamazing\b/i, reason: 'praise (en): "amazing"' },
  { pattern: /\bawesome\b/i, reason: 'praise (en): "awesome"' },
  { pattern: /\bperfect\b/i, reason: 'praise (en): "perfect"' },
];

// AI-4: decorative emojis. We deliberately ALLOW ✓ ⏸ ⚠ (semantic
// status). Everything else flags.
const ALLOWED_EMOJIS = new Set(['✓', '⏸', '⚠']);
const EMOJI_REGEX = /\p{Extended_Pictographic}/gu;

/** Count direct + indirect questions. Heuristic — looks at '?' first,
 * then question-word starts. */
function countQuestions(text: string): number {
  const directs = (text.match(/\?/g) ?? []).length;
  // We don't try to count rhetorical statements — direct '?' is the
  // contract. The agent is instructed to use exactly one '?' per turn.
  return directs;
}

function countSentences(text: string): number {
  // Split on terminal punctuation. Trim short fragments < 2 chars.
  const parts = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
  return parts.length;
}

/**
 * Lint a candidate agent response. Returns the (possibly empty) list
 * of violations. Empty array → passes all checks.
 */
export function lintAgentReply(text: string): VoiceLintViolation[] {
  const violations: VoiceLintViolation[] = [];

  // AI-1: voseo + argentinismos.
  for (const { pattern, reason } of VOSEO_PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      violations.push({ principle: 'AI-1', reason, match: m[0].toLowerCase() });
    }
  }

  // AI-3: praise tokens.
  for (const { pattern, reason } of PRAISE_PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      violations.push({ principle: 'AI-3', reason, match: m[0].toLowerCase() });
    }
  }

  // AI-4: decorative emojis (anything not in the allowed-status set).
  const emojis = [...text.matchAll(EMOJI_REGEX)].map((m) => m[0]);
  for (const e of emojis) {
    if (!ALLOWED_EMOJIS.has(e)) {
      violations.push({
        principle: 'AI-4',
        reason: 'decorative emoji not allowed',
        match: e,
      });
    }
  }

  // AI-2: at most one '?'. Zero is acceptable (statements / reflections).
  const qs = countQuestions(text);
  if (qs > 1) {
    violations.push({
      principle: 'AI-2',
      reason: `${qs} questions in one turn (max 1)`,
    });
  }

  // AI-6: sentence-count budget. We allow up to 3 (a 2-sentence reply
  // followed by a 1-sentence question = 3 fragments after split).
  const sentenceCount = countSentences(text);
  if (sentenceCount > 3) {
    violations.push({
      principle: 'AI-6',
      reason: `${sentenceCount} sentences (max 3)`,
    });
  }

  return violations;
}

/** Convenience: true iff the reply lints clean. */
export function passesVoiceLint(text: string): boolean {
  return lintAgentReply(text).length === 0;
}
