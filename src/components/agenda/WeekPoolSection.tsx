'use client';

/**
 * WeekPoolSection — "PENDIENTES SIN DÍA" droppable section for /week.
 *
 * Receives activities without scheduledDate. User can drag them out to any
 * day section (or back). The single quick-add entry point for the Week scope
 * lives here — all new activities land in the pool first, then the user
 * drags them onto a day. No per-day "+ Tarea" anymore (per user feedback).
 *
 * Mobile: full-width section above the day stack.
 * Desktop: 320px sticky sidebar (caller wraps it accordingly).
 */

import { useDroppable } from '@dnd-kit/core';
import { ActivityQuickAdd, type QuickAddDraft } from './ActivityQuickAdd';
import { DraggablePoolActivity, type PoolActivity } from './DraggablePoolActivity';

interface WeekPoolSectionProps {
  activities: PoolActivity[];
  onCreate: (draft: QuickAddDraft) => void;
}

export function WeekPoolSection({ activities, onCreate }: WeekPoolSectionProps) {
  const { isOver, setNodeRef } = useDroppable({ id: 'week-pool' });

  return (
    <section
      aria-labelledby="ag-week-pool-heading"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-2)',
      }}
    >
      <h2
        id="ag-week-pool-heading"
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-body)',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ag-slate)',
        }}
      >
        Pendientes sin día · {activities.length}
      </h2>

      <ul
        ref={setNodeRef}
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 'var(--ag-space-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-1)',
          minHeight: 64,
          backgroundColor: isOver ? 'var(--ag-bg-elevated)' : 'transparent',
          border: `1px dashed ${isOver ? 'var(--ag-ink-soft)' : 'var(--ag-rule)'}`,
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
            Sin pendientes.
          </li>
        ) : (
          activities.map((a) => <DraggablePoolActivity key={a.id} activity={a} />)
        )}
      </ul>

      <ActivityQuickAdd onCreate={onCreate} />
    </section>
  );
}
