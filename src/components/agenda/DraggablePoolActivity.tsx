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

export interface PoolActivity {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  projectLabel: string;
}

interface DraggablePoolActivityProps {
  activity: PoolActivity;
}

export function DraggablePoolActivity({ activity }: DraggablePoolActivityProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: activity.id,
  });

  const isDone = activity.status === 'done';
  const isInProgress = activity.status === 'in_progress';

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    display: 'grid',
    gridTemplateColumns: 'auto auto 1fr auto',
    alignItems: 'center',
    gap: 'var(--ag-space-2)',
    padding: '6px 8px',
    backgroundColor: 'var(--ag-bg)',
    border: '1px solid var(--ag-rule)',
    borderRadius: 'var(--ag-radius-base)',
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
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
        aria-label={isDone ? 'Hecho' : 'Pendiente'}
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
    </li>
  );
}
