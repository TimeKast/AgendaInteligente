/**
 * Human ID Generator
 *
 * Generates human-readable IDs for records that coexist with UUIDs.
 * Use this when users need to reference, communicate, or remember record IDs.
 *
 * @example
 * ```typescript
 * import { generateHumanId } from '@/lib/utils/human-id';
 *
 * // With year (default)
 * generateHumanId(42, { prefix: 'ORD' })     // → 'ORD-2026-0042'
 * generateHumanId(1, { prefix: 'INV' })       // → 'INV-2026-0001'
 *
 * // Without year
 * generateHumanId(1, { prefix: 'USR', includeYear: false })  // → 'USR-0001'
 *
 * // Custom padding
 * generateHumanId(1, { prefix: 'T', padLength: 6 })  // → 'T-2026-000001'
 * ```
 *
 * ## Schema Pattern
 *
 * ```typescript
 * export const orders = pgTable('orders', {
 *   // Technical ID (PK, joins, indexes)
 *   id: uuid('id').primaryKey().defaultRandom(),
 *
 *   // Human ID (display, URLs, breadcrumbs)
 *   orderNumber: text('order_number').notNull().unique(),
 * });
 * ```
 *
 * ## ⚠️ Sequence resolution
 *
 * `generateHumanId` does NOT resolve the sequence number — the caller passes a
 * positive integer. There are two correct ways to obtain it:
 *
 * 1. **`getNextHumanId(db, '<table>_human_id_seq', …)`** — atomic via a
 *    Postgres `SEQUENCE` you create in a migration. Preferred for high-throughput
 *    tables. Lock-free under concurrency.
 *
 * 2. **`getNextHumanIdSeq(executor, table, table.humanId)`** — application-level
 *    `MAX(trailing-int) + 1`. Gap-resilient (a deleted row mid-series does NOT
 *    poison the sequence). Pair with `withHumanIdRetry` for concurrency, and use
 *    a savepoint when invoked inside a parent `tx`. See pattern below.
 *
 * ### Canonical pattern (helper opens its own tx)
 *
 * ```typescript
 * // ✅ CORRECT — gap-resilient + race-resilient
 * const created = await withHumanIdRetry(() =>
 *   db.transaction(async (tx) => {
 *     const seq = await getNextHumanIdSeq(tx, orders, orders.humanId);
 *     const humanId = generateHumanId(seq, { prefix: 'ORD' });
 *     const [row] = await tx.insert(orders).values({ humanId, ... }).returning();
 *     return row;
 *   })
 * );
 *
 * // ❌ WRONG — collides whenever a row in the middle is deleted:
 * // const [{ count }] = await db.select({ count: sql`count(*)` }).from(orders);
 * // const humanId = generateHumanId(count + 1, { prefix: 'ORD' });
 * ```
 *
 * ### Inside a parent `tx` — open a SAVEPOINT for the retry
 *
 * Wrapping `withHumanIdRetry` directly around code that runs inside a parent
 * `tx` is broken: a `23505` aborts the parent tx and every subsequent
 * SELECT/INSERT fails with "current transaction is aborted". Use a nested
 * `tx.transaction(async sp => ...)` so each retry rolls back ONLY the
 * savepoint:
 *
 * ```typescript
 * const created = await withHumanIdRetry(() =>
 *   tx.transaction(async (sp) => {  // ← SAVEPOINT
 *     const seq = await getNextHumanIdSeq(sp, orders, orders.humanId);
 *     const humanId = generateHumanId(seq, { prefix: 'ORD' });
 *     const [row] = await sp.insert(orders).values({ humanId, ... }).returning();
 *     return row;
 *   })
 * );
 * ```
 *
 * @see SCHEMA-003
 */

import { sql, type SQL } from 'drizzle-orm';
import type { PgColumn, PgTable, PgTransaction } from 'drizzle-orm/pg-core';
import type { db as drizzleDb } from '@/lib/db/drizzle';

export type HumanIdOptions = {
  /** Prefix for the ID (e.g., 'ORD', 'USR', 'INV') */
  prefix: string;
  /** Include year in the format? Default: true */
  includeYear?: boolean;
  /** Padding length for sequence number. Default: 4 */
  padLength?: number;
};

/**
 * Generate a human-readable ID from a sequence number.
 *
 * Always feed `sequence` from `getNextHumanId` (PG SEQUENCE) or
 * `getNextHumanIdSeq` (gap-resilient app-level) — see the file header for the
 * canonical pattern. Never feed it raw `count(*) + 1`.
 *
 * @param sequence - The sequence number (must be positive integer)
 * @param options - Configuration for the ID format
 * @returns Human-readable ID string
 */
export function generateHumanId(sequence: number, options: HumanIdOptions): string {
  const { prefix, includeYear = true, padLength = 4 } = options;

  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error('Sequence must be a positive integer');
  }

  if (!prefix || prefix.length === 0) {
    throw new Error('Prefix is required');
  }

  const paddedSeq = String(sequence).padStart(padLength, '0');

  if (includeYear) {
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${paddedSeq}`;
  }

  return `${prefix}-${paddedSeq}`;
}

/**
 * Common prefixes used in the starter kit.
 * Extend this in your project as needed.
 */
export const HUMAN_ID_PREFIXES = {
  USER: 'USR',
  ORDER: 'ORD',
  INVOICE: 'INV',
  TICKET: 'TKT',
} as const;

/**
 * Get the next human ID from a PostgreSQL SEQUENCE.
 *
 * Atomically increments the sequence and formats the result.
 * Safe for concurrent access — no race conditions.
 *
 * @param db - Drizzle database instance
 * @param sequenceName - Name of the PG SEQUENCE (e.g., 'user_human_id_seq')
 * @param options - HumanIdOptions for formatting
 * @returns Formatted human ID (e.g., 'USR-0001')
 *
 * @example
 * ```typescript
 * import { getNextHumanId, HUMAN_ID_PREFIXES } from '@/lib/utils/human-id';
 * import { db } from '@/lib/db/drizzle';
 *
 * const humanId = await getNextHumanId(db, 'user_human_id_seq', {
 *   prefix: HUMAN_ID_PREFIXES.USER,
 *   includeYear: false,
 * });
 * // → 'USR-0042'
 * ```
 */
export async function getNextHumanId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: { execute: (query: any) => Promise<{ rows: Array<Record<string, unknown>> }> },
  sequenceName: string,
  options: HumanIdOptions
): Promise<string> {
  const result = await db.execute(sql`SELECT nextval(${sequenceName}) as nextval`);
  const nextval = Number((result.rows[0] as { nextval: string }).nextval);
  return generateHumanId(nextval, options);
}

/**
 * Retry-on-collision wrapper for humanId-bearing inserts.
 *
 * Two concurrent inserts that read the same sequence (whether via
 * `getNextHumanIdSeq` or any other application-level approach) can both
 * propose the same humanId; the second hits a `23505 unique_violation` on the
 * unique index. This wrapper retries the operation up to N times, letting each
 * attempt re-read the sequence and propose a fresh humanId.
 *
 * Postgres error shape (Drizzle / postgres-js / @neondatabase/serverless): the
 * underlying `DatabaseError` exposes `.code === '23505'` either directly or
 * under `.cause.code`.
 *
 * Transaction note: this helper handles RACES, not transaction-aborted state.
 * If `op` runs inside a parent `tx`, a 23505 marks that tx aborted and every
 * retry's SELECT/INSERT will fail with "current transaction is aborted". The
 * caller must open a SAVEPOINT (`tx.transaction(async sp => ...)`) inside `op`
 * so each retry rolls back only the savepoint. See the file header.
 *
 * @param op - Async operation that resolves the sequence AND inserts the row.
 * @param maxAttempts - Default 5. Beyond that we surface the error so the
 *                     caller does not loop indefinitely under sustained
 *                     concurrency (alert-worthy).
 */
export async function withHumanIdRetry<T>(op: () => Promise<T>, maxAttempts = 5): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await op();
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      lastErr = err;
      // tiny jitter so two contenders don't lockstep their retries
      await new Promise((r) => setTimeout(r, Math.random() * 25));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('withHumanIdRetry: max attempts exhausted');
}

/**
 * Resolve the next humanId sequence number by reading **MAX(trailing-int) + 1**
 * from existing rows — gap-resilient.
 *
 * The naive `count(*) + 1` pattern silently breaks whenever a row is deleted
 * from the middle of the series: with `ORD-2026-0002` and `ORD-2026-0003`
 * alive but `ORD-2026-0001` deleted, `count = 2 → seq = 3`, proposing the
 * already-taken `ORD-2026-0003`. `withHumanIdRetry` cannot rescue this because
 * every retry recomputes the same count and re-collides.
 *
 * This helper extracts the trailing integer from the humanId column via SQL
 * regex, so it works regardless of prefix shape (`ORD-0042`, `USR-2026-0001`,
 * `INV-26-0003`, etc) — it always reads the last block of digits.
 *
 * Concurrency note: this is **not a substitute for `withHumanIdRetry`**. Two
 * parallel inserts can still see the same MAX. The retry handles that case
 * (the loser re-reads MAX and gets MAX+1 the next round). What this helper
 * fixes is the orthogonal **gap problem** (delete in the middle).
 *
 * Transaction note: when called inside a parent `tx`, pass that `tx` as the
 * executor so the SELECT runs in the same isolation context. **However**, do
 * NOT rely on `withHumanIdRetry` to recover from a 23505 *inside that same tx*
 * — Postgres marks the tx aborted after the violation. Use a savepoint via
 * `tx.transaction(async sp => ...)` so each retry gets a fresh nested scope.
 * See the canonical patterns in the file header.
 *
 * For very-high-throughput tables prefer `getNextHumanId` + a Postgres
 * `SEQUENCE` (lock-free under sustained load). This MAX-based helper is O(rows).
 *
 * @param executor - DB or active transaction (or an open savepoint).
 * @param table - Drizzle table reference.
 * @param humanIdColumn - The `text('human_id')` column reference on that table.
 * @param whereClause - Optional filter (e.g. `eq(movements.type, 'APO')`) when
 *   humanId series are partitioned per-type.
 * @returns The next sequence number to feed into `generateHumanId`.
 */
export async function getNextHumanIdSeq(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executor: PgTransaction<any, any, any> | typeof drizzleDb,
  table: PgTable,
  humanIdColumn: PgColumn,
  whereClause?: SQL
): Promise<number> {
  // Pattern uses `[0-9]+` (literal POSIX char class), NOT `\d+`. Drizzle's
  // `sql` tag reads the COOKED template strings — JS strips the backslash from
  // `\d` (cooked = "d+"), which would silently break the regex and make
  // MAX(...) always NULL → seq always 1 → permanent collisions on the first
  // row of any populated series. Never use `\d`, `\w`, `\s` or any backslash
  // escape in regex literals embedded in `sql\`...\``.
  const expr = sql<number>`COALESCE(MAX(CAST(SUBSTRING(${humanIdColumn} FROM '([0-9]+)$') AS integer)), 0)::int`;
  const builder = executor.select({ maxSeq: expr }).from(table);
  const [row] = await (whereClause ? builder.where(whereClause) : builder);
  return (row?.maxSeq ?? 0) + 1;
}

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; cause?: { code?: string } };
  if (e.code === '23505') return true;
  if (e.cause && typeof e.cause === 'object' && e.cause.code === '23505') return true;
  return false;
}
