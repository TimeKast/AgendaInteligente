/**
 * AgentMessage — agent line in the chat (DD-006).
 *
 * Typography:
 *   - Serif italic, ink-soft, no background, no bubble.
 *   - Reads as editorial reflection — never coachy/cheerful.
 */

interface AgentMessageProps {
  children: React.ReactNode;
}

export function AgentMessage({ children }: AgentMessageProps) {
  return (
    <p
      style={{
        margin: 0,
        paddingBlock: 'var(--ag-space-2)',
        paddingInline: 'var(--ag-space-2)',
        fontFamily: 'var(--ag-font-display)',
        fontStyle: 'italic',
        fontSize: 17,
        lineHeight: 1.55,
        color: 'var(--ag-ink-soft)',
      }}
    >
      {children}
    </p>
  );
}
