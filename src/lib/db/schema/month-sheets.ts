/**
 * MonthSheet Schema — E-026 per 06_DATA_MODEL.md (ISSUE-131).
 *
 * Lighter than WeekSheet: a single "one thing" for the month +
 * themes + a close summary. BR-19: `month_starting` is always day 1
 * of the month in the user's TZ — enforced both via a CHECK on the
 * DATE column AND by the helper that normalizes a YYYY-MM-DD before
 * inserting.
 *
 * BR-7: UNIQUE `(user_id, month_starting)`.
 *
 * Linked: BR-7, BR-19, FT-131, US-131.
 */

import { pgTable, text, uuid, date, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const monthSheets = pgTable(
  'month_sheets',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** YYYY-MM-01 in the user's TZ. Enforced via CHECK + helper. */
    monthStarting: date('month_starting').notNull(),

    /** Free-text goals (or JSON if the UI evolves there later). */
    goals: text('goals'),

    /** 3-5 themes / focus areas. */
    themes: text('themes').array().notNull().default([]),

    closeSummary: text('close_summary'),
    closedAt: timestamp('closed_at', { mode: 'date', withTimezone: true }),

    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('month_sheets_user_month_unique').on(table.userId, table.monthStarting),
    index('month_sheets_user_month_desc_idx').on(table.userId, sql`${table.monthStarting} DESC`),
  ]
);

export type MonthSheet = typeof monthSheets.$inferSelect;
export type NewMonthSheet = typeof monthSheets.$inferInsert;
