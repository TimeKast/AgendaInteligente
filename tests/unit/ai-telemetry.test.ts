/**
 * Tests for AI telemetry — ISSUE-050.
 *
 * Verifies the upsert payload + period bucketing. The actual SQL is
 * mocked at the scopedDb layer — same pattern as goal-actions tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { state } = vi.hoisted(() => ({
  state: {
    insertedKey: undefined as string | undefined,
    insertedValues: undefined as unknown,
    conflictSet: undefined as unknown,
  },
}));

vi.mock('@/lib/db/scoped', () => ({
  scopedDb: vi.fn(() => ({
    userId: 'u',
    insert(key: string, values: unknown) {
      state.insertedKey = key;
      state.insertedValues = values;
      return {
        onConflictDoUpdate(opts: { set: unknown }) {
          state.conflictSet = opts.set;
          return { execute: vi.fn().mockResolvedValue(undefined) };
        },
      };
    },
  })),
}));

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

beforeEach(() => {
  state.insertedKey = undefined;
  state.insertedValues = undefined;
  state.conflictSet = undefined;
});

describe('currentPeriodStart', () => {
  it('returns YYYY-MM-01 in UTC for the given date', async () => {
    const { currentPeriodStart } = await import('@/lib/ai/telemetry');
    expect(currentPeriodStart(new Date(Date.UTC(2026, 4, 26, 18)))).toBe('2026-05-01');
    expect(currentPeriodStart(new Date(Date.UTC(2026, 0, 1, 0)))).toBe('2026-01-01');
    expect(currentPeriodStart(new Date(Date.UTC(2026, 11, 31, 23, 59)))).toBe('2026-12-01');
  });
});

describe('recordTokens', () => {
  it('inserts a usage_meters row with token counts + 1 call', async () => {
    const { recordTokens } = await import('@/lib/ai/telemetry');
    await recordTokens(
      USER,
      { input: 100, output: 50, cacheRead: 0, cacheWrite: 0 },
      { now: new Date(Date.UTC(2026, 4, 26)) }
    );

    expect(state.insertedKey).toBe('usageMeters');
    expect(state.insertedValues).toMatchObject({
      periodStart: '2026-05-01',
      aiCallsCount: 1,
    });
    const values = state.insertedValues as { aiTokensInput: bigint; aiTokensOutput: bigint };
    expect(values.aiTokensInput).toBe(100n);
    expect(values.aiTokensOutput).toBe(50n);
  });

  it('folds cacheRead + cacheWrite into the input bucket', async () => {
    const { recordTokens } = await import('@/lib/ai/telemetry');
    await recordTokens(USER, {
      input: 10,
      output: 0,
      cacheRead: 100,
      cacheWrite: 200,
    });

    const values = state.insertedValues as { aiTokensInput: bigint };
    expect(values.aiTokensInput).toBe(310n); // 10 + 100 + 200
  });

  it('stages an onConflictDoUpdate that increments counters', async () => {
    const { recordTokens } = await import('@/lib/ai/telemetry');
    await recordTokens(USER, { input: 5, output: 7 });

    expect(state.conflictSet).toBeDefined();
    // The `set` object holds Drizzle SQL fragments — we can at least
    // assert the keys are present.
    const setObj = state.conflictSet as Record<string, unknown>;
    expect(Object.keys(setObj)).toContain('aiCallsCount');
    expect(Object.keys(setObj)).toContain('aiTokensInput');
    expect(Object.keys(setObj)).toContain('aiTokensOutput');
  });
});
