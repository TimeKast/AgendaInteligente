'use client';

/**
 * SortableActivityRow — wraps ActivityRow with @dnd-kit/sortable so the row
 * can be reordered inside a SortableContext (DD-026).
 *
 * The visible drag handle is rendered via the `dragHandle` slot on ActivityRow
 * — that keeps the rest of the row tappable for navigation.
 */

import { GripVertical, MoreHorizontal } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ActivityRow } from './ActivityRow';
import type { ActivityStatus } from './ActivityRow';

interface SortableActivityRowProps {
  id: string;
  title: string;
  status: ActivityStatus;
  scheduledTime?: string;
  priority: number;
  projectLabel: string;
  href?: string;
  /** When provided, renders a "⋯" button after the row that opens the status modal. */
  onOpenStatus?: () => void;
}

export function SortableActivityRow(props: SortableActivityRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    backgroundColor: isDragging ? 'var(--ag-bg-elevated)' : 'transparent',
  };

  const handle = (
    <button
      type="button"
      aria-label={`Arrastrá para reordenar ${props.title}`}
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
    <div
      ref={setNodeRef}
      style={{ ...style, position: 'relative' }}
    >
      <ActivityRow {...rowProps} dragHandle={handle} trailingSlot={
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
      } />
    </div>
  );
}
