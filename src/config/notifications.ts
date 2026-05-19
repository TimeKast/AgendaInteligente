/**
 * Notification System Configuration
 *
 * Configurable categories, types, and channels for the notification system.
 * Categories are extensible per project — add custom categories to NOTIFICATION_CATEGORIES.
 *
 * @see NOTIF-002
 */

import { isNotificationsEnabled, isPushConfigured } from '@/lib/env';

// =============================================================================
// Types
// =============================================================================

/**
 * Notification category definition.
 * Used for preference management and UI display.
 */
export interface NotificationCategory {
  /** Unique category identifier */
  id: string;
  /** Display label for UI */
  label: string;
  /** Lucide icon name */
  icon: string;
  /** Short description for settings UI */
  description: string;
  /** If true, user cannot disable this category */
  locked: boolean;
  /** Default channels for new users */
  defaultChannels: NotificationChannel[];
  /** Badge color variant for UI display */
  badgeVariant?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

// =============================================================================
// Notification Types
// =============================================================================

/**
 * Notification types for visual styling.
 * Maps to UI variants (color, icon).
 */
export const NOTIFICATION_TYPES = {
  /** Informational — neutral styling */
  INFO: 'info',
  /** Success — green/positive styling */
  SUCCESS: 'success',
  /** Warning — amber/caution styling */
  WARNING: 'warning',
  /** Error — red/danger styling */
  ERROR: 'error',
  /** System — special styling for system messages */
  SYSTEM: 'system',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

// =============================================================================
// Notification Channels
// =============================================================================

/**
 * Available delivery channels.
 * Each channel degrades gracefully if not configured.
 */
export const NOTIFICATION_CHANNELS = {
  /** In-app bell + panel */
  IN_APP: 'in_app',
  /** Web Push (VAPID) */
  PUSH: 'push',
  /** Email delivery */
  EMAIL: 'email',
} as const;

export type NotificationChannel =
  (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];

// =============================================================================
// Category Definitions
// =============================================================================

/**
 * Notification categories with metadata.
 *
 * - `locked: true` → user cannot disable (system/security events)
 * - `defaultChannels` → default delivery for new users
 *
 * Extensible: add custom categories per project.
 *
 * @example Add a custom category:
 * ```ts
 * NOTIFICATION_CATEGORIES.billing = {
 *   id: 'billing',
 *   label: 'Billing',
 *   icon: 'CreditCard',
 *   description: 'Payment and invoice notifications',
 *   locked: false,
 *   defaultChannels: ['in_app', 'email'],
 * };
 * ```
 */
export const NOTIFICATION_CATEGORIES: Record<string, NotificationCategory> = {
  /**
   * General notifications — single category for the kit.
   *
   * Forks can extend with additional categories (`billing`, `social`, etc.)
   * but the kit ships only `general`. Why one category by default:
   * - Avoids forcing channel preferences user can't opt out of
   * - In-app is always delivered (cannot be disabled), serving as the
   *   safe-by-default fallback. Push and email are user opt-out per
   *   category — and one category keeps the matrix simple
   */
  general: {
    id: 'general',
    label: 'General',
    icon: 'Bell',
    description: 'Notificaciones de la aplicación',
    locked: false,
    defaultChannels: ['in_app'],
    badgeVariant: 'info',
  },
};

// =============================================================================
// System Configuration
// =============================================================================

/**
 * Notification system configuration.
 *
 * - `retention.days` — Auto-cleanup notifications older than N days
 * - `retention.maxPerUser` — FIFO limit per user (cleanup on each notify())
 */
export const NOTIFICATION_CONFIG = {
  retention: {
    /** Delete notifications older than this many days */
    days: 30,
    /** Max notifications per user — FIFO cleanup on insert */
    maxPerUser: 200,
  },
} as const;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get all category IDs
 */
export function getCategoryIds(): string[] {
  return Object.keys(NOTIFICATION_CATEGORIES);
}

/**
 * Get a category by ID (returns undefined if not found)
 */
export function getCategory(id: string): NotificationCategory | undefined {
  return NOTIFICATION_CATEGORIES[id];
}

/**
 * Check if a category is locked (cannot be disabled by user)
 */
export function isCategoryLocked(categoryId: string): boolean {
  return NOTIFICATION_CATEGORIES[categoryId]?.locked ?? false;
}

/**
 * Get default channels for a category
 */
export function getDefaultChannels(categoryId: string): NotificationChannel[] {
  return NOTIFICATION_CATEGORIES[categoryId]?.defaultChannels ?? ['in_app'];
}

/**
 * Validate a notification type string
 */
export function isValidNotificationType(type: string): type is NotificationType {
  return Object.values(NOTIFICATION_TYPES).includes(type as NotificationType);
}

/**
 * Validate a notification channel string
 */
export function isValidChannel(channel: string): channel is NotificationChannel {
  return Object.values(NOTIFICATION_CHANNELS).includes(channel as NotificationChannel);
}

// Re-export env helpers for convenience
export { isNotificationsEnabled, isPushConfigured };
