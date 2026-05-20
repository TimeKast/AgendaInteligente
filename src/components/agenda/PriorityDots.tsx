/**
 * PriorityDots — 5 dots, filled per priority 1-5.
 * Used inside ActivityRow (CMP-035 / CMP-050 per 15_DESIGN.md §4).
 */

interface PriorityDotsProps {
  /** 1-5 priority; values outside clamp to range. */
  priority: number;
}

export function PriorityDots({ priority }: PriorityDotsProps) {
  const p = Math.max(1, Math.min(5, Math.round(priority)));
  return (
    <span
      aria-label={`Prioridad ${p} de 5`}
      className="inline-flex items-center"
      style={{ gap: 3 }}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= p;
        return (
          <span
            key={i}
            aria-hidden
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: 'var(--ag-radius-pill)',
              backgroundColor: filled ? 'var(--ag-ink-soft)' : 'transparent',
              boxShadow: filled ? 'none' : 'inset 0 0 0 1px var(--ag-rule)',
            }}
          />
        );
      })}
    </span>
  );
}
