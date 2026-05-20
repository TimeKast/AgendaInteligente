/**
 * ActivitySection — a time-block group of activities (DD-pattern-1).
 *
 * Renders:
 *   - Uppercase caption label (MAÑANA / TARDE / NOCHE).
 *   - A list of ActivityRow children, OR an italic-serif empty state.
 */

import type { ReactNode } from 'react';

interface ActivitySectionProps {
  label: string;
  /** Empty state copy shown italic-serif when no children. */
  emptyCopy?: string;
  children?: ReactNode;
  /** When true, render `emptyCopy` instead of children. */
  empty?: boolean;
}

export function ActivitySection({
  label,
  emptyCopy = 'Sin actividades.',
  empty = false,
  children,
}: ActivitySectionProps) {
  return (
    <section
      className="ag-activity-section"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-2)',
        paddingBlock: 'var(--ag-space-4)',
      }}
      aria-label={label}
    >
      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-body)',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ag-slate)',
          paddingBlock: 'var(--ag-space-1)',
        }}
      >
        {label}
      </h3>

      {empty ? (
        <p
          style={{
            margin: 0,
            paddingBlock: 'var(--ag-space-2)',
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 16,
            color: 'var(--ag-ink-hint)',
            opacity: 0.85,
          }}
        >
          {emptyCopy}
        </p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </ul>
      )}
    </section>
  );
}
