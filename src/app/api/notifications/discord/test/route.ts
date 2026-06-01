/**
 * POST /api/notifications/discord/test — Send a test message to the
 * user's configured Discord webhook.
 *
 * Returns:
 *   - 200 + { sent: true } when the webhook fired.
 *   - 200 + { sent: false, reason: 'not_configured' } when the URL
 *     is unset (settings page tells the user to paste one first).
 *   - 401 when no session.
 *
 * No anti-spam gate here — this is an explicit user action triggered
 * from the settings page, not a proactive task.
 */

import { auth } from '@/lib/auth/auth';
import { sendDiscord } from '@/lib/notifications/discord';

export async function POST(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sent = await sendDiscord(session.user.id, {
    title: 'Test desde AgendaInteligente',
    body: 'Si lees esto, tu webhook de Discord está activo. El agente puede mandarte check-ins por acá.',
    url: '/today',
  });

  return Response.json({
    sent,
    reason: sent ? 'ok' : 'not_configured',
  });
}
