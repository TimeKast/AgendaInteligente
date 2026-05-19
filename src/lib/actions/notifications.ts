'use server';

/**
 * Notification Server Actions
 *
 * Server actions for the notification UI. All actions use `withSelf()`
 * since notifications are user-scoped (no admin RBAC needed).
 *
 * Actions:
 * - getNotifications — paginated list with filters
 * - getUnreadCount — badge counter
 * - markAsRead — single notification
 * - markAllAsRead — all for current user
 * - markManyAsRead — bulk by IDs
 * - deleteNotification — single (owner only)
 * - deleteNotifications — bulk by IDs
 * - getNotificationPrefs — user preferences
 * - updateNotificationPref — toggle individual preference
 *
 * @see NOTIF-003
 */

import { db } from '@/lib/db/drizzle';
import {
  notifications,
  notificationPreferences,
  pushSubscriptions,
} from '@/lib/db/schema/notifications';
import { eq, and, desc, sql, inArray, isNull, or, gt, gte, lte, ilike } from 'drizzle-orm';
import { withSelf } from '@/lib/actions/helpers';
import { ActionError, type ActionResult } from '@/lib/actions/types';
import { notify } from '@/lib/notifications';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CHANNELS,
  isCategoryLocked,
} from '@/config/notifications';

// =============================================================================
// Schemas
// =============================================================================

const getNotificationsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
  category: z.string().optional(),
  unread: z.boolean().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(), // ISO date string
  dateTo: z.string().optional(), // ISO date string
});

const markAsReadSchema = z.object({
  id: z.string().uuid(),
});

const markManyAsReadSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

const deleteNotificationSchema = z.object({
  id: z.string().uuid(),
});

const deleteNotificationsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

const updateNotificationPrefSchema = z.object({
  channel: z.enum(['in_app', 'push', 'email']),
  category: z.string(),
  enabled: z.boolean(),
});

// =============================================================================
// Read Actions
// =============================================================================

/**
 * Get paginated notifications for the current user.
 * Filters out expired notifications automatically.
 */
export async function getNotifications(input: unknown) {
  return withSelf({ schema: getNotificationsSchema }, input, async (data, userId) => {
    const { page, pageSize, category, unread, search, dateFrom, dateTo } = data;
    const offset = (page - 1) * pageSize;

    // Base conditions (applied to all queries including facets)
    const baseConditions = [
      eq(notifications.userId, userId),
      or(isNull(notifications.expiresAt), gt(notifications.expiresAt, new Date())),
    ];

    if (search) {
      const pattern = `%${search}%`;
      baseConditions.push(
        or(ilike(notifications.title, pattern), ilike(notifications.body, pattern))!
      );
    }

    if (dateFrom) {
      baseConditions.push(gte(notifications.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      baseConditions.push(lte(notifications.createdAt, endOfDay));
    }

    // Full conditions (base + dropdown filters)
    const fullConditions = [...baseConditions];

    if (category) {
      fullConditions.push(eq(notifications.category, category));
    }

    if (unread !== undefined) {
      fullConditions.push(eq(notifications.read, !unread));
    }

    // Query with pagination
    const items = await db
      .select()
      .from(notifications)
      .where(and(...fullConditions))
      .orderBy(desc(notifications.createdAt))
      .limit(pageSize)
      .offset(offset);

    // Total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(...fullConditions));

    // Cascading facets — each facet is filtered by ALL OTHER filters except itself
    const categoryFacetConditions = [...baseConditions];
    if (unread !== undefined) {
      categoryFacetConditions.push(eq(notifications.read, !unread));
    }

    const statusFacetConditions = [...baseConditions];
    if (category) {
      statusFacetConditions.push(eq(notifications.category, category));
    }

    const [categoryFacets, statusFacets] = await Promise.all([
      db
        .selectDistinct({ category: notifications.category })
        .from(notifications)
        .where(and(...categoryFacetConditions)),
      db
        .selectDistinct({ read: notifications.read })
        .from(notifications)
        .where(and(...statusFacetConditions)),
    ]);

    return {
      items,
      total: countResult?.count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((countResult?.count ?? 0) / pageSize),
      facets: {
        categories: categoryFacets.map((r) => r.category),
        statuses: statusFacets.map((r) => (r.read ? 'read' : 'unread')),
      },
    };
  });
}

/**
 * Get unread notification count for the current user.
 * Used for badge counter on NotificationBell.
 *
 * @public SK API — exported for derived projects to use in custom badge UIs.
 */
export async function getUnreadCount() {
  return withSelf({}, async (userId) => {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false),
          or(isNull(notifications.expiresAt), gt(notifications.expiresAt, new Date()))
        )
      );

    return { count: result?.count ?? 0 };
  });
}

// =============================================================================
// Mutation Actions
// =============================================================================

/**
 * Mark a single notification as read.
 */
export async function markAsRead(input: unknown) {
  return withSelf(
    { schema: markAsReadSchema, revalidate: '/notifications' },
    input,
    async (data, userId) => {
      const result = await db
        .update(notifications)
        .set({ read: true, readAt: new Date() })
        .where(and(eq(notifications.id, data.id), eq(notifications.userId, userId)))
        .returning({ id: notifications.id });

      if (result.length === 0) {
        throw new ActionError('Notificación no encontrada');
      }
    }
  );
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllAsRead() {
  return withSelf({ revalidate: '/notifications' }, async (userId) => {
    await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  });
}

/**
 * Mark multiple notifications as read (bulk).
 */
export async function markManyAsRead(input: unknown) {
  return withSelf(
    { schema: markManyAsReadSchema, revalidate: '/notifications' },
    input,
    async (data, userId) => {
      await db
        .update(notifications)
        .set({ read: true, readAt: new Date() })
        .where(and(inArray(notifications.id, data.ids), eq(notifications.userId, userId)));
    }
  );
}

/**
 * Mark multiple notifications as unread (bulk).
 */
export async function markManyAsUnread(input: unknown) {
  return withSelf(
    { schema: markManyAsReadSchema, revalidate: '/notifications' },
    input,
    async (data, userId) => {
      await db
        .update(notifications)
        .set({ read: false, readAt: null })
        .where(and(inArray(notifications.id, data.ids), eq(notifications.userId, userId)));
    }
  );
}

/**
 * Delete a single notification (owner only).
 */
export async function deleteNotification(input: unknown) {
  return withSelf(
    { schema: deleteNotificationSchema, revalidate: '/notifications' },
    input,
    async (data, userId) => {
      const result = await db
        .delete(notifications)
        .where(and(eq(notifications.id, data.id), eq(notifications.userId, userId)))
        .returning({ id: notifications.id });

      if (result.length === 0) {
        throw new ActionError('Notificación no encontrada');
      }
    }
  );
}

/**
 * Delete multiple notifications (bulk, owner only).
 */
export async function deleteNotifications(input: unknown) {
  return withSelf(
    { schema: deleteNotificationsSchema, revalidate: '/notifications' },
    input,
    async (data, userId) => {
      await db
        .delete(notifications)
        .where(and(inArray(notifications.id, data.ids), eq(notifications.userId, userId)));
    }
  );
}

// =============================================================================
// Preferences Actions
// =============================================================================

/**
 * Get notification preferences for the current user.
 *
 * Returns a structured object with all categories × channels,
 * filling in defaults for preferences not yet set.
 */
export async function getNotificationPrefs() {
  return withSelf({}, async (userId) => {
    // Fetch existing preferences
    const existing = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));

    // Build lookup: `${channel}:${category}` → enabled
    const lookup = new Map<string, boolean>();
    for (const pref of existing) {
      lookup.set(`${pref.channel}:${pref.category}`, pref.enabled);
    }

    // Build structured response
    const categories = Object.entries(NOTIFICATION_CATEGORIES).map(([id, cat]) => ({
      id,
      label: cat.label,
      icon: cat.icon,
      description: cat.description,
      locked: cat.locked,
      channels: Object.values(NOTIFICATION_CHANNELS).map((channel) => {
        const key = `${channel}:${id}`;
        const defaultEnabled = cat.defaultChannels.includes(channel);
        return {
          channel,
          enabled: lookup.has(key) ? lookup.get(key)! : defaultEnabled,
        };
      }),
    }));

    return { categories };
  });
}

/**
 * Toggle a single notification preference (channel × category).
 *
 * Validates that the category isn't locked before allowing disable.
 * Uses upsert (ON CONFLICT UPDATE) to handle first-time toggles.
 */
export async function updateNotificationPref(input: unknown) {
  return withSelf(
    { schema: updateNotificationPrefSchema, revalidate: '/notifications' },
    input,
    async (data, userId) => {
      const { channel, category, enabled } = data;

      // Locked categories cannot be disabled for in_app channel
      // (Push/Email are always user-toggleable)
      if (!enabled && channel === 'in_app' && isCategoryLocked(category)) {
        throw new ActionError(`La categoría "${category}" no se puede desactivar para In-App`);
      }

      // Upsert preference
      await db
        .insert(notificationPreferences)
        .values({
          userId,
          channel,
          category,
          enabled,
        })
        .onConflictDoUpdate({
          target: [
            notificationPreferences.userId,
            notificationPreferences.channel,
            notificationPreferences.category,
          ],
          set: { enabled },
        });

      revalidatePath('/notifications');
    }
  );
}

// =============================================================================
// Push Devices (per-device push subscriptions)
// =============================================================================

export interface PushDevice {
  id: string;
  endpoint: string;
  userAgent: string | null;
  createdAt: Date;
}

/**
 * List all push subscriptions registered for the current user.
 *
 * Returns one row per device (browser × machine). The client identifies
 * which row corresponds to the current device by matching `endpoint`
 * against `registration.pushManager.getSubscription()?.endpoint` locally.
 */
export async function getPushDevices(): Promise<ActionResult<PushDevice[]>> {
  return withSelf({ schema: z.object({}), revalidate: '/notifications' }, {}, async (_, userId) => {
    const rows = await db
      .select({
        id: pushSubscriptions.id,
        endpoint: pushSubscriptions.endpoint,
        userAgent: pushSubscriptions.userAgent,
        createdAt: pushSubscriptions.createdAt,
      })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId))
      .orderBy(desc(pushSubscriptions.createdAt));

    return rows;
  });
}

const removePushDeviceSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Send a test notification to the currently authenticated user.
 *
 * Used by the dashboard "Probar notificación" button to verify the
 * notification pipeline end-to-end. We explicitly request all three
 * channels (in_app + push + email) so the test exercises whatever the
 * user has enabled — the dispatcher's `resolveChannels` will filter
 * down to what the user actually opted into. Without this override,
 * `general`'s defaultChannels is `['in_app']` only and push never fires
 * regardless of the user's subscription state.
 */
export async function sendTestNotification() {
  return withSelf({ schema: z.object({}), revalidate: '/notifications' }, {}, async (_, userId) => {
    await notify({
      userId,
      title: 'Notificación de prueba',
      body: 'Si ves esto, tus notificaciones funcionan correctamente.',
      type: 'info',
      category: 'general',
      channels: ['in_app', 'push', 'email'],
      url: '/notifications',
    });
  });
}

/**
 * Remove a push subscription owned by the current user.
 *
 * Note: this only deletes the BD row. If the device is online, its
 * browser subscription is still active until the next push attempt
 * fails (web-push will return 410/404, the dispatcher should clean up).
 * For immediate revocation from the device itself, the user toggles
 * "Activar push" on the device and then off, which calls
 * pushSubscription.unsubscribe() locally.
 */
export async function removePushDevice(input: unknown) {
  return withSelf(
    { schema: removePushDeviceSchema, revalidate: '/notifications' },
    input,
    async (data, userId) => {
      const result = await db
        .delete(pushSubscriptions)
        .where(and(eq(pushSubscriptions.id, data.id), eq(pushSubscriptions.userId, userId)))
        .returning({ id: pushSubscriptions.id });

      if (result.length === 0) {
        throw new ActionError('Dispositivo no encontrado');
      }
    }
  );
}
