'use client';

/**
 * MonthDayCell — single day cell in the /month calendar grid.
 *
 * Responsibilities:
 *   - Render date number (top-left, dimmer for overflow days).
 *   - Render up to N activity chips, then a "+ N más" overflow caption.
 *   - Render a goal-deadline marker (Lucide Target) bottom-right colored by
 *     the goal's scope (Quarter / Year).
 *   - Be a dnd-kit droppable so the user can drag a task onto this day.
 *   - Be a button: tapping opens the parent's DayActivitiesSheet via
 *     `onSelect(isoDate)`.
 *
 * The cell does NOT render full activity rows — they would crowd the grid.
 * It uses tiny chips (title + first-letter project), and lets the bottom
 * sheet show the full DayRow-style list.
 */

import { useDroppable } from '@dnd-kit/core';
import { Target } from 'lucide-react';
import { memo, type CSSProperties } from 'react';

export interface MonthCellActivity {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
}

export interface MonthCellGoalMarker {
  id: string;
  title: string;
  scopeKind: 'quarter' | 'year' | '5year' | 'life';
}

interface MonthDayCellProps {
  /** ISO YYYY-MM-DD. */
  iso: string;
  /** "1".."31". */
  dayNumber: string;
  /** When false this cell belongs to the prev/next month (dim styling). */
  inCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  activities: MonthCellActivity[];
  goalMarkers: MonthCellGoalMarker[];
  /** Caller-controlled max chips shown before collapsing into "+ N más". */
  maxVisible?: number;
  onSelect: (iso: string) => void;
}

const SCOPE_VAR: Record<MonthCellGoalMarker['scopeKind'], string> = {
  quarter: 'var(--ag-scope-quarter)',
  year: 'var(--ag-scope-year)',
  '5year': 'var(--ag-scope-5year)',
  life: 'var(--ag-scope-life)',
};

function MonthDayCellInner({
  iso,
  dayNumber,
  inCurrentMonth,
  isToday,
  isPast,
  activities,
  goalMarkers,
  maxVisible = 3,
  onSelect,
}: MonthDayCellProps) {
  const { isOver, setNodeRef } = useDroppable({ id: `month-day-${iso}` });

  const visible = activities.slice(0, maxVisible);
  const overflow = Math.max(0, activities.length - visible.length);

  const cellStyle: CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minHeight: 60,
    padding: '4px 4px 4px 6px',
    backgroundColor: isToday
      ? 'var(--ag-bg-elevated)'
      : isOver
      ? 'var(--ag-bg-elevated)'
      : 'var(--ag-bg)',
    border: `1px solid ${
      isToday ? 'var(--ag-scope-day)' : isOver ? 'var(--ag-ink-soft)' : 'var(--ag-rule)'
    }`,
    borderRadius: 'var(--ag-radius-sm)',
    boxShadow: isToday
      ? '0 0 0 1px color-mix(in oklab, var(--ag-scope-day), transparent 70%)'
      : 'none',
    opacity: inCurrentMonth ? 1 : 0.55,
    cursor: 'pointer',
    textAlign: 'left',
    overflow: 'hidden',
    transition:
      'background-color var(--ag-duration-base) var(--ag-ease), border-color var(--ag-duration-base) var(--ag-ease)',
  };

  return (
    <button
      type="button"
      ref={setNodeRef}
      onClick={() => onSelect(iso)}
      aria-label={`Día ${dayNumber}, ${activities.length} ${
        activities.length === 1 ? 'actividad' : 'actividades'
      }`}
      className="ag-month-cell"
      style={cellStyle}
    >
      {/* Date number row */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 4,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 12,
            fontWeight: isToday ? 600 : 500,
            color: !inCurrentMonth
              ? 'var(--ag-ink-hint)'
              : isToday
              ? 'var(--ag-scope-day)'
              : isPast
              ? 'var(--ag-ink-hint)'
              : 'var(--ag-ink-soft)',
            lineHeight: 1,
          }}
        >
          {dayNumber}
        </span>
        {activities.length > 0 ? (
          <span
            aria-hidden
            style={{
              fontFamily: 'var(--ag-font-mono)',
              fontSize: 9,
              color: 'var(--ag-ink-hint)',
              lineHeight: 1,
            }}
          >
            {activities.length}
          </span>
        ) : null}
      </span>

      {/* Activity chips (compact) */}
      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minWidth: 0,
          flex: 1,
        }}
      >
        {visible.map((a) => (
          <span
            key={a.id}
            style={{
              display: 'block',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 10,
              lineHeight: 1.2,
              color:
                a.status === 'done' ? 'var(--ag-ink-hint)' : 'var(--ag-ink-primary)',
              textDecoration: a.status === 'done' ? 'line-through' : 'none',
              fontStyle: a.status === 'in_progress' ? 'italic' : 'normal',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              paddingInlineStart: 4,
              borderInlineStart: '2px solid var(--ag-rule)',
            }}
          >
            {a.title}
          </span>
        ))}
        {overflow > 0 ? (
          <span
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 10,
              color: 'var(--ag-ink-hint)',
              paddingInlineStart: 4,
            }}
          >
            + {overflow} más
          </span>
        ) : null}
      </span>

      {/* Goal markers (bottom-right). Render up to 2, stacked. */}
      {goalMarkers.length > 0 ? (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: 4,
            bottom: 4,
            display: 'inline-flex',
            gap: 2,
          }}
        >
          {goalMarkers.slice(0, 2).map((g) => (
            <span
              key={g.id}
              title={`${g.title} vence acá`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 14,
                height: 14,
                borderRadius: 'var(--ag-radius-pill)',
                color: SCOPE_VAR[g.scopeKind],
                backgroundColor:
                  'color-mix(in oklab, var(--ag-bg), transparent 0%)',
              }}
            >
              <Target size={11} strokeWidth={1.8} />
            </span>
          ))}
        </span>
      ) : null}
    </button>
  );
}

export const MonthDayCell = memo(MonthDayCellInner);
