'use client';

/**
 * CalendarGrid — vertical list of HourSlot rows from `startHour` to `endHour`
 * (inclusive, 1-hour granularity). Renders an uppercase "AGENDA" caption
 * label at the top.
 *
 * The caller supplies the contents of each hour via `slotsByHour` (a Record
 * keyed by "HH:00" → ReactNode list) and a set of `blockedHours` (hours that
 * have an external Google event blocking the slot).
 */

import type { CSSProperties, ReactNode } from 'react';
import { HourSlot } from './HourSlot';

/** Fixed pixel height of a 1-hour calendar slot. SSOT for resize math. */
export const HOUR_HEIGHT_PX = 60;

interface CalendarGridProps {
  /** "HH" integer 0-23 — first hour shown (default 6). */
  startHour?: number;
  /** "HH" integer 0-23 — last hour shown inclusive (default 22). */
  endHour?: number;
  /** True while ANY drag is in flight (forwarded to each HourSlot). */
  isDragging: boolean;
  /** Per-hour children: keys are "HH:00" strings, values are ReactNodes. */
  slotsByHour: Record<string, ReactNode>;
  /** Hours where drops are disabled (blocked by external events). */
  blockedHours?: Set<string>;
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function CalendarGrid({
  startHour = 6,
  endHour = 22,
  isDragging,
  slotsByHour,
  blockedHours,
}: CalendarGridProps) {
  const hours: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    hours.push(`${pad(h)}:00`);
  }

  // Expose HOUR_HEIGHT to descendant slots/rows via CSS variable. Resize
  // logic reads the same constant from JS (HOUR_HEIGHT_PX) — single source.
  const gridStyle: CSSProperties = {
    ['--ag-hour-height' as string]: `${HOUR_HEIGHT_PX}px`,
  };

  return (
    <section aria-label="Agenda por hora" style={gridStyle}>
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
        Agenda
      </p>
      <div>
        {hours.map((time) => (
          <HourSlot
            key={time}
            time={time}
            isDragging={isDragging}
            blocked={blockedHours?.has(time) ?? false}
          >
            {slotsByHour[time] ?? null}
          </HourSlot>
        ))}
      </div>
    </section>
  );
}
