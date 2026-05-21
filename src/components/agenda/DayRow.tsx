'use client';

/**
 * DayRow — single day section in /week's vertical day-stack layout.
 *
 * Replaces the old `DayColumn` (which was a narrow side-by-side column).
 * Now every day spans the full canvas width:
 *
 *   - Mobile: each day is a full-width section stacked vertically.
 *   - Desktop: each day is also a full-width row inside the canvas; multiple
 *     activities flow as chips horizontally (flex-wrap) instead of stacking
 *     into cramped columns.
 *
 * Composition:
 *   - Header: uppercase caption (e.g. "LUN 26 MAY") + activity count badge.
 *   - Droppable activity list ({@link useDroppable} id = `isoDate`).
 *
 * The "+ Tarea" inline quick-add was removed (per user feedback); all new
 * activities go to the pool first and are dragged onto a day.
 */

import { useDroppable } from '@dnd-kit/core';
import { DraggablePoolActivity, type PoolActivity } from './DraggablePoolActivity';

interface DayRowProps {
  /** ISO YYYY-MM-DD used as droppable id AND the section's DOM id (for the
   *  mobile day-strip's scroll-into-view jump). */
  isoDate: string;
  /** Short caption shown in the header (e.g. "LUN 26 MAY"). */
  caption: string;
  /** True if this day is "today" — accent header + ring. */
  isToday: boolean;
  activities: PoolActivity[];
}

export function DayRow({ isoDate, caption, isToday, activities }: DayRowProps) {
  const { isOver, setNodeRef } = useDroppable({ id: isoDate });

  return (
    <section
      id={`day-section-${isoDate}`}
      aria-label={`Día ${caption}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-2)',
        backgroundColor: 'var(--ag-bg-elevated)',
        border: `1px solid ${isToday ? 'var(--ag-scope-day)' : 'var(--ag-rule)'}`,
        borderRadius: 'var(--ag-radius-card)',
        padding: 'var(--ag-space-3)',
        scrollMarginTop: 96,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 'var(--ag-space-2)',
          paddingBottom: 'var(--ag-space-1)',
          borderBottom: '1px solid var(--ag-rule)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 12,
            fontWeight: isToday ? 600 : 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: isToday ? 'var(--ag-scope-day)' : 'var(--ag-slate)',
          }}
        >
          {caption}
        </span>
        <span
          style={{
            fontFamily: 'var(--ag-font-mono)',
            fontSize: 11,
            color: 'var(--ag-ink-hint)',
          }}
        >
          {activities.length}
        </span>
      </header>

      <ul
        ref={setNodeRef}
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 'var(--ag-space-1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-1)',
          minHeight: 56,
          backgroundColor: isOver ? 'var(--ag-bg)' : 'transparent',
          border: `1px dashed ${isOver ? 'var(--ag-ink-soft)' : 'transparent'}`,
          borderRadius: 'var(--ag-radius-base)',
          transition: `background-color var(--ag-duration-base) var(--ag-ease)`,
        }}
      >
        {activities.length === 0 ? (
          <li
            style={{
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--ag-ink-hint)',
              textAlign: 'center',
              paddingBlock: 'var(--ag-space-2)',
            }}
          >
            Sin tareas. Asigna desde pendientes.
          </li>
        ) : (
          activities.map((a) => <DraggablePoolActivity key={a.id} activity={a} />)
        )}
      </ul>
    </section>
  );
}
