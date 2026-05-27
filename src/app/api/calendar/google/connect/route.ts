/**
 * GET /api/calendar/google/connect — ISSUE-090b.
 *
 * Auth-required entry point that:
 *   1. Signs an HMAC state token bound to the current userId.
 *   2. Sets it in an httpOnly cookie (SameSite=Lax so the cross-site
 *      callback can read it).
 *   3. Redirects the browser to Google's consent screen.
 *
 * The cookie + the URL `state` param are compared on `/callback` to
 * defeat CSRF (attacker can't set our cookie from another origin).
 *
 * Linked: FT-090, BR-12.
 */

import { auth } from '@/lib/auth/auth';
import { buildAuthUrl } from '@/lib/integrations/calendar/google';
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
