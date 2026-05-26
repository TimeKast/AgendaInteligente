/**
 * Billing Schema — E-070 Plan, E-071 Subscription, E-072 UsageMeter
 *
 * Scaffold-only in v1: structure exists so feature limits can be wired later
 * without destructive migrations. No pricing active yet (price_monthly/yearly
 * nullable), no Stripe yet (columns nullable). Plan 'free' is seeded; future
 * `pro` row is added when pricing is decided.
 *
 * Constraints applied via raw SQL in the migration file (not Drizzle-native):
 *   - subscriptions: UNIQUE (user_id) WHERE status = 'active'
 *   - usage_meters: UNIQUE (user_id, period_start)
 *
 * Linked: BR-10, FT-110, FT-111, FT-112.
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
  numeric,
  integer,
  bigint,
  date,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

// =============================================================================
// E-070 — Plan
// =============================================================================

export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),

  /** Stable identifier ('free' | 'pro'). */
  slug: text('slug').notNull().unique(),

  /** Display name. */
  name: text('name').notNull(),

  /** Marketing description. */
  description: text('description'),

  /** Feature flags by plan ({ ai_agent: true, voice_capture: true, ... }). */
  features: jsonb('features')
    .$type<Record<string, boolean | number | string>>()
    .notNull()
    .default({}),

  /** Hard limits ({ max_projects, max_ai_calls_per_month, max_voice_minutes, ... }). */
  limits: jsonb('limits').$type<Record<string, number | null>>().notNull().default({}),

  /** Monthly price (NULL until pricing decided). */
  priceMonthly: numeric('price_monthly', { precision: 10, scale: 2 }),

  /** Yearly price (NULL until pricing decided). */
  priceYearly: numeric('price_yearly', { precision: 10, scale: 2 }),

  /** Plan is offered (false = grandfathered or retired). */
  active: boolean('active').notNull().default(true),

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// E-071 — Subscription
// =============================================================================

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id),

    /** Status: active | cancelled | past_due. */
    status: text('status').notNull().default('active'),

    /** Current billing period start (NULL on free / pre-pricing). */
    currentPeriodStart: timestamp('current_period_start', { mode: 'date', withTimezone: true }),

    /** Current billing period end. */
    currentPeriodEnd: timestamp('current_period_end', { mode: 'date', withTimezone: true }),

    /** Stripe subscription id (v2). */
    stripeSubscriptionId: text('stripe_subscription_id'),

    /** Stripe customer id (v2). */
    stripeCustomerId: text('stripe_customer_id'),

    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),

    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // BR-10 grace period cron uses (status, updated_at).
    index('subscriptions_status_updated_idx').on(table.status, table.updatedAt),
  ]
);

// =============================================================================
// E-072 — UsageMeter
// =============================================================================

export const usageMeters = pgTable('usage_meters', {
  id: uuid('id').primaryKey().defaultRandom(),

  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  /** First day of the month bucketed (date, no time). */
  periodStart: date('period_start').notNull(),

  /** Count of LLM agent calls in the period. */
  aiCallsCount: integer('ai_calls_count').notNull().default(0),

  /** Aggregate input tokens (for cost tracking). */
  aiTokensInput: bigint('ai_tokens_input', { mode: 'bigint' })
    .notNull()
    .default(sql`0`),

  /** Aggregate output tokens. */
  aiTokensOutput: bigint('ai_tokens_output', { mode: 'bigint' })
    .notNull()
    .default(sql`0`),

  /** Voice minutes captured (Web Speech + Whisper combined). */
  voiceMinutesCount: numeric('voice_minutes_count', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),

  /** Whisper STT seconds (for the OpenAI cost meter specifically). */
  whisperSecondsCount: integer('whisper_seconds_count').notNull().default(0),

  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// =============================================================================
// Inferred types
// =============================================================================

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type UsageMeter = typeof usageMeters.$inferSelect;
export type NewUsageMeter = typeof usageMeters.$inferInsert;
