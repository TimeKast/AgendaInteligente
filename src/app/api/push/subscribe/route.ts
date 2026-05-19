/**
 * Push Subscription API
 *
 * POST   /api/push/subscribe — Register a push subscription
 * DELETE /api/push/subscribe — Unregister a push subscription
 *
 * Both endpoints require authentication.
 * Request bodies are validated with Zod.
 *
 * @see NOTIF-006
 */

import { auth } from '@/lib/auth/auth';
import { subscribePush, unsubscribePush } from '@/lib/notifications/push';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// =============================================================================
// Validation Schemas
// =============================================================================

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

// =============================================================================
// POST — Subscribe
// =============================================================================

/**
 * Register a new push subscription for the authenticated user.
 *
 * Body: { endpoint: string, keys: { p256dh: string, auth: string } }
 */
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = subscribeSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const userAgent = req.headers.get('user-agent') ?? undefined;

    await subscribePush(session.user.id, result.data, userAgent);

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    logger.error('[api:push:subscribe] POST failed', { error });
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// DELETE — Unsubscribe
// =============================================================================

/**
 * Unregister a push subscription for the authenticated user.
 *
 * Body: { endpoint: string }
 */
export async function DELETE(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = unsubscribeSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: 'Invalid request body', details: result.error.flatten() },
        { status: 400 }
      );
    }

    await unsubscribePush(session.user.id, result.data.endpoint);

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    logger.error('[api:push:subscribe] DELETE failed', { error });
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
