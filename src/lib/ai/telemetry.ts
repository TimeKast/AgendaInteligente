/**
 * AI telemetry — ISSUE-050 (Slice A1).
 *
 * Records every LLM call into `usage_meters` so we have month-bucketed
 * cost visibility per user. Atomic upsert keyed on `(user_id,
 * period_start)`:
 *   - First call of the month → INSERT with the call's tokens.
 *   - Subsequent calls → UPDATE adding tokens to the bigint counters.
 *
 * The `period_start` is bucketed to the first day of the current UTC
 * month — we don't want per-user-TZ buckets here (would split bills
 * weirdly around month boundaries and complicate aggregation).
 *
 * Linked: FT-051, FT-054, AI-5.
 */

import { sql } from 'drizzle-orm';
import { usageMeters } from '@/lib/db/schema/billing';
import { scopedDb } from '@/lib/db/scoped';
import type { TokenUsage } from './models';

/** YYYY-MM-01 in UTC. Pure — `now` injectable for tests. */
export function currentPeriodStart(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

/**
 * Append a single LLM call's token usage to `usage_meters` for the
 * current month. Idempotent under concurrent calls (Postgres handles
 * the increment atomically; ON CONFLICT picks up the existing row).
 *
 * `cacheRead` + `cacheWrite` aren't broken out at the DB schema level
 * (E-072 only has aiTokensInput / aiTokensOutput) — we fold cache
 * reads/writes into `aiTokensInput` since they're paid against the
 * input budget.
 */
export async function recordTokens(
  userId: string,
  usage: TokenUsage,
  options: { now?: Date } = {}
): Promise<void> {
  const periodStart = currentPeriodStart(options.now ?? new Date());
  const inputDelta = usage.input + (usage.cacheRead ?? 0) + (usage.cacheWrite ?? 0);
  const outputDelta = usage.output;

  const sdb = scopedDb(userId);

  // ON CONFLICT (user_id, period_start) DO UPDATE — increment counters
  // atomically. Drizzle returns the raw insert builder, so we can chain
  // .onConflictDoUpdate() directly.
  await (
    sdb.insert('usageMeters', {
      periodStart,
      aiCallsCount: 1,
      aiTokensInput: BigInt(inputDelta),
      aiTokensOutput: BigInt(outputDelta),
    }) as unknown as {
      onConflictDoUpdate: (opts: { target: unknown[]; set: Record<string, unknown> }) => {
        execute: () => Promise<unknown>;
      };
    }
  )
    .onConflictDoUpdate({
      target: [usageMeters.userId, usageMeters.periodStart],
      set: {
        aiCallsCount: sql`${usageMeters.aiCallsCount} + 1`,
        aiTokensInput: sql`${usageMeters.aiTokensInput} + ${BigInt(inputDelta)}::bigint`,
        aiTokensOutput: sql`${usageMeters.aiTokensOutput} + ${BigInt(outputDelta)}::bigint`,
      },
    })
    .execute();
}
