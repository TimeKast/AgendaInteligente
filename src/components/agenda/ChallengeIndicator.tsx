/**
 * ChallengeIndicator — small inline italic indicator showing the agent
 * just applied a "challenge" technique (vague_language, etc.).
 *
 * Subtle, ink-hint. Caps lowercase — reads as a typographic footnote.
 */

interface ChallengeIndicatorProps {
  kind: string;
}

export function ChallengeIndicator({ kind }: ChallengeIndicatorProps) {
  return (
    <p
      style={{
        margin: 0,
        paddingInline: 'var(--ag-space-2)',
        paddingBlock: 4,
        fontFamily: 'var(--ag-font-display)',
        fontStyle: 'italic',
        fontSize: 12,
        color: 'var(--ag-ink-hint)',
        letterSpacing: '0.01em',
      }}
    >
      ⚡ challenge: {kind}
    </p>
  );
}
