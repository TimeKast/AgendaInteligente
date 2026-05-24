'use client';

/**
 * MonthPlanner — orchestrator for /month. Mirrors WeekSwimlane but at month
 * granularity.
 *
 * Layout:
 *   Mobile (<1024px):
 *     - Top: PENDIENTES SIN FECHA pool (collapsible, default collapsed).
 *     - Below: MonthGrid full-width.
 *
 *   Desktop (≥1024px):
 *     - Pool sticky sidebar on the left (280px).
 *     - MonthGrid spans the remaining canvas width.
 *
 * Drag scenarios (single-day assignment, no multi-day-in-month for now):
 *   - Pool   → day D            → scheduledDates = [D]
 *   - Day A  → day B            → scheduledDates = [B]   (replace, preserve
 *                                  off-month dates if any — same MOVE
 *                                  semantics as WeekSwimlane)
 *   - Day A  → pool             → scheduledDates = []
 *
 * Tap day cell → opens the DayActivitiesSheet for that ISO date.
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
import { MonthGrid } from './MonthGrid';
import {
  DayActivitiesSheet,
  type DaySheetActivity,
} from './DayActivitiesSheet';
import type { PoolActivity } from './DraggablePoolActivity';
import type { MonthCellActivity, MonthCellGoalMarker } from './MonthDayCell';

export interface MonthPlannerActivity extends PoolActivity {
  /** Empty array = pool. */
  scheduledDates: string[];
}

export interface MonthPlannerGoal {
  id: string;
  title: string;
  scopeKind: 'quarter' | 'year' | '5year' | 'life';
  /** ISO YYYY-MM-DD of the deadline. */
  deadline: string;
}

interface MonthPlannerProps {
  /** First day of the visible month. */
  monthStart: Date;
  today: Date;
  seedActivities: MonthPlannerActivity[];
  seedGoals: MonthPlannerGoal[];
}

const POOL_DROP_ID = 'week-pool';
const MONTH_DAY_PREFIX = 'month-day-';

const SHEET_LABEL_FMT = new Intl.DateTimeFormat('es-MX', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  return out;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatSheetLabel(iso: string): string {
  const d = parseIso(iso);
  const raw = SHEET_LABEL_FMT.format(d).replace(/\./g, '');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function MonthPlanner({
  monthStart,
  today,
  seedActivities,
  seedGoals,
}: MonthPlannerProps) {
  const [activities, setActivities] = useState<MonthPlannerActivity[]>(() =>
    dedupeById(seedActivities),
  );
  const [poolOpenMobile, setPoolOpenMobile] = useState(false);
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const poolActivities = useMemo(
    () => activities.filter((a) => a.scheduledDates.length === 0),
    [activities],
  );

  const activitiesByDay = useMemo(() => {
    const map: Record<string, MonthCellActivity[]> = {};
    for (const a of activities) {
      for (const iso of a.scheduledDates) {
        if (!map[iso]) map[iso] = [];
        map[iso].push({ id: a.id, title: a.title, status: a.status });
      }
    }
    return map;
  }, [activities]);

  const goalsByDay = useMemo(() => {
    const map: Record<string, MonthCellGoalMarker[]> = {};
    for (const g of seedGoals) {
      if (!map[g.deadline]) map[g.deadline] = [];
      map[g.deadline].push({
        id: g.id,
        title: g.title,
        scopeKind: g.scopeKind,
      });
    }
    return map;
  }, [seedGoals]);

  function resolveDropTarget(overId: string): string | null {
    if (overId === POOL_DROP_ID) return null;
    if (overId.startsWith(MONTH_DAY_PREFIX)) return overId.slice(MONTH_DAY_PREFIX.length);
    return null;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const rawId = String(active.id);
    const [activeId, sourceIso] = rawId.includes('::')
      ? (rawId.split('::') as [string, string])
      : [rawId, null];

    const target = resolveDropTarget(String(over.id));

    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== activeId) return a;

        // Drop on pool → clear all dates.
        if (target === null) {
          return { ...a, scheduledDates: [] };
        }

        // Day → day move: replace source with target, preserve other dates
        // (off-month assignments stay).
        if (sourceIso) {
          if (sourceIso === target) return a;
          const without = a.scheduledDates.filter((d) => d !== sourceIso);
          const next = without.includes(target) ? without : [...without, target];
          return { ...a, scheduledDates: next };
        }

        // Pool → day: single assignment.
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

  function handleRemoveFromDay(activityId: string) {
    if (!selectedIso) return;
    const iso = selectedIso;
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== activityId) return a;
        return { ...a, scheduledDates: a.scheduledDates.filter((d) => d !== iso) };
      }),
    );
  }

  const sheetActivities: DaySheetActivity[] = useMemo(() => {
    if (!selectedIso) return [];
    return activities
      .filter((a) => a.scheduledDates.includes(selectedIso))
      .map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        projectLabel: a.projectLabel,
      }));
  }, [activities, selectedIso]);

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      <div className="ag-month-shell">
        {/* Pool */}
        <div className="ag-month-shell__pool">
          {/* Mobile-only collapse trigger */}
          <button
            type="button"
            className="ag-month-shell__pool-toggle"
            onClick={() => setPoolOpenMobile((v) => !v)}
            aria-expanded={poolOpenMobile}
            style={{
              appearance: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              gap: 'var(--ag-space-1)',
              background: 'transparent',
              border: 'none',
              padding: '6px 0',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--ag-slate)',
              cursor: 'pointer',
            }}
          >
            <span>
              Pendientes sin fecha · {poolActivities.length}
            </span>
            <span
              aria-hidden
              style={{ fontFamily: 'var(--ag-font-mono)', fontSize: 12 }}
            >
              {poolOpenMobile ? '−' : '+'}
            </span>
          </button>

          <div className="ag-month-shell__pool-body" data-open={poolOpenMobile}>
            <WeekPoolSection
              activities={poolActivities}
              onCreate={handleQuickAdd}
            />
          </div>
        </div>

        {/* Grid */}
        <div className="ag-month-shell__grid">
          <MonthGrid
            monthStart={monthStart}
            today={today}
            activitiesByDay={activitiesByDay}
            goalsByDay={goalsByDay}
            onSelectDay={setSelectedIso}
          />
        </div>
      </div>

      <DayActivitiesSheet
        open={selectedIso !== null}
        isoDate={selectedIso ?? ''}
        dayLabel={selectedIso ? formatSheetLabel(selectedIso) : ''}
        activities={sheetActivities}
        onClose={() => setSelectedIso(null)}
        onRemoveFromDay={handleRemoveFromDay}
      />

      <style>{`
        .ag-month-shell {
          display: flex;
          flex-direction: column;
          gap: var(--ag-space-3);
          padding-inline: var(--ag-space-4);
          padding-top: var(--ag-space-3);
        }
        .ag-month-shell__pool {
          display: flex;
          flex-direction: column;
          gap: var(--ag-space-1);
        }
        .ag-month-shell__pool-body[data-open="false"] {
          display: none;
        }
        @media (min-width: 1024px) {
          .ag-month-shell {
            flex-direction: row;
            align-items: flex-start;
            gap: var(--ag-space-5);
          }
          .ag-month-shell__pool {
            width: 280px;
            flex-shrink: 0;
            position: sticky;
            top: 80px;
          }
          .ag-month-shell__pool-toggle {
            display: none !important;
          }
          .ag-month-shell__pool-body[data-open="false"] {
            display: block;
          }
          .ag-month-shell__grid {
            flex: 1;
            min-width: 0;
          }
        }
      `}</style>
    </DndContext>
  );
}
