'use client';

/**
 * DayColumn — single day swimlane in /week (mobile stacked / desktop column).
 *
 * Composition:
 *   - Header: "LUN 26 MAY" caption + activity count.
 *   - Droppable list of activities (already scheduled to that day).
 *   - Inline "+ Tarea" quick-add (title only).
 *
 * Drop target id is the day's ISO date string ("YYYY-MM-DD").
 */

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { DraggablePoolActivity, type PoolActivity } from './DraggablePoolActivity';

interface DayColumnProps {
  /** ISO YYYY-MM-DD used as droppable id. */
  isoDate: string;
  /** Short caption shown in the header (e.g. "LUN 26 MAY"). */
  caption: string;
  /** True if this day is "today" — accent header. */
  isToday: boolean;
  activities: PoolActivity[];
  onQuickAdd: (isoDate: string, title: string) => void;
  /** Optional: when true, render in compact desktop column mode. */
  compact?: boolean;
}

export function DayColumn({
  isoDate,
  caption,
  isToday,
  activities,
  onQuickAdd,
  compact = false,
}: DayColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: isoDate });
  const [draft, setDraft] = useState('');

  function submit() {
    const t = draft.trim();
    if (!t) return;
    onQuickAdd(isoDate, t);
    setDraft('');
  }

  return (
    <section
      aria-label={`Día ${caption}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-2)',
        backgroundColor: 'var(--ag-bg-elevated)',
        border: '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-card)',
        padding: 'var(--ag-space-3)',
        minWidth: compact ? 160 : 'auto',
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
            fontSize: 11,
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
          minHeight: 64,
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
              fontSize: 12,
              color: 'var(--ag-ink-hint)',
              textAlign: 'center',
              paddingBlock: 'var(--ag-space-1)',
            }}
          >
            Sin actividades.
          </li>
        ) : (
          activities.map((a) => <DraggablePoolActivity key={a.id} activity={a} />)
        )}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 'var(--ag-space-1)',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="+ Tarea"
          aria-label={`Agregar tarea a ${caption}`}
          style={{
            appearance: 'none',
            background: 'transparent',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-base)',
            padding: '6px 10px',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-primary)',
            outline: 'none',
            minWidth: 0,
          }}
        />
        <button
          type="submit"
          aria-label="Crear tarea"
          disabled={!draft.trim()}
          style={{
            appearance: 'none',
            background: 'transparent',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-base)',
            color: draft.trim() ? 'var(--ag-ink-primary)' : 'var(--ag-ink-hint)',
            cursor: draft.trim() ? 'pointer' : 'default',
            width: 28,
            height: 28,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={14} strokeWidth={1.75} />
        </button>
      </form>
    </section>
  );
}
