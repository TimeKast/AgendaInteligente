'use client';

/**
 * PoolSection — drop-target list of unscheduled tasks (no `scheduledTime`).
 *
 * Used for both:
 *   - "HOY SIN HORARIO" (today pool) → id = "pool:today"
 *   - "ESTA SEMANA"    (week pool, desktop sidebar only) → id = "pool:week"
 *
 * Visuals: uppercase caption label + bordered ul list. When a drag is active,
 * a faint bg-elevated tint signals the drop target; an italic "Soltá acá"
 * hint appears if the pool is empty.
 */

import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';

interface PoolSectionProps {
  /** Unique droppable id (e.g. "pool:today"). */
  id: string;
  /** Caption label, rendered uppercase. */
  label: string;
  /** True while ANY drag is in flight. */
  isDragging: boolean;
  /** True when the underlying list has no items (controls the empty hint). */
  empty: boolean;
  children: ReactNode;
  /** Optional footer (e.g. inline ActivityQuickAdd). */
  footer?: ReactNode;
}

export function PoolSection({
  id,
  label,
  isDragging,
  empty,
  children,
  footer,
}: PoolSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section aria-label={label}>
      <p
        style={{
          margin: 0,
          paddingBlock: 'var(--ag-space-2)',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.12em',
          color: 'var(--ag-ink-hint)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </p>
      <div
        ref={setNodeRef}
        style={{
          backgroundColor:
            isOver && isDragging
              ? 'color-mix(in oklab, var(--ag-bg-elevated), transparent 30%)'
              : 'transparent',
          borderRadius: 'var(--ag-radius-base)',
          transition: 'background-color 160ms ease-out',
          minHeight: empty ? 56 : undefined,
        }}
      >
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{children}</ul>
        {empty && isDragging ? (
          <p
            style={{
              margin: 0,
              paddingBlock: 'var(--ag-space-2)',
              paddingInline: 'var(--ag-space-2)',
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--ag-ink-hint)',
              opacity: 0.85,
            }}
          >
            Soltá acá
          </p>
        ) : null}
        {empty && !isDragging ? (
          <p
            style={{
              margin: 0,
              paddingBlock: 'var(--ag-space-2)',
              paddingInline: 'var(--ag-space-2)',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              color: 'var(--ag-ink-hint)',
            }}
          >
            Sin actividades.
          </p>
        ) : null}
      </div>
      {footer ?? null}
    </section>
  );
}
