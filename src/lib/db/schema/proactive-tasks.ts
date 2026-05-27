/**
 * ProactiveTask Schema — E-040 per 06_DATA_MODEL.md (ISSUE-082).
 *
 * Records every push/notification the agent considered firing — both
 * the ones that went through AND the ones we cancelled (anti-spam,
 * mute, listening). Cancellations are first-class rows so OPS-1 and
 * OPS-2 windows can query them deterministically.
 *
 * Linked: FT-086, FT-087, OPS-1, OPS-2, US-086.
 */

import { pgTable, text, uuid, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const proactiveTasks = pgTable(
  'proactive_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** Type of agent action — CHECK in migration. */
    type: text('type').notNull(),

    scheduledFor: timestamp('scheduled_for', { mode: 'date', withTimezone: true }).notNull(),

    /** Free-shape context (activity/goal/pattern referenced). */
    payload: jsonb('payload'),

    /** State machine — CHECK in migration. */
    status: text('status').notNull().default('pending'),

    sentAt: timestamp('sent_at', { mode: 'date', withTimezone: true }),
    respondedAt: timestamp('responded_at', { mode: 'date', withTimezone: true }),

    /** Reserved for v1.5 quote-back. NULL on v1. */
    quoteReference: jsonb('quote_reference'),

    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Cron picker: "what's due in the next 5 min for this user".
    index('proactive_tasks_user_scheduled_idx').on(table.userId, table.scheduledFor),
    // OPS-1 anti-spam window: "how many tasks sent_at > now - 24h?"
    index('proactive_tasks_user_sent_idx').on(table.userId, table.sentAt),
    // OPS-2 weekly pattern window: filter by type + sent_at desc.
    index('proactive_tasks_user_type_sent_idx').on(table.userId, table.type, table.sentAt),
  ]
);

export type ProactiveTask = typeof proactiveTasks.$inferSelect;
export type NewProactiveTask = typeof proactiveTasks.$inferInsert;

export const PROACTIVE_TASK_TYPES = [
  'morning_open',
  'midday_check',
  'evening_close',
  'weekly_kickoff',
  'weekly_review',
  'pattern_challenge',
  'risk_alert',
  'project_kill_suggestion',
  'silence_re_entry',
] as const;
export type ProactiveTaskType = (typeof PROACTIVE_TASK_TYPES)[number];

export const PROACTIVE_TASK_STATUSES = [
  'pending',
  'sent',
  'responded',
  'dismissed',
  'cancelled',
  'cancelled_anti_spam',
  'cancelled_muted',
  'cancelled_listening',
] as const;
export type ProactiveTaskStatus = (typeof PROACTIVE_TASK_STATUSES)[number];

/** Types treated as "challenges" for the OPS-2 weekly window. */
export const CHALLENGE_TYPES: ProactiveTaskType[] = [
  'pattern_challenge',
  'risk_alert',
  'project_kill_suggestion',
];
