/**
 * TagChip — small pill rendering an arbitrary tag (e.g. urgente, follow-up).
 *
 * Same skin grammar as ProjectChip, but with a different intent — uses
 * the slate ink to differentiate visually without introducing new color.
 */

interface TagChipProps {
  label: string;
}

export function TagChip({ label }: TagChipProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 'var(--ag-radius-pill)',
        backgroundColor: 'transparent',
        boxShadow: 'inset 0 0 0 1px var(--ag-rule)',
        color: 'var(--ag-ink-soft)',
        fontFamily: 'var(--ag-font-body)',
        fontSize: 12,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
