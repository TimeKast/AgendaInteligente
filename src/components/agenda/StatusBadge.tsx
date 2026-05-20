/**
 * StatusBadge — project status pill (ACTIVE / PAUSED / COMPLETED / KILLED).
 *
 * Caption typography (11px, uppercase, ls 0.04em). Tone-on-tone:
 *   - active    → success-tinted
 *   - paused    → warning-tinted
 *   - completed → ink-soft ring (neutral, "done")
 *   - killed    → danger-tinted (muted)
 */

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'killed';

const META: Record<
  ProjectStatus,
  { label: string; color: string; bg: string }
> = {
  active: {
    label: 'Active',
    color: 'var(--ag-success)',
    bg: 'color-mix(in oklab, var(--ag-success), transparent 88%)',
  },
  paused: {
    label: 'Paused',
    color: 'var(--ag-warning)',
    bg: 'color-mix(in oklab, var(--ag-warning), transparent 88%)',
  },
  completed: {
    label: 'Completed',
    color: 'var(--ag-ink-soft)',
    bg: 'var(--ag-bg-sunken)',
  },
  killed: {
    label: 'Killed',
    color: 'var(--ag-danger)',
    bg: 'color-mix(in oklab, var(--ag-danger), transparent 90%)',
  },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const m = META[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 'var(--ag-radius-pill)',
        backgroundColor: m.bg,
        color: m.color,
        fontFamily: 'var(--ag-font-body)',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {m.label}
    </span>
  );
}
