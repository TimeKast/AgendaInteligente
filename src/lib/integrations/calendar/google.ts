/**
 * Google Calendar OAuth client — ISSUE-090b.
 *
 * Thin wrappers around 6 Google endpoints using native `fetch`:
 *   - buildAuthUrl   → builds /o/oauth2/v2/auth redirect URL
 *   - exchangeCode   → POST /token (authorization_code grant)
 *   - fetchUserInfo  → GET  /userinfo (email)
 *   - listCalendars  → GET  /calendar/v3/users/me/calendarList
 *   - refreshAccessToken → POST /token (refresh_token grant)
 *   - revokeToken    → POST /revoke
 *
 * Why no `googleapis` SDK: 5MB+ of class hierarchies for 6 endpoints
 * we already understand. Native fetch keeps the bundle small, tests
 * trivial (mock global fetch), and the surface honest (no hidden
 * retries or transformations).
 *
 * Errors throw `GoogleApiError` with `status` + `body`. Callers map
 * those to user-facing redirects (`?error=already_connected`,
 * `?error=scope_denied`, etc.).
 *
 * Linked: FT-090, BR-12, R-T-002.
 */

import { getGoogleCredentials } from '@/config/auth-features';
import { getAppUrl } from '@/lib/env';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const CALENDAR_LIST_URL = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
const FREEBUSY_URL = 'https://www.googleapis.com/calendar/v3/freeBusy';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

/** Scope required for read-only calendar access. */
export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

export class GoogleApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(message);
    this.name = 'GoogleApiError';
  }
}

export interface TokenResponse {
  access_token: string;
  /** Only present on the initial code exchange — `refresh` calls don't return it. */
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
}

export interface GoogleUserInfo {
  email: string;
  name?: string;
  picture?: string;
}

export interface GoogleCalendarEntry {
  id: string;
  summary: string;
  primary?: boolean;
}

export function getRedirectUri(): string {
  return `${getAppUrl()}/api/calendar/google/callback`;
}

/**
 * Build the Google OAuth consent URL with calendar.readonly scope.
 *
 * `prompt=select_account` forces the account picker — essential for
 * multi-account UX (user adding a 2nd Google account doesn't get
 * silently logged into their primary one).
 *
 * `access_type=offline` requests a refresh_token (we need to refresh
 * the access_token offline as it expires every hour).
 */
export function buildAuthUrl(state: string): string {
  const { clientId } = getGoogleCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: `${CALENDAR_SCOPE} openid email`,
    access_type: 'offline',
    prompt: 'select_account consent',
    include_granted_scopes: 'true',
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange an authorization code for tokens. Throws GoogleApiError on
 * non-200 (Google returns details in the body — we surface them).
 */
export async function exchangeCode(code: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = getGoogleCredentials();
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }).toString(),
  });
  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new GoogleApiError(`exchangeCode failed: ${res.status}`, res.status, body);
  }
  return body as unknown as TokenResponse;
}

/**
 * Refresh an access_token. Google returns the SAME refresh_token (so we
 * don't rotate it in the DB) plus a fresh access_token + expires_in.
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = getGoogleCredentials();
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });
  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new GoogleApiError(`refreshAccessToken failed: ${res.status}`, res.status, body);
  }
  return body as unknown as TokenResponse;
}

export async function fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new GoogleApiError(`fetchUserInfo failed: ${res.status}`, res.status, body);
  }
  if (typeof body.email !== 'string') {
    throw new GoogleApiError('userinfo response missing email', res.status, body);
  }
  return body as unknown as GoogleUserInfo;
}

export async function listCalendars(accessToken: string): Promise<GoogleCalendarEntry[]> {
  const res = await fetch(CALENDAR_LIST_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new GoogleApiError(`listCalendars failed: ${res.status}`, res.status, body);
  }
  const items = body.items;
  if (!Array.isArray(items)) {
    throw new GoogleApiError('calendarList response missing items', res.status, body);
  }
  return items as GoogleCalendarEntry[];
}

export interface FreeBusyInterval {
  start: string; // RFC3339 timestamp
  end: string;
}

/**
 * Query the freebusy API for one or more calendars. Returns the busy
 * intervals per calendar in the requested time window.
 *
 * Caller pre-decrypts the access token. We don't fetch event titles
 * here — freebusy is much cheaper than events.list and the title is
 * fetched separately via `listEvents` only when needed for display.
 */
export async function freeBusy(
  accessToken: string,
  options: { calendarIds: string[]; timeMin: Date; timeMax: Date }
): Promise<Record<string, FreeBusyInterval[]>> {
  const res = await fetch(FREEBUSY_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin: options.timeMin.toISOString(),
      timeMax: options.timeMax.toISOString(),
      items: options.calendarIds.map((id) => ({ id })),
    }),
  });
  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new GoogleApiError(`freeBusy failed: ${res.status}`, res.status, body);
  }
  const calendars = body.calendars as Record<string, { busy?: FreeBusyInterval[] }> | undefined;
  if (!calendars) {
    throw new GoogleApiError('freeBusy response missing calendars', res.status, body);
  }
  const result: Record<string, FreeBusyInterval[]> = {};
  for (const [id, entry] of Object.entries(calendars)) {
    result[id] = entry.busy ?? [];
  }
  return result;
}

/**
 * Revoke a token (any token — access or refresh — both revoke the whole
 * grant per Google's docs). Treat 200 + 400 with error="invalid_token"
 * as success ("already revoked").
 */
export async function revokeToken(token: string): Promise<void> {
  const res = await fetch(REVOKE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }).toString(),
  });
  if (res.ok) return;
  // Idempotent: a 400 with invalid_token means the token was already
  // revoked or never existed — both states are "done from our side".
  if (res.status === 400) {
    const body = await res.json().catch(() => ({}));
    const errBody = body as Record<string, unknown>;
    if (errBody.error === 'invalid_token') return;
    throw new GoogleApiError('revokeToken rejected', res.status, body);
  }
  throw new GoogleApiError(`revokeToken failed: ${res.status}`, res.status, await res.text());
}
