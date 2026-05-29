/**
 * Notification Prefs Schema — E-002 per 06_DATA_MODEL.md
 *
 * NOT to be confused with the kit's `notification_preferences` table in
 * `./notifications.ts`, which stores per-channel-per-category on/off toggles
 * for the generic kit notification system.
 *
 * This table is a singleton per user storing the agent CHECK-IN SCHEDULE:
 * when the AI proactively reaches out (morning, midday, evening, weekly
 * kickoff, weekly review) and which days to skip.
 *
 * Linked: FT-085, US-085, OPS-1..4, BR-15..20 (days_off + weekend_skip).
 */

import {
  pgTable,
  time,
  smallint,
  boolean,
  timestamp,
  uuid,
  date,
  text,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const notificationPrefs = pgTable(
  'notification_prefs',
  {
    /** 1:1 with users — user_id is the primary key. */
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** Daily morning check-in time (user TZ aware). */
    morningTime: time('morning_time').notNull().default('08:00'),

    /** Daily midday check-in time. */
    middayTime: time('midday_time').notNull().default('13:00'),

    /** Daily evening check-in time. */
    eveningTime: time('evening_time').notNull().default('21:00'),

    /** Weekly kickoff day-of-week (0=Sunday … 6=Saturday). */
    weeklyKickoffDow: smallint('weekly_kickoff_dow').notNull().default(0),

    /** Weekly kickoff time. */
    weeklyKickoffTime: time('weekly_kickoff_time').notNull().default('18:00'),

    /** Weekly review day-of-week (default 6=Saturday). */
    weeklyReviewDow: smallint('weekly_review_dow').notNull().default(6),

    /** Weekly review time. */
    weeklyReviewTime: time('weekly_review_time').notNull().default('20:00'),

    /**
     * If true, skip daily check-ins on Saturday/Sunday.
     * Default false → 7 days/week.
     * Naming convention: skip-true = no send.
     */
    weekendSkip: boolean('weekend_skip').notNull().default(false),

    /**
     * Absolute dates with no check-ins (vacations, specific days off).
     * Non-recurring — use weekend_skip for recurring weekend skips.
     */
    daysOff: date('days_off').array().notNull().default([]),

    /** Push notifications enabled. */
    pushEnabled: boolean('push_enabled').notNull().default(true),

    /** Email fallback enabled. */
    emailEnabled: boolean('email_enabled').notNull().default(false),

    /**
     * Discord webhook URL (opaque token in the URL). User pastes from
     * Discord → Server Settings → Integrations → Webhooks. NULL = not
     * configured. Length-checked at DB level (50-200 chars).
     */
    discordWebhookUrl: text('discord_webhook_url'),

    /** Temporary mute until this timestamp (US-087). NULL = not muted. */
    mutedUntil: timestamp('muted_until', { mode: 'date', withTimezone: true }),

    /** Last update timestamp. */
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('notification_prefs_days_off_gin_idx').using('gin', table.daysOff)]
);

export type NotificationPref = typeof notificationPrefs.$inferSelect;
export type NewNotificationPref = typeof notificationPrefs.$inferInsert;
