'use client';

/**
 * useChatStream — ISSUE-052b.
 *
 * React hook that owns the chat message list + SSE consumer for the
 * `/api/ai/chat` route. Why a hook (not a Context provider): chat is
 * page-local for v1 — every screen that mounts a conversation gets a
 * fresh instance. When/if we need a draft persisted across navigation,
 * a Context wrapper is the next step, not a refactor of this surface.
 *
 * Responsibilities:
 *   - Maintains a list of `ChatMessage` rows for the open conversation.
 *   - Optimistically inserts a user message on `send()`; reconciles its
 *     id from the SSE `user_message` event so subsequent ops (edit,
 *     react) can target the persisted row.
 *   - Appends an empty agent row on send, then accumulates `token`
 *     deltas into its `content`. Multi-turn loops keep streaming into
 *     the SAME agent row — Slice A2 of the route emits text deltas
 *     across all rounds.
 *   - Surfaces `tool_result` events as a sibling list for UI badges.
 *   - On `crisis_exit`, sets a separate state slot so the page can
 *     render CMP-078 instead of the chat surface.
 *   - On `error` or `tool_round_limit`, exposes a `lastError` flag so
 *     the UI can show a retry affordance without losing message state.
 *
 * Why parse SSE by hand vs `EventSource`: native `EventSource` is GET-
 * only and our route is POST. So we fetch + read the body as a stream
 * and parse the `event: name\ndata: <json>\n\n` framing ourselves —
 * trivial, well-tested, and avoids dragging in `@microsoft/fetch-event-
 * source` for one consumer.
 *
 * Linked: FT-050, FT-051, ISSUE-052 (route), ISSUE-052b (UI).
 */

import { useCallback, useReducer, useRef } from 'react';
import type { LinkedSheetType } from '@/lib/db/schema/conversations';

// ─── Public types ────────────────────────────────────────────────────────

export interface ChatMessage {
  /**
   * Tagged id: `optimistic:<nanoid>` until the SSE `user_message` event
   * reconciles it with the persisted UUID. Stable identity for React
   * keys regardless of reconciliation.
   */
  id: string;
  role: 'user' | 'agent';
  content: string;
  /** True while the agent message is still receiving token deltas. */
  streaming?: boolean;
  /** Set when the persisted UUID is known. Mirrors `id` once reconciled. */
  persistedId?: string | null;
  /** Wall-clock when the row was created locally. */
  createdAt: Date;
}

export interface ToolResultEvent {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface CrisisExitState {
  conversationId: string;
  line: {
    name: string;
    phone_display: string;
    phone_tel: string;
    hours: string;
    language: string;
  };
}

export interface ChatStreamError {
  /** Stable code for UI branching. */
  code: 'network' | 'http' | 'stream' | 'round_limit';
  /** Human-readable detail; safe to surface but not localized. */
  message: string;
}

export interface SendArgs {
  message: string;
  linkedSheetType?: LinkedSheetType;
  linkedSheetId?: string;
}

export interface UseChatStreamResult {
  /** Chronologically-ordered message list (oldest first). */
  messages: ChatMessage[];
  /** Tool results from the most recent send, in arrival order. */
  toolResults: ToolResultEvent[];
  /** Set when the route fired the AI-8 crisis exit — page should render CMP-078. */
  crisisExit: CrisisExitState | null;
  /** Last error encountered (network, HTTP, stream parse, or round-limit). */
  lastError: ChatStreamError | null;
  /** True while a send is in flight (request open, tokens may still arrive). */
  isStreaming: boolean;
  /** True when the loop hit `MAX_TOOL_ROUNDS` on the server. */
  hitRoundLimit: boolean;
  /** Submit a new turn. Resolves when the SSE stream closes. */
  send: (args: SendArgs) => Promise<void>;
  /** Hydrate the message list from server-loaded history (page mount). */
  setInitialMessages: (msgs: ChatMessage[]) => void;
  /** Clear transient state (errors, tool results) — keeps `messages` intact. */
  reset: () => void;
}

// ─── Reducer ─────────────────────────────────────────────────────────────

interface State {
  messages: ChatMessage[];
  toolResults: ToolResultEvent[];
  crisisExit: CrisisExitState | null;
  lastError: ChatStreamError | null;
  isStreaming: boolean;
  hitRoundLimit: boolean;
  /** Local id of the agent row currently receiving tokens. */
  activeAgentId: string | null;
  /** Local id of the user row awaiting `user_message` reconciliation. */
  pendingUserId: string | null;
}

type Action =
  | { type: 'init'; messages: ChatMessage[] }
  | {
      type: 'send_start';
      userMessage: ChatMessage;
      agentPlaceholder: ChatMessage;
    }
  | { type: 'user_reconcile'; persistedId: string }
  | { type: 'token'; text: string }
  | { type: 'tool_result'; result: ToolResultEvent }
  | { type: 'tool_round_limit' }
  | { type: 'crisis_exit'; payload: CrisisExitState }
  | { type: 'done'; agentMessageId: string | null }
  | { type: 'error'; error: ChatStreamError }
  | { type: 'reset' };

const initialState: State = {
  messages: [],
  toolResults: [],
  crisisExit: null,
  lastError: null,
  isStreaming: false,
  hitRoundLimit: false,
  activeAgentId: null,
  pendingUserId: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'init':
      return { ...initialState, messages: action.messages };

    case 'send_start':
      return {
        ...state,
        toolResults: [],
        crisisExit: null,
        lastError: null,
        isStreaming: true,
        hitRoundLimit: false,
        activeAgentId: action.agentPlaceholder.id,
        pendingUserId: action.userMessage.id,
        messages: [...state.messages, action.userMessage, action.agentPlaceholder],
      };

    case 'user_reconcile':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === state.pendingUserId
            ? { ...m, persistedId: action.persistedId, id: action.persistedId }
            : m
        ),
        pendingUserId: null,
      };

    case 'token':
      if (!state.activeAgentId) return state;
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === state.activeAgentId ? { ...m, content: m.content + action.text } : m
        ),
      };

    case 'tool_result':
      return { ...state, toolResults: [...state.toolResults, action.result] };

    case 'tool_round_limit':
      return { ...state, hitRoundLimit: true };

    case 'crisis_exit':
      // Roll back the placeholder agent message — the route never
      // generated one. Keep the user message so the audit trail in the
      // UI reflects what the user said.
      return {
        ...state,
        crisisExit: action.payload,
        isStreaming: false,
        messages: state.messages.filter((m) => m.id !== state.activeAgentId),
        activeAgentId: null,
      };

    case 'done':
      return {
        ...state,
        isStreaming: false,
        messages: state.messages.map((m) =>
          m.id === state.activeAgentId
            ? {
                ...m,
                streaming: false,
                persistedId: action.agentMessageId,
                id: action.agentMessageId ?? m.id,
              }
            : m
        ),
        activeAgentId: null,
      };

    case 'error':
      // Mark the agent placeholder as no-longer-streaming so the UI
      // can render whatever partial text arrived + a retry affordance.
      return {
        ...state,
        isStreaming: false,
        lastError: action.error,
        messages: state.messages.map((m) =>
          m.id === state.activeAgentId ? { ...m, streaming: false } : m
        ),
        activeAgentId: null,
      };

    case 'reset':
      return {
        ...state,
        toolResults: [],
        crisisExit: null,
        lastError: null,
        hitRoundLimit: false,
      };
  }
}

// ─── SSE parsing ─────────────────────────────────────────────────────────

interface SseEvent {
  event: string;
  data: unknown;
}

/**
 * Reads `event: name\ndata: <json>\n\n` blocks from a `ReadableStream`.
 * Yields parsed events as they arrive. Tolerates partial chunks at
 * buffer boundaries; ignores blocks with malformed JSON (logs and
 * continues so a single bad event doesn't kill the stream).
 */
async function* parseSseStream(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal
): AsyncGenerator<SseEvent, void, void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf('\n\n')) !== -1) {
        const block = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        if (!block.trim()) continue;
        const lines = block.split('\n');
        const evLine = lines.find((l) => l.startsWith('event: '));
        const dataLine = lines.find((l) => l.startsWith('data: '));
        if (!evLine) continue;
        const name = evLine.slice(7);
        const raw = dataLine?.slice(6) ?? '{}';
        try {
          yield { event: name, data: JSON.parse(raw) };
        } catch {
          // Skip malformed payload — stream remains useful.
          continue;
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────

let optimisticCounter = 0;
function nextOptimisticId(prefix: 'u' | 'a'): string {
  optimisticCounter++;
  return `optimistic:${prefix}:${Date.now()}:${optimisticCounter}`;
}

export function useChatStream(): UseChatStreamResult {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef<AbortController | null>(null);

  const setInitialMessages = useCallback((msgs: ChatMessage[]) => {
    dispatch({ type: 'init', messages: msgs });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'reset' });
  }, []);

  const send = useCallback(async ({ message, linkedSheetType, linkedSheetId }: SendArgs) => {
    // Cancel a previous in-flight send (defensive — the UI normally
    // disables the send button during streaming, but a manual race
    // shouldn't double-fire requests).
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const now = new Date();
    const userMessage: ChatMessage = {
      id: nextOptimisticId('u'),
      role: 'user',
      content: message,
      createdAt: now,
    };
    const agentPlaceholder: ChatMessage = {
      id: nextOptimisticId('a'),
      role: 'agent',
      content: '',
      streaming: true,
      createdAt: now,
    };
    dispatch({ type: 'send_start', userMessage, agentPlaceholder });

    let res: Response;
    try {
      res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, linkedSheetType, linkedSheetId }),
        signal: ctrl.signal,
      });
    } catch (err) {
      if (ctrl.signal.aborted) return;
      dispatch({
        type: 'error',
        error: { code: 'network', message: (err as Error).message },
      });
      return;
    }

    if (!res.ok || !res.body) {
      dispatch({
        type: 'error',
        error: { code: 'http', message: `HTTP ${res.status}` },
      });
      return;
    }

    try {
      for await (const ev of parseSseStream(res.body, ctrl.signal)) {
        switch (ev.event) {
          case 'user_message': {
            const data = ev.data as { id: string };
            if (data.id) dispatch({ type: 'user_reconcile', persistedId: data.id });
            break;
          }
          case 'token': {
            const data = ev.data as { text: string };
            if (typeof data.text === 'string') dispatch({ type: 'token', text: data.text });
            break;
          }
          case 'tool_result':
            dispatch({ type: 'tool_result', result: ev.data as ToolResultEvent });
            break;
          case 'tool_round_limit':
            dispatch({ type: 'tool_round_limit' });
            break;
          case 'crisis_exit':
            dispatch({ type: 'crisis_exit', payload: ev.data as CrisisExitState });
            break;
          case 'done': {
            const data = ev.data as { agentMessageId: string | null };
            dispatch({ type: 'done', agentMessageId: data.agentMessageId ?? null });
            break;
          }
          case 'error':
            dispatch({
              type: 'error',
              error: { code: 'stream', message: (ev.data as { message?: string }).message ?? '' },
            });
            break;
        }
      }
    } catch (err) {
      if (ctrl.signal.aborted) return;
      dispatch({
        type: 'error',
        error: { code: 'stream', message: (err as Error).message },
      });
    }
  }, []);

  return {
    messages: state.messages,
    toolResults: state.toolResults,
    crisisExit: state.crisisExit,
    lastError: state.lastError,
    isStreaming: state.isStreaming,
    hitRoundLimit: state.hitRoundLimit,
    send,
    setInitialMessages,
    reset,
  };
}
