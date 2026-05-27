/**
 * SSE writer helpers — ISSUE-052.
 *
 * Tiny wrappers over the standard `ReadableStream` constructor so the
 * chat route can emit typed events without manually building the
 * `event: name\ndata: ...\n\n` framing on every send.
 *
 * SSE events emitted by `/api/ai/chat`:
 *   - `user_message`    → echoed user message id (so client can map
 *                         optimistic insert → persisted id).
 *   - `token`           → text delta from Claude.
 *   - `tool_result`     → JSON of a single tool_result block (after
 *                         dispatch).
 *   - `tool_round_limit` → multi-turn loop hit `MAX_TOOL_ROUNDS`; the
 *                         agent stopped before naturally finishing.
 *   - `crisis_exit`     → AI-8 trigger fired (with crisis line info).
 *   - `done`            → stream finished cleanly (with final agent
 *                         message id + challenges_fired list).
 *   - `error`           → stream aborted with an error.
 *
 * Linked: FT-050, FT-051.
 */

export type SseEventName =
  | 'user_message'
  | 'token'
  | 'tool_result'
  | 'tool_round_limit'
  | 'crisis_exit'
  | 'done'
  | 'error';

export interface SseWriter {
  send(event: SseEventName, data: unknown): void;
  close(): void;
}

/**
 * Frames `event: name\ndata: <json>\n\n` and pushes to the underlying
 * stream controller. JSON-encodes the data; downstream code doesn't
 * touch the wire format.
 */
export function makeSseWriter(controller: ReadableStreamDefaultController<Uint8Array>): SseWriter {
  const encoder = new TextEncoder();
  let closed = false;

  return {
    send(event, data) {
      if (closed) return;
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(encoder.encode(payload));
    },
    close() {
      if (closed) return;
      closed = true;
      try {
        controller.close();
      } catch {
        // Stream already closed by the runtime — ignore.
      }
    },
  };
}

/** Standard SSE response headers. */
export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  // Prevents Next.js / proxies from buffering the stream.
  'X-Accel-Buffering': 'no',
} as const;
