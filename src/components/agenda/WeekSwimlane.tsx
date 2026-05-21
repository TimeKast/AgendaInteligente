'use client';

/**
 * WeekSwimlane — 7-day vertical-stack planner for /week.
 *
 * REFACTOR (Round 5): the previous "7 narrow horizontal columns" layout was
 * too cramped on mobile (and made it impossible to drag from the pool onto a
 * far-away day without first scrolling). New layout:
 *
 *   Mobile (<1024px):
 *     - Sticky 7-day strip at the top (`WeekDayStrip`) — each button is a
 *       droppable AND a scroll-into-view jump for that day's section.
 *     - Below: full-width pool ("Pendientes sin día") with quick-add.
 *     - Below: 7 day sections stacked vertically, each full-width.
 *
 *   Desktop (≥1024px):
 *     - Pool sticky sidebar on the left (320px).
 *     - Canvas on the right: 7 day SECTIONS stacked vertically, each spanning
 *       the full canvas width. Days are no longer cramped narrow columns.
 *
 * Single source of truth: ONE `activities` array. Pool vs. day membership is
 * derived via `useMemo` on `scheduledDate`. Drag handlers always MUTATE the
 * matching entry by id (`map`), never push duplicates. Each activity can only
 * appear in one place (pool OR a single day) by construction.
 *
 * Drop targets handled by `onDragEnd`:
 *   - `week-pool`              → clears scheduledDate (back to pool).
 *   - `YYYY-MM-DD`             → day section drop.
 *   - `day-button-YYYY-MM-DD`  → mobile day-strip drop (same semantics).
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
import { DayRow } from './DayRow';
import { WeekDayStrip, type WeekDayStripDay } from './WeekDayStrip';
import type { PoolActivity } from './DraggablePoolActivity';

interface WeekSwimlaneActivity extends PoolActivity {
  /** ISO YYYY-MM-DD or null = pool. */
  scheduledDate: string | null;
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
  // "lun. 26 may" → "LUN 26 MAY"
  return DAY_LABEL_FMT.format(d).replace(/\./g, '').toUpperCase();
}

/**
 * Defensive dedupe — guarantees we never render two entries with the same id
 * even if seed data accidentally repeats one. Keeps the first occurrence,
 * drops the rest.
 */
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

export function WeekSwimlane({ weekStarting, today, seedActivities }: WeekSwimlaneProps) {
  const [activities, setActivities] = useState<WeekSwimlaneActivity[]>(() =>
    dedupeById(seedActivities),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // 7 day descriptors for the week being viewed.
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

  // Derived slices — single source of truth means duplicates are structurally
  // impossible: each activity belongs to exactly one bucket (pool OR a day)
  // based on its scheduledDate, never both.
  const poolActivities = useMemo(
    () => activities.filter((a) => a.scheduledDate === null),
    [activities],
  );

  const activitiesByDay = useMemo(() => {
    const map: Record<string, WeekSwimlaneActivity[]> = {};
    for (const d of days) map[d.iso] = [];
    for (const a of activities) {
      if (a.scheduledDate && map[a.scheduledDate]) {
        map[a.scheduledDate].push(a);
      }
    }
    return map;
  }, [activities, days]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Resolve target scheduledDate (null = pool, else YYYY-MM-DD).
    let nextScheduledDate: string | null;
    if (overId === POOL_DROP_ID) {
      nextScheduledDate = null;
    } else if (overId.startsWith(DAY_BUTTON_PREFIX)) {
      nextScheduledDate = overId.slice(DAY_BUTTON_PREFIX.length);
    } else {
      // Plain day-section drop target — the id IS the iso date.
      nextScheduledDate = overId;
    }

    setActivities((prev) =>
      prev.map((a) =>
        a.id === activeId ? { ...a, scheduledDate: nextScheduledDate } : a,
      ),
    );
  }

  function handleQuickAdd(draft: QuickAddDraft) {
    // Pool quick-add: new activities always land in the pool, regardless of
    // the dateLabel the user picked. Assigning a date is a deliberate drag.
    const id = `pool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setActivities((prev) => [
      ...prev,
      {
        id,
        title: draft.title,
        status: 'todo',
        projectLabel: draft.projectLabel,
        scheduledDate: null,
      },
    ]);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      {/* Mobile-only sticky day-strip — hidden on desktop via CSS. */}
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
            />
          ))}
        </div>
      </div>

      <style>{`
        .ag-week-strip-wrap {
          /* Mobile-only — hidden on desktop where the sticky sidebar pool +
             vertical day rows already make jumping unnecessary. */
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
