/**
 * Microsoft Graph OAuth + Calendar client — mirrors `./google.ts`.
 *
 * Wraps Microsoft Identity Platform OAuth + Microsoft Graph for the
 * minimum surface needed by the calendar sync:
 *   - buildAuthUrl  → /common/oauth2/v2.0/authorize
 *   - exchangeCode  → POST /token
 *   - refreshAccessToken → POST /token (refresh_token grant)
 *   - fetchUserInfo → GET /me (mail / userPrincipalName)
 *   - listCalendars → GET /me/calendars
 *   - listEvents    → GET /me/calendars/{id}/calendarView
 *     (calendarView auto-expands recurrence instances inside the window)
 *
 * Multi-tenant: we use the `/common` authority so the same app accepts
 * personal Microsoft accounts (outlook.com, hotmail.com) AND any work
 * tenant (Entra ID). No admin consent required for the `Calendars.Read`
 * scope.
 *
 * Errors throw `MicrosoftApiError` (status + body) — callers map to
 * user-facing redirects, same pattern as the Google client.
 */

import { getAppUrl } from '@/lib/env';
import { getMicrosoftCredentials } from '@/lib/env';

const AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

/**
 * Delegated scope for read-only calendar access. Includes `offline_access`
 * so the token endpoint returns a refresh_token; without it the access
 * token expires in ~1h and we lose the connection.
 */
export const MS_CALENDAR_SCOPES = ['Calendars.Read', 'User.Read', 'offline_access'] as const;
export const MS_CALENDAR_SCOPE = 'Calendars.Read';

export class MicrosoftApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(message);
    this.name = 'MicrosoftApiError';
  }
}

export interface MsTokenResponse {
  access_token: string;
  /** Only present when `offline_access` scope was granted. */
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
}

export interface MsUserInfo {
  /** Tenant-issued user id (immutable). */
  id: string;
  /** Primary email or UPN (mail is null for personal accounts → fall back to userPrincipalName). */
  email: string;
  displayName?: string;
}

export interface MsCalendarEntry {
  id: string;
  name: string;
  /** True for the user's primary "Calendar". */
  isDefaultCalendar?: boolean;
}

export interface MsEvent {
  id: string;
  subject?: string;
  bodyPreview?: string;
  body?: { contentType?: 'html' | 'text'; content?: string };
  isCancelled?: boolean;
  isAllDay?: boolean;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
}

function getRedirectUri(): string {
  return `${getAppUrl()}/api/calendar/microsoft/callback`;
}

/**
 * Build the Microsoft consent URL.
 *
 * `prompt=select_account` forces the account picker even for users with a
 * single signed-in MS account, so adding a 2nd account is explicit.
 */
export function buildAuthUrl(state: string): string {
  const { clientId } = getMicrosoftCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    response_mode: 'query',
    scope: MS_CALENDAR_SCOPES.join(' '),
    state,
    prompt: 'select_account',
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<MsTokenResponse> {
  const { clientId, clientSecret } = getMicrosoftCredentials();
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
      // Scope MUST be repeated here per Microsoft's spec.
      scope: MS_CALENDAR_SCOPES.join(' '),
    }).toString(),
  });
  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new MicrosoftApiError(`exchangeCode failed: ${res.status}`, res.status, body);
  }
  return body as unknown as MsTokenResponse;
}

export async function refreshAccessToken(refreshToken: string): Promise<MsTokenResponse> {
  const { clientId, clientSecret } = getMicrosoftCredentials();
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: MS_CALENDAR_SCOPES.join(' '),
    }).toString(),
  });
  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new MicrosoftApiError(`refreshAccessToken failed: ${res.status}`, res.status, body);
  }
  return body as unknown as MsTokenResponse;
}

/**
 * Fetch the connected account's email + display name. `mail` is null for
 * many personal accounts (e.g. fresh outlook.com), in which case Microsoft
 * uses `userPrincipalName` (an outlook-style address) as the durable id.
 */
export async function fetchUserInfo(accessToken: string): Promise<MsUserInfo> {
  const res = await fetch(`${GRAPH_BASE}/me?$select=id,mail,userPrincipalName,displayName`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new MicrosoftApiError(`fetchUserInfo failed: ${res.status}`, res.status, body);
  }
  const id = typeof body.id === 'string' ? body.id : null;
  const mail = typeof body.mail === 'string' ? body.mail : null;
  const upn = typeof body.userPrincipalName === 'string' ? body.userPrincipalName : null;
  const email = mail ?? upn;
  if (!id || !email) {
    throw new MicrosoftApiError('me response missing id or email', res.status, body);
  }
  return {
    id,
    email,
    displayName: typeof body.displayName === 'string' ? body.displayName : undefined,
  };
}

export async function listCalendars(accessToken: string): Promise<MsCalendarEntry[]> {
  const res = await fetch(`${GRAPH_BASE}/me/calendars?$select=id,name,isDefaultCalendar`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new MicrosoftApiError(`listCalendars failed: ${res.status}`, res.status, body);
  }
  const value = body.value;
  if (!Array.isArray(value)) {
    throw new MicrosoftApiError('calendars response missing value array', res.status, body);
  }
  return value as MsCalendarEntry[];
}

/**
 * List instances inside `[timeMin, timeMax)`. We use `calendarView` instead
 * of `events` so recurring series get expanded into their concrete
 * instances by Graph (matches Google's `singleEvents=true`). Pages via
 * `@odata.nextLink` up to a safety cap.
 */
export async function listEvents(
  accessToken: string,
  calendarId: string,
  options: { timeMin: Date; timeMax: Date }
): Promise<MsEvent[]> {
  const params = new URLSearchParams({
    startDateTime: options.timeMin.toISOString(),
    endDateTime: options.timeMax.toISOString(),
    $select: 'id,subject,bodyPreview,body,isCancelled,isAllDay,start,end',
    $orderby: 'start/dateTime',
    $top: '250',
  });
  let nextUrl: string | null = `${GRAPH_BASE}/me/calendars/${encodeURIComponent(
    calendarId
  )}/calendarView?${params.toString()}`;

  const out: MsEvent[] = [];
  let safety = 10; // max 10 pages of 250 = 2500 events
  while (nextUrl && safety-- > 0) {
    const res = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // Tells Graph what timezone the returned dateTimes are in. We
        // ask for UTC so the sync's `new Date(dateTime)` parses cleanly.
        Prefer: 'outlook.timezone="UTC"',
      },
    });
    const body = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      throw new MicrosoftApiError(`listEvents failed: ${res.status}`, res.status, body);
    }
    const items = (body.value as MsEvent[] | undefined) ?? [];
    for (const evt of items) {
      if (evt.isCancelled) continue;
      if (evt.isAllDay) continue; // mirrors Google client
      if (!evt.start?.dateTime || !evt.end?.dateTime) continue;
      out.push(evt);
    }
    nextUrl =
      typeof body['@odata.nextLink'] === 'string' ? (body['@odata.nextLink'] as string) : null;
  }
  return out;
}
