/**
 * Rate Limit Buckets Schema
 *
 * Database-backed rate-limit storage. Used as the production backend
 * when DATABASE_URL is configured and Upstash is not. Each row holds the
 * counter + reset timestamp for one (bucket × identifier) tuple.
 *
 * Atomic reads/writes via INSERT ... ON CONFLICT DO UPDATE with CASE
 * (see `src/lib/rate-limit.ts → postgresRateLimit`).
 *
 * @see KIT-020 §E
 */

import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core';

// =============================================================================
// Rate Limit Buckets Table
// =============================================================================

/**
 * Buckets keyed by `${prefix}:${identifier}` (e.g. `ratelimit:auth:1.2.3.4`).
 * `count` is the number of requests inside the current window.
 * `reset_at` is when the window expires (and `count` resets to 1 on next hit).
 *
 * Indexed on `reset_at` to keep the probabilistic cleanup DELETE cheap.
 */
export const rateLimitBuckets = pgTable(
  'rate_limit_buckets',
  {
    key: text('key').primaryKey(),
    count: integer('count').notNull().default(0),
    resetAt: timestamp('reset_at', { mode: 'date', withTimezone: true }).notNull(),
  },
  (t) => [index('rate_limit_buckets_reset_at_idx').on(t.resetAt)]
);

// =============================================================================
// Types (inferred from schema)
// =============================================================================

export type RateLimitBucket = typeof rateLimitBuckets.$inferSelect;
export type NewRateLimitBucket = typeof rateLimitBuckets.$inferInsert;
