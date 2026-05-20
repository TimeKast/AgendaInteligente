/**
 * ActivityRow — single line in the day's activity list (CMP-050).
 *
 * Composition (left → right):
 *   [checkbox] [title] [scheduled_time?] [priority dots] [project chip]
 *
 * States:
 *   - todo        → empty checkbox, normal weight
 *   - in_progress → half-filled checkbox + italic title
 *   - done        → filled checkbox + strikethrough + ink-hint color
 *
 * When `href` is provided the row wraps in a <Link> so the user can tap
 * through to the activity detail. The row is otherwise purely presentational
 * (no real state mutations — this is a visual prototype).
 */

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Check, AlertTriangle, MinusCircle } from 'lucide-react';
import { PriorityDots } from './PriorityDots';
import { ProjectChip } from './ProjectChip';

export type ActivityStatus = 'todo' | 'in_progress' | 'done' | 'skipped' | 'blocked';

interface ActivityRowProps {
  title: string;
  status: ActivityStatus;
  /** "HH:mm" string or undefined if not scheduled. */
  scheduledTime?: string;
  /** 1-5 priority. */
  priority: number;
  projectLabel: string;
  /** Optional link target — if set, the row navigates on tap. */
  href?: string;
  /**
   * Optional leading drag handle element. When provided, rendered to the LEFT
   * of the checkbox and NOT wrapped by the row's <Link> so dragging doesn't
   * trigger navigation. Used by SortableActivityRow in Today.
   */
  dragHandle?: ReactNode;
  /**
   * Optional trailing slot rendered AFTER the row's link (e.g. a "⋯" menu
   * button). Like `dragHandle`, it lives outside the <Link> so taps don't
   * trigger navigation.
   */
  trailingSlot?: ReactNode;
}

function Checkbox({ status }: { status: ActivityStatus }) {
  const base = {
    width: 18,
    height: 18,
    borderRadius: 'var(--ag-radius-xs)',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: `background-color var(--ag-duration-base) var(--ag-ease), box-shadow var(--ag-duration-base) var(--ag-ease)`,
  } as const;

  if (status === 'done') {
    return (
      <span
        aria-label="Hecho"
        style={{
          ...base,
          backgroundColor: 'var(--ag-ink-primary)',
          boxShadow: 'inset 0 0 0 1px var(--ag-ink-primary)',
          color: 'var(--ag-accent-on)',
        }}
      >
        <Check size={12} strokeWidth={2} />
      </span>
    );
  }

  if (status === 'in_progress') {
    return (
      <span
        aria-label="En progreso"
        style={{
          ...base,
          // Half-filled visual via diagonal gradient on warm tones — no blue.
          background: 'linear-gradient(135deg, var(--ag-ink-primary) 0 50%, transparent 50% 100%)',
          boxShadow: 'inset 0 0 0 1px var(--ag-ink-soft)',
        }}
      />
    );
  }

  if (status === 'skipped') {
    return (
      <span
        aria-label="Saltado"
        style={{
          ...base,
          color: 'var(--ag-ink-hint)',
        }}
      >
        <MinusCircle size={14} strokeWidth={1.5} />
      </span>
    );
  }

  if (status === 'blocked') {
    return (
      <span
        aria-label="Bloqueado"
        style={{
          ...base,
          color: 'var(--ag-warning)',
        }}
      >
        <AlertTriangle size={14} strokeWidth={1.75} />
      </span>
    );
  }

  return (
    <span
      aria-label="Pendiente"
      style={{
        ...base,
        backgroundColor: 'transparent',
        boxShadow: 'inset 0 0 0 1px var(--ag-rule)',
      }}
    />
  );
}

export function ActivityRow({
  title,
  status,
  scheduledTime,
  priority,
  projectLabel,
  href,
  dragHandle,
  trailingSlot,
}: ActivityRowProps) {
  const isDone = status === 'done';
  const isInProgress = status === 'in_progress';
  const isSkipped = status === 'skipped';

  const rowInner = (
    <>
      <Checkbox status={status} />

      {/* Title + time stacked, occupying flexible middle column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          gap: 2,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 16,
            lineHeight: 1.4,
            color: isDone || isSkipped ? 'var(--ag-ink-hint)' : 'var(--ag-ink-primary)',
            fontStyle: isInProgress ? 'italic' : 'normal',
            textDecoration: isDone ? 'line-through' : 'none',
            textDecorationColor: 'var(--ag-rule)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
        {scheduledTime ? (
          <span
            style={{
              fontFamily: 'var(--ag-font-mono)',
              fontSize: 12,
              color: 'var(--ag-slate)',
              letterSpacing: '0.02em',
            }}
          >
            {scheduledTime}
          </span>
        ) : null}
      </div>

      {/* Right cluster: priority dots + project chip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--ag-space-3)',
          flexShrink: 0,
        }}
      >
        <PriorityDots priority={priority} />
        <ProjectChip label={projectLabel} />
      </div>
    </>
  );

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    gap: 'var(--ag-space-3)',
    padding: 'var(--ag-space-3) 0',
    borderBottom: '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
    minHeight: 48, // touch target
    color: 'inherit',
    textDecoration: 'none',
  } as const;

  // When a drag handle or trailing slot is provided, render them OUTSIDE the
  // link so dragging / menu taps don't trigger navigation.
  if (dragHandle || trailingSlot) {
    const cols = `${dragHandle ? 'auto ' : ''}1fr${trailingSlot ? ' auto' : ''}`;
    return (
      <li
        className="ag-activity-row"
        style={{
          listStyle: 'none',
          display: 'grid',
          gridTemplateColumns: cols,
          alignItems: 'center',
          gap: 'var(--ag-space-2)',
          borderBottom:
            '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
        }}
      >
        {dragHandle ?? null}
        {href ? (
          <Link
            href={href}
            style={{
              ...rowStyle,
              borderBottom: 'none',
            }}
          >
            {rowInner}
          </Link>
        ) : (
          <div style={{ ...rowStyle, borderBottom: 'none' }}>{rowInner}</div>
        )}
        {trailingSlot ?? null}
      </li>
    );
  }

  return (
    <li className="ag-activity-row" style={{ listStyle: 'none' }}>
      {href ? (
        <Link href={href} style={rowStyle}>
          {rowInner}
        </Link>
      ) : (
        <div style={rowStyle}>{rowInner}</div>
      )}
    </li>
  );
}
