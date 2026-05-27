/**
 * Tests for `useChatStream` — ISSUE-052b.
 *
 * Strategy: stub `fetch` with a `ReadableStream` of SSE frames the hook
 * can parse. Each test drives the hook via `act` + `renderHook` and
 * asserts the reducer state visible to consumers (messages, errors,
 * crisis exit).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useChatStream } from '@/lib/hooks/useChatStream';

// ─── SSE stream helper ──────────────────────────────────────────────────

function frame(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sseResponse(frames: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      for (const f of frames) controller.enqueue(enc.encode(f));
      controller.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

// ─── Tests ──────────────────────────────────────────────────────────────

describe('useChatStream — happy path', () => {
  it('optimistically inserts the user message + streams the agent reply', async () => {
    fetchMock.mockResolvedValueOnce(
      sseResponse([
        frame('user_message', { id: 'user-1' }),
        frame('token', { text: 'hola' }),
        frame('token', { text: ' qué tal' }),
        frame('done', { conversationId: 'c1', agentMessageId: 'agent-1' }),
      ])
    );

    const { result } = renderHook(() => useChatStream());

    await act(async () => {
      await result.current.send({ message: '¿qué hago hoy?' });
    });

    expect(result.current.messages).toHaveLength(2);

    const [userMsg, agentMsg] = result.current.messages;
    expect(userMsg.role).toBe('user');
    expect(userMsg.content).toBe('¿qué hago hoy?');
    expect(userMsg.id).toBe('user-1'); // reconciled from optimistic

    expect(agentMsg.role).toBe('agent');
    expect(agentMsg.content).toBe('hola qué tal');
    expect(agentMsg.id).toBe('agent-1'); // reconciled on done
    expect(agentMsg.streaming).toBe(false);

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('captures tool_result events into the toolResults sibling list', async () => {
    fetchMock.mockResolvedValueOnce(
      sseResponse([
        frame('user_message', { id: 'u1' }),
        frame('token', { text: 'anotado' }),
        frame('tool_result', { type: 'tool_result', tool_use_id: 'tu-1', content: '{"ok":true}' }),
        frame('done', { agentMessageId: 'a1' }),
      ])
    );

    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      await result.current.send({ message: 'guarda eso' });
    });

    expect(result.current.toolResults).toEqual([
      { type: 'tool_result', tool_use_id: 'tu-1', content: '{"ok":true}' },
    ]);
  });
});

describe('useChatStream — crisis exit', () => {
  it('rolls back the agent placeholder and surfaces the crisis line', async () => {
    fetchMock.mockResolvedValueOnce(
      sseResponse([
        frame('crisis_exit', {
          conversationId: 'c1',
          line: {
            name: 'SAPTEL',
            phone_display: '55 5259-8121',
            phone_tel: '+525552598121',
            hours: '24/7',
            language: 'es',
          },
        }),
        frame('done', { conversationId: 'c1' }),
      ])
    );

    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      await result.current.send({ message: 'ya no quiero seguir' });
    });

    expect(result.current.crisisExit?.line.name).toBe('SAPTEL');
    // Only the user message remains; the empty agent placeholder is gone.
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('user');
  });
});

describe('useChatStream — error handling', () => {
  it('records a network error when fetch rejects', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));

    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      await result.current.send({ message: 'hola' });
    });

    expect(result.current.lastError).toEqual({ code: 'network', message: 'offline' });
    expect(result.current.isStreaming).toBe(false);
    // Both rows remain so the UI can render the user's text + a retry.
    expect(result.current.messages).toHaveLength(2);
  });

  it('records an http error when the route returns non-2xx', async () => {
    fetchMock.mockResolvedValueOnce(new Response('boom', { status: 500 }));

    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      await result.current.send({ message: 'hola' });
    });

    expect(result.current.lastError?.code).toBe('http');
  });

  it('records a stream error when the route emits an error event', async () => {
    fetchMock.mockResolvedValueOnce(
      sseResponse([
        frame('user_message', { id: 'u1' }),
        frame('error', { error: 'stream_failed', message: 'upstream 500' }),
      ])
    );

    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      await result.current.send({ message: 'hola' });
    });

    expect(result.current.lastError).toMatchObject({
      code: 'stream',
      message: 'upstream 500',
    });
  });

  it('sets hitRoundLimit when the route emits tool_round_limit', async () => {
    fetchMock.mockResolvedValueOnce(
      sseResponse([
        frame('user_message', { id: 'u1' }),
        frame('token', { text: 'pensando' }),
        frame('tool_round_limit', { rounds: 4 }),
        frame('done', { agentMessageId: 'a1' }),
      ])
    );

    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      await result.current.send({ message: 'pruebalo' });
    });

    expect(result.current.hitRoundLimit).toBe(true);
  });
});

describe('useChatStream — helpers', () => {
  it('setInitialMessages hydrates history at mount', async () => {
    const { result } = renderHook(() => useChatStream());

    act(() => {
      result.current.setInitialMessages([
        { id: 'm1', role: 'user', content: 'hola', createdAt: new Date() },
        { id: 'm2', role: 'agent', content: 'qué hay', createdAt: new Date() },
      ]);
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });
  });

  it('reset clears errors and tool results without dropping the message log', async () => {
    fetchMock.mockResolvedValueOnce(new Response('boom', { status: 500 }));

    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      await result.current.send({ message: 'hola' });
    });

    expect(result.current.lastError?.code).toBe('http');

    act(() => result.current.reset());
    expect(result.current.lastError).toBeNull();
    expect(result.current.toolResults).toEqual([]);
    // Messages survive a reset.
    expect(result.current.messages.length).toBeGreaterThan(0);
  });
});
