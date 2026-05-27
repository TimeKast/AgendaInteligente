/**
 * Goals Schema — E-010 per 06_DATA_MODEL.md.
 *
 * Entidad SEPARADA de la jerarquía operacional (Category → Project →
 * Activity). BR-6: los Goals viven fuera y se vinculan M2M a Projects o
 * Activities vía E-011 GoalLink (ISSUE-041 — fuera de este PR).
 *
 * Scope enum (4 niveles de planeación):
 *   - quarter  → meta trimestral (deadline obligatorio)
 *   - year     → meta anual (deadline obligatorio)
 *   - 5year    → meta a 5 años (deadline opcional)
 *   - life     → meta de vida (deadline opcional)
 *
 * UI v1 expone solo quarter/year (SCR-022/SCR-043). 5year/life son
 * placeholders para v2 — el schema acepta los 4 valores desde día 1
 * para no requerir migration cuando se habilite la UI.
 *
 * Status:
 *   - active    → en curso (default al crear)
 *   - achieved  → logrado
 *   - partial   → logrado parcial
 *   - abandoned → soltado por decisión consciente
 *
 * No state machine estricta — el usuario marca el status manualmente.
 * (A diferencia de Activity, que sí tiene la matriz BR-8.)
 *
 * Constraints aplicados via SQL en la migration:
 *   - CHECK scope IN ('quarter','year','5year','life')
 *   - CHECK status IN ('active','achieved','partial','abandoned')
 *   - CHECK review_score IS NULL OR review_score BETWEEN 1 AND 10
 *
 * Linked: BR-6, BR-9, FT-040..043, US-040.
 */

import { pgTable, text, uuid, smallint, date, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const goals = pgTable(
  'goals',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    title: text('title').notNull(),
    description: text('description'),

    /** quarter | year | 5year | life — CHECK in migration. */
    scope: text('scope').notNull(),

    /** Required for quarter/year, optional for 5year/life. Enforced in Zod. */
    deadline: date('deadline'),

    /** Free text — "qué cambiará en mi vida si esto se cumple". */
    outcomeExpected: text('outcome_expected'),

    /** Cost-reveal challenge artifact (US-061). What am I willing to trade? */
    notesCost: text('notes_cost'),

    /** active | achieved | partial | abandoned — CHECK in migration. */
    status: text('status').notNull().default('active'),

    /** 1..10 self-assessment al cerrar la meta. CHECK in migration. */
    reviewScore: smallint('review_score'),

    /** Free-text review notes (filled junto con review_score). */
    reviewNotes: text('review_notes'),

    /** Stamped on first review (review_score OR review_notes set). */
    reviewedAt: timestamp('reviewed_at', { mode: 'date', withTimezone: true }),

    /** Soft-delete (mismo pattern que category/project/activity). */
    deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),

    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),

    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // "Active quarter goals" hot path (also year, with status filter).
    index('goals_user_scope_status_idx').on(table.userId, table.scope, table.status),
    // "Goals con deadline próxima" — review_pending detection (BR-9).
    index('goals_user_deadline_idx').on(table.userId, table.deadline),
  ]
);

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;

/** Type-safe enum values (mirrors the CHECK constraints). */
export const GOAL_SCOPES = ['quarter', 'year', '5year', 'life'] as const;
export type GoalScope = (typeof GOAL_SCOPES)[number];

export const GOAL_STATUSES = ['active', 'achieved', 'partial', 'abandoned'] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];
