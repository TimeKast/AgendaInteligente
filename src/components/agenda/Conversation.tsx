/**
 * Conversation — vertical stack of chat messages with consistent spacing.
 *
 * Purely a layout container. Children are AgentMessage / UserMessage /
 * ChallengeIndicator / DateDivider in mixed order.
 */

import type { ReactNode } from 'react';

interface ConversationProps {
  children: ReactNode;
}

export function Conversation({ children }: ConversationProps) {
  return (
    <div
      role="log"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        paddingInline: 'var(--ag-space-3)',
        paddingBottom: 'var(--ag-space-4)',
      }}
    >
      {children}
    </div>
  );
}
