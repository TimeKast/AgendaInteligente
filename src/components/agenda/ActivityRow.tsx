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
import { Check } from 'lucide-react';
import { PriorityDots } from './PriorityDots';
import { ProjectChip } from './ProjectChip';

export type ActivityStatus = 'todo' | 'in_progress' | 'done';

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
}: ActivityRowProps) {
  const isDone = status === 'done';
  const isInProgress = status === 'in_progress';

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
            color: isDone ? 'var(--ag-ink-hint)' : 'var(--ag-ink-primary)',
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

  // When a drag handle is provided, render it OUTSIDE the link so dragging
  // doesn't trigger navigation.
  if (dragHandle) {
    return (
      <li
        className="ag-activity-row"
        style={{
          listStyle: 'none',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          alignItems: 'center',
          gap: 'var(--ag-space-2)',
          borderBottom:
            '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
        }}
      >
        {dragHandle}
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
