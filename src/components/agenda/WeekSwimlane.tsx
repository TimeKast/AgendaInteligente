'use client';

/**
 * WeekSwimlane — 7-day vertical-stack planner for /week.
 *
 * Layout responsibility:
 *   Mobile (<1024px):
 *     - Sticky 7-day strip at the top (`WeekDayStrip`) — each button is a
 *       droppable AND a scroll-into-view jump for that day's section.
 *     - Below: full-width pool ("Pendientes sin día") with quick-add.
 *     - Below: 7 day sections stacked vertically, each full-width.
 *
 *   Desktop (≥1024px):
 *     - Pool sticky sidebar on the left (320px).
 *     - Canvas on the right: 7 day SECTIONS stacked vertically, each spanning
 *       the full canvas width.
 *
 * Multi-day assignment (Round 7):
 *   An activity now carries `scheduledDates: string[]` instead of a single
 *   `scheduledDate`. Semantics:
 *
 *     []                                → pool (no day assigned)
 *     ['2026-05-26']                    → one day
 *     ['2026-05-26','2026-05-28', ...]  → multiple days, renders in each
 *
 *   Drag semantics (kept MOVE, never copy):
 *     - Pool → day D                    → [D]
 *     - Pool ← any day (drop on pool)   → []
 *     - Day A → day B (single-day item) → replace A with B → [B]
 *     - Day A → day B (multi-day item)  → replace A with B inside the array,
 *                                          keeping the other days. Source day
 *                                          is inferred from the DragStart
 *                                          drop-source isoDate captured via
 *                                          composite drag id `aid::isoDate`.
 *   For copying onto more days, use the explicit MultiDayPicker (per-row
 *   icon button in DayRow) → no accidental duplicates via drag.
 */

import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { QuickAddDraft } from './ActivityQuickAdd';
import { WeekPoolSection } from './WeekPoolSection';
import { DayRow, type DayRowActivity } from './DayRow';
import { WeekDayStrip, type WeekDayStripDay } from './WeekDayStrip';
import type { PoolActivity } from './DraggablePoolActivity';
import { MultiDayPicker, buildWeekDays } from './MultiDayPicker';

export interface WeekSwimlaneActivity extends PoolActivity {
  /**
   * ISO YYYY-MM-DD entries. Empty array = pool. Order is preserved for
   * stability but Set semantics apply to membership (no duplicates).
   */
  scheduledDates: string[];
}

interface WeekSwimlaneProps {
  /** Sunday of the week being viewed. */
  weekStarting: Date;
  /** "Today" reference for highlighting the current day. */
  today: Date;
  /** Seed data — hardcoded by parent in the prototype. */
  seedActivities: WeekSwimlaneActivity[];
}

const DAY_LABEL_FMT = new Intl.DateTimeFormat('es-MX', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const DAY_LETTERS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

const DAY_BUTTON_PREFIX = 'day-button-';
const POOL_DROP_ID = 'week-pool';

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

function dayCaption(d: Date): string {
  return DAY_LABEL_FMT.format(d).replace(/\./g, '').toUpperCase();
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

/** Set-style add: returns a new array with `iso` present (no duplicates). */
function addDate(arr: string[], iso: string): string[] {
  return arr.includes(iso) ? arr : [...arr, iso];
}

/** Set-style remove: returns a new array without `iso`. */
function removeDate(arr: string[], iso: string): string[] {
  return arr.filter((d) => d !== iso);
}

export function WeekSwimlane({ weekStarting, today, seedActivities }: WeekSwimlaneProps) {
  const [activities, setActivities] = useState<WeekSwimlaneActivity[]>(() =>
    dedupeById(seedActivities),
  );
  const [pickerActivityId, setPickerActivityId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const days = useMemo(() => {
    const todayIso = toIsoDate(today);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(weekStarting, i);
      const iso = toIsoDate(d);
      return {
        iso,
        caption: dayCaption(d),
        letter: DAY_LETTERS[d.getDay()],
        dayNumber: String(d.getDate()),
        isToday: iso === todayIso,
      };
    });
  }, [weekStarting, today]);

  const stripDays: WeekDayStripDay[] = useMemo(
    () =>
      days.map((d) => ({
        iso: d.iso,
        letter: d.letter,
        dayNumber: d.dayNumber,
        isToday: d.isToday,
      })),
    [days],
  );

  const poolActivities = useMemo(
    () => activities.filter((a) => a.scheduledDates.length === 0),
    [activities],
  );

  const activitiesByDay = useMemo(() => {
    const map: Record<string, DayRowActivity[]> = {};
    for (const d of days) map[d.iso] = [];
    for (const a of activities) {
      for (const iso of a.scheduledDates) {
        if (map[iso]) {
          map[iso].push({ ...a, totalAssignedDays: a.scheduledDates.length });
        }
      }
    }
    return map;
  }, [activities, days]);

  function resolveDropTarget(overId: string): string | null {
    // Returns ISO date string or null = pool. Unknown drops → return special
    // sentinel by throwing; caller handles via try/catch is overkill — instead
    // we return null only for pool, ISO otherwise; unknown ids are ignored
    // upstream by the caller checking startsWith.
    if (overId === POOL_DROP_ID) return null;
    if (overId.startsWith(DAY_BUTTON_PREFIX)) return overId.slice(DAY_BUTTON_PREFIX.length);
    return overId;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    // Active id is composite when dragged from a day section: "aid::isoDate".
    // From the pool it's plain "aid". Parse accordingly.
    const rawId = String(active.id);
    const [activeId, sourceIso] = rawId.includes('::')
      ? (rawId.split('::') as [string, string])
      : [rawId, null];

    const overId = String(over.id);
    const target = resolveDropTarget(overId);

    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== activeId) return a;

        // Drop on pool → clear all dates.
        if (target === null) {
          return { ...a, scheduledDates: [] };
        }

        // Drop on a specific day:
        //   - If dragged from a day section (sourceIso known): replace
        //     sourceIso with target (preserves other dates of multi-day items).
        //   - If dragged from pool (no sourceIso): set to [target] only when
        //     it was empty; otherwise add to existing set (defensive).
        if (sourceIso) {
          // No-op when source == target (drop on its own day).
          if (sourceIso === target) return a;
          const without = removeDate(a.scheduledDates, sourceIso);
          return { ...a, scheduledDates: addDate(without, target) };
        }
        // Pool → day: single assignment (matches the documented contract).
        return { ...a, scheduledDates: [target] };
      }),
    );
  }

  function handleQuickAdd(draft: QuickAddDraft) {
    const id = `pool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setActivities((prev) => [
      ...prev,
      {
        id,
        title: draft.title,
        status: 'todo',
        projectLabel: draft.projectLabel,
        scheduledDates: [],
      },
    ]);
  }

  function handleSaveMultiDay(nextDates: string[]) {
    if (!pickerActivityId) return;
    const id = pickerActivityId;
    // Apply Set semantics + drop dates outside the visible week's day list
    // ONLY when they aren't deliberately preserved. Keep behavior simple here:
    // the picker only exposes the visible week's 7 days, so anything outside
    // would not appear as a chip → we still preserve it. But since user can
    // only toggle within the visible week, the new list IS the truth for
    // those 7 days. Off-week dates (none in this prototype) stay untouched.
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const weekIsos = new Set(days.map((d) => d.iso));
        const offWeek = a.scheduledDates.filter((iso) => !weekIsos.has(iso));
        // Dedupe with Set semantics — never store duplicates.
        const merged = Array.from(new Set([...offWeek, ...nextDates]));
        return { ...a, scheduledDates: merged };
      }),
    );
    setPickerActivityId(null);
  }

  const pickerActivity = pickerActivityId
    ? activities.find((a) => a.id === pickerActivityId) ?? null
    : null;

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      <div className="ag-week-strip-wrap">
        <WeekDayStrip days={stripDays} />
      </div>

      <div className="ag-week-swimlane">
        {/* Pool */}
        <div className="ag-week-swimlane__pool">
          <WeekPoolSection activities={poolActivities} onCreate={handleQuickAdd} />
        </div>

        {/* Day stack */}
        <div className="ag-week-swimlane__days">
          {days.map((d) => (
            <DayRow
              key={d.iso}
              isoDate={d.iso}
              caption={d.caption}
              isToday={d.isToday}
              activities={activitiesByDay[d.iso] ?? []}
              onOpenMultiDay={(activityId) => setPickerActivityId(activityId)}
            />
          ))}
        </div>
      </div>

      <MultiDayPicker
        open={pickerActivity !== null}
        activityTitle={pickerActivity?.title ?? ''}
        weekDays={buildWeekDays(weekStarting)}
        initialDates={
          pickerActivity
            ? pickerActivity.scheduledDates.filter((iso) =>
                days.some((d) => d.iso === iso),
              )
            : []
        }
        onCancel={() => setPickerActivityId(null)}
        onSave={handleSaveMultiDay}
      />

      <style>{`
        .ag-week-strip-wrap {
          display: block;
        }
        .ag-week-swimlane {
          display: flex;
          flex-direction: column;
          gap: var(--ag-space-4);
          padding-inline: var(--ag-space-4);
          padding-top: var(--ag-space-3);
        }
        .ag-week-swimlane__days {
          display: flex;
          flex-direction: column;
          gap: var(--ag-space-3);
        }
        @media (min-width: 1024px) {
          .ag-week-strip-wrap {
            display: none;
          }
          .ag-week-swimlane {
            flex-direction: row;
            align-items: flex-start;
            gap: var(--ag-space-5);
          }
          .ag-week-swimlane__pool {
            width: 320px;
            flex-shrink: 0;
            position: sticky;
            top: 80px;
          }
          .ag-week-swimlane__days {
            flex: 1;
            min-width: 0;
          }
        }
      `}</style>
    </DndContext>
  );
}
