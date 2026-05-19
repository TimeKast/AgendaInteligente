/**
 * Polling Notification Endpoint
 *
 * GET /api/notifications/poll
 *
 * REST endpoint that returns the latest notifications + unread count for
 * the current user. Replaces the previous SSE stream. The client polls
 * every 30s while the tab is visible (see useNotifications hook).
 *
 * Why polling on Vercel:
 * - SSE in serverless bills wall-clock execution time → 100% utilization
 *   per active user → cost scales linearly. Polling 30s ≈ 1% of that cost.
 * - Trade-off: notif latency rises from <5s to up to 30s (avg ~15s) —
 *   acceptable for in-app notifications (not chat).
 */

import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db/drizzle';
import { notifications } from '@/lib/db/schema';
import { and, eq, desc, count as drizzleCount } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Aligned with `NotificationPanel.MAX_ITEMS`. The dropdown shows up to ~6
 * items above the fold and scrolls internally for the rest; past this cap
 * the user navigates to `/notifications` for the full list.
 */
const PAGE_SIZE = 20;

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const [items, [unreadResult]] = await Promise.all([
      db
        .select({
          id: notifications.id,
          title: notifications.title,
          body: notifications.body,
          type: notifications.type,
          category: notifications.category,
          url: notifications.url,
          read: notifications.read,
          createdAt: notifications.createdAt,
          metadata: notifications.metadata,
        })
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(PAGE_SIZE),
      db
        .select({ value: drizzleCount() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.read, false))),
    ]);

    return Response.json({
      items,
      unreadCount: unreadResult?.value ?? 0,
    });
  } catch (error) {
    logger.error('[notifications/poll] query failed', { userId, error });
    return Response.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
