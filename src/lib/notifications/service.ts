/**
 * Notification Service — Core
 *
 * Orchestrates notification creation, channel dispatch, and FIFO cleanup.
 * This is the heart of the notification system — all UI components and
 * event triggers depend on it.
 *
 * @see NOTIF-003
 */

import { db } from '@/lib/db/drizzle';
import { notifications, notificationPreferences } from '@/lib/db/schema/notifications';
import { users } from '@/lib/db/schema';
import { eq, and, or, lt, desc, sql, inArray, isNotNull } from 'drizzle-orm';
import { sendEmail, isEmailReady } from '@/lib/email';
import { notificationEmail } from '@/lib/email/templates/notification';
import { sendPush } from '@/lib/notifications/push';
import { isPushConfigured } from '@/lib/env';
import {
  NOTIFICATION_CONFIG,
  NOTIFICATION_CHANNELS,
  getDefaultChannels,
  type NotificationType,
  type NotificationChannel,
} from '@/config/notifications';

// =============================================================================
// Types
// =============================================================================

/** Input for creating a single notification */
export interface NotifyInput {
  /** Target user UUID */
  userId: string;
  /** Notification title */
  title: string;
  /** Notification body */
  body: string;
  /** Visual type: info, success, warning, error, system */
  type: NotificationType;
  /** Category for preference matching (e.g. security, general) */
  category: string;
  /** Optional deep link URL */
  url?: string;
  /** Requested channels (defaults to category's defaultChannels) */
  channels?: NotificationChannel[];
  /** Optional expiration date */
  expiresAt?: Date;
  /** Extensible metadata */
  metadata?: Record<string, unknown>;
}

/** Input for notifying multiple users */
export interface NotifyManyInput extends Omit<NotifyInput, 'userId'> {
  /** Target user UUIDs */
  userIds: string[];
}

/** Result of a notify() call */
export interface NotifyResult {
  /** Created notification ID */
  id: string;
  /** Channels that were actually dispatched */
  channels: string[];
}

// =============================================================================
// Core Service
// =============================================================================

/**
 * Create a notification for a single user.
 *
 * 1. Resolves effective channels (requested ∩ user preferences)
 * 2. Inserts notification record in DB
 * 3. Dispatches to enabled channels (push, email — stubs until NOTIF-004+)
 * 4. Runs FIFO cleanup if user exceeds maxPerUser
 * 5. Cleans up expired notifications
 *
 * @example
 * ```ts
 * await notify({
 *   userId: 'uuid',
 *   title: 'Nuevo documento',
 *   body: 'Se subió "Contrato Q1.pdf"',
 *   url: '/documents/123',
 *   type: 'info',
 *   category: 'documents',
 * });
 * ```
 */
export async function notify(input: NotifyInput): Promise<NotifyResult> {
  const { userId, title, body, type, category, url, channels, expiresAt, metadata } = input;

  // 1. Resolve effective channels
  const effectiveChannels = await resolveChannels(userId, category, channels);

  // 2. Insert notification
  const [created] = await db
    .insert(notifications)
    .values({
      userId,
      title,
      body,
      type,
      category,
      url: url ?? null,
      channels: effectiveChannels,
      expiresAt: expiresAt ?? null,
      metadata: metadata ?? null,
    })
    .returning({ id: notifications.id });

  // 3. Dispatch to channels
  await dispatchToChannels(userId, {
    title,
    body,
    category,
    url,
    channels: effectiveChannels,
  });

  // 4. Piggyback cleanup (retention.days + expired + FIFO) — per-user
  await cleanupForUser(userId);

  return {
    id: created.id,
    channels: effectiveChannels,
  };
}

/**
 * Create notifications for multiple users.
 *
 * Calls notify() per user. Each user gets their own preference resolution.
 */
export async function notifyMany(input: NotifyManyInput): Promise<NotifyResult[]> {
  const { userIds, ...rest } = input;

  const results: NotifyResult[] = [];
  for (const userId of userIds) {
    try {
      const result = await notify({ userId, ...rest });
      results.push(result);
    } catch (error) {
      // Graceful degradation: log and continue for other users
      console.error(`[notifyMany] Failed for user ${userId}:`, error);
    }
  }

  return results;
}

// =============================================================================
// Channel Resolution
// =============================================================================

/**
 * Resolve effective channels for a notification.
 *
 * Model: defaultChannels is the initial-ON set for users without explicit
 * preferences. Once a user toggles ANY channel for a category, their stored
 * preferences become authoritative for THAT channel — defaultChannels no longer
 * applies to it. The two layers (defaults + user prefs) compose so each toggle
 * the user sees in NotificationSettings has effect, regardless of whether the
 * channel was in defaultChannels or not.
 *
 * Priority for each channel:
 *  1. Explicit `requestedChannels` override (caller-supplied) — bypasses defaults
 *     but still respects user opt-out (except in_app).
 *  2. User preference if stored — wins over defaults.
 *  3. defaultChannels of the category — used for channels the user has not toggled.
 *
 * Invariants:
 *  - in_app is always delivered, ignoring any opt-out.
 *  - Channels not in NOTIFICATION_CHANNELS cannot leak in.
 */
async function resolveChannels(
  userId: string,
  category: string,
  requestedChannels?: NotificationChannel[]
): Promise<string[]> {
  // Fetch user preferences for this category
  const prefs = await db
    .select({
      channel: notificationPreferences.channel,
      enabled: notificationPreferences.enabled,
    })
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.userId, userId),
        eq(notificationPreferences.category, category)
      )
    );

  const userPref = new Map<string, boolean>(
    prefs.map((p: { channel: string; enabled: boolean }) => [p.channel, p.enabled])
  );

  // Caller-supplied `requestedChannels` is an explicit override (e.g. system
  // notifs that must use a specific channel). It bypasses defaults but still
  // respects user opt-out for non-in_app channels.
  if (requestedChannels) {
    const effective = requestedChannels.filter(
      (ch) => ch === 'in_app' || userPref.get(ch) !== false
    );
    if (!effective.includes('in_app')) effective.unshift('in_app');
    return effective;
  }

  // Default path: defaults define the initial-ON set; user prefs override
  // per-channel once stored. Each channel resolves independently:
  //   - user has stored pref → use it
  //   - no stored pref → fall back to defaultChannels.includes(ch)
  const defaultsSet = new Set<string>(getDefaultChannels(category));
  const effective = Object.values(NOTIFICATION_CHANNELS).filter((ch) => {
    if (ch === 'in_app') return true;
    if (userPref.has(ch)) return userPref.get(ch) === true;
    return defaultsSet.has(ch);
  });

  if (!effective.includes('in_app')) effective.unshift('in_app');
  return effective;
}

// =============================================================================
// Channel Dispatch
// =============================================================================

interface DispatchPayload {
  title: string;
  body: string;
  category: string;
  url?: string;
  channels: string[];
}

/**
 * Dispatch notification to non-in-app channels.
 *
 * in_app is handled by the DB insert itself.
 * Email uses `sendEmail()` + `notificationEmail()` template.
 * Push uses `sendPush()` via web-push (VAPID).
 *
 * Graceful degradation: errors are logged, never thrown.
 *
 * @see NOTIF-004 (email)
 * @see NOTIF-006 (push)
 */
async function dispatchToChannels(userId: string, payload: DispatchPayload): Promise<void> {
  const { title, body, category, url, channels } = payload;

  // Email dispatch
  if (channels.includes('email') && isEmailReady()) {
    try {
      // Look up user email
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user?.email) {
        // Guard: skip real email dispatch for test addresses
        const testDomains = ['@test.com', '@example.com', '@test.local'];
        if (testDomains.some((d) => user.email.endsWith(d))) {
          console.info(`[notify:email] Skipped email to test address: ${user.email}`);
        } else {
          const { subject, html } = notificationEmail({
            title,
            body,
            category,
            ctaText: url ? 'Ver detalles' : undefined,
            ctaUrl: url ?? undefined,
          });

          await sendEmail({ to: user.email, subject, html });
        }
      }
    } catch (error) {
      // Graceful degradation — don't fail the notification
      console.error(`[notify:email] Failed to send email for user ${userId}:`, error);
    }
  }

  // Push dispatch (NOTIF-006)
  if (channels.includes('push') && isPushConfigured()) {
    try {
      await sendPush({ userId, title, body, url });
    } catch (error) {
      // Graceful degradation — don't fail the notification
      console.error(`[notify:push] Failed to send push for user ${userId}:`, error);
    }
  }
}

// =============================================================================
// Cleanup
// =============================================================================

/**
 * Per-user cleanup, runs piggyback in every notify() call.
 *
 * Three rules applied in this order:
 *  1. Delete by retention.days — anything older than the cutoff
 *  2. Delete expired — `expires_at` set and in the past
 *  3. FIFO — if still over `maxPerUser`, drop the oldest until equal
 *
 * Why piggyback (not cron):
 *  - No scheduled functions on Vercel (extra cost, extra surface)
 *  - Inactive users don't trigger queries; their old rows persist
 *    until their next notify(), bounded by `maxPerUser` worst-case
 *  - Index `(user_id, created_at)` already exists (schema line 87) —
 *    DELETE cost is negligible
 *
 * @see Discovery §7 — Retention policy
 */
async function cleanupForUser(userId: string): Promise<void> {
  const { days, maxPerUser } = NOTIFICATION_CONFIG.retention;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const now = new Date();

  // 1 + 2: retention age + expired (single DELETE, two predicates)
  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        or(
          lt(notifications.createdAt, cutoff),
          and(isNotNull(notifications.expiresAt), lt(notifications.expiresAt, now))
        )
      )
    );

  // 3: FIFO check on what's left
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(eq(notifications.userId, userId));

  const currentCount = countResult?.count ?? 0;
  if (currentCount <= maxPerUser) return;

  const toDelete = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .offset(maxPerUser);

  if (toDelete.length > 0) {
    await db.delete(notifications).where(
      inArray(
        notifications.id,
        toDelete.map((n: { id: string }) => n.id)
      )
    );
  }
}
