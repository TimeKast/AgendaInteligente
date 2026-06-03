/**
 * Categories Schema — E-003 per 06_DATA_MODEL.md
 *
 * Nivel 1 de organización jerárquica (Category → Project → Activity).
 * Multi-tenant: cada user tiene su propio set de categorías + exactamente
 * UNA categoría Inbox (auto-creada en signup por ISSUE-006).
 *
 * Constraints aplicados via SQL raw en la migration (no expresables nativos
 * en Drizzle):
 *   - UNIQUE (user_id, is_inbox) WHERE is_inbox = true
 *   - UNIQUE (user_id, name) WHERE deleted_at IS NULL
 *   - CHECK (is_inbox = false OR name = 'Inbox')
 *
 * Linked: BR-3, BR-4.
 */

import { pgTable, text, uuid, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** Display name. UNIQUE (user_id, name) WHERE deleted_at IS NULL via migration. */
    name: text('name').notNull(),

    /** Hex color (e.g. #5C7B5C). Constrained to a curated palette in UI but stored as text. */
    color: text('color').notNull().default('#5C5C5C'),

    /** Lucide icon name. NULL = no icon. */
    icon: text('icon'),

    /** Sort order. App-managed; user reorders via drag (ISSUE-011). */
    position: integer('position').notNull().default(0),

    /**
     * System Inbox category. Exactly one per user (partial UNIQUE).
     * If true, name MUST be 'Inbox' (CHECK constraint).
     * Inbox is not deletable / not renameable.
     */
    isInbox: boolean('is_inbox').notNull().default(false),

    deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),

    /**
     * Soft "inactive" flag. Distinct from deletedAt: archived categories
     * stay visible in the catalog under a "Ver archivadas" toggle and can
     * be restored without touching their downstream projects/activities.
     */
    archivedAt: timestamp('archived_at', { mode: 'date', withTimezone: true }),

    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),

    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Sort-by-position lookup per user (the "list categories" hot path).
    index('categories_user_position_idx').on(table.userId, table.position),
  ]
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
