/**
 * Tests for POST /api/ai/parse-task — ISSUE-073.
 *
 * Verifies: auth, rate-limit, JSON validation, user-context loading,
 * Anthropic Haiku call with the create_activity_preview tool, and
 * defensive 502 when no tool_use block is emitted.
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
vi.mock('@/lib/auth/auth', () => ({ auth: authMock }));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const rateLimitMock = vi.fn();
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: rateLimitMock,
  rateLimitExceededResponse: () =>
    new Response(JSON.stringify({ error: 'Too Many Requests' }), { status: 429 }),
}));

const userRowsMock = vi.fn(() => [{ timezone: 'America/Mexico_City', preferredLanguage: 'es' }]);
const projectRowsMock = vi.fn(() => [
  { id: 'p-1', name: 'Personal', categoryName: 'Vida' },
  { id: 'p-2', name: 'Empresa Genomma', categoryName: 'Trabajo' },
]);

const { fromState } = vi.hoisted(() => ({ fromState: { i: 0 } }));

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => {
        const turn = fromState.i++;
        // First call in a test → users; subsequent → projects.
        return {
          where: vi.fn(async () => (turn === 0 ? userRowsMock() : projectRowsMock())),
          leftJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(async () => projectRowsMock()),
            })),
          })),
        };
      }),
    })),
  },
}));

const messagesCreateMock = vi.fn();
vi.mock('@/lib/ai/client', () => ({
  getAnthropicClient: () => ({
    messages: { create: messagesCreateMock },
  }),
}));

const recordTokensMock = vi.fn();
vi.mock('@/lib/ai/telemetry', () => ({
  recordTokens: recordTokensMock,
}));

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function makeReq(body: unknown): Request {
  return new Request('http://test.local/api/ai/parse-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  fromState.i = 0;
  authMock.mockResolvedValue({ user: { id: USER, email: 'a@example.com', role: 'user' } });
  rateLimitMock.mockResolvedValue({ success: true, limit: 200, remaining: 199, reset: 0 });
  recordTokensMock.mockResolvedValue(undefined);
  userRowsMock.mockReturnValue([{ timezone: 'America/Mexico_City', preferredLanguage: 'es' }]);
  projectRowsMock.mockReturnValue([{ id: 'p-1', name: 'Personal', categoryName: 'Vida' }]);
  messagesCreateMock.mockResolvedValue({
    content: [
      {
        type: 'tool_use',
        id: 'tu-1',
        name: 'create_activity_preview',
        input: {
          title: 'Llamar a Juan',
          project_id_suggestion: 'p-1',
          project_name_match: 'Personal',
          project_match_confidence: 0.92,
          scheduled_date: '2026-05-28',
          scheduled_time: '10:00',
          priority: 4,
        },
      },
    ],
    usage: {
      input_tokens: 400,
      output_tokens: 80,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    },
  });
});

describe('POST /api/ai/parse-task — gates', () => {
  it('returns 401 when no session', async () => {
    authMock.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/ai/parse-task/route');
    const res = await POST(makeReq({ text: 'hola' }));
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate-limited', async () => {
    rateLimitMock.mockResolvedValueOnce({ success: false, limit: 200, remaining: 0, reset: 0 });
    const { POST } = await import('@/app/api/ai/parse-task/route');
    const res = await POST(makeReq({ text: 'hola' }));
    expect(res.status).toBe(429);
    expect(messagesCreateMock).not.toHaveBeenCalled();
  });

  it('returns 400 on invalid JSON', async () => {
    const { POST } = await import('@/app/api/ai/parse-task/route');
    const res = await POST(
      new Request('http://test.local/api/ai/parse-task', { method: 'POST', body: '{nope' })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when text missing or empty', async () => {
    const { POST } = await import('@/app/api/ai/parse-task/route');
    const res1 = await POST(makeReq({}));
    expect(res1.status).toBe(400);
    const res2 = await POST(makeReq({ text: '' }));
    expect(res2.status).toBe(400);
  });

  it('returns 404 when user row missing', async () => {
    userRowsMock.mockReturnValueOnce([]);
    const { POST } = await import('@/app/api/ai/parse-task/route');
    const res = await POST(makeReq({ text: 'hola' }));
    expect(res.status).toBe(404);
  });
});

describe('POST /api/ai/parse-task — happy path', () => {
  it('returns the extracted preview JSON', async () => {
    const { POST } = await import('@/app/api/ai/parse-task/route');
    const res = await POST(
      makeReq({ text: 'llamar a juan mañana a las 10 personal alta prioridad' })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      preview: { title: string; project_name_match: string; priority: number };
      model: string;
      costUsd: number;
    };
    expect(body.preview.title).toBe('Llamar a Juan');
    expect(body.preview.project_name_match).toBe('Personal');
    expect(body.preview.priority).toBe(4);
    expect(body.model).toContain('haiku');
    expect(body.costUsd).toBeGreaterThan(0);
  });

  it('records token usage telemetry', async () => {
    const { POST } = await import('@/app/api/ai/parse-task/route');
    await POST(makeReq({ text: 'agendar reunión' }));
    expect(recordTokensMock).toHaveBeenCalledOnce();
    expect(recordTokensMock).toHaveBeenCalledWith(
      USER,
      expect.objectContaining({ input: 400, output: 80 })
    );
  });

  it('forces the model into the create_activity_preview tool (tool_choice)', async () => {
    const { POST } = await import('@/app/api/ai/parse-task/route');
    await POST(makeReq({ text: 'hola' }));
    const callArgs = messagesCreateMock.mock.calls[0][0];
    expect(callArgs.tool_choice).toMatchObject({
      type: 'tool',
      name: 'create_activity_preview',
    });
    expect(callArgs.tools).toHaveLength(1);
    expect(callArgs.tools[0].name).toBe('create_activity_preview');
  });

  it('embeds the user TZ in the system prompt for relative-date resolution', async () => {
    const { POST } = await import('@/app/api/ai/parse-task/route');
    await POST(makeReq({ text: 'mañana' }));
    const sysPrompt = messagesCreateMock.mock.calls[0][0].system as string;
    expect(sysPrompt).toContain('America/Mexico_City');
    expect(sysPrompt).toContain('mañana'); // ES voice-parser prompt
  });

  it('emits the English prompt when preferred_language=en', async () => {
    userRowsMock.mockReturnValueOnce([{ timezone: 'America/New_York', preferredLanguage: 'en' }]);
    const { POST } = await import('@/app/api/ai/parse-task/route');
    await POST(makeReq({ text: 'call John tomorrow' }));
    const sysPrompt = messagesCreateMock.mock.calls[0][0].system as string;
    expect(sysPrompt).toContain('VOICE PARSER');
    expect(sysPrompt).toContain('TODAY');
    expect(sysPrompt).not.toContain('Convertí UNA frase');
  });
});

describe('POST /api/ai/parse-task — defensive paths', () => {
  it('returns 502 when Anthropic call throws', async () => {
    messagesCreateMock.mockRejectedValueOnce(new Error('upstream 500'));
    const { POST } = await import('@/app/api/ai/parse-task/route');
    const res = await POST(makeReq({ text: 'hola' }));
    expect(res.status).toBe(502);
  });

  it('returns 502 when response lacks tool_use block', async () => {
    messagesCreateMock.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'I refuse' }],
      usage: { input_tokens: 10, output_tokens: 5 },
    });
    const { POST } = await import('@/app/api/ai/parse-task/route');
    const res = await POST(makeReq({ text: 'hola' }));
    expect(res.status).toBe(502);
  });
});
