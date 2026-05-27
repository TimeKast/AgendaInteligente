/**
 * Tests for conversation/message server actions — ISSUE-051.
 *
 * Strategy: mock scopedDb + raw db for the `messages` direct path.
 * Verify ownership checks, idempotent threading, message append shape,
 * close idempotency, and pagination cursor semantics.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('@/lib/auth/permissions', () => ({ requirePermission: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { scopedState, dbState } = vi.hoisted(() => ({
  scopedState: {
    selectResults: [] as unknown[],
    selectCalls: [] as Array<{ key: string }>,
    inserted: undefined as unknown,
    insertedReturning: undefined as unknown,
    updated: undefined as { set: unknown } | undefined,
  },
  dbState: {
    selectChainResult: [] as unknown[],
    insertedValues: undefined as unknown,
  },
}));

vi.mock('@/lib/db/scoped', () => ({
  scopedDb: vi.fn(() => ({
    userId: 'u',
    async select(key: string) {
      scopedState.selectCalls.push({ key });
      return (scopedState.selectResults.shift() ?? []) as unknown[];
    },
    insert(_key: string, values: unknown) {
      scopedState.inserted = values;
      return {
        returning: vi.fn(() =>
          Promise.resolve(scopedState.insertedReturning ?? [{ id: 'new-id' }])
        ),
      };
    },
    update(_table: string, set: unknown) {
      return {
        where() {
          scopedState.updated = { set };
          return { execute: vi.fn().mockResolvedValue(undefined) };
        },
      };
    },
  })),
}));

vi.mock('@/lib/db/drizzle', () => {
  const chain = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(async () => dbState.selectChainResult),
    values: vi.fn((v: unknown) => {
      dbState.insertedValues = v;
      return {
        returning: vi.fn(async () => [{ id: 'msg-1' }]),
      };
    }),
  };
  return {
    db: {
      select: vi.fn(() => chain),
      insert: vi.fn(() => chain),
    },
  };
});

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CONV = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const SHEET = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function authed() {
  authMock.mockResolvedValue({ user: { id: USER, email: 'a@example.com', role: 'user' } });
}

function reset() {
  scopedState.selectResults = [];
  scopedState.selectCalls = [];
  scopedState.inserted = undefined;
  scopedState.insertedReturning = undefined;
  scopedState.updated = undefined;
  dbState.selectChainResult = [];
  dbState.insertedValues = undefined;
  vi.clearAllMocks();
  authed();
}

beforeEach(reset);

describe('getOrCreateConversation', () => {
  it('returns existing open conversation when same context already open', async () => {
    scopedState.selectResults = [[{ id: CONV, channel: 'in_app_chat', endedAt: null }]];

    const { getOrCreateConversation } = await import('@/lib/actions/conversation');
    const result = await getOrCreateConversation({
      linkedSheetType: 'day',
      linkedSheetId: SHEET,
    });

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ id: CONV, created: false });
    expect(scopedState.inserted).toBeUndefined();
  });

  it('creates a new row when no open conversation matches the context', async () => {
    scopedState.selectResults = [[]]; // none
    scopedState.insertedReturning = [{ id: 'fresh-id' }];

    const { getOrCreateConversation } = await import('@/lib/actions/conversation');
    const result = await getOrCreateConversation({
      linkedSheetType: 'week',
      linkedSheetId: SHEET,
    });

    expect(result.data).toEqual({ id: 'fresh-id', created: true });
    expect(scopedState.inserted).toMatchObject({
      channel: 'in_app_chat',
      linkedSheetType: 'week',
      linkedSheetId: SHEET,
    });
  });

  it('defaults channel to in_app_chat', async () => {
    scopedState.selectResults = [[]];
    const { getOrCreateConversation } = await import('@/lib/actions/conversation');
    await getOrCreateConversation({});
    expect(scopedState.inserted).toMatchObject({ channel: 'in_app_chat' });
  });

  it('rejects invalid channel enum', async () => {
    const { getOrCreateConversation } = await import('@/lib/actions/conversation');
    const result = await getOrCreateConversation({ channel: 'whatsapp' });
    expect(result.error).toBeDefined();
  });
});

describe('appendMessage', () => {
  it('404 when the conversation does not belong to the caller', async () => {
    scopedState.selectResults = [[]];

    const { appendMessage } = await import('@/lib/actions/conversation');
    const result = await appendMessage({
      conversationId: CONV,
      role: 'user',
      content: 'hola',
    });

    expect(result.error).toBe('Conversación no encontrada');
    expect(dbState.insertedValues).toBeUndefined();
  });

  it('inserts the message via raw db when owner check passes', async () => {
    scopedState.selectResults = [[{ id: CONV, userId: USER }]];

    const { appendMessage } = await import('@/lib/actions/conversation');
    const result = await appendMessage({
      conversationId: CONV,
      role: 'user',
      content: 'hola, ¿cómo va el día?',
      challengesFired: ['vague_language'],
    });

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ id: 'msg-1' });
    expect(dbState.insertedValues).toMatchObject({
      conversationId: CONV,
      role: 'user',
      content: 'hola, ¿cómo va el día?',
      challengesFired: ['vague_language'],
    });
  });

  it('persists tool_calls jsonb when provided (agent turn)', async () => {
    scopedState.selectResults = [[{ id: CONV }]];

    const { appendMessage } = await import('@/lib/actions/conversation');
    const toolCalls = [{ name: 'save_sheet_field', input: { field: 'identityStatement' } }];
    await appendMessage({
      conversationId: CONV,
      role: 'agent',
      content: 'Guardé tu identidad de hoy.',
      toolCalls,
    });

    expect(dbState.insertedValues).toMatchObject({ toolCalls });
  });

  it('rejects empty content', async () => {
    const { appendMessage } = await import('@/lib/actions/conversation');
    const result = await appendMessage({
      conversationId: CONV,
      role: 'user',
      content: '',
    });
    expect(result.error).toBeDefined();
  });

  it('rejects invalid role', async () => {
    const { appendMessage } = await import('@/lib/actions/conversation');
    const result = await appendMessage({
      conversationId: CONV,
      role: 'system',
      content: 'x',
    });
    expect(result.error).toBeDefined();
  });
});

describe('closeConversation', () => {
  it('sets ended_at when conversation was open', async () => {
    scopedState.selectResults = [[{ id: CONV, endedAt: null }]];

    const { closeConversation } = await import('@/lib/actions/conversation');
    const result = await closeConversation({ conversationId: CONV });

    expect(result.error).toBeUndefined();
    expect(scopedState.updated).toBeDefined();
  });

  it('is idempotent on already-closed (no second UPDATE)', async () => {
    scopedState.selectResults = [[{ id: CONV, endedAt: new Date() }]];

    const { closeConversation } = await import('@/lib/actions/conversation');
    const result = await closeConversation({ conversationId: CONV });

    expect(result.error).toBeUndefined();
    expect(scopedState.updated).toBeUndefined();
  });

  it('404 when conversation not found', async () => {
    scopedState.selectResults = [[]];
    const { closeConversation } = await import('@/lib/actions/conversation');
    const result = await closeConversation({ conversationId: CONV });
    expect(result.error).toBe('Conversación no encontrada');
  });
});

describe('listMessages', () => {
  it('returns messages chronological + nextCursor when page is full', async () => {
    // Owner check passes:
    scopedState.selectResults = [[{ id: CONV }]];
    const created = (n: number) => new Date(`2026-05-26T10:${String(n).padStart(2, '0')}:00Z`);
    // DB returns DESC order; action reverses to chronological.
    const limit = 3;
    dbState.selectChainResult = [
      { id: 'm3', createdAt: created(3) },
      { id: 'm2', createdAt: created(2) },
      { id: 'm1', createdAt: created(1) },
    ];

    const { listMessages } = await import('@/lib/actions/conversation');
    const result = await listMessages({ conversationId: CONV, limit });

    expect(result.error).toBeUndefined();
    expect(result.data?.messages.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
    expect(result.data?.nextCursor).toBe(created(1).toISOString());
  });

  it('returns nextCursor=null when page is partial', async () => {
    scopedState.selectResults = [[{ id: CONV }]];
    dbState.selectChainResult = [{ id: 'm1', createdAt: new Date('2026-05-26T10:00:00Z') }];

    const { listMessages } = await import('@/lib/actions/conversation');
    const result = await listMessages({ conversationId: CONV, limit: 50 });

    expect(result.data?.nextCursor).toBeNull();
  });

  it('404 when conversation not owned', async () => {
    scopedState.selectResults = [[]];
    const { listMessages } = await import('@/lib/actions/conversation');
    const result = await listMessages({ conversationId: CONV });
    expect(result.error).toBe('Conversación no encontrada');
  });

  it('rejects invalid limit (>200)', async () => {
    const { listMessages } = await import('@/lib/actions/conversation');
    const result = await listMessages({ conversationId: CONV, limit: 500 });
    expect(result.error).toBeDefined();
  });
});
