/**
 * Projects Schema — E-004 per 06_DATA_MODEL.md
 *
 * Nivel 2 de organización jerárquica (Category → Project → Activity).
 *
 * Constraints aplicados via SQL en la migration (no expresables nativos):
 *   - CHECK status IN ('active','paused','completed','killed')
 *   - UNIQUE (user_id, is_inbox) WHERE is_inbox = true
 *   - UNIQUE (user_id, category_id, name) WHERE deleted_at IS NULL
 *
 * FKs:
 *   - user_id → users.id ON DELETE CASCADE (multi-tenant root)
 *   - category_id → categories.id ON DELETE RESTRICT (BR-3 — no orphans).
 *     Note: la cascade-on-soft-delete check vive en app code (ISSUE-011);
 *     RESTRICT acá solo protege contra DELETE FROM accidentales.
 *
 * Linked: BR-2, BR-3, FT-011.
 */

import { pgTable, text, uuid, date, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { categories } from './categories';

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** FK to categories. RESTRICT en hard-delete; soft-delete cascade en app (ISSUE-011). */
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),

    name: text('name').notNull(),

    description: text('description'),

    /**
     * Project lifecycle status. CHECK constraint enforces the enum at DB level.
     *   active    — working on it
     *   paused    — temporarily set aside, intent to resume
     *   completed — done; `completed_at` is set
     *   killed    — abandoned without finishing
     */
    status: text('status').notNull().default('active'),

    /** Target finish date, optional. */
    deadline: date('deadline'),

    /** Free-text "what done looks like". Helps the AI agent challenge vague goals. */
    outcomeExpected: text('outcome_expected'),

    /**
     * System Inbox project. Exactly one per user (partial UNIQUE), lives
     * inside the Inbox category. Not deletable / not renameable.
     */
    isInbox: boolean('is_inbox').notNull().default(false),

    deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),

    /** Auto-set by server action when status transitions to 'completed'. */
    completedAt: timestamp('completed_at', { mode: 'date', withTimezone: true }),

    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),

    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('projects_user_category_idx').on(table.userId, table.categoryId),
    index('projects_user_status_idx').on(table.userId, table.status),
  ]
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

/** Allowed project statuses — kept in sync with the DB CHECK constraint. */
export const PROJECT_STATUSES = ['active', 'paused', 'completed', 'killed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
