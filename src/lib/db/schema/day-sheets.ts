/**
 * Day Sheets Schema — E-020 per 06_DATA_MODEL.md (post-prototype consolidation).
 *
 * BR-7: exactly one DaySheet per (user, date). Enforced at DB level via
 * UNIQUE (user_id, date) — `date` is a calendar date in the user's TZ
 * (server-side helpers resolve TZ before persisting).
 *
 * Schema CONSOLIDADO tras iteración prototipo:
 *
 * REMOVED (no se persisten):
 *   - intention, gratitude, evening_win, evening_lesson, tomorrow_top, insight
 *   - energy_physical, energy_mental, energy_emotional
 *
 * KEPT:
 *   - identity_statement, wins_planned (max 3), avoidance
 *
 * ADDED:
 *   - close_summary (reemplaza evening_win/lesson/tomorrow/insight)
 *   - notes_dreams (notas pre-sesión matutina, opcional)
 *
 * Completion flow (per app code, no DB triggers):
 *   - morning_completed_at = now() cuando identity_statement, wins_planned
 *     (≥1) y avoidance están todos seteados.
 *   - evening_completed_at = now() cuando close_summary se setea por
 *     primera vez. El detalle per-activity vive en Activity, no aquí
 *     (BR-17 + ISSUE-017 close-day flow).
 *
 * Linked: BR-7, FT-030, FT-031, US-030b, US-031b.
 */

import { pgTable, text, uuid, date, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const daySheets = pgTable(
  'day_sheets',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** Calendar date in user's TZ (server resolves TZ before insert). */
    date: date('date').notNull(),

    /** Identity statement set during morning ritual ("Soy alguien que ..."). */
    identityStatement: text('identity_statement'),

    /**
     * Up to 3 planned wins for the day. Max enforced at DB via CHECK
     * (array_length <= 3 OR NULL).
     */
    winsPlanned: text('wins_planned').array(),

    /** Free text: "lo que NO voy a hacer hoy". */
    avoidance: text('avoidance'),

    /** One-liner reflection captured at close-day. */
    closeSummary: text('close_summary'),

    /** Optional pre-morning notes (dreams, residual thoughts). */
    notesDreams: text('notes_dreams'),

    /** Set by app when morning ritual fields are complete. */
    morningCompletedAt: timestamp('morning_completed_at', {
      mode: 'date',
      withTimezone: true,
    }),

    /** Set by app on first close_summary write. */
    eveningCompletedAt: timestamp('evening_completed_at', {
      mode: 'date',
      withTimezone: true,
    }),

    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),

    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // BR-7: exactly one sheet per (user, date).
    uniqueIndex('day_sheets_user_date_unique').on(table.userId, table.date),
    // "últimos N días" hot path.
    index('day_sheets_user_date_desc_idx').on(table.userId, sql`${table.date} DESC`),
  ]
);

export type DaySheet = typeof daySheets.$inferSelect;
export type NewDaySheet = typeof daySheets.$inferInsert;
