/**
 * Model registry + per-token pricing — ISSUE-050 (Slice A1).
 *
 * Pricing is USD per MILLION tokens, snapshotted from the Anthropic
 * public pricing page. Update when the rates change — the cost
 * estimator below derives everything from these constants.
 *
 * Model selection:
 *   - SONNET → default for proactive check-ins (best reasoning per dollar).
 *   - HAIKU  → cheap + fast path for voice parsing (structured tool call,
 *              ~1.5s p50 target).
 *
 * Sonnet 4.7 will become default when stable — flip `DEFAULT_MODEL`.
 *
 * Linked: FT-051, FT-054, AI-5.
 */

export const MODELS = {
  SONNET: 'claude-sonnet-4-6',
  HAIKU: 'claude-haiku-4-5-20251001',
} as const;

export type ModelKey = keyof typeof MODELS;
export type ModelId = (typeof MODELS)[ModelKey];

/** Default model for agent check-ins / weekly review. */
export const DEFAULT_MODEL: ModelId = MODELS.SONNET;

/** Cheap model for voice → structured task parsing. */
export const VOICE_PARSER_MODEL: ModelId = MODELS.HAIKU;

/**
 * USD per million tokens. Cache hits cost ~10% of regular input,
 * cache writes ~125% of regular input — keys mirror Anthropic billing.
 */
export const PRICING: Record<
  ModelId,
  { input: number; output: number; cacheRead: number; cacheWrite: number }
> = {
  [MODELS.SONNET]: { input: 3.0, output: 15.0, cacheRead: 0.3, cacheWrite: 3.75 },
  [MODELS.HAIKU]: { input: 1.0, output: 5.0, cacheRead: 0.1, cacheWrite: 1.25 },
};

export interface TokenUsage {
  input: number;
  output: number;
  /** Tokens served from the prompt cache (paid at cacheRead rate). */
  cacheRead?: number;
  /** Tokens written into the prompt cache on this call. */
  cacheWrite?: number;
}

/** Returns the USD cost of a single call. Pure function. */
export function estimateCostUsd(model: ModelId, usage: TokenUsage): number {
  const p = PRICING[model];
  if (!p) throw new Error(`Unknown model for pricing: ${model}`);
  const cost =
    (usage.input * p.input +
      usage.output * p.output +
      (usage.cacheRead ?? 0) * p.cacheRead +
      (usage.cacheWrite ?? 0) * p.cacheWrite) /
    1_000_000;
  return Math.round(cost * 1_000_000) / 1_000_000; // round to micro-USD
}
