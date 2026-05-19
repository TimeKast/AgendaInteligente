/**
 * Notifications Schema
 *
 * Database schema for the notification system.
 * Three tables: notifications, push_subscriptions, notification_preferences.
 *
 * @see NOTIF-001
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// =============================================================================
// Notifications Table
// =============================================================================

/**
 * Persistent notifications for users.
 *
 * Type is TEXT (not pgEnum) following SK convention — validation in config.
 * Valid types: info, success, warning, error, system
 */
export const notifications = pgTable(
  'notifications',
  {
    /** Unique identifier (UUID v4) */
    id: uuid('id').primaryKey().defaultRandom(),

    /** Target user */
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** Notification title */
    title: text('title').notNull(),

    /** Notification body */
    body: text('body').notNull(),

    /**
     * Notification type for visual styling.
     * Valid values: info, success, warning, error, system
     */
    type: text('type').notNull(),

    /** Category for preference matching (e.g. security, general, updates) */
    category: text('category').notNull(),

    /** Optional deep link URL */
    url: text('url'),

    /** Whether the notification has been read */
    read: boolean('read').notNull().default(false),

    /** When the notification was read */
    readAt: timestamp('read_at', { mode: 'date', withTimezone: true }),

    /** Optional expiration (null = never expires) */
    expiresAt: timestamp('expires_at', { mode: 'date', withTimezone: true }),

    /** Delivery channels used (e.g. ["in_app", "push", "email"]) */
    channels: jsonb('channels').$type<string[]>(),

    /** Extensible metadata */
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),

    /** Record creation timestamp */
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),

    /** Last modification timestamp */
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('notifications_user_read_created_idx').on(table.userId, table.read, table.createdAt),
  ]
);

// =============================================================================
// Push Subscriptions Table
// =============================================================================

/**
 * Web Push (VAPID) subscriptions per device.
 *
 * Stores the PushSubscription object from the browser's Push API.
 * Keys are stored as JSON (p256dh + auth) for web-push library compatibility.
 */
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    /** Unique identifier (UUID v4) */
    id: uuid('id').primaryKey().defaultRandom(),

    /** Subscriber user */
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** Push endpoint URL (unique per device) */
    endpoint: text('endpoint').notNull().unique(),

    /** VAPID keys: { p256dh, auth } */
    keys: jsonb('keys').$type<{ p256dh: string; auth: string }>().notNull(),

    /** Browser/device user agent */
    userAgent: text('user_agent'),

    /** When the subscription was created */
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('push_subscriptions_user_idx').on(table.userId)]
);

// =============================================================================
// Notification Preferences Table
// =============================================================================

/**
 * Per-user, per-channel, per-category notification preferences.
 *
 * Channel is TEXT: in_app, push, email
 * Category matches keys from config/notifications.ts NOTIFICATION_CATEGORIES
 *
 * Unique constraint on (userId, channel, category) ensures one preference per combo.
 */
export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    /** Unique identifier (UUID v4) */
    id: uuid('id').primaryKey().defaultRandom(),

    /** Owner user */
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** Notification channel: in_app, push, email */
    channel: text('channel').notNull(),

    /** Category key (matches NOTIFICATION_CATEGORIES keys) */
    category: text('category').notNull(),

    /** Whether this channel+category is enabled for the user */
    enabled: boolean('enabled').notNull().default(true),
  },
  (table) => [
    uniqueIndex('notification_prefs_user_channel_category_idx').on(
      table.userId,
      table.channel,
      table.category
    ),
    index('notification_prefs_user_channel_idx').on(table.userId, table.channel),
  ]
);

// =============================================================================
// Types (inferred from schema)
// =============================================================================

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;
