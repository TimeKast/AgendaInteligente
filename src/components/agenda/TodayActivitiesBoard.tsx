'use client';

/**
 * TodayActivitiesBoard — pool + calendar grid orchestrator for Today.
 *
 * Replaces the previous 4-section (Mañana/Tarde/Noche/Anytime) time-block
 * layout with a calendar-style model:
 *
 *   - POOL ("HOY SIN HORARIO")  → activities with scheduledDate=today and
 *                                  scheduledTime=null. Rendered as a top list.
 *   - CALENDAR GRID ("AGENDA")  → 06:00 → 22:00, one row per hour. Activities
 *                                  with scheduledTime live in their hour slot.
 *
 * Drag rules:
 *   - Pool → hour slot  : sets scheduledTime = "HH:00".
 *   - Hour slot → pool  : clears scheduledTime.
 *   - Hour A → Hour B   : updates scheduledTime.
 *
 * External Google Calendar events are decorative (2 hardcoded entries that
 * block their hour slot — useDroppable disabled inside HourSlot via `blocked`).
 *
 * Swipe-to-status (DD-021) stays on pool rows. Calendar-anchored rows do NOT
 * get swipe so the grid feels solid — status changes go through the "⋯" menu.
 *
 * Layout responsibility:
 *   - Mobile <1024px: single-column flow (pool above calendar).
 *   - Desktop ≥1024px: caller wraps this in a `.ag-today-split` flex; here we
 *     render the pool sidebar + calendar canvas as siblings and let CSS rule
 *     the geometry.
 */

import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ActivityRow, type ActivityStatus } from './ActivityRow';
import { ActivityQuickAdd, type QuickAddDraft } from './ActivityQuickAdd';
import { SwipeableRow } from './SwipeableRow';
import { DraggableTaskRow } from './DraggableTaskRow';
import { PoolSection } from './PoolSection';
import { CalendarGrid } from './CalendarGrid';
import { ExternalEventRow } from './ExternalEventRow';
import {
  ActivityStatusModal,
  type ExtendedActivityStatus,
  type StatusReason,
} from './ActivityStatusModal';

interface TodayActivity {
  id: string;
  title: string;
  status: ActivityStatus;
  /** "HH:00" string anchors this activity to that hour slot. null → pool. */
  scheduledTime: string | null;
  priority: number;
  projectLabel: string;
  /**
   * Duration in minutes. Only meaningful when `scheduledTime != null`; pool
   * items ignore this field. Defaults to 60 for hour-anchored items via the
   * initial data below. Editable via the bottom-edge resize handle on desktop
   * (see DraggableTaskRow). Whole-hour snap on commit, min 60min, max clamped
   * to calendar end (22:00).
   */
  durationMinutes: number;
  /** Optional ISO YYYY-MM-DD deadline (inline DeadlineBadge). */
  deadline?: string;
  /** Optional 0..100 progress (bottom-edge bar). */
  progressPercent?: number;
}

interface WeekActivity {
  id: string;
  title: string;
  status: ActivityStatus;
  priority: number;
  projectLabel: string;
  deadline?: string;
  progressPercent?: number;
}

interface ExternalEvent {
  id: string;
  hour: string; // "HH:00"
  title: string;
  timeRange: string; // "10:00 – 11:00"
}

const INITIAL_TODAY: TodayActivity[] = [
  {
    id: 't1',
    title: 'Reunión Genomma — kickoff',
    status: 'todo',
    scheduledTime: '08:00',
    priority: 4,
    projectLabel: 'Empresa Genomma',
    durationMinutes: 60,
  },
  {
    id: 't2',
    title: 'Reporte trimestral',
    status: 'in_progress',
    scheduledTime: '11:00',
    priority: 5,
    projectLabel: 'Empresa Genomma',
    // Pre-seeded 2h example so the multi-slot rendering is visible at load.
    durationMinutes: 120,
    // Soon deadline (warning state) + mid progress.
    deadline: '2026-05-25',
    progressPercent: 60,
  },
  {
    id: 't3',
    title: 'Revisar PR equipo',
    status: 'todo',
    scheduledTime: null,
    priority: 3,
    projectLabel: 'Empresa Genomma',
    durationMinutes: 60,
    progressPercent: 25,
  },
  {
    id: 't4',
    title: 'Gym 1h',
    status: 'todo',
    scheduledTime: null,
    priority: 2,
    projectLabel: 'Personal',
    durationMinutes: 60,
  },
  {
    id: 't5',
    title: 'Llamar a mamá',
    status: 'todo',
    scheduledTime: '19:00',
    priority: 3,
    projectLabel: 'Personal',
    durationMinutes: 60,
    // Past-due (danger state).
    deadline: '2026-05-20',
  },
];

const INITIAL_WEEK: WeekActivity[] = [
  {
    id: 'w1',
    title: 'Borrador propuesta cliente',
    status: 'todo',
    priority: 4,
    projectLabel: 'Empresa Genomma',
  },
  {
    id: 'w2',
    title: 'Estudio alemán — capítulo 3',
    status: 'todo',
    priority: 3,
    projectLabel: 'Personal',
  },
  {
    id: 'w3',
    title: 'Pagar tarjeta',
    status: 'todo',
    priority: 2,
    projectLabel: 'Personal',
  },
];

const EXTERNAL_EVENTS: ExternalEvent[] = [
  { id: 'gc-1', hour: '10:00', title: 'Reunión clientes', timeRange: '10:00 – 11:00' },
  { id: 'gc-2', hour: '14:00', title: 'Llamada Juan', timeRange: '14:00 – 15:00' },
];

const DROP_POOL_TODAY = 'pool:today';
const DROP_POOL_WEEK = 'pool:week';
const HOUR_DROP_PREFIX = 'hour:';
/** Calendar end hour (exclusive minute boundary). 22 means slot 22:00 is the
 *  last visible row and an activity may not extend past 22:00. */
const CALENDAR_END_HOUR = 22;

/** Parse "HH:00" → integer hour. Returns NaN if invalid. */
function parseHour(time: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  return m ? Number(m[1]) : NaN;
}

interface TodayActivitiesBoardProps {
  /**
   * When true, render desktop layout: pool sidebar (DaySheet + pool + week) on
   * the left, calendar canvas on the right — wrapped by CSS class
   * `.ag-today-split`. When false (mobile), stack everything in single column.
   *
   * The caller doesn't actually toggle this — both DOMs are rendered and CSS
   * shows the right one. Kept as a single layout that responds via CSS.
   */
  morningSection?: React.ReactNode;
}

export function TodayActivitiesBoard({ morningSection }: TodayActivitiesBoardProps) {
  const [todayItems, setTodayItems] = useState<TodayActivity[]>(INITIAL_TODAY);
  const [weekItems, setWeekItems] = useState<WeekActivity[]>(INITIAL_WEEK);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<{
    id: string;
    title: string;
    status: ExtendedActivityStatus;
  } | null>(null);

  const sensors = useSensors(
    // distance: 8 keeps quick taps and horizontal swipes from triggering a
    // drag — drag wins only after 8px of sustained motion.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /**
   * Hours that should reject drops: external Google events (always) PLUS
   * any "overflow" hours covered by a multi-hour activity (e.g. a 2h activity
   * at 11:00 blocks 12:00 too — that hour is visually occupied even though
   * no activity is anchored there).
   *
   * The activity's OWN start hour is NOT added — drop on its own slot is a
   * no-op (it already lives there). The recompute runs on every duration
   * change because resize updates `todayItems`.
   */
  const blockedHours = useMemo(() => {
    const set = new Set(EXTERNAL_EVENTS.map((e) => e.hour));
    for (const a of todayItems) {
      if (!a.scheduledTime) continue;
      const startHour = parseHour(a.scheduledTime);
      if (Number.isNaN(startHour)) continue;
      const spanHours = Math.ceil(a.durationMinutes / 60);
      // Block subsequent hours covered by the activity (not the start hour
      // itself — that's where the activity lives).
      for (let h = startHour + 1; h < startHour + spanHours; h++) {
        if (h <= CALENDAR_END_HOUR) {
          set.add(`${h.toString().padStart(2, '0')}:00`);
        }
      }
    }
    return set;
  }, [todayItems]);

  const activeActivity = useMemo(() => {
    if (!activeId) return null;
    return todayItems.find((a) => a.id === activeId)
      ?? weekItems.find((a) => a.id === activeId)
      ?? null;
  }, [activeId, todayItems, weekItems]);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Determine source list
    const inToday = todayItems.some((a) => a.id === activeId);
    const inWeek = weekItems.some((a) => a.id === activeId);

    if (overId === DROP_POOL_TODAY) {
      // Land in today pool: clear scheduledTime; if it was in week, move it
      // into today (with scheduledTime=null).
      if (inToday) {
        setTodayItems((prev) =>
          prev.map((a) => (a.id === activeId ? { ...a, scheduledTime: null } : a)),
        );
      } else if (inWeek) {
        const moved = weekItems.find((a) => a.id === activeId);
        if (!moved) return;
        setWeekItems((prev) => prev.filter((a) => a.id !== activeId));
        setTodayItems((prev) => [
          ...prev,
          { ...moved, scheduledTime: null, durationMinutes: 60 },
        ]);
      }
      return;
    }

    if (overId === DROP_POOL_WEEK) {
      // Drag a today item into the week pool: remove from today, append to
      // week (drops scheduledTime entirely).
      if (inToday) {
        const moved = todayItems.find((a) => a.id === activeId);
        if (!moved) return;
        setTodayItems((prev) => prev.filter((a) => a.id !== activeId));
        setWeekItems((prev) => [
          ...prev,
          {
            id: moved.id,
            title: moved.title,
            status: moved.status,
            priority: moved.priority,
            projectLabel: moved.projectLabel,
          },
        ]);
      }
      return;
    }

    if (overId.startsWith(HOUR_DROP_PREFIX)) {
      const hour = overId.slice(HOUR_DROP_PREFIX.length); // "HH:00"
      if (blockedHours.has(hour)) return; // can't land on Google-blocked slot
      if (inToday) {
        setTodayItems((prev) =>
          prev.map((a) => (a.id === activeId ? { ...a, scheduledTime: hour } : a)),
        );
      } else if (inWeek) {
        // Drag from week to a specific hour today: promote into today, set hour.
        const moved = weekItems.find((a) => a.id === activeId);
        if (!moved) return;
        setWeekItems((prev) => prev.filter((a) => a.id !== activeId));
        setTodayItems((prev) => [
          ...prev,
          { ...moved, scheduledTime: hour, durationMinutes: 60 },
        ]);
      }
    }
  }

  function handleCreate(draft: QuickAddDraft) {
    const id = `new-${Date.now()}`;
    setTodayItems((prev) => [
      ...prev,
      {
        id,
        title: draft.title,
        status: 'todo',
        scheduledTime: draft.scheduledTime ? normalizeHour(draft.scheduledTime) : null,
        priority: draft.priority,
        projectLabel: draft.projectLabel,
        durationMinutes: 60,
      },
    ]);
  }

  function handleResize(id: string, nextDurationMinutes: number) {
    setTodayItems((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, durationMinutes: nextDurationMinutes } : a,
      ),
    );
  }

  function setTodayStatus(id: string, next: ActivityStatus) {
    setTodayItems((prev) => prev.map((a) => (a.id === id ? { ...a, status: next } : a)));
  }

  function openStatus(activity: { id: string; title: string; status: ActivityStatus }) {
    setStatusModal({ id: activity.id, title: activity.title, status: activity.status });
  }

  function applyStatus(next: ExtendedActivityStatus, _reason?: StatusReason) {
    if (!statusModal) return;
    setTodayStatus(statusModal.id, next);
    setStatusModal(null);
  }

  // ----- Derived slices -----
  const poolItems = useMemo(
    () => todayItems.filter((a) => a.scheduledTime === null),
    [todayItems],
  );

  const slotsByHour = useMemo(() => {
    const map: Record<string, React.ReactNode> = {};
    // Tasks anchored to each hour
    for (const a of todayItems) {
      if (!a.scheduledTime) continue;
      const startHour = parseHour(a.scheduledTime);
      // Max duration = fits entre startHour y (a) calendar end OR (b) la
      // próxima hora ocupada por OTRA tarea o evento externo. Evita overlap
      // al resize. Ejemplo: activity a las 09:00 + otra a las 11:00 → max
      // duration = 2h (no llega a las 11).
      let maxDurationMinutes = 240;
      if (!Number.isNaN(startHour)) {
        let nextOccupiedHour = CALENDAR_END_HOUR;
        // External events (Google Calendar mock)
        for (const e of EXTERNAL_EVENTS) {
          const eh = parseHour(e.hour);
          if (!Number.isNaN(eh) && eh > startHour && eh < nextOccupiedHour) {
            nextOccupiedHour = eh;
          }
        }
        // Other anchored activities
        for (const other of todayItems) {
          if (other.id === a.id || !other.scheduledTime) continue;
          const oh = parseHour(other.scheduledTime);
          if (!Number.isNaN(oh) && oh > startHour && oh < nextOccupiedHour) {
            nextOccupiedHour = oh;
          }
        }
        maxDurationMinutes = Math.max(60, (nextOccupiedHour - startHour) * 60);
      }
      const existing = map[a.scheduledTime];
      const row = (
        <DraggableTaskRow
          key={a.id}
          id={a.id}
          title={a.title}
          status={a.status}
          priority={a.priority}
          projectLabel={a.projectLabel}
          href={`/activity/${a.id}`}
          onOpenStatus={() => openStatus(a)}
          durationMinutes={a.durationMinutes}
          onResize={(next) => handleResize(a.id, next)}
          maxDurationMinutes={maxDurationMinutes}
          deadline={a.deadline}
          progressPercent={a.progressPercent}
        />
      );
      map[a.scheduledTime] = existing ? (
        <>
          {existing}
          {row}
        </>
      ) : row;
    }
    // External Google events
    for (const evt of EXTERNAL_EVENTS) {
      const existing = map[evt.hour];
      const block = (
        <ExternalEventRow key={evt.id} title={evt.title} timeRange={evt.timeRange} />
      );
      map[evt.hour] = existing ? (
        <>
          {existing}
          {block}
        </>
      ) : block;
    }
    return map;
    // openStatus/setTodayStatus are stable references via the parent's
    // function declarations; dnd-kit useDraggable manages its own identity.
  }, [todayItems]);

  const isDragging = activeId !== null;

  // ----- Render -----
  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        autoScroll
      >
        <div className="ag-today-split">
          {/* ---- Pool sidebar (desktop) / pool stack (mobile) ---- */}
          <div className="ag-today-pool">
            {morningSection ?? null}

            <PoolSection
              id={DROP_POOL_TODAY}
              label="Hoy sin horario"
              isDragging={isDragging}
              empty={poolItems.length === 0}
              footer={<ActivityQuickAdd onCreate={handleCreate} />}
            >
              {poolItems.map((a) => (
                <SwipeableRow
                  key={a.id}
                  disabled={isDragging}
                  onDone={() => setTodayStatus(a.id, 'done')}
                  onSkip={() => openStatus(a)}
                  onBlock={() => setTodayStatus(a.id, 'blocked')}
                >
                  <DraggableTaskRow
                    id={a.id}
                    title={a.title}
                    status={a.status}
                    priority={a.priority}
                    projectLabel={a.projectLabel}
                    href={`/activity/${a.id}`}
                    onOpenStatus={() => openStatus(a)}
                    deadline={a.deadline}
                    progressPercent={a.progressPercent}
                  />
                </SwipeableRow>
              ))}
            </PoolSection>

            <PoolSection
              id={DROP_POOL_WEEK}
              label="Esta semana"
              isDragging={isDragging}
              empty={weekItems.length === 0}
            >
              {weekItems.map((a) => (
                <SwipeableRow
                  key={a.id}
                  disabled={isDragging}
                  onDone={() => {/* week-list status mutations are out of scope */}}
                  onSkip={() => {/* idem */}}
                  onBlock={() => {/* idem */}}
                >
                  <DraggableTaskRow
                    id={a.id}
                    title={a.title}
                    status={a.status}
                    priority={a.priority}
                    projectLabel={a.projectLabel}
                    deadline={a.deadline}
                    progressPercent={a.progressPercent}
                  />
                </SwipeableRow>
              ))}
            </PoolSection>
          </div>

          {/* ---- Calendar canvas ---- */}
          <div className="ag-today-canvas">
            <CalendarGrid
              startHour={6}
              endHour={22}
              isDragging={isDragging}
              slotsByHour={slotsByHour}
              blockedHours={blockedHours}
            />
          </div>
        </div>

        <DragOverlay
          dropAnimation={{ duration: 160, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}
        >
          {activeActivity ? (
            <div
              style={{
                backgroundColor: 'var(--ag-bg-elevated)',
                borderRadius: 'var(--ag-radius-base)',
                boxShadow: '0 8px 24px rgba(42, 40, 38, 0.18)',
                paddingInline: 'var(--ag-space-2)',
                opacity: 0.96,
              }}
            >
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                <ActivityRow
                  title={activeActivity.title}
                  status={activeActivity.status}
                  priority={activeActivity.priority}
                  projectLabel={activeActivity.projectLabel}
                />
              </ul>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ActivityStatusModal
        open={statusModal !== null}
        title={statusModal?.title ?? ''}
        currentStatus={statusModal?.status ?? 'todo'}
        onCancel={() => setStatusModal(null)}
        onApply={applyStatus}
      />
    </>
  );
}

/**
 * Round an arbitrary "HH:mm" string down to the nearest hour ("HH:00") so
 * quick-add's free-form time input collapses cleanly onto our 1-hour grid.
 */
function normalizeHour(time: string): string {
  const m = /^(\d{1,2})(?::\d{2})?$/.exec(time.trim());
  if (!m) return time;
  const hh = Math.max(0, Math.min(23, Number(m[1])));
  return `${hh.toString().padStart(2, '0')}:00`;
}
