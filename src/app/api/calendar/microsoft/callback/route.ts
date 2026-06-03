/**
 * GET /api/calendar/microsoft/callback — mirror of the Google callback.
 *
 * Steps:
 *   1. Auth must still be the same logged-in user.
 *   2. CSRF: cookie state must match URL state, decode to the same userId.
 *   3. Exchange the code → tokens.
 *   4. Fetch the account email + list calendars; pick the default.
 *   5. Insert encrypted row via scopedDb. UNIQUE conflict (BR-20) →
 *      redirect with `?error=already_connected`.
 *
 * All error paths bounce to `/settings/integrations?error=<reason>`.
 * Microsoft body strings never leak to the browser.
 */

import { auth } from '@/lib/auth/auth';
import { logger } from '@/lib/logger';
import { exchangeCode, fetchUserInfo, listCalendars } from '@/lib/integrations/calendar/microsoft';
import { encryptToken } from '@/lib/integrations/calendar/tokens';
import { verifyState, OAUTH_STATE_COOKIE } from '@/lib/integrations/calendar/state';
import { scopedDb } from '@/lib/db/scoped';
import { calendarConnections } from '@/lib/db/schema/calendar-connections';
import { getAppUrl } from '@/lib/env';
import { publish } from '@/lib/inngest/publish';

const SETTINGS_PATH = '/settings/integrations';
const ONBOARDING_PATH = '/onboarding/done';

function makeRedirect(basePath: string) {
  return function (reason: string, code = 302): Response {
    const url = `${getAppUrl()}${basePath}?${reason}`;
    return new Response(null, {
      status: code,
      headers: {
        Location: url,
        'Set-Cookie': `${OAUTH_STATE_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/api/calendar; Max-Age=0`,
      },
    });
  };
}

export async function GET(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  const userId = session.user.id;

  const isOnboarding = !(session.user as { onboardingCompletedAt?: string | null })
    .onboardingCompletedAt;
  const redirect = makeRedirect(isOnboarding ? ONBOARDING_PATH : SETTINGS_PATH);

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const urlState = url.searchParams.get('state');

  // Microsoft sends `error` + `error_description` when the user denies
  // or something else goes wrong on their side.
  const oauthError = url.searchParams.get('error');
  if (oauthError) {
    logger.warn(`[ms.callback] OAuth provider error: ${oauthError}`);
    return redirect(`error=${encodeURIComponent(oauthError)}`);
  }

  if (!code || !urlState) {
    return redirect('error=missing_params');
  }

  const cookieHeader = req.headers.get('cookie') ?? '';
  const cookieState = parseCookie(cookieHeader, OAUTH_STATE_COOKIE);
  if (!cookieState || cookieState !== urlState) {
    return redirect('error=invalid_state');
  }

  let stateUserId: string;
  try {
    const payload = verifyState(urlState);
    stateUserId = payload.userId;
  } catch (err) {
    logger.warn(`[ms.callback] state verification failed: ${(err as Error).message}`);
    return redirect('error=invalid_state');
  }
  if (stateUserId !== userId) {
    return redirect('error=invalid_state');
  }

  let tokens: Awaited<ReturnType<typeof exchangeCode>>;
  try {
    tokens = await exchangeCode(code);
  } catch (err) {
    logger.error('[ms.callback] exchangeCode failed', err);
    return redirect('error=exchange_failed');
  }

  if (!tokens.refresh_token) {
    // Without offline_access being granted we lose the connection after
    // ~1h. This usually means the user revoked the scope or the app
    // wasn't asked for it — log and reject.
    logger.error('[ms.callback] Microsoft did not return refresh_token');
    return redirect('error=no_refresh_token');
  }

  let userInfo: Awaited<ReturnType<typeof fetchUserInfo>>;
  let calendars: Awaited<ReturnType<typeof listCalendars>>;
  try {
    userInfo = await fetchUserInfo(tokens.access_token);
    calendars = await listCalendars(tokens.access_token);
  } catch (err) {
    logger.error('[ms.callback] post-exchange API failed', err);
    return redirect('error=microsoft_api_failed');
  }

  const defaultId = calendars.find((c) => c.isDefaultCalendar)?.id ?? calendars[0]?.id;
  const calendarIds = defaultId ? [defaultId] : [];

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  const sdb = scopedDb(userId);

  const inserted: { id: string }[] = await (
    sdb.insert('calendarConnections', {
      provider: 'outlook',
      externalAccountId: userInfo.email,
      accessToken: encryptToken(tokens.access_token),
      refreshToken: encryptToken(tokens.refresh_token),
      expiresAt,
      calendarIds,
      enabled: true,
      accountLabel: userInfo.email,
    }) as unknown as {
      onConflictDoNothing: (opts: { target: unknown[] }) => {
        returning: () => Promise<{ id: string }[]>;
      };
    }
  )
    .onConflictDoNothing({
      target: [
        calendarConnections.userId,
        calendarConnections.provider,
        calendarConnections.externalAccountId,
      ],
    })
    .returning();

  if (inserted.length === 0) {
    return redirect('error=already_connected');
  }

  publish('calendar.sync.requested', {
    userId,
    connectionId: inserted[0].id,
  }).catch((err) =>
    logger.warn(`[ms.callback] initial sync publish failed: ${(err as Error).message}`)
  );

  return redirect('connected=1');
}

function parseCookie(header: string, name: string): string | null {
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
}
