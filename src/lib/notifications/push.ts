/**
 * Push Notification Service
 *
 * Sends Web Push (VAPID) notifications using the `web-push` library.
 * Manages push subscription lifecycle (subscribe/unsubscribe).
 *
 * - `sendPush()` — send to all user subscriptions, auto-cleanup 410 Gone
 * - `subscribePush()` — register a new push subscription
 * - `unsubscribePush()` — remove a subscription by endpoint
 *
 * Graceful degradation: all functions are no-op if VAPID is not configured.
 *
 * @see NOTIF-006
 */

import webpush from 'web-push';
import { db } from '@/lib/db/drizzle';
import { pushSubscriptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { isPushConfigured, getVapidConfig } from '@/lib/env';
import { logger } from '@/lib/logger';

// =============================================================================
// Types
// =============================================================================

/** Input for sending a push notification */
export interface SendPushInput {
  /** Target user ID */
  userId: string;
  /** Notification title */
  title: string;
  /** Notification body text */
  body: string;
  /** Optional deep link URL */
  url?: string;
  /** Optional icon URL */
  icon?: string;
}

// =============================================================================
// VAPID Setup (lazy)
// =============================================================================

let vapidInitialized = false;

/**
 * Initialize VAPID credentials (idempotent).
 * Only runs once, no-ops on subsequent calls.
 */
function ensureVapidInit(): boolean {
  if (!isPushConfigured()) return false;
  if (vapidInitialized) return true;

  try {
    const { publicKey, privateKey, subject } = getVapidConfig();
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidInitialized = true;
    return true;
  } catch (error) {
    logger.error('[push] Failed to initialize VAPID', { error });
    return false;
  }
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Send a push notification to all of a user's subscriptions.
 *
 * - No-op if VAPID is not configured (graceful degradation)
 * - Auto-deletes subscriptions that return 410 Gone (expired)
 * - Errors on individual subscriptions are logged but don't fail the batch
 *
 * @example
 * ```ts
 * await sendPush({
 *   userId: 'uuid',
 *   title: 'Nuevo documento',
 *   body: 'Se subió "Contrato Q1.pdf"',
 *   url: '/documents/123',
 * });
 * ```
 */
export async function sendPush(input: SendPushInput): Promise<void> {
  if (!ensureVapidInit()) return;

  const { userId, title, body, url, icon } = input;

  // Fetch all subscriptions for the user
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  if (subs.length === 0) return;

  const payload = JSON.stringify({
    title,
    body,
    url: url ?? undefined,
    icon: icon ?? undefined,
  });

  // Send to each subscription in parallel
  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          payload
        );
      } catch (error: unknown) {
        const statusCode = (error as { statusCode?: number })?.statusCode;

        if (statusCode === 410 || statusCode === 404) {
          // Subscription expired or invalid — auto-cleanup
          logger.info('[push] Removing expired subscription', {
            userId,
            endpoint: sub.endpoint,
            statusCode,
          });
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        } else {
          // Log other errors but don't re-throw
          logger.error('[push] Failed to send to subscription', {
            userId,
            endpoint: sub.endpoint,
            error,
          });
        }
      }
    })
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  logger.info('[push] Batch complete', {
    userId,
    total: subs.length,
    succeeded,
  });
}

/**
 * Register a new push subscription for a user.
 *
 * Uses upsert logic: if the endpoint already exists, updates the keys.
 *
 * @param userId - The user ID
 * @param subscription - The PushSubscription object from the browser
 * @param userAgent - Optional browser/device user agent string
 */
export async function subscribePush(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent?: string
): Promise<void> {
  // Check if subscription endpoint already exists
  const [existing] = await db
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
    .limit(1);

  if (existing) {
    // Update existing subscription (keys may have rotated)
    await db
      .update(pushSubscriptions)
      .set({
        userId,
        keys: subscription.keys,
        userAgent: userAgent ?? null,
      })
      .where(eq(pushSubscriptions.id, existing.id));
  } else {
    // Insert new subscription
    await db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent: userAgent ?? null,
    });
  }
}

/**
 * Unsubscribe a push subscription by endpoint.
 *
 * Only deletes if the subscription belongs to the specified user.
 *
 * @param userId - The user ID (for ownership check)
 * @param endpoint - The push endpoint URL to remove
 */
export async function unsubscribePush(userId: string, endpoint: string): Promise<void> {
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
}
