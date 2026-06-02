'use client';

/**
 * DraggablePoolActivity — single draggable activity row used inside the
 * week pool and day columns on /week.
 *
 * Compact visual: checkbox-like marker + title + small project chip.
 * NO scheduledTime (the Week scope doesn't deal with times).
 */

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { DeadlineBadge } from './DeadlineBadge';

export interface PoolActivity {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  projectLabel: string;
  /** Optional ISO YYYY-MM-DD deadline. Surfaced via DeadlineBadge inline. */
  deadline?: string;
  /** 0-100 progress. Independent from status. Renders a thin bottom bar. */
  progressPercent?: number;
}

interface DraggablePoolActivityProps {
  activity: PoolActivity;
  /**
   * Optional trailing slot rendered AFTER the project label (e.g. a "+ días"
   * icon button to open the MultiDayPicker). Lives outside the drag listeners
   * so taps don't trigger drag.
   */
  trailingSlot?: React.ReactNode;
  /**
   * Optional inline caption rendered below the row (italic serif ink-hint).
   * Used for the "+ N días más" multi-day indicator.
   */
  inlineCaption?: string;
  /**
   * Optional extra caption slot rendered BELOW `inlineCaption`. Free-form
   * React node — used by /week + /month to inject the "Movido desde [día]"
   * indicator when a task drifted from its planned position.
   */
  extraCaption?: React.ReactNode;
  /**
   * Override the dnd-kit draggable id. Used by WeekSwimlane to encode the
   * source day via a composite id ("aid::isoDate") so the drag handler can
   * preserve other dates of multi-day items when moving between days. When
   * omitted, defaults to `activity.id`.
   */
  dragId?: string;
}

export function DraggablePoolActivity({
  activity,
  trailingSlot,
  inlineCaption,
  extraCaption,
  dragId,
}: DraggablePoolActivityProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId ?? activity.id,
  });

  const isDone = activity.status === 'done';
  const isInProgress = activity.status === 'in_progress';
  const showProgress = !isDone && (activity.progressPercent ?? 0) > 0;

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: 'var(--ag-bg)',
    border: '1px solid var(--ag-rule)',
    borderRadius: 'var(--ag-radius-base)',
    overflow: 'hidden',
  };

  const innerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: trailingSlot
      ? 'auto auto 1fr auto auto auto'
      : activity.deadline
        ? 'auto auto 1fr auto auto'
        : 'auto auto 1fr auto',
    alignItems: 'center',
    gap: 'var(--ag-space-2)',
    padding: '6px 8px',
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  };

  return (
    <li ref={setNodeRef} style={wrapperStyle}>
      <div style={innerStyle} {...attributes} {...listeners}>
        <span
          aria-hidden
          style={{
            color: 'var(--ag-ink-hint)',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <GripVertical size={14} strokeWidth={1.5} />
        </span>
        <span
          aria-label={isDone ? 'Hecha' : 'Por hacer'}
          style={{
            display: 'inline-block',
            width: 14,
            height: 14,
            borderRadius: 'var(--ag-radius-xs)',
            backgroundColor: isDone ? 'var(--ag-ink-primary)' : 'transparent',
            boxShadow: isDone
              ? 'inset 0 0 0 1px var(--ag-ink-primary)'
              : 'inset 0 0 0 1px var(--ag-rule)',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: isDone ? 'var(--ag-ink-hint)' : 'var(--ag-ink-primary)',
            textDecoration: isDone ? 'line-through' : 'none',
            fontStyle: isInProgress ? 'italic' : 'normal',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {activity.title}
        </span>
        <span
          style={{
            fontFamily: 'var(--ag-font-mono)',
            fontSize: 10,
            color: 'var(--ag-slate)',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}
        >
          {activity.projectLabel}
        </span>
        {activity.deadline ? <DeadlineBadge deadline={activity.deadline} /> : null}
      </div>

      {trailingSlot ? (
        <div
          style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          {trailingSlot}
        </div>
      ) : null}

      {inlineCaption ? (
        <span
          style={{
            display: 'block',
            paddingInline: 8,
            paddingBottom: 4,
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 11,
            color: 'var(--ag-ink-hint)',
          }}
        >
          {inlineCaption}
        </span>
      ) : null}

      {extraCaption ? (
        <span
          style={{
            display: 'block',
            paddingInline: 8,
            paddingBottom: 4,
          }}
        >
          {extraCaption}
        </span>
      ) : null}

      {showProgress ? (
        <span
          aria-label={`Avance ${activity.progressPercent}%`}
          style={{
            display: 'block',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 2,
            backgroundColor: 'var(--ag-rule)',
          }}
        >
          <span
            aria-hidden
            style={{
              display: 'block',
              width: `${Math.max(0, Math.min(100, activity.progressPercent ?? 0))}%`,
              height: '100%',
              backgroundColor: 'var(--ag-ink-soft)',
            }}
          />
        </span>
      ) : null}
    </li>
  );
}
