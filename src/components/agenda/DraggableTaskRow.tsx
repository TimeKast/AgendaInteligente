'use client';

/**
 * DraggableTaskRow — wraps ActivityRow with @dnd-kit/core `useDraggable` so a
 * row can be picked up from the pool or an hour slot and dropped on a
 * different drop target (hour slot or pool).
 *
 * Replaces SortableActivityRow for the new Today UX where reorder-within-list
 * is no longer the primary gesture — instead, drag = schedule/unschedule by
 * hour. The drag handle is the left grip (kept outside the row's <Link> so
 * taps still navigate to detail).
 *
 * Props mirror ActivityRow's contract plus an `id` for dnd-kit identity and an
 * optional `onOpenStatus` for the trailing "⋯" menu (status modal).
 */

import { GripVertical, MoreHorizontal } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ActivityRow, type ActivityStatus } from './ActivityRow';

interface DraggableTaskRowProps {
  id: string;
  title: string;
  status: ActivityStatus;
  scheduledTime?: string;
  priority: number;
  projectLabel: string;
  href?: string;
  /** When provided, renders a "⋯" button at the trailing edge. */
  onOpenStatus?: () => void;
  /** Disable drag entirely (e.g. external/Google events). */
  draggable?: boolean;
}

export function DraggableTaskRow(props: DraggableTaskRowProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: props.id,
    disabled: props.draggable === false,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    backgroundColor: isDragging ? 'var(--ag-bg-elevated)' : 'transparent',
    position: 'relative',
  };

  const handle = props.draggable === false ? null : (
    <button
      type="button"
      aria-label={`Arrastrá ${props.title}`}
      {...attributes}
      {...listeners}
      style={{
        appearance: 'none',
        background: 'transparent',
        border: 'none',
        color: 'var(--ag-ink-hint)',
        cursor: 'grab',
        touchAction: 'none',
        padding: 4,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <GripVertical size={16} strokeWidth={1.5} aria-hidden />
    </button>
  );

  const { onOpenStatus, ...rowProps } = props;

  return (
    <div ref={setNodeRef} style={style}>
      <ActivityRow
        {...rowProps}
        dragHandle={handle}
        trailingSlot={
          onOpenStatus ? (
            <button
              type="button"
              aria-label={`Cambiar status de ${props.title}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenStatus();
              }}
              style={{
                appearance: 'none',
                background: 'transparent',
                border: 'none',
                color: 'var(--ag-ink-hint)',
                cursor: 'pointer',
                padding: 4,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MoreHorizontal size={16} strokeWidth={1.5} aria-hidden />
            </button>
          ) : undefined
        }
      />
    </div>
  );
}
