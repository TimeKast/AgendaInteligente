/**
 * CalendarBusySlot cache schema — E-061 per 06_DATA_MODEL.md (ISSUE-091).
 *
 * Read-cache of the user's selected calendars, refreshed every 15 min
 * by the sync cron. We serve activity-conflict checks (BR-22) from this
 * table instead of round-tripping to Google on each render.
 *
 * Refresh strategy (handled in the cron):
 *   - Delete the (connection_id) rows in the window we're refreshing
 *   - Insert the freebusy response as new rows
 *
 * That's simpler than diff-and-merge and the window is small (30d).
 *
 * Indexes:
 *   - (user_id, start_at, end_at): the "what's busy in this range" query.
 *   - (connection_id, start_at): the "invalidate this connection's slice"
 *     query during refresh + the cascade on disconnect.
 *
 * Linked: BR-22, FT-091, OPS-6.
 */

import { pgTable, text, uuid, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { calendarConnections } from './calendar-connections';

export const calendarBusySlots = pgTable(
  'calendar_busy_slots',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    connectionId: uuid('connection_id')
      .notNull()
      .references(() => calendarConnections.id, { onDelete: 'cascade' }),

    /** Provider calendar id (e.g. Google "primary" / "work@calendar"). */
    calendarId: text('calendar_id').notNull(),

    startAt: timestamp('start_at', { mode: 'date', withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { mode: 'date', withTimezone: true }).notNull(),

    /** Optional title for display in the UI (calendar event summary). */
    eventTitle: text('event_title'),

    /** Optional event description (HTML stripped to plain text upstream). */
    eventDescription: text('event_description'),

    syncedAt: timestamp('synced_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // "What's busy between X and Y for this user" hot path.
    index('calendar_busy_slots_user_range_idx').on(table.userId, table.startAt, table.endAt),
    // Invalidate-per-connection during refresh + reverse lookup.
    index('calendar_busy_slots_connection_start_idx').on(table.connectionId, table.startAt),
  ]
);

export type CalendarBusySlot = typeof calendarBusySlots.$inferSelect;
export type NewCalendarBusySlot = typeof calendarBusySlots.$inferInsert;
