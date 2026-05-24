'use client';

/**
 * MonthGrid — 7-column calendar grid for /month.
 *
 * Layout:
 *   - Day-of-week header row (L M X J V S D — locale convention is Sunday-
 *     last for this product, matching the Week shell which starts on Sunday;
 *     but the visual brief asked for "L M X J V S D" so weeks read Monday-
 *     first VISUALLY. Internally each row is still a Sunday-start week. We
 *     reconcile by laying out the cells in Monday-first order: convert each
 *     day's weekday index from getDay() to a Monday-first index).
 *
 *   - Body: 5 or 6 rows of 7 cells, padded with overflow cells from the
 *     previous and following month so every row is a complete week.
 *
 * The grid is responsive: small cells on mobile (min 50px tall), large cells
 * on desktop (min 100px tall). Sizing rules live entirely in CSS — the inner
 * <MonthDayCell> is unaware of the breakpoint.
 */

import { MonthDayCell, type MonthCellActivity, type MonthCellGoalMarker } from './MonthDayCell';

const DAY_HEADER = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Monday-first weekday index: 0 = Monday ... 6 = Sunday. */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

interface MonthGridProps {
  /** First day of the visible month. */
  monthStart: Date;
  /** Today's date (for `isToday` / `isPast` calc). */
  today: Date;
  /** Map ISO → activities to render in that cell. */
  activitiesByDay: Record<string, MonthCellActivity[]>;
  /** Map ISO → goal-deadline markers to render in that cell. */
  goalsByDay: Record<string, MonthCellGoalMarker[]>;
  onSelectDay: (iso: string) => void;
}

interface GridCell {
  iso: string;
  date: Date;
  inCurrentMonth: boolean;
}

function buildCells(monthStart: Date): GridCell[] {
  const month = monthStart.getMonth();
  // First day of the visible grid = Monday of the week containing the 1st.
  const firstWeekday = mondayIndex(monthStart);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - firstWeekday);

  // Always render whole weeks until we cover the full month. Compute how many
  // weeks the month spans (5 or 6) by checking where the last day lands.
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const daysSpan = firstWeekday + monthEnd.getDate();
  const rows = Math.ceil(daysSpan / 7);
  const totalCells = rows * 7;

  const cells: GridCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({
      iso: toIsoDate(d),
      date: d,
      inCurrentMonth: d.getMonth() === month,
    });
  }
  return cells;
}

export function MonthGrid({
  monthStart,
  today,
  activitiesByDay,
  goalsByDay,
  onSelectDay,
}: MonthGridProps) {
  const cells = buildCells(monthStart);
  const todayIso = toIsoDate(today);

  return (
    <section
      aria-label="Calendario del mes"
      className="ag-month-grid-wrap"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* Weekday header */}
      <div
        role="row"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          paddingBlock: 4,
          borderBottom: '1px solid var(--ag-rule)',
        }}
      >
        {DAY_HEADER.map((letter) => (
          <span
            key={letter}
            role="columnheader"
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ag-ink-hint)',
              textAlign: 'center',
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Body */}
      <div
        role="grid"
        className="ag-month-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
        }}
      >
        {cells.map((c) => {
          const dayNumber = String(c.date.getDate());
          const isToday = c.iso === todayIso;
          const isPast = c.iso < todayIso;
          const activities = activitiesByDay[c.iso] ?? [];
          const goalMarkers = goalsByDay[c.iso] ?? [];
          return (
            <MonthDayCell
              key={c.iso}
              iso={c.iso}
              dayNumber={dayNumber}
              inCurrentMonth={c.inCurrentMonth}
              isToday={isToday}
              isPast={isPast}
              activities={activities}
              goalMarkers={goalMarkers}
              onSelect={onSelectDay}
            />
          );
        })}
      </div>

      <style>{`
        .ag-month-grid > .ag-month-cell {
          min-height: 64px;
        }
        @media (min-width: 1024px) {
          .ag-month-grid > .ag-month-cell {
            min-height: 110px;
          }
        }
      `}</style>
    </section>
  );
}
