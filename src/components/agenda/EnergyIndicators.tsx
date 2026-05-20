/**
 * EnergyIndicators — three 1-5 scale rows (Físico / Mental / Emocional).
 * Renders filled vs empty dots; no interactivity in this prototype round.
 *
 * Design ref: 15_DESIGN.md §6 DD-pattern-3 (sheet view) + SCR-020 wireframe.
 */

type Score = 0 | 1 | 2 | 3 | 4 | 5;

interface EnergyRow {
  label: string;
  /** 0-5; 0 = unfilled state */
  value: Score;
}

interface EnergyIndicatorsProps {
  rows: EnergyRow[];
}

function Dots({ value }: { value: Score }) {
  return (
    <span aria-label={`${value} out of 5`} className="inline-flex items-center" style={{ gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= value;
        return (
          <span
            key={i}
            aria-hidden
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: 'var(--ag-radius-pill)',
              backgroundColor: filled ? 'var(--ag-ink-primary)' : 'transparent',
              boxShadow: filled ? 'none' : 'inset 0 0 0 1px var(--ag-rule)',
            }}
          />
        );
      })}
    </span>
  );
}

export function EnergyIndicators({ rows }: EnergyIndicatorsProps) {
  return (
    <div
      className="ag-energy"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-2)',
      }}
    >
      <span
        className="ag-caption"
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ag-slate)',
        }}
      >
        Energy
      </span>

      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-2)',
        }}
      >
        {rows.map((row) => (
          <li
            key={row.label}
            style={{
              display: 'grid',
              gridTemplateColumns: '92px 1fr',
              alignItems: 'center',
              gap: 'var(--ag-space-3)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--ag-font-body)',
                fontSize: 14,
                color: 'var(--ag-ink-soft)',
              }}
            >
              {row.label}
            </span>
            <Dots value={row.value} />
          </li>
        ))}
      </ul>
    </div>
  );
}
