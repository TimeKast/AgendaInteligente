/**
 * SCR-023 — Chat (mobile portrait prototype)
 *
 * No bottom nav (AgendaShell hides it), no FAB (chat has its own mic).
 * Hardcoded morning ritual flow with a vague_language challenge.
 */

import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { Conversation } from '@/components/agenda/Conversation';
import { DateDivider } from '@/components/agenda/DateDivider';
import { AgentMessage } from '@/components/agenda/AgentMessage';
import { UserMessage } from '@/components/agenda/UserMessage';
import { ChallengeIndicator } from '@/components/agenda/ChallengeIndicator';
import { ChatInput } from '@/components/agenda/ChatInput';

export default function ChatPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
      }}
    >
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

      <main
        style={{
          flex: 1,
          maxWidth: 480,
          marginInline: 'auto',
          width: '100%',
        }}
      >
        <Conversation>
          <DateDivider label="Lunes 19 de mayo" />

          <AgentMessage>
            Buenos días. ¿Cuál es la intención de hoy — una sola frase?
          </AgentMessage>

          <UserMessage text="estar más enfocado hoy" time="9:02" />

          <ChallengeIndicator kind="vague_language" />

          <AgentMessage>
            &ldquo;Más enfocado&rdquo; — ¿qué significa eso concretamente?
          </AgentMessage>

          <UserMessage
            text="terminar el reporte trimestral antes de las 13"
            time="9:03"
          />

          <AgentMessage>
            Bien. Guardo: hoy es para el reporte. ¿Terminado o no a qué hora?
          </AgentMessage>
        </Conversation>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 'var(--ag-space-3) var(--ag-space-4)',
          }}
        >
          <Link
            href="/chat/crisis-demo"
            style={{
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 12,
              color: 'var(--ag-ink-hint)',
              textDecoration: 'none',
            }}
          >
            Demo: ver pantalla de crisis exit (AI-8)
          </Link>
        </div>
      </main>

      <ChatInput />
    </div>
  );
}
