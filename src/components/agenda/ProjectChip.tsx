/**
 * ProjectChip — small pill labeling the project an activity belongs to.
 * Caption typography (12px, uppercase, ls 0.04em, weight 500).
 *
 * Tone-on-tone — warm bg-sunken background with ink-soft text.
 * NO scope color is applied to project chips (those are reserved for
 * scope/timescale signal, not project taxonomy).
 */

interface ProjectChipProps {
  label: string;
}

export function ProjectChip({ label }: ProjectChipProps) {
  return (
    <span
      className="ag-project-chip"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 'var(--ag-radius-pill)',
        backgroundColor: 'var(--ag-bg-sunken)',
        color: 'var(--ag-ink-soft)',
        fontFamily: 'var(--ag-font-body)',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
