/**
 * StatCard — single metric card used on the /stats page.
 *
 * Composition:
 *   - Caption uppercase label.
 *   - Large serif value (number or percentage).
 *   - Optional sub-line (italic serif "vs hace 30d" or "3 de 12").
 *   - Optional inline 10-dot indicator bar (DD-pattern adjacent to wins).
 *
 * Pure presentational. Warm-book palette only.
 */

interface StatCardProps {
  caption: string;
  value: string;
  sub?: string;
  /** 0-10 filled dots out of 10. Optional. */
  dots?: number;
  /** Show an accent (sage scope-quarter) on the value — used for "current period". */
  accent?: boolean;
}

export function StatCard({ caption, value, sub, dots, accent = false }: StatCardProps) {
  return (
    <article
      style={{
        backgroundColor: 'var(--ag-bg-elevated)',
        borderRadius: 'var(--ag-radius-card)',
        padding: 'var(--ag-space-4) var(--ag-space-5)',
        boxShadow: '0 1px 2px rgba(42, 40, 38, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-2)',
        minHeight: 120,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ag-slate)',
        }}
      >
        {caption}
      </span>

      <span
        style={{
          fontFamily: 'var(--ag-font-display)',
          fontSize: 32,
          fontWeight: 500,
          lineHeight: 1.1,
          color: accent ? 'var(--ag-scope-quarter)' : 'var(--ag-ink-primary)',
        }}
      >
        {value}
      </span>

      {typeof dots === 'number' ? (
        <span aria-hidden style={{ display: 'inline-flex', gap: 4 }}>
          {Array.from({ length: 10 }).map((_, i) => {
            const filled = i < dots;
            return (
              <span
                key={i}
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
      ) : null}

      {sub ? (
        <span
          style={{
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
          }}
        >
          {sub}
        </span>
      ) : null}
    </article>
  );
}
