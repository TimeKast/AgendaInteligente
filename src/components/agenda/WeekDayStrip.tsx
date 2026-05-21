'use client';

/**
 * WeekDayStrip — mobile-only sticky 7-day mini-button strip for /week.
 *
 * Solves two mobile UX problems with the previous cramped-column layout:
 *
 *   1. **Drag-to-any-day without scrolling.** Each button is registered as a
 *      droppable via {@link useDroppable} with id `day-button-{isoDate}`. The
 *      caller's drag handler treats those drop ids the same as `isoDate` drops
 *      onto the day's section below — so users can drag a task from the
 *      pool to e.g. Saturday without scrolling down through all 6 prior days.
 *
 *   2. **Quick navigation.** Tapping a button scrolls the matching day section
 *      into view (`#day-section-{isoDate}`).
 *
 * Visual: 7 evenly spaced compact buttons (`L 26`, `M 27`, ...). Today
 * highlighted with the `--ag-scope-day` ring; an active drop hover lifts the
 * background to `--ag-bg`. Sticky at the top of the scroll container.
 */

import { useDroppable } from '@dnd-kit/core';

export interface WeekDayStripDay {
  iso: string;
  /** Single-letter weekday label (L M X J V S D). */
  letter: string;
  /** Day-of-month number ("26"). */
  dayNumber: string;
  isToday: boolean;
}

interface WeekDayStripProps {
  days: WeekDayStripDay[];
}

export function WeekDayStrip({ days }: WeekDayStripProps) {
  function jumpTo(iso: string) {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(`day-section-${iso}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div
      role="navigation"
      aria-label="Saltar a un día de la semana"
      className="ag-week-day-strip"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 'var(--ag-space-1)',
        padding: 'var(--ag-space-2) var(--ag-space-3)',
        backgroundColor: 'var(--ag-bg-elevated)',
        borderBottom: '1px solid var(--ag-rule)',
        backdropFilter: 'saturate(140%)',
      }}
    >
      {days.map((d) => (
        <WeekDayStripButton key={d.iso} day={d} onJump={() => jumpTo(d.iso)} />
      ))}
    </div>
  );
}

function WeekDayStripButton({
  day,
  onJump,
}: {
  day: WeekDayStripDay;
  onJump: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `day-button-${day.iso}` });

  return (
    <button
      type="button"
      ref={setNodeRef}
      onClick={onJump}
      aria-label={`Día ${day.letter} ${day.dayNumber}`}
      style={{
        appearance: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        padding: '6px 0',
        backgroundColor: isOver ? 'var(--ag-bg)' : 'transparent',
        border: `1px solid ${
          day.isToday ? 'var(--ag-scope-day)' : isOver ? 'var(--ag-ink-soft)' : 'var(--ag-rule)'
        }`,
        borderRadius: 'var(--ag-radius-base)',
        cursor: 'pointer',
        transition: `background-color var(--ag-duration-base) var(--ag-ease), border-color var(--ag-duration-base) var(--ag-ease)`,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: day.isToday ? 'var(--ag-scope-day)' : 'var(--ag-slate)',
        }}
      >
        {day.letter}
      </span>
      <span
        style={{
          fontFamily: 'var(--ag-font-mono)',
          fontSize: 13,
          fontWeight: day.isToday ? 600 : 500,
          color: day.isToday ? 'var(--ag-scope-day)' : 'var(--ag-ink-primary)',
        }}
      >
        {day.dayNumber}
      </span>
    </button>
  );
}
