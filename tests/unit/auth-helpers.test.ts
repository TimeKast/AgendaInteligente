/**
 * Tests for AgendaInteligente auth helpers (ISSUE-003).
 *
 * - getCurrentUser() returns the session.user or null
 * - requireAuth() returns the user when authed, calls next/navigation `redirect`
 *   to /login when not (with optional callbackUrl).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
const redirectMock = vi.fn((url: string) => {
  // next/navigation.redirect throws to abort the calling component — emulate that
  const err = new Error(`NEXT_REDIRECT: ${url}`);
  // @ts-expect-error — runtime-only marker
  err.digest = `NEXT_REDIRECT;replace;${url};307;`;
  throw err;
});

vi.mock('@/lib/auth/auth', () => ({
  auth: authMock,
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the user when a session exists', async () => {
    authMock.mockResolvedValueOnce({
      user: { id: 'u1', email: 'a@example.com', role: 'user' },
    });
    const { getCurrentUser } = await import('@/lib/auth/helpers');
    const user = await getCurrentUser();
    expect(user).toEqual({ id: 'u1', email: 'a@example.com', role: 'user' });
  });

  it('returns null when no session', async () => {
    authMock.mockResolvedValueOnce(null);
    const { getCurrentUser } = await import('@/lib/auth/helpers');
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it('returns null when session exists but user is missing', async () => {
    authMock.mockResolvedValueOnce({ user: undefined });
    const { getCurrentUser } = await import('@/lib/auth/helpers');
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });
});

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the user when authenticated', async () => {
    authMock.mockResolvedValueOnce({
      user: { id: 'u1', email: 'a@example.com', role: 'user' },
    });
    const { requireAuth } = await import('@/lib/auth/helpers');
    const user = await requireAuth();
    expect(user).toMatchObject({ id: 'u1' });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('redirects to /login when no session (no callbackUrl)', async () => {
    authMock.mockResolvedValueOnce(null);
    const { requireAuth } = await import('@/lib/auth/helpers');
    await expect(requireAuth()).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });

  it('redirects to /login?callbackUrl=... when path is provided', async () => {
    authMock.mockResolvedValueOnce(null);
    const { requireAuth } = await import('@/lib/auth/helpers');
    await expect(requireAuth('/today')).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectMock).toHaveBeenCalledWith('/login?callbackUrl=%2Ftoday');
  });

  it('encodes complex callbackUrl correctly', async () => {
    authMock.mockResolvedValueOnce(null);
    const { requireAuth } = await import('@/lib/auth/helpers');
    await expect(requireAuth('/activity/abc?foo=bar')).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectMock).toHaveBeenCalledWith('/login?callbackUrl=%2Factivity%2Fabc%3Ffoo%3Dbar');
  });
});
