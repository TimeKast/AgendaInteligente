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
 * Each activity row gets a small "+ días" Calendar icon button that calls
 * `onOpenMultiDay` so WeekSwimlane can pop the MultiDayPicker modal. Same
 * activity may appear in multiple DayRows when assigned to several dates —
 * by design (see WeekSwimlane).
 */

import { useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { CalendarPlus, Plus } from 'lucide-react';
import { DraggablePoolActivity, type PoolActivity } from './DraggablePoolActivity';
import { MovedFromIndicator } from './PlanSnapshotControls';

export interface DayRowActivity extends PoolActivity {
  /**
   * Total number of days this activity is assigned to. When > 1, an inline
   * "+ N días más" caption renders below the row.
   */
  totalAssignedDays: number;
  /**
   * If set, the activity was at this label in the plan snapshot but has
   * since been moved off it. Renders the MovedFromIndicator below the row.
   */
  movedFromLabel?: string;
}

interface DayRowProps {
  /** ISO YYYY-MM-DD used as droppable id AND the section's DOM id (for the
   *  mobile day-strip's scroll-into-view jump). */
  isoDate: string;
  /** Short caption shown in the header (e.g. "LUN 26 MAY"). */
  caption: string;
  /** True if this day is "today" — accent header + ring. */
  isToday: boolean;
  activities: DayRowActivity[];
  /** Open multi-day picker for the given activity id. */
  onOpenMultiDay: (activityId: string) => void;
  /** Tap "+" in the day header → quick-add anchored at the button element. */
  onQuickAdd?: (isoDate: string, anchor: HTMLElement) => void;
}

export function DayRow({
  isoDate,
  caption,
  isToday,
  activities,
  onOpenMultiDay,
  onQuickAdd,
}: DayRowProps) {
  const { isOver, setNodeRef } = useDroppable({ id: isoDate });
  const addButtonRef = useRef<HTMLButtonElement>(null);

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
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--ag-space-2)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--ag-font-mono)',
              fontSize: 11,
              color: 'var(--ag-ink-hint)',
            }}
          >
            {activities.length}
          </span>
          {onQuickAdd ? (
            <button
              ref={addButtonRef}
              type="button"
              aria-label={`Agregar tarea a ${caption}`}
              title="Agregar tarea"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (addButtonRef.current) onQuickAdd(isoDate, addButtonRef.current);
              }}
              style={{
                appearance: 'none',
                background: 'transparent',
                border: 'none',
                color: 'var(--ag-ink-hint)',
                cursor: 'pointer',
                padding: 2,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              <Plus size={14} strokeWidth={1.5} aria-hidden />
            </button>
          ) : null}
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
          activities.map((a) => {
            const extra = a.totalAssignedDays - 1;
            // Use a composite key — same activity id can render in multiple
            // DayRows when assigned to multiple dates, so isoDate disambiguates.
            return (
              <DraggablePoolActivity
                key={`${a.id}::${isoDate}`}
                activity={a}
                dragId={`${a.id}::${isoDate}`}
                inlineCaption={extra > 0 ? `+ ${extra} ${extra === 1 ? 'día más' : 'días más'}` : undefined}
                extraCaption={
                  a.movedFromLabel ? (
                    <MovedFromIndicator fromLabel={a.movedFromLabel} />
                  ) : undefined
                }
                trailingSlot={
                  <button
                    type="button"
                    aria-label={`Asignar ${a.title} a más días`}
                    title="Asignar a más días"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onOpenMultiDay(a.id);
                    }}
                    onPointerDown={(e) => {
                      // Don't let dnd-kit's PointerSensor pick this up as a drag.
                      e.stopPropagation();
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
                    <CalendarPlus size={14} strokeWidth={1.5} aria-hidden />
                  </button>
                }
              />
            );
          })
        )}
      </ul>
    </section>
  );
}
