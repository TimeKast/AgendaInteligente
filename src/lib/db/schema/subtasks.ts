/**
 * Subtasks — E-006 per 06_DATA_MODEL.md
 *
 * Items inside an Activity. BR-5: 1 level max (no recursion). Structural
 * prevention — there's no `parent_subtask_id` column, so the schema itself
 * makes nesting impossible. A future "I want sub-sub-tasks" feature would
 * require a deliberate migration.
 *
 * Scoping note: this is the ONE entity intentionally not in TENANT_TABLES
 * (no `user_id` column). Multi-tenant isolation is enforced at the action
 * layer: every action verifies the parent activity belongs to the caller
 * before reading/writing subtasks. The FK `activity_id ON DELETE CASCADE`
 * guarantees a hard delete of the activity wipes its subtasks too.
 *
 * Linked: BR-5, FT-013, US-017.
 */

import { pgTable, text, uuid, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { activities } from './activities';

export const subtasks = pgTable(
  'subtasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    activityId: uuid('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),

    title: text('title').notNull(),

    /** 'pending' | 'done'. Constrained at DB level in migration. */
    status: text('status').notNull().default('pending'),

    /** App-managed sort. User reorders via drag (same pattern as categories). */
    position: integer('position').notNull().default(0),

    /** Set when status transitions to 'done'. */
    completedAt: timestamp('completed_at', { mode: 'date', withTimezone: true }),

    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('subtasks_activity_position_idx').on(table.activityId, table.position)]
);

export type Subtask = typeof subtasks.$inferSelect;
export type NewSubtask = typeof subtasks.$inferInsert;

export const SUBTASK_STATUSES = ['pending', 'done'] as const;
export type SubtaskStatus = (typeof SUBTASK_STATUSES)[number];
