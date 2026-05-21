/**
 * PatternsList — italic-serif intro + bulleted list of observed patterns.
 *
 * Pure presentational. Used on /stats.
 */

interface PatternsListProps {
  intro: string;
  items: string[];
}

export function PatternsList({ intro, items }: PatternsListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-3)' }}>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-display)',
          fontStyle: 'italic',
          fontSize: 15,
          color: 'var(--ag-ink-hint)',
        }}
      >
        {intro}
      </p>
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
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              alignItems: 'baseline',
              gap: 'var(--ag-space-2)',
              paddingBlock: 'var(--ag-space-1)',
              borderBottom:
                i === items.length - 1
                  ? 'none'
                  : '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: 'var(--ag-radius-pill)',
                backgroundColor: 'var(--ag-ink-hint)',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--ag-font-body)',
                fontSize: 14,
                color: 'var(--ag-ink-primary)',
                lineHeight: 1.5,
              }}
            >
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
