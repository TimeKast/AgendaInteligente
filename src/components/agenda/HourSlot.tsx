'use client';

/**
 * HourSlot — one row of the calendar grid representing a single hour
 * (e.g. "08:00"). Renders:
 *   - A monospaced time label on the LEFT (fixed 56px column).
 *   - A drop-target slot area on the RIGHT that:
 *       · receives drops via @dnd-kit `useDroppable` (id = `hour:HH:mm`)
 *       · renders any task children inside (zero or more `DraggableTaskRow`)
 *       · renders external Google events as decorative blockers
 *       · shows an italic "Soltá acá" hint when a drag is active and the slot
 *         is empty
 *
 * Visual:
 *   - 1px warm-ecru horizontal rule baseline (the calendar look).
 *   - On hover during drag: subtle bg-elevated tint.
 *   - Min height 48px so even empty slots are obviously click/drop targets.
 */

import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';

interface HourSlotProps {
  /** "HH:mm" — used both for display and as the droppable id (`hour:HH:mm`). */
  time: string;
  /** True while ANY drag is in flight (controls the drop hint visibility). */
  isDragging: boolean;
  /** When true, drop highlight + hint render only on the active hover. */
  blocked?: boolean;
  children?: ReactNode;
}

export function HourSlot({ time, isDragging, blocked = false, children }: HourSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `hour:${time}`,
    disabled: blocked,
  });

  const hasChildren =
    Array.isArray(children) ? children.filter(Boolean).length > 0 : Boolean(children);

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'grid',
        gridTemplateColumns: '56px 1fr',
        alignItems: 'stretch',
        minHeight: 48,
        borderTop: '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
        backgroundColor:
          isOver && isDragging && !blocked
            ? 'color-mix(in oklab, var(--ag-bg-elevated), transparent 30%)'
            : 'transparent',
        transition: 'background-color 160ms ease-out',
      }}
    >
      <div
        style={{
          padding: '6px 8px 0 0',
          textAlign: 'right',
          fontFamily: 'var(--ag-font-mono)',
          fontSize: 11,
          color: 'var(--ag-ink-hint)',
          letterSpacing: '0.02em',
          userSelect: 'none',
        }}
      >
        {time}
      </div>
      <div
        style={{
          padding: '4px 0 4px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          minWidth: 0,
        }}
      >
        {children}
        {isDragging && !hasChildren && !blocked ? (
          <p
            style={{
              margin: 0,
              paddingBlock: 4,
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 12,
              color: 'var(--ag-ink-hint)',
              opacity: 0.8,
            }}
          >
            Soltá acá
          </p>
        ) : null}
      </div>
    </div>
  );
}
