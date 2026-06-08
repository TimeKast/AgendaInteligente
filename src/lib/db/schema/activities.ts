/**
 * Activities Schema — E-005 per 06_DATA_MODEL.md
 *
 * Unidad de trabajo (Category → Project → Activity → Subtask).
 * Core entity del producto.
 *
 * Iteración prototipo introduce:
 *   - scheduled_dates date[] (reemplaza scheduled_date single, BR-15)
 *   - duration_minutes (BR-16: requiere scheduled_time)
 *   - quadrant 1-4 Eisenhower (BR-17 progress semantics)
 *   - progress_percent 0-100
 * Y elimina:
 *   - scheduled_date (single) → ahora array
 *   - time_blocks → cubierto por scheduled_time + duration_minutes
 *
 * Constraints aplicados via SQL en la migration:
 *   - CHECK status enum
 *   - CHECK priority 1..5
 *   - CHECK quadrant 1..4 OR NULL
 *   - CHECK progress_percent 0..100 OR NULL
 *   - CHECK duration_minutes > 0 OR NULL
 *   - CHECK duration_minutes IS NULL OR scheduled_time IS NOT NULL (BR-16)
 *   - CHECK reason_category enum OR NULL
 *
 * Linked: BR-1, BR-2, BR-8, BR-11, BR-15, BR-16, BR-17, FT-012..028.
 */

import {
  pgTable,
  text,
  uuid,
  date,
  time,
  integer,
  smallint,
  timestamp,
  index,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { projects } from './projects';

export const activities = pgTable(
  'activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** Project the activity lives in. RESTRICT on hard-delete (BR-2). */
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict' }),

    title: text('title').notNull(),
    description: text('description'),

    /**
     * Dates the activity is scheduled on. Empty array = pool/backlog row.
     * Normalized to unique + ascending order before persistence (BR-15).
     */
    scheduledDates: date('scheduled_dates')
      .array()
      .notNull()
      .default(sql`'{}'`),

    /** Optional time-of-day anchor; applies to every date in scheduled_dates. */
    scheduledTime: time('scheduled_time'),

    /**
     * Duration of the anchored block in minutes. Requires scheduled_time
     * (BR-16 — CHECK constraint at DB level).
     */
    durationMinutes: integer('duration_minutes'),

    /** Hard deadline (different from scheduled — when the activity MUST be done by). */
    deadline: timestamp('deadline', { mode: 'date', withTimezone: true }),

    /** Estimation captured at creation; orthogonal to duration_minutes. */
    estimatedMinutes: integer('estimated_minutes'),

    /** 1 (low) to 5 (high). */
    priority: smallint('priority').notNull().default(3),

    /**
     * Eisenhower quadrant (1-4) — materialized so drag-between-quadrants
     * doesn't require recomputing from priority × urgency.
     */
    quadrant: smallint('quadrant'),

    /**
     * 0-100 — used in close-day modal when user marks "Avanzada" instead
     * of "Hecha". status='done' forces this to 100 (BR-17, enforced in
     * server action — DB only constrains the range).
     */
    progressPercent: smallint('progress_percent'),

    /**
     * Simplified recurrence DSL. Accepted:
     *   - `daily`
     *   - `weekly:MO,WE,FR` (2-letter day codes joined by `,`)
     *   - `monthly:1` | `monthly:last`
     * Validation lives in `src/lib/validations/activity.ts`. NOT RRULE.
     * Materializer cron arrives in ISSUE-024.
     */
    recurrenceRule: text('recurrence_rule'),

    /** Set on materialized instances; FK self-references the master row. */
    recurrenceParentId: uuid('recurrence_parent_id').references((): AnyPgColumn => activities.id, {
      onDelete: 'cascade',
    }),

    /** pending | in_progress | done | skipped | blocked */
    status: text('status').notNull().default('pending'),

    completedAt: timestamp('completed_at', { mode: 'date', withTimezone: true }),

    /** Free text when status is skipped/blocked. */
    reasonNotDone: text('reason_not_done'),

    /** enum: time | priority | blocked | didnt_want | other */
    reasonCategory: text('reason_category'),

    /** Lowercase-normalized tags. */
    tags: text('tags')
      .array()
      .notNull()
      .default(sql`'{}'`),

    deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Composite indexes for the hot paths.
    index('activities_user_status_deadline_idx').on(table.userId, table.status, table.deadline),
    index('activities_user_project_idx').on(table.userId, table.projectId),
    index('activities_recurrence_parent_idx').on(table.recurrenceParentId),
    // GIN indexes are added via raw SQL in the migration (Drizzle's
    // `using('gin', col)` doesn't support array columns reliably yet).
  ]
);

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;

export const ACTIVITY_STATUSES = [
  'pending',
  'in_progress',
  'done',
  'skipped',
  'blocked',
  'cancelled',
] as const;
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export const ACTIVITY_REASON_CATEGORIES = [
  'time',
  'priority',
  'blocked',
  'didnt_want',
  'other',
] as const;
export type ActivityReasonCategory = (typeof ACTIVITY_REASON_CATEGORIES)[number];
