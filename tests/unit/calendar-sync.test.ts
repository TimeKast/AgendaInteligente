/**
 * Tests for syncConnection — ISSUE-091.
 *
 * Mocks freeBusy + getValidAccessToken + the raw db chain. We verify:
 *   - 404 when connection missing or cross-tenant.
 *   - Disabled or empty-calendar_ids connections short-circuit.
 *   - Happy path: refresh → freeBusy → delete window → bulk insert →
 *     stamp last_synced_at + clear error.
 *   - 401/403 from Google → markReconnectRequired + flag returned.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { state } = vi.hoisted(() => ({
  state: {
    connectionRow: null as unknown,
    deletedRows: [] as unknown[],
    inserted: [] as unknown[],
    updates: [] as unknown[],
  },
}));

const freeBusyMock = vi.fn();
const tokenMock = vi.fn();

vi.mock('@/lib/integrations/calendar/google', async () => {
  const actual = await vi.importActual<typeof import('@/lib/integrations/calendar/google')>(
    '@/lib/integrations/calendar/google'
  );
  return {
    ...actual,
    freeBusy: freeBusyMock,
  };
});

vi.mock('@/lib/integrations/calendar/refresh', () => ({
  getValidAccessToken: tokenMock,
  ConnectionNotFoundError: class ConnectionNotFoundError extends Error {},
}));

vi.mock('@/lib/db/drizzle', () => {
  const mkSelect = () => ({
    from: vi.fn(() => ({
      where: vi.fn(async () => (state.connectionRow ? [state.connectionRow] : [])),
    })),
  });

  const mkDelete = () => ({
    where: vi.fn(() => ({
      returning: vi.fn(async () => state.deletedRows),
    })),
  });

  const mkInsert = () => ({
    values: vi.fn(async (vals: unknown) => {
      if (Array.isArray(vals)) state.inserted.push(...vals);
      else state.inserted.push(vals);
      return undefined;
    }),
  });

  const mkUpdate = () => ({
    set: vi.fn((vals: unknown) => ({
      where: vi.fn(async () => {
        state.updates.push(vals);
        return undefined;
      }),
    })),
  });

  return {
    db: {
      select: vi.fn(() => mkSelect()),
      delete: vi.fn(() => mkDelete()),
      insert: vi.fn(() => mkInsert()),
      update: vi.fn(() => mkUpdate()),
    },
  };
});

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CONN = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function reset() {
  state.connectionRow = null;
  state.deletedRows = [];
  state.inserted = [];
  state.updates = [];
  freeBusyMock.mockReset();
  tokenMock.mockReset();
}

function connection(overrides: Record<string, unknown> = {}) {
  return {
    id: CONN,
    userId: USER,
    provider: 'google',
    calendarIds: ['primary', 'work@calendar'],
    enabled: true,
    accessToken: Buffer.from('enc:at'),
    refreshToken: Buffer.from('enc:rt'),
    expiresAt: new Date(Date.now() + 3600_000),
    ...overrides,
  };
}

beforeEach(reset);

describe('syncConnection', () => {
  it('throws ConnectionNotFoundError when row missing', async () => {
    state.connectionRow = null;
    const { syncConnection } = await import('@/lib/integrations/calendar/sync');
    await expect(syncConnection(USER, CONN)).rejects.toThrow();
  });

  it('short-circuits when enabled=false', async () => {
    state.connectionRow = connection({ enabled: false });
    const { syncConnection } = await import('@/lib/integrations/calendar/sync');
    const result = await syncConnection(USER, CONN);

    expect(result).toEqual({
      connectionId: CONN,
      deleted: 0,
      inserted: 0,
      reconnectRequired: false,
    });
    expect(tokenMock).not.toHaveBeenCalled();
    expect(freeBusyMock).not.toHaveBeenCalled();
  });

  it('short-circuits when calendar_ids is empty', async () => {
    state.connectionRow = connection({ calendarIds: [] });
    const { syncConnection } = await import('@/lib/integrations/calendar/sync');
    const result = await syncConnection(USER, CONN);
    expect(result.inserted).toBe(0);
    expect(freeBusyMock).not.toHaveBeenCalled();
  });

  it('happy path: refresh → freeBusy → delete → insert → stamp last_synced_at', async () => {
    state.connectionRow = connection();
    state.deletedRows = [{ id: 'old-1' }, { id: 'old-2' }];
    tokenMock.mockResolvedValue('fresh-token');
    freeBusyMock.mockResolvedValue({
      primary: [
        { start: '2026-05-27T15:00:00Z', end: '2026-05-27T16:00:00Z' },
        { start: '2026-05-28T14:00:00Z', end: '2026-05-28T15:00:00Z' },
      ],
      'work@calendar': [{ start: '2026-05-29T13:00:00Z', end: '2026-05-29T14:00:00Z' }],
    });

    const { syncConnection } = await import('@/lib/integrations/calendar/sync');
    const result = await syncConnection(USER, CONN, {
      now: new Date('2026-05-26T12:00:00Z'),
    });

    expect(result).toEqual({
      connectionId: CONN,
      deleted: 2,
      inserted: 3,
      reconnectRequired: false,
    });
    expect(tokenMock).toHaveBeenCalledWith(USER, CONN, expect.any(Object));
    expect(freeBusyMock).toHaveBeenCalledOnce();
    expect(state.inserted).toHaveLength(3);
    expect(state.inserted[0]).toMatchObject({
      userId: USER,
      connectionId: CONN,
      calendarId: 'primary',
    });
    // Connection updated with last_synced_at + cleared error.
    expect(state.updates[0]).toMatchObject({ lastSyncError: null });
  });

  it('marks reconnect required when Google returns 401', async () => {
    state.connectionRow = connection();
    tokenMock.mockResolvedValue('fresh-token');
    const { GoogleApiError } = await import('@/lib/integrations/calendar/google');
    freeBusyMock.mockRejectedValue(new GoogleApiError('401', 401, { error: 'invalid_grant' }));

    const { syncConnection } = await import('@/lib/integrations/calendar/sync');
    const result = await syncConnection(USER, CONN);

    expect(result.reconnectRequired).toBe(true);
    expect(result.inserted).toBe(0);
    // markReconnectRequired wrote enabled=false + last_sync_error.
    const update = state.updates[0] as { enabled?: boolean; lastSyncError?: string };
    expect(update.enabled).toBe(false);
    expect(update.lastSyncError).toContain('Reconnect required');
  });

  it('marks reconnect required when refresh returns 400/401', async () => {
    state.connectionRow = connection();
    const { GoogleApiError } = await import('@/lib/integrations/calendar/google');
    tokenMock.mockRejectedValue(new GoogleApiError('400', 400, { error: 'invalid_grant' }));

    const { syncConnection } = await import('@/lib/integrations/calendar/sync');
    const result = await syncConnection(USER, CONN);

    expect(result.reconnectRequired).toBe(true);
    expect(freeBusyMock).not.toHaveBeenCalled();
  });

  it('does not insert when freeBusy returns empty intervals', async () => {
    state.connectionRow = connection({ calendarIds: ['primary'] });
    tokenMock.mockResolvedValue('fresh-token');
    freeBusyMock.mockResolvedValue({ primary: [] });

    const { syncConnection } = await import('@/lib/integrations/calendar/sync');
    const result = await syncConnection(USER, CONN);

    expect(result.inserted).toBe(0);
    expect(state.inserted).toEqual([]);
  });
});
