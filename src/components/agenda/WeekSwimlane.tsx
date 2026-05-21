'use client';

/**
 * WeekSwimlane — 7-day planning grid for /week.
 *
 * Mobile (<1024px): pool on top, 7 day columns stacked vertically.
 * Desktop (≥1024px): pool sidebar left (240px), 7 day columns horizontal right.
 *
 * Owns the @dnd-kit DndContext. Drop targets:
 *   - "week-pool"   → clears scheduledDate.
 *   - "YYYY-MM-DD"  → sets scheduledDate to that day.
 *
 * State is purely local (useState) — visual prototype, no persistence.
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
import { WeekPoolSection } from './WeekPoolSection';
import { DayColumn } from './DayColumn';
import type { PoolActivity } from './DraggablePoolActivity';

interface WeekSwimlaneActivity extends PoolActivity {
  /** ISO YYYY-MM-DD or null = pool. */
  scheduledDate: string | null;
}

interface WeekSwimlaneProps {
  /** Sunday of the week being viewed. */
  weekStarting: Date;
  /** "Today" reference for highlighting the current day column. */
  today: Date;
  /** Seed data — hardcoded by parent in the prototype. */
  seedActivities: WeekSwimlaneActivity[];
}

const DAY_LABEL_FMT = new Intl.DateTimeFormat('es-MX', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

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
  return DAY_LABEL_FMT.format(d)
    .replace(/\./g, '')
    .toUpperCase();
}

export function WeekSwimlane({ weekStarting, today, seedActivities }: WeekSwimlaneProps) {
  const [activities, setActivities] = useState<WeekSwimlaneActivity[]>(seedActivities);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Build the 7 day descriptors for the week being viewed.
  const days = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const d = addDays(weekStarting, i);
        return {
          iso: toIsoDate(d),
          caption: dayCaption(d),
          isToday: toIsoDate(d) === toIsoDate(today),
        };
      }),
    [weekStarting, today],
  );

  const poolActivities = activities.filter((a) => a.scheduledDate === null);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== active.id) return a;
        if (overId === 'week-pool') return { ...a, scheduledDate: null };
        // Day drop target (YYYY-MM-DD)
        return { ...a, scheduledDate: overId };
      }),
    );
  }

  function handleQuickAdd(isoDate: string, title: string) {
    const id = `quick-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setActivities((prev) => [
      ...prev,
      {
        id,
        title,
        status: 'todo',
        projectLabel: 'Inbox',
        scheduledDate: isoDate,
      },
    ]);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      <div className="ag-week-swimlane">
        {/* Pool */}
        <div className="ag-week-swimlane__pool">
          <WeekPoolSection activities={poolActivities} />
        </div>

        {/* Days */}
        <div className="ag-week-swimlane__days">
          {days.map((d) => (
            <DayColumn
              key={d.iso}
              isoDate={d.iso}
              caption={d.caption}
              isToday={d.isToday}
              activities={activities.filter((a) => a.scheduledDate === d.iso)}
              onQuickAdd={handleQuickAdd}
              compact
            />
          ))}
        </div>
      </div>

      <style>{`
        .ag-week-swimlane {
          display: flex;
          flex-direction: column;
          gap: var(--ag-space-4);
          padding-inline: var(--ag-space-4);
        }
        .ag-week-swimlane__days {
          display: flex;
          flex-direction: column;
          gap: var(--ag-space-3);
        }
        @media (min-width: 1024px) {
          .ag-week-swimlane {
            flex-direction: row;
            align-items: flex-start;
            gap: var(--ag-space-5);
          }
          .ag-week-swimlane__pool {
            width: 240px;
            flex-shrink: 0;
            position: sticky;
            top: 80px;
          }
          .ag-week-swimlane__days {
            flex: 1;
            flex-direction: row;
            gap: var(--ag-space-2);
            overflow-x: auto;
            padding-bottom: var(--ag-space-2);
          }
          .ag-week-swimlane__days > section {
            flex: 1 0 160px;
          }
        }
      `}</style>
    </DndContext>
  );
}
