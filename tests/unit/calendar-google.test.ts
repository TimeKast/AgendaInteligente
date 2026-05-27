/**
 * Tests for the Google Calendar API client — ISSUE-090b.
 *
 * Global fetch is mocked per-test (vitest >= 4 ships a typed fetch mock).
 * We verify URL, method, headers, body shape AND parse the typed result.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/config/auth-features', () => ({
  getGoogleCredentials: () => ({ clientId: 'cid', clientSecret: 'cs' }),
}));

vi.mock('@/lib/env', () => ({
  getAppUrl: () => 'https://app.example.com',
}));

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('buildAuthUrl + getRedirectUri', () => {
  it('builds a URL containing scope, redirect_uri, access_type=offline, prompt, state', async () => {
    const { buildAuthUrl, CALENDAR_SCOPE } = await import('@/lib/integrations/calendar/google');
    const url = buildAuthUrl('STATE-123');
    expect(url).toContain('accounts.google.com/o/oauth2/v2/auth');
    expect(url).toContain('client_id=cid');
    expect(url).toContain('access_type=offline');
    expect(url).toContain('prompt=select_account+consent');
    expect(url).toContain('state=STATE-123');
    expect(url).toContain(encodeURIComponent(CALENDAR_SCOPE));
    expect(url).toContain(
      encodeURIComponent('https://app.example.com/api/calendar/google/callback')
    );
  });

  it('getRedirectUri matches the URL embedded in buildAuthUrl', async () => {
    const { getRedirectUri } = await import('@/lib/integrations/calendar/google');
    expect(getRedirectUri()).toBe('https://app.example.com/api/calendar/google/callback');
  });
});

describe('exchangeCode', () => {
  it('POSTs to /token with the authorization_code grant + credentials', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ access_token: 'AT', refresh_token: 'RT', expires_in: 3600 })
    );

    const { exchangeCode } = await import('@/lib/integrations/calendar/google');
    const result = await exchangeCode('CODE');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://oauth2.googleapis.com/token');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(init.body).toContain('grant_type=authorization_code');
    expect(init.body).toContain('code=CODE');
    expect(init.body).toContain('client_id=cid');
    expect(result).toEqual({ access_token: 'AT', refresh_token: 'RT', expires_in: 3600 });
  });

  it('throws GoogleApiError on non-200', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'invalid_grant' }, 400));

    const { exchangeCode, GoogleApiError } = await import('@/lib/integrations/calendar/google');
    await expect(exchangeCode('CODE')).rejects.toBeInstanceOf(GoogleApiError);
  });
});

describe('refreshAccessToken', () => {
  it('POSTs grant_type=refresh_token + refresh_token in body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ access_token: 'NEW', expires_in: 3600 }));

    const { refreshAccessToken } = await import('@/lib/integrations/calendar/google');
    const result = await refreshAccessToken('RT');

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toContain('grant_type=refresh_token');
    expect(init.body).toContain('refresh_token=RT');
    expect(result.access_token).toBe('NEW');
  });

  it('throws on refresh failure (e.g. revoked token)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'invalid_grant' }, 400));
    const { refreshAccessToken, GoogleApiError } =
      await import('@/lib/integrations/calendar/google');
    await expect(refreshAccessToken('RT')).rejects.toBeInstanceOf(GoogleApiError);
  });
});

describe('fetchUserInfo', () => {
  it('GETs userinfo with Bearer + parses email', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ email: 'foo@example.com', name: 'Foo' }));

    const { fetchUserInfo } = await import('@/lib/integrations/calendar/google');
    const info = await fetchUserInfo('AT');

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer AT');
    expect(info.email).toBe('foo@example.com');
  });

  it('throws if response is missing email', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ name: 'No email' }));
    const { fetchUserInfo } = await import('@/lib/integrations/calendar/google');
    await expect(fetchUserInfo('AT')).rejects.toThrow(/email/);
  });
});

describe('listCalendars', () => {
  it('GETs calendarList with Bearer + returns items', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        items: [
          { id: 'primary', summary: 'Me', primary: true },
          { id: 'work@calendar', summary: 'Work' },
        ],
      })
    );

    const { listCalendars } = await import('@/lib/integrations/calendar/google');
    const cals = await listCalendars('AT');

    expect(cals).toHaveLength(2);
    expect(cals[0].primary).toBe(true);
  });

  it('throws when response lacks items array', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ kind: 'calendar#calendarList' }));
    const { listCalendars } = await import('@/lib/integrations/calendar/google');
    await expect(listCalendars('AT')).rejects.toThrow(/items/);
  });
});

describe('revokeToken', () => {
  it('returns silently on 200', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 200 }));
    const { revokeToken } = await import('@/lib/integrations/calendar/google');
    await expect(revokeToken('AT')).resolves.toBeUndefined();
  });

  it('treats 400 invalid_token as success (idempotent)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'invalid_token' }, 400));
    const { revokeToken } = await import('@/lib/integrations/calendar/google');
    await expect(revokeToken('AT')).resolves.toBeUndefined();
  });

  it('throws on other 400 errors', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'bad_request' }, 400));
    const { revokeToken, GoogleApiError } = await import('@/lib/integrations/calendar/google');
    await expect(revokeToken('AT')).rejects.toBeInstanceOf(GoogleApiError);
  });

  it('throws on 500-class', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Internal', { status: 500 }));
    const { revokeToken, GoogleApiError } = await import('@/lib/integrations/calendar/google');
    await expect(revokeToken('AT')).rejects.toBeInstanceOf(GoogleApiError);
  });
});
