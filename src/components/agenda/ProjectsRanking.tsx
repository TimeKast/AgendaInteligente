/**
 * ProjectsRanking — ranking row list of top projects with done/total ratio
 * and a 5-dot progress indicator.
 *
 * Pure presentational. Used on /stats.
 */

export interface ProjectRow {
  name: string;
  /** "4/5" string for display. */
  ratio: string;
  /** 0-5 filled dots out of 5. */
  dots: number;
}

interface ProjectsRankingProps {
  rows: ProjectRow[];
}

export function ProjectsRanking({ rows }: ProjectsRankingProps) {
  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {rows.map((row, i) => (
        <li
          key={row.name}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            alignItems: 'center',
            gap: 'var(--ag-space-3)',
            paddingBlock: 'var(--ag-space-3)',
            borderTop: i === 0 ? '1px solid var(--ag-rule)' : 'none',
            borderBottom: '1px solid var(--ag-rule)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              color: 'var(--ag-ink-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.name}
          </span>
          <span
            style={{
              fontFamily: 'var(--ag-font-mono)',
              fontSize: 12,
              color: 'var(--ag-ink-soft)',
              whiteSpace: 'nowrap',
            }}
          >
            {row.ratio}
          </span>
          <span aria-hidden style={{ display: 'inline-flex', gap: 3 }}>
            {Array.from({ length: 5 }).map((_, idx) => {
              const filled = idx < row.dots;
              return (
                <span
                  key={idx}
                  style={{
                    display: 'inline-block',
                    width: 7,
                    height: 7,
                    borderRadius: 'var(--ag-radius-pill)',
                    backgroundColor: filled ? 'var(--ag-ink-primary)' : 'transparent',
                    boxShadow: filled ? 'none' : 'inset 0 0 0 1px var(--ag-rule)',
                  }}
                />
              );
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
