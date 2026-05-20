/**
 * UserMessage — user line in the chat (DD-006).
 *
 * Typography:
 *   - Sans, ink-primary, soft bg-elevated chip background.
 *   - Right-aligned on mobile to mirror conversational direction.
 *   - Time stamp (HH:mm) below in mono ink-hint.
 *
 * NOTE: This IS technically a "bubble" — but a soft one used to disambiguate
 * speaker, not to ape iMessage. No rounded corners on the speaker side, no
 * heavy fill, no glossy shadow.
 */

interface UserMessageProps {
  text: string;
  time: string;
}

export function UserMessage({ text, time }: UserMessageProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 4,
        paddingBlock: 'var(--ag-space-2)',
      }}
    >
      <p
        style={{
          margin: 0,
          maxWidth: '85%',
          backgroundColor: 'var(--ag-bg-elevated)',
          color: 'var(--ag-ink-primary)',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 16,
          lineHeight: 1.45,
          padding: '8px 12px',
          borderRadius: '12px 12px 4px 12px',
        }}
      >
        {text}
      </p>
      <span
        style={{
          fontFamily: 'var(--ag-font-mono)',
          fontSize: 11,
          color: 'var(--ag-ink-hint)',
        }}
      >
        {time}
      </span>
    </div>
  );
}
