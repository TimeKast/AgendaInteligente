'use client';

/**
 * TodayActivitiesBoard — pool + calendar grid orchestrator for /today.
 *
 * Modelo conceptual:
 *
 *   POOL (sidebar):  todo lo no programado en una hora del calendario hoy.
 *                    Vive en una de 3 secciones (vista "fecha") o 4 secciones
 *                    (vista "matriz"). Todos los ítems son draggables al
 *                    calendar grid Y entre secciones del pool.
 *
 *   CALENDAR GRID:   06:00 → 22:00, una fila por hora. Ítems con
 *                    `scheduledTime` viven en su hora. Sin cambios visuales
 *                    vs iteraciones anteriores.
 *
 * Vista del pool (`view` prop):
 *
 *   - "fecha"  (default):
 *       HOY SIN HORARIO  ← items[scope='today']
 *       ESTA SEMANA      ← items[scope='week']    (collapsible)
 *       PENDIENTES       ← items[scope='backlog'] (collapsible)
 *
 *   - "matriz":
 *       Q1 URGENTE+IMPORTANTE  (wine border-left)
 *       Q2 IMPORTANTE          (sage border-left)
 *       Q3 URGENTE             (orange border-left, collapsible)
 *       Q4 NEUTRO              (ink-hint border-left, collapsible)
 *
 * Drag rules:
 *   - Cualquier pool item → hora HH:00  : promueve a today + scheduledTime, scope='today'.
 *   - Hora HH:00 → pool:today           : limpia scheduledTime (mantiene scope='today').
 *   - Hora HH:00 → pool:week            : pasa a scope='week', limpia time.
 *   - Hora HH:00 → pool:backlog         : pasa a scope='backlog', limpia time.
 *   - pool:today → pool:week / backlog  : cambia scope, sin time.
 *   - pool:week ↔ pool:backlog          : cambia scope.
 *   - En vista "matriz": los drops a Q1-Q4 cambian cuadrante (mantienen scope).
 *
 * External Google Calendar events: 2 hardcoded entries que bloquean su hora.
 *
 * Swipe-to-status (DD-021) solo en pool rows. Calendar-anchored no tiene swipe.
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
import type { TodayView } from './TodayViewToggle';

type Quadrant = 1 | 2 | 3 | 4;

type PoolScope = 'today' | 'week' | 'backlog';

interface PoolActivity {
  id: string;
  title: string;
  status: ActivityStatus;
  /** Where in the pool taxonomy this item lives. */
  scope: PoolScope;
  /** Eisenhower quadrant (1..4) — informativo + agrupador en vista matriz. */
  quadrant: Quadrant;
  priority: number;
  projectLabel: string;
  deadline?: string;
  progressPercent?: number;
}

interface ScheduledActivity {
  id: string;
  title: string;
  status: ActivityStatus;
  /** "HH:00" string — anchored to that hour slot. */
  scheduledTime: string;
  priority: number;
  projectLabel: string;
  durationMinutes: number;
  deadline?: string;
  progressPercent?: number;
  quadrant: Quadrant;
}

interface ExternalEvent {
  id: string;
  hour: string; // "HH:00"
  title: string;
  timeRange: string; // "10:00 – 11:00"
}

const INITIAL_SCHEDULED: ScheduledActivity[] = [
  {
    id: 's1',
    title: 'Reunión Genomma — kickoff',
    status: 'todo',
    scheduledTime: '08:00',
    priority: 4,
    projectLabel: 'Empresa Genomma',
    durationMinutes: 60,
    quadrant: 1,
  },
  {
    id: 's2',
    title: 'Reporte trimestral',
    status: 'in_progress',
    scheduledTime: '11:00',
    priority: 5,
    projectLabel: 'Empresa Genomma',
    durationMinutes: 120,
    deadline: '2026-05-25',
    progressPercent: 60,
    quadrant: 1,
  },
  {
    id: 's3',
    title: 'Llamar a mamá',
    status: 'todo',
    scheduledTime: '19:00',
    priority: 3,
    projectLabel: 'Personal',
    durationMinutes: 60,
    deadline: '2026-05-20',
    quadrant: 3,
  },
];

const INITIAL_POOL: PoolActivity[] = [
  // Hoy sin horario (3)
  {
    id: 'p1',
    title: 'Revisar PR equipo',
    status: 'todo',
    scope: 'today',
    quadrant: 2,
    priority: 3,
    projectLabel: 'Empresa Genomma',
    progressPercent: 25,
  },
  {
    id: 'p2',
    title: 'Gym 1h',
    status: 'todo',
    scope: 'today',
    quadrant: 2,
    priority: 2,
    projectLabel: 'Personal',
  },
  {
    id: 'p3',
    title: 'Responder a Marta',
    status: 'todo',
    scope: 'today',
    quadrant: 3,
    priority: 2,
    projectLabel: 'Personal',
  },

  // Esta semana (4)
  {
    id: 'w1',
    title: 'Borrador propuesta cliente',
    status: 'todo',
    scope: 'week',
    quadrant: 1,
    priority: 4,
    projectLabel: 'Empresa Genomma',
  },
  {
    id: 'w2',
    title: 'Estudio alemán — capítulo 3',
    status: 'todo',
    scope: 'week',
    quadrant: 2,
    priority: 3,
    projectLabel: 'Personal',
  },
  {
    id: 'w3',
    title: 'Pagar tarjeta',
    status: 'todo',
    scope: 'week',
    quadrant: 3,
    priority: 2,
    projectLabel: 'Personal',
  },
  {
    id: 'w4',
    title: 'Diseñar landing v0.5',
    status: 'in_progress',
    scope: 'week',
    quadrant: 2,
    priority: 4,
    projectLabel: 'Empresa Genomma',
  },

  // Pendientes / backlog (6)
  {
    id: 'b1',
    title: 'Investigar competencia',
    status: 'todo',
    scope: 'backlog',
    quadrant: 4,
    priority: 3,
    projectLabel: 'Empresa Genomma',
    deadline: '2026-07-15',
  },
  {
    id: 'b2',
    title: 'Refactor schema usuarios',
    status: 'todo',
    scope: 'backlog',
    quadrant: 4,
    priority: 3,
    projectLabel: 'Side project Web3',
    deadline: '2026-06-10',
  },
  {
    id: 'b3',
    title: 'Leer libro de la semana',
    status: 'todo',
    scope: 'backlog',
    quadrant: 4,
    priority: 1,
    projectLabel: 'Personal',
  },
  {
    id: 'b4',
    title: 'Llamar al dentista',
    status: 'todo',
    scope: 'backlog',
    quadrant: 3,
    priority: 2,
    projectLabel: 'Personal',
  },
  {
    id: 'b5',
    title: 'Planear viaje',
    status: 'todo',
    scope: 'backlog',
    quadrant: 4,
    priority: 2,
    projectLabel: 'Personal',
  },
  {
    id: 'b6',
    title: 'Setup analytics evento beta',
    status: 'todo',
    scope: 'backlog',
    quadrant: 2,
    priority: 3,
    projectLabel: 'Empresa Genomma',
  },
];

const EXTERNAL_EVENTS: ExternalEvent[] = [
  { id: 'gc-1', hour: '10:00', title: 'Reunión clientes', timeRange: '10:00 – 11:00' },
  { id: 'gc-2', hour: '14:00', title: 'Llamada Juan', timeRange: '14:00 – 15:00' },
];

const DROP_POOL_TODAY = 'pool:today';
const DROP_POOL_WEEK = 'pool:week';
const DROP_POOL_BACKLOG = 'pool:backlog';
const DROP_Q_PREFIX = 'quad:';
const HOUR_DROP_PREFIX = 'hour:';
const CALENDAR_END_HOUR = 22;

const POOL_DROP_TARGETS = new Set([DROP_POOL_TODAY, DROP_POOL_WEEK, DROP_POOL_BACKLOG]);

const QUADRANT_ACCENT: Record<Quadrant, string> = {
  1: 'var(--ag-scope-life)',
  2: 'var(--ag-scope-quarter)',
  3: 'var(--ag-scope-year)',
  4: 'var(--ag-ink-hint)',
};

const QUADRANT_LABEL: Record<Quadrant, string> = {
  1: 'Q1 · Urgente + importante',
  2: 'Q2 · Importante',
  3: 'Q3 · Urgente',
  4: 'Q4 · Neutro',
};

/** Parse "HH:00" → integer hour. Returns NaN if invalid. */
function parseHour(time: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  return m ? Number(m[1]) : NaN;
}

interface TodayActivitiesBoardProps {
  morningSection?: React.ReactNode;
  /** Modo de agrupación del pool sidebar. Default 'fecha'. */
  view?: TodayView;
  /**
   * Persistence hook for quick-adds — Phase 2 wiring (ISSUE-025).
   * When provided, the optimistic insert still happens locally for
   * snappy UX and this callback is invoked in parallel for the real
   * server write. Leave undefined for prototype demos.
   */
  onCreatePersist?: (draft: QuickAddDraft) => void;
  /**
   * Persistence hook for swipe / status-modal transitions — Phase 2
   * wiring. Receives the activity id + the BR-8 target status. The
   * board updates its local view optimistically before invoking.
   */
  onTransitionPersist?: (id: string, toStatus: 'done' | 'skipped' | 'blocked' | 'pending') => void;
}

export function TodayActivitiesBoard({
  morningSection,
  view = 'fecha',
  onCreatePersist,
  onTransitionPersist,
}: TodayActivitiesBoardProps) {
  const [scheduled, setScheduled] = useState<ScheduledActivity[]>(INITIAL_SCHEDULED);
  const [pool, setPool] = useState<PoolActivity[]>(INITIAL_POOL);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<{
    id: string;
    title: string;
    status: ExtendedActivityStatus;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const blockedHours = useMemo(() => {
    const set = new Set(EXTERNAL_EVENTS.map((e) => e.hour));
    for (const a of scheduled) {
      const startHour = parseHour(a.scheduledTime);
      if (Number.isNaN(startHour)) continue;
      const spanHours = Math.ceil(a.durationMinutes / 60);
      for (let h = startHour + 1; h < startHour + spanHours; h++) {
        if (h <= CALENDAR_END_HOUR) {
          set.add(`${h.toString().padStart(2, '0')}:00`);
        }
      }
    }
    return set;
  }, [scheduled]);

  const activeActivity = useMemo(() => {
    if (!activeId) return null;
    return scheduled.find((a) => a.id === activeId) ?? pool.find((a) => a.id === activeId) ?? null;
  }, [activeId, scheduled, pool]);

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

    const aId = String(active.id);
    const overId = String(over.id);
    const inScheduled = scheduled.some((a) => a.id === aId);
    const inPool = pool.some((a) => a.id === aId);

    // --- Drop on a pool section ---
    if (POOL_DROP_TARGETS.has(overId)) {
      const nextScope: PoolScope =
        overId === DROP_POOL_TODAY ? 'today' : overId === DROP_POOL_WEEK ? 'week' : 'backlog';

      if (inScheduled) {
        const moved = scheduled.find((a) => a.id === aId);
        if (!moved) return;
        setScheduled((prev) => prev.filter((a) => a.id !== aId));
        setPool((prev) => [
          ...prev,
          {
            id: moved.id,
            title: moved.title,
            status: moved.status,
            scope: nextScope,
            quadrant: moved.quadrant,
            priority: moved.priority,
            projectLabel: moved.projectLabel,
            deadline: moved.deadline,
            progressPercent: moved.progressPercent,
          },
        ]);
      } else if (inPool) {
        setPool((prev) => prev.map((a) => (a.id === aId ? { ...a, scope: nextScope } : a)));
      }
      return;
    }

    // --- Drop on a quadrant section (vista "matriz") ---
    if (overId.startsWith(DROP_Q_PREFIX)) {
      const q = Number(overId.slice(DROP_Q_PREFIX.length)) as Quadrant;
      if (!([1, 2, 3, 4] as const).includes(q)) return;
      if (inPool) {
        setPool((prev) => prev.map((a) => (a.id === aId ? { ...a, quadrant: q } : a)));
      } else if (inScheduled) {
        // Drag from grid → quadrant: unschedule + change quadrant.
        const moved = scheduled.find((a) => a.id === aId);
        if (!moved) return;
        setScheduled((prev) => prev.filter((a) => a.id !== aId));
        setPool((prev) => [
          ...prev,
          {
            id: moved.id,
            title: moved.title,
            status: moved.status,
            scope: 'today',
            quadrant: q,
            priority: moved.priority,
            projectLabel: moved.projectLabel,
            deadline: moved.deadline,
            progressPercent: moved.progressPercent,
          },
        ]);
      }
      return;
    }

    // --- Drop on an hour slot ---
    if (overId.startsWith(HOUR_DROP_PREFIX)) {
      const hour = overId.slice(HOUR_DROP_PREFIX.length);
      if (blockedHours.has(hour)) return;

      if (inScheduled) {
        setScheduled((prev) => prev.map((a) => (a.id === aId ? { ...a, scheduledTime: hour } : a)));
      } else if (inPool) {
        const moved = pool.find((a) => a.id === aId);
        if (!moved) return;
        setPool((prev) => prev.filter((a) => a.id !== aId));
        setScheduled((prev) => [
          ...prev,
          {
            id: moved.id,
            title: moved.title,
            status: moved.status,
            scheduledTime: hour,
            priority: moved.priority,
            projectLabel: moved.projectLabel,
            durationMinutes: 60,
            deadline: moved.deadline,
            progressPercent: moved.progressPercent,
            quadrant: moved.quadrant,
          },
        ]);
      }
    }
  }

  function handleCreate(draft: QuickAddDraft) {
    const id = `new-${Date.now()}`;
    if (draft.scheduledTime) {
      setScheduled((prev) => [
        ...prev,
        {
          id,
          title: draft.title,
          status: 'todo',
          scheduledTime: normalizeHour(draft.scheduledTime!),
          priority: draft.priority,
          projectLabel: draft.projectLabel,
          durationMinutes: 60,
          quadrant: 2,
        },
      ]);
    } else {
      setPool((prev) => [
        ...prev,
        {
          id,
          title: draft.title,
          status: 'todo',
          scope: 'today',
          quadrant: 2,
          priority: draft.priority,
          projectLabel: draft.projectLabel,
        },
      ]);
    }
    // Fire-and-forget the server persist alongside the optimistic insert.
    // The parent owns reconciling the optimistic id with the persisted
    // UUID on the next page revalidation.
    onCreatePersist?.(draft);
  }

  function handleResize(id: string, nextDurationMinutes: number) {
    setScheduled((prev) =>
      prev.map((a) => (a.id === id ? { ...a, durationMinutes: nextDurationMinutes } : a))
    );
  }

  function handleResizeStart(id: string, nextStartTime: string, nextDurationMinutes: number) {
    setScheduled((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, scheduledTime: nextStartTime, durationMinutes: nextDurationMinutes }
          : a
      )
    );
  }

  function setScheduledStatus(id: string, next: ActivityStatus) {
    setScheduled((prev) => prev.map((a) => (a.id === id ? { ...a, status: next } : a)));
    setPool((prev) => prev.map((a) => (a.id === id ? { ...a, status: next } : a)));
  }

  function openStatus(activity: { id: string; title: string; status: ActivityStatus }) {
    setStatusModal({ id: activity.id, title: activity.title, status: activity.status });
  }

  function applyStatus(next: ExtendedActivityStatus, _reason?: StatusReason) {
    if (!statusModal) return;
    setScheduledStatus(statusModal.id, next);
    // Map the UI's ExtendedActivityStatus to the BR-8 enum the action
    // expects. 'todo' is the rest state — no transition to record.
    const mapped: Record<
      ExtendedActivityStatus,
      'done' | 'skipped' | 'blocked' | 'pending' | null
    > = {
      done: 'done',
      skipped: 'skipped',
      blocked: 'blocked',
      todo: 'pending',
      in_progress: null,
    };
    const toStatus = mapped[next];
    if (toStatus) onTransitionPersist?.(statusModal.id, toStatus);
    setStatusModal(null);
  }

  // ----- Slices by view -----
  const poolByScope = useMemo(() => {
    const today = pool.filter((a) => a.scope === 'today');
    const week = pool.filter((a) => a.scope === 'week');
    const backlog = pool.filter((a) => a.scope === 'backlog');
    return { today, week, backlog };
  }, [pool]);

  const poolByQuadrant = useMemo(() => {
    const map: Record<Quadrant, PoolActivity[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const a of pool) map[a.quadrant].push(a);
    return map;
  }, [pool]);

  const slotsByHour = useMemo(() => {
    const map: Record<string, React.ReactNode> = {};
    for (const a of scheduled) {
      const startHour = parseHour(a.scheduledTime);
      let maxDurationMinutes = 240;
      let minStartHour = 6;
      if (!Number.isNaN(startHour)) {
        // Para el bottom handle: hora más temprana ocupada DESPUÉS del start
        let nextOccupiedHour = CALENDAR_END_HOUR;
        // Para el top handle: hora más reciente ocupada (incluyendo end de
        // otra activity, o un Google event) ANTES del start. minStartHour es
        // el clamp más temprano permitido.
        let prevOccupiedEnd = 6;
        for (const e of EXTERNAL_EVENTS) {
          const eh = parseHour(e.hour);
          if (Number.isNaN(eh)) continue;
          if (eh > startHour && eh < nextOccupiedHour) nextOccupiedHour = eh;
          // Google events asumimos 1h, así que su end = eh + 1
          const eEnd = eh + 1;
          if (eEnd <= startHour && eEnd > prevOccupiedEnd) prevOccupiedEnd = eEnd;
        }
        for (const other of scheduled) {
          if (other.id === a.id) continue;
          const oh = parseHour(other.scheduledTime);
          if (Number.isNaN(oh)) continue;
          if (oh > startHour && oh < nextOccupiedHour) nextOccupiedHour = oh;
          const oEnd = oh + Math.ceil(other.durationMinutes / 60);
          if (oEnd <= startHour && oEnd > prevOccupiedEnd) prevOccupiedEnd = oEnd;
        }
        maxDurationMinutes = Math.max(60, (nextOccupiedHour - startHour) * 60);
        minStartHour = prevOccupiedEnd;
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
          onResizeStart={(t, d) => handleResizeStart(a.id, t, d)}
          maxDurationMinutes={maxDurationMinutes}
          minStartHour={minStartHour}
          scheduledTime={a.scheduledTime}
          deadline={a.deadline}
          progressPercent={a.progressPercent}
        />
      );
      map[a.scheduledTime] = existing ? (
        <>
          {existing}
          {row}
        </>
      ) : (
        row
      );
    }
    for (const evt of EXTERNAL_EVENTS) {
      const existing = map[evt.hour];
      const block = <ExternalEventRow key={evt.id} title={evt.title} timeRange={evt.timeRange} />;
      map[evt.hour] = existing ? (
        <>
          {existing}
          {block}
        </>
      ) : (
        block
      );
    }
    return map;
  }, [scheduled]);

  const isDragging = activeId !== null;

  /**
   * Render a draggable pool row con accent de cuadrante a la izquierda. La
   * banda warn-of-color es subtle: borderLeft 3px en color del cuadrante,
   * más un dot accent al lado del título para escaneo rápido.
   */
  function renderPoolRow(a: PoolActivity) {
    const accent = QUADRANT_ACCENT[a.quadrant];
    return (
      <SwipeableRow
        key={a.id}
        disabled={isDragging}
        onDone={() => setScheduledStatus(a.id, 'done')}
        onSkip={() => openStatus(a)}
        onBlock={() => setScheduledStatus(a.id, 'blocked')}
      >
        <div
          style={{
            borderLeft: `3px solid ${accent}`,
            paddingLeft: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            aria-label={`Cuadrante Q${a.quadrant}`}
            title={`Q${a.quadrant}`}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: accent,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
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
          </div>
        </div>
      </SwipeableRow>
    );
  }

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

            {view === 'fecha' ? (
              <>
                <PoolSection
                  id={DROP_POOL_TODAY}
                  label="Hoy sin horario"
                  isDragging={isDragging}
                  empty={poolByScope.today.length === 0}
                  count={poolByScope.today.length}
                  header={<ActivityQuickAdd onCreate={handleCreate} />}
                >
                  {poolByScope.today.map(renderPoolRow)}
                </PoolSection>

                <PoolSection
                  id={DROP_POOL_WEEK}
                  label="Esta semana"
                  isDragging={isDragging}
                  empty={poolByScope.week.length === 0}
                  count={poolByScope.week.length}
                  collapsible
                >
                  {poolByScope.week.map(renderPoolRow)}
                </PoolSection>

                <PoolSection
                  id={DROP_POOL_BACKLOG}
                  label="Pendientes"
                  isDragging={isDragging}
                  empty={poolByScope.backlog.length === 0}
                  count={poolByScope.backlog.length}
                  collapsible
                >
                  {poolByScope.backlog.map(renderPoolRow)}
                </PoolSection>
              </>
            ) : (
              <>
                <PoolSection
                  id={`${DROP_Q_PREFIX}1`}
                  label={QUADRANT_LABEL[1]}
                  isDragging={isDragging}
                  empty={poolByQuadrant[1].length === 0}
                  count={poolByQuadrant[1].length}
                  accentColor={QUADRANT_ACCENT[1]}
                  header={<ActivityQuickAdd onCreate={handleCreate} />}
                >
                  {poolByQuadrant[1].map(renderPoolRow)}
                </PoolSection>

                <PoolSection
                  id={`${DROP_Q_PREFIX}2`}
                  label={QUADRANT_LABEL[2]}
                  isDragging={isDragging}
                  empty={poolByQuadrant[2].length === 0}
                  count={poolByQuadrant[2].length}
                  accentColor={QUADRANT_ACCENT[2]}
                >
                  {poolByQuadrant[2].map(renderPoolRow)}
                </PoolSection>

                <PoolSection
                  id={`${DROP_Q_PREFIX}3`}
                  label={QUADRANT_LABEL[3]}
                  isDragging={isDragging}
                  empty={poolByQuadrant[3].length === 0}
                  count={poolByQuadrant[3].length}
                  accentColor={QUADRANT_ACCENT[3]}
                  collapsible
                >
                  {poolByQuadrant[3].map(renderPoolRow)}
                </PoolSection>

                <PoolSection
                  id={`${DROP_Q_PREFIX}4`}
                  label={QUADRANT_LABEL[4]}
                  isDragging={isDragging}
                  empty={poolByQuadrant[4].length === 0}
                  count={poolByQuadrant[4].length}
                  accentColor={QUADRANT_ACCENT[4]}
                  collapsible
                >
                  {poolByQuadrant[4].map(renderPoolRow)}
                </PoolSection>
              </>
            )}
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

        <DragOverlay dropAnimation={{ duration: 160, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
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
