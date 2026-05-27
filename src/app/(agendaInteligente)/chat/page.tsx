/**
 * SCR-023 — Chat (live, wired to /api/ai/chat).
 *
 * Server component shell that holds the page chrome; the
 * `<LiveChat>` client component owns the stream + message list via
 * `useChatStream`. Initial messages will be hydrated by ISSUE-052b
 * follow-up (infinite scroll up via `listMessages` cursor) — for v1
 * the chat starts empty on mount.
 *
 * Linked: ISSUE-052 (route), ISSUE-052b (UI), ISSUE-056b (crisis panel).
 */

import { MoreHorizontal } from 'lucide-react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { LiveChat } from '@/components/chat/LiveChat';

export default function ChatPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AgendaHeader
        dateLabel="Chat"
        rightSlot={
          <button
            type="button"
            aria-label="Histórico"
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--ag-ink-soft)',
              padding: 6,
              cursor: 'pointer',
              display: 'inline-flex',
            }}
          >
            <MoreHorizontal size={20} strokeWidth={1.5} />
          </button>
        }
      />
      <LiveChat />
    </div>
  );
}
