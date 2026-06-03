/**
 * GET /api/calendar/microsoft/connect — mirror of the Google connect.
 *
 * Signs an HMAC state token bound to the current userId, drops it in an
 * httpOnly cookie, and redirects to the Microsoft consent page.
 */

import { auth } from '@/lib/auth/auth';
import { buildAuthUrl } from '@/lib/integrations/calendar/microsoft';
import {
  signState,
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_TTL_SECONDS,
} from '@/lib/integrations/calendar/state';

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const state = signState(session.user.id);
  const url = buildAuthUrl(state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      'Set-Cookie': [
        `${OAUTH_STATE_COOKIE}=${state}`,
        'HttpOnly',
        'Secure',
        'SameSite=Lax',
        'Path=/api/calendar',
        `Max-Age=${OAUTH_STATE_TTL_SECONDS}`,
      ].join('; '),
    },
  });
}
