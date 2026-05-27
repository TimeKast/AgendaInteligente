/**
 * GoalLinks Schema — E-011 per 06_DATA_MODEL.md.
 *
 * M2M polymorphic Goal ↔ {Project | Activity}. Implementa BR-6: los Goals
 * viven FUERA de la jerarquía operacional y se enganchan a Projects o
 * Activities vía esta tabla.
 *
 * Shape clave:
 *   - `goal_id` FK → goals.id ON DELETE CASCADE (hard-delete del goal
 *     barre sus links automáticamente).
 *   - `target_type` enum: 'project' | 'activity' (CHECK in migration).
 *   - `target_id` UUID **SIN FK** — la integridad polymorphic se enforza
 *     en app code (Server Actions validate target existence + ownership).
 *
 * Cero `user_id` column: ownership se deriva del goal padre (mismo pattern
 * que Subtask via Activity). ESLint allowlist en `goal-link.ts` action.
 *
 * Constraints en migration:
 *   - CHECK target_type IN ('project','activity')
 *   - UNIQUE (goal_id, target_type, target_id) — re-link idempotente
 *
 * Indexes:
 *   - UNIQUE composite arriba sirve como (goal_id, …) forward lookup
 *   - (target_type, target_id) para "goals linkados a esta activity"
 *
 * Linked: BR-6, E-010, E-011, FT-041, US-041.
 */

import { pgTable, uuid, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { goals } from './goals';

export const goalLinks = pgTable(
  'goal_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    goalId: uuid('goal_id')
      .notNull()
      .references(() => goals.id, { onDelete: 'cascade' }),

    /** 'project' | 'activity' — CHECK in migration. */
    targetType: text('target_type').notNull(),

    /** Polymorphic FK — NOT enforced at DB level. App code validates. */
    targetId: uuid('target_id').notNull(),

    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Re-link idempotente: (goal, target_type, target_id) is unique.
    uniqueIndex('goal_links_goal_target_unique').on(table.goalId, table.targetType, table.targetId),
    // Reverse lookup: "qué goals están linkados a esta activity/project".
    index('goal_links_target_idx').on(table.targetType, table.targetId),
  ]
);

export type GoalLink = typeof goalLinks.$inferSelect;
export type NewGoalLink = typeof goalLinks.$inferInsert;

export const GOAL_LINK_TARGET_TYPES = ['project', 'activity'] as const;
export type GoalLinkTargetType = (typeof GOAL_LINK_TARGET_TYPES)[number];
