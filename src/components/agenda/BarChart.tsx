/**
 * BarChart — CSS-only horizontal bar chart for /stats.
 *
 * Each bar: label (left) + filled track (middle, width = pct) + value (right).
 * No charting library — just divs. Current period bar uses accent color.
 */

export interface BarRow {
  label: string;
  /** 0-100 */
  pct: number;
  /** True if this is the "current" period — highlights with --ag-scope-quarter. */
  current?: boolean;
}

interface BarChartProps {
  rows: BarRow[];
  ariaLabel?: string;
}

export function BarChart({ rows, ariaLabel = 'Gráfico de barras' }: BarChartProps) {
  return (
    <ul
      aria-label={ariaLabel}
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-2)',
      }}
    >
      {rows.map((row) => {
        const fillColor = row.current
          ? 'var(--ag-scope-quarter)'
          : 'var(--ag-ink-primary)';
        return (
          <li
            key={row.label}
            style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr 48px',
              alignItems: 'center',
              gap: 'var(--ag-space-3)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--ag-font-mono)',
                fontSize: 12,
                color: 'var(--ag-ink-soft)',
                letterSpacing: '0.02em',
              }}
            >
              {row.label}
            </span>
            <span
              role="presentation"
              style={{
                display: 'block',
                position: 'relative',
                height: 12,
                backgroundColor: 'var(--ag-rule)',
                borderRadius: 'var(--ag-radius-pill)',
                overflow: 'hidden',
              }}
            >
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${Math.max(0, Math.min(100, row.pct))}%`,
                  backgroundColor: fillColor,
                  borderRadius: 'var(--ag-radius-pill)',
                }}
              />
            </span>
            <span
              style={{
                fontFamily: 'var(--ag-font-mono)',
                fontSize: 12,
                color: row.current ? 'var(--ag-scope-quarter)' : 'var(--ag-ink-soft)',
                textAlign: 'right',
                fontWeight: row.current ? 500 : 400,
              }}
            >
              {row.pct}%
            </span>
          </li>
        );
      })}
    </ul>
  );
}
