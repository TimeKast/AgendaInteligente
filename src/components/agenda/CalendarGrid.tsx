'use client';

/**
 * CalendarGrid — vertical list of HourSlot rows from `startHour` to `endHour`
 * in 30-minute granularity (each hour is split into :00 and :30 sub-slots).
 *
 * The caller supplies the contents of each slot via `slotsBySlot` (a Record
 * keyed by "HH:00"/"HH:30" → ReactNode list) and a set of `blockedSlots`
 * (slots blocked by external calendar events or multi-slot tasks).
 */

import type { CSSProperties, ReactNode } from 'react';
import { HourSlot } from './HourSlot';

/** Fixed pixel height of a 30-minute calendar slot. SSOT for resize math. */
export const SLOT_HEIGHT_PX = 30;
/** Derived: pixel height of a full hour. Kept for resize math compat. */
export const HOUR_HEIGHT_PX = SLOT_HEIGHT_PX * 2;
/** Minutes per slot — change-once to flip granularity. */
export const SLOT_MINUTES = 30;

interface CalendarGridProps {
  /** "HH" integer 0-23 — first hour shown (default 6). */
  startHour?: number;
  /** "HH" integer 0-23 — last hour shown inclusive (default 22). */
  endHour?: number;
  /** True while ANY drag is in flight (forwarded to each slot row). */
  isDragging: boolean;
  /** Per-slot children: keys are "HH:00"/"HH:30" strings, values are ReactNodes. */
  slotsBySlot: Record<string, ReactNode>;
  /** Slots where drops are disabled (blocked by external events). */
  blockedSlots?: Set<string>;
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function CalendarGrid({
  startHour = 6,
  endHour = 22,
  isDragging,
  slotsBySlot,
  blockedSlots,
}: CalendarGridProps) {
  const slots: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    slots.push(`${pad(h)}:00`);
    // Add the half-hour mark for every hour up to (but not past) endHour.
    if (h < endHour) slots.push(`${pad(h)}:30`);
  }

  // Expose SLOT_HEIGHT (and the legacy HOUR_HEIGHT) via CSS variables.
  // Resize logic reads HOUR_HEIGHT_PX from JS — single source for math.
  const gridStyle: CSSProperties = {
    ['--ag-slot-height' as string]: `${SLOT_HEIGHT_PX}px`,
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
        {slots.map((time) => (
          <HourSlot
            key={time}
            time={time}
            isDragging={isDragging}
            blocked={blockedSlots?.has(time) ?? false}
          >
            {slotsBySlot[time] ?? null}
          </HourSlot>
        ))}
      </div>
    </section>
  );
}
