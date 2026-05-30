/**
 * GET /api/calendar/google/callback — ISSUE-090b.
 *
 * Google redirects here after the user completes the consent flow. We:
 *   1. Auth: must still be the same logged-in user.
 *   2. CSRF: cookie state must match URL state AND not be expired AND
 *      its embedded userId must equal the current session userId.
 *   3. Scope check: granted_scopes must include calendar.readonly.
 *   4. Exchange the code → tokens.
 *   5. Fetch the account email + the user's calendar list.
 *   6. Insert the encrypted row via scopedDb. UNIQUE conflict (BR-20) →
 *      redirect with `?error=already_connected`.
 *
 * All error paths redirect to `/settings/integrations?error=<reason>`
 * — never leak Google bodies to the browser.
 *
 * Linked: FT-090, BR-12, BR-20.
 */

import { auth } from '@/lib/auth/auth';
import { logger } from '@/lib/logger';
import {
  CALENDAR_SCOPE,
  exchangeCode,
  fetchUserInfo,
  listCalendars,
} from '@/lib/integrations/calendar/google';
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
        // Clear the state cookie regardless of outcome.
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

  // If the user is still in onboarding, bounce them back to
  // /onboarding/done instead of /settings/integrations — middleware
  // would otherwise reject /settings/* and dump them at step 1.
  const isOnboarding = !(session.user as { onboardingCompletedAt?: string | null })
    .onboardingCompletedAt;
  const redirect = makeRedirect(isOnboarding ? ONBOARDING_PATH : SETTINGS_PATH);

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const urlState = url.searchParams.get('state');
  const grantedScope = url.searchParams.get('scope') ?? '';

  // Provider-side error (user denied consent, invalid_request, etc.).
  const oauthError = url.searchParams.get('error');
  if (oauthError) {
    logger.warn(`[calendar.callback] OAuth provider error: ${oauthError}`);
    return redirect(`error=${encodeURIComponent(oauthError)}`);
  }

  if (!code || !urlState) {
    return redirect('error=missing_params');
  }

  // Pull state from cookie + cross-check.
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
    logger.warn(`[calendar.callback] state verification failed: ${(err as Error).message}`);
    return redirect('error=invalid_state');
  }

  if (stateUserId !== userId) {
    // State was minted for a different user — possible session-swap attack.
    return redirect('error=invalid_state');
  }

  // BR-12: user must have actually granted the calendar scope.
  if (!grantedScope.split(/\s+/).includes(CALENDAR_SCOPE)) {
    return redirect('error=scope_denied');
  }

  let tokens: Awaited<ReturnType<typeof exchangeCode>>;
  try {
    tokens = await exchangeCode(code);
  } catch (err) {
    logger.error('[calendar.callback] exchangeCode failed', err);
    return redirect('error=exchange_failed');
  }

  if (!tokens.refresh_token) {
    // Without a refresh_token we can't keep the connection alive past
    // the first hour. This usually means access_type=offline wasn't
    // honored — log loudly and reject.
    logger.error('[calendar.callback] Google did not return refresh_token');
    return redirect('error=no_refresh_token');
  }

  let userInfo: Awaited<ReturnType<typeof fetchUserInfo>>;
  let calendars: Awaited<ReturnType<typeof listCalendars>>;
  try {
    userInfo = await fetchUserInfo(tokens.access_token);
    calendars = await listCalendars(tokens.access_token);
  } catch (err) {
    logger.error('[calendar.callback] post-exchange API failed', err);
    return redirect('error=google_api_failed');
  }

  // Select primary calendar by default; fall back to first entry.
  const primaryId = calendars.find((c) => c.primary)?.id ?? calendars[0]?.id;
  const calendarIds = primaryId ? [primaryId] : [];

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  const sdb = scopedDb(userId);

  // The scopedDb.insert builder loses Drizzle's chained `.onConflict…`
  // type — we wrap it manually so the chain typechecks. Runtime shape
  // is identical (`.values()` was already called by scopedDb.insert).
  const inserted: { id: string }[] = await (
    sdb.insert('calendarConnections', {
      provider: 'google',
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
      // BR-20: composite UNIQUE — re-linking same account surfaces as
      // a friendly redirect, not a 500.
      target: [
        calendarConnections.userId,
        calendarConnections.provider,
        calendarConnections.externalAccountId,
      ],
    })
    .returning();

  if (inserted.length === 0) {
    // UNIQUE conflict (BR-20) — already connected.
    return redirect('error=already_connected');
  }

  // Fire-and-forget: kick off a first sync immediately so the user
  // doesn't wait up to 15 min for the cron. Publish failure (e.g.
  // Inngest unconfigured) is logged but doesn't block the redirect.
  publish('calendar.sync.requested', {
    userId,
    connectionId: inserted[0].id,
  }).catch((err) =>
    logger.warn(`[calendar.callback] initial sync publish failed: ${(err as Error).message}`)
  );

  return redirect('connected=1');
}

/** Extract the value of `name=` from a `Cookie:` header string. */
function parseCookie(header: string, name: string): string | null {
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
}
