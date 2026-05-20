/**
 * DayCard — compact preview of a single day inside the Week screen (SCR-021).
 *
 * Composition:
 *   - Header line: day label (LUN 19) + "Ver día →" link.
 *   - Stats row: wins done count + morning/evening ritual ticks.
 *   - Activities preview: up to N rows (no checkbox interaction).
 */

import Link from 'next/link';

interface ActivityPreview {
  title: string;
  scheduledTime?: string;
  status: 'todo' | 'in_progress' | 'done';
}

interface DayCardProps {
  /** Short label e.g. "LUN 19". */
  dayLabel: string;
  /** "3/5 wins done" stat. */
  winsStat: string;
  /** Morning ritual completed? */
  morningDone: boolean;
  /** Evening ritual completed? */
  eveningDone: boolean;
  /** Up to 3 activity previews. */
  activities: ActivityPreview[];
  /** Href to the dedicated day view (e.g. /today). */
  href: string;
}

export function DayCard({
  dayLabel,
  winsStat,
  morningDone,
  eveningDone,
  activities,
  href,
}: DayCardProps) {
  return (
    <article
      className="ag-day-card"
      style={{
        backgroundColor: 'var(--ag-bg-elevated)',
        borderRadius: 'var(--ag-radius-card)',
        padding: 'var(--ag-space-4) var(--ag-space-5)',
        marginInline: 'var(--ag-space-4)',
        boxShadow: '0 1px 2px rgba(42, 40, 38, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-3)',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 'var(--ag-space-3)',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontSize: 18,
            fontWeight: 500,
            color: 'var(--ag-ink-primary)',
          }}
        >
          {dayLabel}
        </h3>
        <Link
          href={href}
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-soft)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Ver día →
        </Link>
      </header>

      <div
        style={{
          display: 'flex',
          gap: 'var(--ag-space-4)',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 13,
          color: 'var(--ag-ink-soft)',
        }}
      >
        <span>{winsStat}</span>
        <span aria-hidden style={{ color: 'var(--ag-rule)' }}>·</span>
        <span>
          {morningDone ? '✓' : '⊘'} morning / {eveningDone ? '✓' : '⊘'} evening
        </span>
      </div>

      <hr
        style={{
          margin: 0,
          border: 'none',
          borderTop: '1px solid var(--ag-rule)',
        }}
      />

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
        {activities.map((a, i) => (
          <li
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center',
              gap: 'var(--ag-space-2)',
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: 'var(--ag-radius-xs)',
                backgroundColor: a.status === 'done' ? 'var(--ag-ink-primary)' : 'transparent',
                boxShadow:
                  a.status === 'done'
                    ? 'inset 0 0 0 1px var(--ag-ink-primary)'
                    : 'inset 0 0 0 1px var(--ag-rule)',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--ag-font-body)',
                fontSize: 14,
                color: a.status === 'done' ? 'var(--ag-ink-hint)' : 'var(--ag-ink-primary)',
                textDecoration: a.status === 'done' ? 'line-through' : 'none',
                fontStyle: a.status === 'in_progress' ? 'italic' : 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {a.title}
            </span>
            {a.scheduledTime ? (
              <span
                style={{
                  fontFamily: 'var(--ag-font-mono)',
                  fontSize: 12,
                  color: 'var(--ag-slate)',
                }}
              >
                {a.scheduledTime}
              </span>
            ) : (
              <span />
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}
