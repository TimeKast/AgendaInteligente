'use client';

/**
 * LiveChat — wires `useChatStream` to the agenda chat components.
 *
 * Responsibilities:
 *   - Hold the conversation state via the hook.
 *   - Render messages as `AgentMessage` / `UserMessage`.
 *   - On `crisisExit !== null`, replace the surface with `CrisisExitPanel`
 *     (ISSUE-056b — separate file so the panel can be reused from a
 *     standalone page if needed).
 *   - Surface stream + http + network errors with a retry affordance.
 *
 * This file is `'use client'` because it owns hook state. The parent
 * page can stay server-component to deliver `initialMessages`.
 *
 * Linked: ISSUE-052, ISSUE-052b, ISSUE-056b.
 */

import { useEffect, useRef } from 'react';
import { AgentMessage } from '@/components/agenda/AgentMessage';
import { UserMessage } from '@/components/agenda/UserMessage';
import { Conversation } from '@/components/agenda/Conversation';
import { ChatInput } from '@/components/agenda/ChatInput';
import { CrisisExitPanel } from '@/components/chat/CrisisExitPanel';
import { useChatStream, type ChatMessage } from '@/lib/hooks';

export interface LiveChatProps {
  /**
   * Initial messages (e.g. from a server-side `listMessages` call).
   * If omitted, the conversation starts empty.
   */
  initialMessages?: ChatMessage[];
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function LiveChat({ initialMessages }: LiveChatProps) {
  const stream = useChatStream();
  const scrollRef = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);

  // Hydrate once on mount. Re-hydration on parent prop change is out of
  // scope — pages that need a "switch conversation" UX should remount
  // this component with a `key={conversationId}`.
  useEffect(() => {
    if (hydrated.current) return;
    if (initialMessages && initialMessages.length > 0) {
      stream.setInitialMessages(initialMessages);
    }
    hydrated.current = true;
  }, [initialMessages, stream]);

  // Auto-scroll to bottom on new messages or token deltas.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [stream.messages, stream.isStreaming]);

  if (stream.crisisExit) {
    return <CrisisExitPanel line={stream.crisisExit.line} onReturn={stream.reset} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto' }}>
        <Conversation>
          {stream.messages.map((m) =>
            m.role === 'agent' ? (
              <AgentMessage key={m.id}>{m.content || (m.streaming ? '…' : '')}</AgentMessage>
            ) : (
              <UserMessage key={m.id} text={m.content} time={formatTime(m.createdAt)} />
            )
          )}
          {stream.lastError && (
            <p
              role="alert"
              style={{
                margin: 0,
                paddingBlock: 'var(--ag-space-2)',
                paddingInline: 'var(--ag-space-2)',
                color: 'var(--ag-ink-hint)',
                fontFamily: 'var(--ag-font-body)',
                fontSize: 14,
              }}
            >
              Algo se rompió. Intenta de nuevo.
            </p>
          )}
        </Conversation>
      </div>

      <ChatInput
        disabled={stream.isStreaming}
        onSubmit={(text) => {
          void stream.send({ message: text });
        }}
      />
    </div>
  );
}
