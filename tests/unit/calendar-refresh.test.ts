/**
 * Tests for getValidAccessToken — ISSUE-090b.
 *
 * Mocks:
 *   - scopedDb: stages the connection row + captures update payloads.
 *   - tokens: stub encrypt/decrypt to round-trip plaintext for assertion clarity.
 *   - google.refreshAccessToken: returns a controlled new access_token.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { state } = vi.hoisted(() => ({
  state: {
    rows: [] as unknown[],
    updateSet: undefined as unknown,
    updateWhere: undefined as unknown,
  },
}));

const refreshMock = vi.fn();
vi.mock('@/lib/integrations/calendar/google', () => ({
  refreshAccessToken: refreshMock,
}));

vi.mock('@/lib/integrations/calendar/tokens', () => ({
  encryptToken: (plain: string) => Buffer.from(`enc:${plain}`),
  decryptToken: (blob: Buffer | Uint8Array) =>
    Buffer.from(blob).toString('utf8').replace(/^enc:/, ''),
}));

vi.mock('@/lib/db/scoped', () => ({
  scopedDb: vi.fn(() => ({
    userId: 'u',
    async select() {
      return state.rows;
    },
    update(_table: string, set: unknown) {
      state.updateSet = set;
      return {
        where(extra: unknown) {
          state.updateWhere = extra;
          return { execute: vi.fn().mockResolvedValue(undefined) };
        },
      };
    },
  })),
}));

const USER = 'u-1';
const CONN = 'c-1';

beforeEach(() => {
  state.rows = [];
  state.updateSet = undefined;
  state.updateWhere = undefined;
  refreshMock.mockReset();
});

function freshConnection(overrides: Record<string, unknown> = {}) {
  return {
    id: CONN,
    userId: USER,
    provider: 'google',
    accessToken: Buffer.from('enc:AT_OLD'),
    refreshToken: Buffer.from('enc:RT'),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min in the future
    ...overrides,
  };
}

describe('getValidAccessToken', () => {
  it('returns the decrypted current token when not near expiry', async () => {
    state.rows = [freshConnection()];

    const { getValidAccessToken } = await import('@/lib/integrations/calendar/refresh');
    const token = await getValidAccessToken(USER, CONN);

    expect(token).toBe('AT_OLD');
    expect(refreshMock).not.toHaveBeenCalled();
    expect(state.updateSet).toBeUndefined();
  });

  it('refreshes when expires_at is in the past', async () => {
    state.rows = [
      freshConnection({ expiresAt: new Date(Date.now() - 60_000) }), // expired 1 min ago
    ];
    refreshMock.mockResolvedValue({ access_token: 'AT_NEW', expires_in: 3600 });

    const { getValidAccessToken } = await import('@/lib/integrations/calendar/refresh');
    const token = await getValidAccessToken(USER, CONN);

    expect(token).toBe('AT_NEW');
    expect(refreshMock).toHaveBeenCalledWith('RT');
    // Write-back staged the new cipher + a future expiresAt.
    const set = state.updateSet as { accessToken: Buffer; expiresAt: Date };
    expect(set.accessToken.toString('utf8')).toBe('enc:AT_NEW');
    expect(set.expiresAt.getTime()).toBeGreaterThan(Date.now() + 3500_000); // ~1h ahead
  });

  it('refreshes within the 60s buffer (token expires in 30s → refresh)', async () => {
    state.rows = [freshConnection({ expiresAt: new Date(Date.now() + 30_000) })];
    refreshMock.mockResolvedValue({ access_token: 'AT_NEW', expires_in: 3600 });

    const { getValidAccessToken } = await import('@/lib/integrations/calendar/refresh');
    const token = await getValidAccessToken(USER, CONN);

    expect(token).toBe('AT_NEW');
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it('does NOT refresh just outside the buffer (token expires in 5 min)', async () => {
    state.rows = [freshConnection({ expiresAt: new Date(Date.now() + 5 * 60_000) })];

    const { getValidAccessToken } = await import('@/lib/integrations/calendar/refresh');
    await getValidAccessToken(USER, CONN);
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('throws ConnectionNotFoundError when row absent (cross-tenant or missing)', async () => {
    state.rows = [];

    const { getValidAccessToken, ConnectionNotFoundError } =
      await import('@/lib/integrations/calendar/refresh');
    await expect(getValidAccessToken(USER, CONN)).rejects.toBeInstanceOf(ConnectionNotFoundError);
  });

  it('propagates refresh errors (e.g. revoked refresh_token)', async () => {
    state.rows = [freshConnection({ expiresAt: new Date(Date.now() - 1000) })];
    refreshMock.mockRejectedValue(new Error('invalid_grant'));

    const { getValidAccessToken } = await import('@/lib/integrations/calendar/refresh');
    await expect(getValidAccessToken(USER, CONN)).rejects.toThrow(/invalid_grant/);
  });
});
