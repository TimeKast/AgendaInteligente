/**
 * Tests for the POST /api/ai/chat SSE route — ISSUE-052.
 *
 * Strategy: stub the heavy deps (Anthropic client, scopedDb, action
 * functions) and exercise the auth + validation + crisis-pre-filter
 * paths end-to-end. The streaming-token path is verified via a mocked
 * Anthropic stream emitter that fires `text` + `contentBlock` events.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────────────

const authMock = vi.fn();
vi.mock('@/lib/auth/auth', () => ({ auth: authMock }));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const userRowsMock = vi.fn(() => [
  {
    intensityMode: 'standard',
    preferredLanguage: 'es',
    onboardingContext: null,
    timezone: 'America/Mexico_City',
  },
]);

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(async () => userRowsMock()),
      })),
    })),
  },
}));

const sdbUpdateMock = vi.fn();
vi.mock('@/lib/db/scoped', () => ({
  scopedDb: vi.fn(() => ({
    userId: 'u',
    update(_table: string, set: unknown) {
      sdbUpdateMock(set);
      return { where: () => ({ execute: vi.fn().mockResolvedValue(undefined) }) };
    },
  })),
}));

const getOrCreateMock = vi.fn();
const appendMessageMock = vi.fn();
const listMessagesMock = vi.fn();
vi.mock('@/lib/actions/conversation', () => ({
  getOrCreateConversation: getOrCreateMock,
  appendMessage: appendMessageMock,
  listMessages: listMessagesMock,
}));

const dispatchAllMock = vi.fn();
vi.mock('@/lib/ai/tools/dispatch', () => ({
  dispatchAll: dispatchAllMock,
}));

const recordTokensMock = vi.fn();
vi.mock('@/lib/ai/telemetry', () => ({
  recordTokens: recordTokensMock,
}));

// Fake EventEmitter-like stream. We invoke `text` handlers
// synchronously inside `finalMessage()` to keep tests deterministic.
// The route reads tool_use blocks from `finalMessage.content` (no
// `contentBlock` listener anymore — Slice A2).
interface FakeStreamConfig {
  textDeltas?: string[];
  toolUses?: Array<{ id: string; name: string; input: unknown }>;
  finalUsage?: { input_tokens: number; output_tokens: number };
  throwError?: Error;
}

function makeFakeStream(cfg: FakeStreamConfig) {
  type Cb = (...args: unknown[]) => void;
  const handlers: Record<string, Cb[]> = {};
  return {
    on(event: string, cb: Cb) {
      (handlers[event] ??= []).push(cb);
      return this;
    },
    async finalMessage() {
      if (cfg.throwError) throw cfg.throwError;
      const text = cfg.textDeltas ?? [];
      for (const t of text) {
        handlers.text?.forEach((h) => h(t, text.slice(0, text.indexOf(t) + 1).join('')));
      }
      const tools = cfg.toolUses ?? [];
      const content: Array<Record<string, unknown>> = [];
      if (text.length > 0) content.push({ type: 'text', text: text.join('') });
      for (const u of tools) content.push({ type: 'tool_use', ...u });
      return {
        content,
        stop_reason: tools.length > 0 ? 'tool_use' : 'end_turn',
        usage: {
          input_tokens: cfg.finalUsage?.input_tokens ?? 100,
          output_tokens: cfg.finalUsage?.output_tokens ?? 50,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
      };
    },
  };
}

const streamFnMock = vi.fn();
vi.mock('@/lib/ai/client', () => ({
  getAnthropicClient: () => ({
    messages: { stream: streamFnMock },
  }),
}));

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CONV = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: USER, email: 'a@example.com', role: 'user' } });
  getOrCreateMock.mockResolvedValue({ data: { id: CONV, created: true } });
  appendMessageMock.mockResolvedValue({ data: { id: 'msg-1' } });
  listMessagesMock.mockResolvedValue({ data: { messages: [], nextCursor: null } });
  dispatchAllMock.mockResolvedValue([]);
  recordTokensMock.mockResolvedValue(undefined);
  streamFnMock.mockReturnValue(makeFakeStream({ textDeltas: ['hola', ' qué tal'] }));
  userRowsMock.mockReturnValue([
    {
      intensityMode: 'standard',
      preferredLanguage: 'es',
      onboardingContext: null,
      timezone: 'America/Mexico_City',
    },
  ]);
});

// Helper to drain an SSE stream into a list of {event, data} pairs.
async function drainSse(res: Response): Promise<Array<{ event: string; data: unknown }>> {
  if (!res.body) return [];
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  const events: Array<{ event: string; data: unknown }> = [];

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value);
    let idx: number;
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const block = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const lines = block.split('\n');
      const evLine = lines.find((l) => l.startsWith('event: '))?.slice(7) ?? '';
      const dataLine = lines.find((l) => l.startsWith('data: '))?.slice(6) ?? '{}';
      events.push({ event: evLine, data: JSON.parse(dataLine) });
    }
  }
  return events;
}

function makeReq(body: unknown): Request {
  return new Request('http://test.local/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('POST /api/ai/chat — auth + validation', () => {
  it('returns 401 when no session', async () => {
    authMock.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeReq({ message: 'hola' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid JSON body', async () => {
    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(
      new Request('http://test.local/api/ai/chat', {
        method: 'POST',
        body: '{not-json',
      })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when message field is missing', async () => {
    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeReq({ linkedSheetType: 'day' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when message is empty string', async () => {
    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeReq({ message: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when user row missing', async () => {
    userRowsMock.mockReturnValueOnce([]);
    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeReq({ message: 'hola' }));
    expect(res.status).toBe(404);
  });
});

describe('POST /api/ai/chat — crisis pre-filter (AI-8 BLOCKING)', () => {
  it('emits crisis_exit + closes without calling the LLM', async () => {
    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeReq({ message: 'ya no quiero seguir viviendo' }));

    expect(res.status).toBe(200);
    const events = await drainSse(res);
    const eventNames = events.map((e) => e.event);

    expect(eventNames).toContain('crisis_exit');
    expect(eventNames).toContain('done');
    // The Anthropic stream was NOT invoked.
    expect(streamFnMock).not.toHaveBeenCalled();
    // Appended NO user message either (we don't persist the crisis text).
    expect(appendMessageMock).not.toHaveBeenCalled();
    // crisis_exit_at WAS stamped.
    expect(sdbUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ crisisExitAt: expect.any(Date) })
    );
  });

  it('crisis_exit payload includes the user country crisis line', async () => {
    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeReq({ message: 'I want to kill myself' }));
    const events = await drainSse(res);
    const crisis = events.find((e) => e.event === 'crisis_exit');
    expect(crisis).toBeDefined();
    const data = crisis!.data as { line: { name: string } };
    // MX timezone → SAPTEL.
    expect(data.line.name).toBe('SAPTEL');
  });
});

describe('POST /api/ai/chat — happy path streaming', () => {
  it('streams tokens then emits done with the agent message id', async () => {
    appendMessageMock
      .mockResolvedValueOnce({ data: { id: 'user-msg-1' } }) // user turn
      .mockResolvedValueOnce({ data: { id: 'agent-msg-1' } }); // agent turn

    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeReq({ message: '¿qué hago hoy?' }));
    const events = await drainSse(res);

    const userMsgEvent = events.find((e) => e.event === 'user_message');
    expect(userMsgEvent?.data).toMatchObject({ id: 'user-msg-1' });

    const tokens = events
      .filter((e) => e.event === 'token')
      .map((e) => (e.data as { text: string }).text);
    expect(tokens).toEqual(['hola', ' qué tal']);

    const done = events.find((e) => e.event === 'done');
    expect(done?.data).toMatchObject({
      conversationId: CONV,
      agentMessageId: 'agent-msg-1',
    });
  });

  it('records token usage telemetry after the stream completes', async () => {
    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeReq({ message: 'hola' }));
    await drainSse(res);
    expect(recordTokensMock).toHaveBeenCalledOnce();
    expect(recordTokensMock).toHaveBeenCalledWith(
      USER,
      expect.objectContaining({ input: 100, output: 50 })
    );
  });

  it('persists agent message with challenges_fired when user uses vague language', async () => {
    appendMessageMock
      .mockResolvedValueOnce({ data: { id: 'user-msg-1' } })
      .mockResolvedValueOnce({ data: { id: 'agent-msg-1' } });

    const { POST } = await import('@/app/api/ai/chat/route');
    await drainSse(await POST(makeReq({ message: 'tal vez mejor mañana' })));

    // Second appendMessage call = agent turn.
    const agentArgs = appendMessageMock.mock.calls[1][0];
    expect(agentArgs.challengesFired).toEqual(['vague_language']);
  });

  it('does NOT record vague-language challenge when intensity = listening', async () => {
    userRowsMock.mockReturnValueOnce([
      {
        intensityMode: 'listening',
        preferredLanguage: 'es',
        onboardingContext: null,
        timezone: 'America/Mexico_City',
      },
    ]);
    appendMessageMock
      .mockResolvedValueOnce({ data: { id: 'u' } })
      .mockResolvedValueOnce({ data: { id: 'a' } });

    const { POST } = await import('@/app/api/ai/chat/route');
    await drainSse(await POST(makeReq({ message: 'tal vez mejor mañana' })));

    const agentArgs = appendMessageMock.mock.calls[1][0];
    expect(agentArgs.challengesFired).toEqual([]);
  });
});

describe('POST /api/ai/chat — tool dispatch', () => {
  it('dispatches tool_use blocks emitted by the LLM + forwards tool_results', async () => {
    streamFnMock.mockReturnValueOnce(
      makeFakeStream({
        textDeltas: ['anotado'],
        toolUses: [
          {
            id: 'tu-1',
            name: 'save_sheet_field',
            input: {
              sheet_type: 'day',
              date: '2026-05-26',
              field: 'identityStatement',
              value: 'Hoy soy alguien que cierra ciclos',
            },
          },
        ],
      })
    );
    dispatchAllMock.mockResolvedValueOnce([
      {
        type: 'tool_result',
        tool_use_id: 'tu-1',
        content: '{"id":"sheet-1"}',
      },
    ]);

    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeReq({ message: 'guarda mi identidad' }));
    const events = await drainSse(res);

    expect(dispatchAllMock).toHaveBeenCalledOnce();
    expect(dispatchAllMock).toHaveBeenCalledWith(
      [expect.objectContaining({ type: 'tool_use', name: 'save_sheet_field' })],
      USER
    );

    const toolResults = events.filter((e) => e.event === 'tool_result');
    expect(toolResults).toHaveLength(1);
  });
});

describe('POST /api/ai/chat — multi-turn tool loop (Slice A2)', () => {
  it('chains a follow-up turn after a tool_use, streaming both rounds', async () => {
    // Round 1: model calls a tool. Round 2: model writes the final reply.
    streamFnMock
      .mockReturnValueOnce(
        makeFakeStream({
          textDeltas: ['un sec'],
          toolUses: [
            {
              id: 'tu-1',
              name: 'save_sheet_field',
              input: {
                sheet_type: 'day',
                date: '2026-05-26',
                field: 'identityStatement',
                value: 'foo',
              },
            },
          ],
        })
      )
      .mockReturnValueOnce(makeFakeStream({ textDeltas: ['listo'] }));

    dispatchAllMock.mockResolvedValueOnce([
      { type: 'tool_result', tool_use_id: 'tu-1', content: '{"ok":true}' },
    ]);

    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeReq({ message: 'guarda mi identidad' }));
    const events = await drainSse(res);

    // Two stream invocations (round 1 + round 2).
    expect(streamFnMock).toHaveBeenCalledTimes(2);

    // Tokens from BOTH rounds, in order.
    const tokens = events
      .filter((e) => e.event === 'token')
      .map((e) => (e.data as { text: string }).text);
    expect(tokens).toEqual(['un sec', 'listo']);

    // Round 2's messages include the assistant content + tool_result.
    const round2Args = streamFnMock.mock.calls[1][0];
    const round2Messages = round2Args.messages as Array<{ role: string; content: unknown }>;
    // Last two should be assistant content + user tool_result.
    expect(round2Messages.at(-2)?.role).toBe('assistant');
    expect(round2Messages.at(-1)?.role).toBe('user');
    expect(round2Messages.at(-1)?.content).toEqual([
      expect.objectContaining({ type: 'tool_result', tool_use_id: 'tu-1' }),
    ]);

    const done = events.find((e) => e.event === 'done');
    expect(done?.data).toMatchObject({ hitRoundLimit: false });
  });

  it('emits tool_round_limit when MAX_TOOL_ROUNDS is hit', async () => {
    // Every round emits a tool_use → loop hits the cap.
    const cfg = {
      textDeltas: ['x'],
      toolUses: [
        {
          id: 'tu',
          name: 'save_sheet_field',
          input: {
            sheet_type: 'day',
            date: '2026-05-26',
            field: 'identityStatement',
            value: 'v',
          },
        },
      ],
    } as const;
    streamFnMock.mockReturnValue(makeFakeStream(cfg));
    dispatchAllMock.mockResolvedValue([{ type: 'tool_result', tool_use_id: 'tu', content: '{}' }]);

    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeReq({ message: 'pruebalo' }));
    const events = await drainSse(res);

    expect(events.some((e) => e.event === 'tool_round_limit')).toBe(true);
    const done = events.find((e) => e.event === 'done');
    expect(done?.data).toMatchObject({ hitRoundLimit: true });
  });
});

describe('POST /api/ai/chat — stream error handling', () => {
  it('emits error SSE event when Anthropic stream throws mid-flight', async () => {
    streamFnMock.mockReturnValueOnce(makeFakeStream({ throwError: new Error('upstream 500') }));

    const { POST } = await import('@/app/api/ai/chat/route');
    const res = await POST(makeReq({ message: 'hola' }));
    const events = await drainSse(res);

    const errEvent = events.find((e) => e.event === 'error');
    expect(errEvent).toBeDefined();
    expect(errEvent?.data).toMatchObject({ error: 'stream_failed' });
  });
});
