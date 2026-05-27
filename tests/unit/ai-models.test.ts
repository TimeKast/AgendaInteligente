/**
 * Tests for the AI model registry + cost estimator — ISSUE-050.
 */

import { describe, it, expect } from 'vitest';
import {
  MODELS,
  DEFAULT_MODEL,
  VOICE_PARSER_MODEL,
  PRICING,
  estimateCostUsd,
} from '@/lib/ai/models';

describe('models registry', () => {
  it('SONNET is the default', () => {
    expect(DEFAULT_MODEL).toBe(MODELS.SONNET);
  });

  it('HAIKU is reserved for voice parsing', () => {
    expect(VOICE_PARSER_MODEL).toBe(MODELS.HAIKU);
  });

  it('pricing keys cover every model in MODELS', () => {
    for (const id of Object.values(MODELS)) {
      expect(PRICING[id]).toBeDefined();
    }
  });
});

describe('estimateCostUsd', () => {
  it('costs zero when usage is zero', () => {
    expect(estimateCostUsd(MODELS.SONNET, { input: 0, output: 0 })).toBe(0);
  });

  it('SONNET input=1M output=1M ≈ $18 (3 + 15)', () => {
    expect(estimateCostUsd(MODELS.SONNET, { input: 1_000_000, output: 1_000_000 })).toBeCloseTo(
      18,
      6
    );
  });

  it('charges cacheRead at 10% of input', () => {
    const sonnetIn = PRICING[MODELS.SONNET].input;
    const sonnetCache = PRICING[MODELS.SONNET].cacheRead;
    expect(sonnetCache).toBeCloseTo(sonnetIn * 0.1, 6);

    const cost = estimateCostUsd(MODELS.SONNET, {
      input: 0,
      output: 0,
      cacheRead: 1_000_000,
    });
    expect(cost).toBeCloseTo(0.3, 6);
  });

  it('rounds to micro-USD', () => {
    const cost = estimateCostUsd(MODELS.HAIKU, { input: 7, output: 11 });
    // 7 * 1.0 + 11 * 5.0 = 62 → 62e-6 USD
    expect(cost).toBeCloseTo(0.000062, 8);
  });

  it('throws on unknown model', () => {
    expect(() => estimateCostUsd('claude-not-a-model' as never, { input: 1, output: 1 })).toThrow();
  });
});
