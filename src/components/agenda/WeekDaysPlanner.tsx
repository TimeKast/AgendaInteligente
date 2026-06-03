'use client';

/**
 * WeekDaysPlanner — week planner with deadline-grouped pool on top and
 * 7 horizontal day cards below.
 *
 * Layout:
 *   Pool (sticky on desktop): tasks with no day yet, split into
 *     · Vence esta semana
 *     · Vence la próxima semana
 *     · Sin deadline (general backlog)
 *   Days: responsive grid (auto-fill, minmax(200px, 1fr)) so we get
 *     7 columns on wide desktops, 2-4 on tablets, 1 on mobile.
 *
 * Drag semantics: MOVE (the activity loses its prior dates).
 *   activity → day card    → scheduled_dates = [targetDay]
 *   activity → pool        → scheduled_dates = []
 */

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  pointerWithin,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ActivityRow } from './ActivityRow';
import {
  ActivityQuickAdd,
  type QuickAddDraft,
  type QuickAddProject,
  type QuickAddCategory,
} from './ActivityQuickAdd';
import { createActivity, updateActivity } from '@/lib/actions/activity';
import { addDaysIsoYmd } from '@/lib/domain/day-calc';
import type { WeekActivitySummary } from '@/lib/db/queries/week-activities';

interface WeekDaysPlannerProps {
  /** 7 YYYY-MM-DD strings starting at week-start (Sunday). */
  days: string[];
  /** YYYY-MM-DD of "today" — drives the highlighted card. */
  todayYmd: string;
  byDay: Record<string, WeekActivitySummary[]>;
  noDay: WeekActivitySummary[];
  projects: QuickAddProject[];
  categories: QuickAddCategory[];
}

interface PlannerItem extends WeekActivitySummary {
  /** Local list of YMD strings — drives bucket placement. */
  dates: string[];
}

const SPANISH_WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const SPANISH_MONTHS_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

function dayLabel(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${SPANISH_WEEKDAYS[date.getUTCDay()]} ${d} ${SPANISH_MONTHS_SHORT[m - 1]}`;
}

const DROP_PREFIX = 'day:';
const NO_DAY = `${DROP_PREFIX}none`;

function dragId(activityId: string, sourceYmd: string | null): string {
  return `${activityId}::${sourceYmd ?? 'none'}`;
}
function parseDragId(id: string): { activityId: string } {
  const [activityId] = id.split('::');
  return { activityId };
}

export function WeekDaysPlanner({
  days,
  todayYmd,
  byDay,
  noDay,
  projects,
  categories,
}: WeekDaysPlannerProps) {
  const router = useRouter();
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Week boundaries for deadline bucketing.
  const weekStart = days[0];
  const weekEnd = days[6];
  const nextWeekEnd = useMemo(() => addDaysIsoYmd(weekStart, 13), [weekStart]);

  const [items, setItems] = useState<PlannerItem[]>(() => {
    const seen = new Map<string, PlannerItem>();
    for (const d of days) {
      for (const a of byDay[d] ?? []) {
        const existing = seen.get(a.id);
        if (existing) existing.dates.push(d);
        else seen.set(a.id, { ...a, dates: [d] });
      }
    }
    for (const a of noDay) {
      if (!seen.has(a.id)) seen.set(a.id, { ...a, dates: [] });
    }
    return Array.from(seen.values());
  });

  const buckets = useMemo(() => {
    const dayLookup = new Set(days);
    const byDayLocal: Record<string, PlannerItem[]> = {};
    for (const d of days) byDayLocal[d] = [];
    const poolThisWeek: PlannerItem[] = [];
    const poolNextWeek: PlannerItem[] = [];
    const poolNoDeadline: PlannerItem[] = [];
    for (const item of items) {
      const matched = item.dates.filter((d) => dayLookup.has(d));
      if (matched.length > 0) {
        for (const d of matched) byDayLocal[d].push(item);
        continue;
      }
      // No day in this week → pool by deadline.
      if (item.dates.length > 0) continue; // scheduled in another week — hidden
      const due = item.deadline ?? null;
      if (due && due >= weekStart && due <= weekEnd) {
        poolThisWeek.push(item);
      } else if (due && due > weekEnd && due <= nextWeekEnd) {
        poolNextWeek.push(item);
      } else {
        poolNoDeadline.push(item);
      }
    }
    const cmp = (x: PlannerItem, y: PlannerItem) => {
      const dx = x.deadline ?? '9999-99-99';
      const dy = y.deadline ?? '9999-99-99';
      if (dx !== dy) return dx.localeCompare(dy);
      return y.priority - x.priority;
    };
    for (const d of days) {
      byDayLocal[d].sort((x, y) => {
        const tx = x.scheduledTime ?? '99:99';
        const ty = y.scheduledTime ?? '99:99';
        if (tx !== ty) return tx.localeCompare(ty);
        return y.priority - x.priority;
      });
    }
    poolThisWeek.sort(cmp);
    poolNextWeek.sort(cmp);
    poolNoDeadline.sort((x, y) => y.priority - x.priority);
    return { byDay: byDayLocal, poolThisWeek, poolNextWeek, poolNoDeadline };
  }, [items, days, weekStart, weekEnd, nextWeekEnd]);

  // Desktop: instant after 6px move. Mobile: 180ms hold so quick taps
  // navigate + vertical scroll keeps working on the lists.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 5 } })
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const { activityId } = parseDragId(String(active.id));
    const overId = String(over.id);
    if (!overId.startsWith(DROP_PREFIX)) return;
    const target = overId.slice(DROP_PREFIX.length);

    const current = items.find((it) => it.id === activityId);
    if (!current) return;
    if (target === 'none' && current.dates.length === 0) return;
    if (target !== 'none' && current.dates.length === 1 && current.dates[0] === target) return;

    const nextDates = target === 'none' ? [] : [target];
    const prevDates = current.dates;
    setItems((prev) => prev.map((it) => (it.id === activityId ? { ...it, dates: nextDates } : it)));
    startTransition(async () => {
      const result = await updateActivity({ id: activityId, scheduledDates: nextDates });
      if (result.error) {
        toast.error(`No se pudo mover: ${result.error}`);
        setItems((prev) =>
          prev.map((it) => (it.id === activityId ? { ...it, dates: prevDates } : it))
        );
        return;
      }
      router.refresh();
    });
  }

  function handleCreate(draft: QuickAddDraft, targetDay: string | null) {
    startTransition(async () => {
      const result = await createActivity({
        title: draft.title,
        projectId: draft.projectId,
        priority: draft.priority,
        description: draft.description,
        scheduledTime: draft.scheduledTime ? `${draft.scheduledTime}:00` : null,
        scheduledDates: targetDay ? [targetDay] : [],
        recurrenceRule: draft.recurrenceRule ?? null,
        deadline: draft.deadline
          ? new Date(
              draft.deadline.includes('T') ? `${draft.deadline}:00` : `${draft.deadline}T23:59:59`
            ).toISOString()
          : null,
      });
      if (result.error) {
        toast.error(`No se pudo guardar: ${result.error}`);
        return;
      }
      toast.success('Tarea agregada.');
      setOpenDay(null);
      router.refresh();
    });
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-3)' }}>
      <header>
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontSize: 16,
            fontWeight: 500,
            color: 'var(--ag-ink-primary)',
          }}
        >
          Planeación de la semana
        </h3>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ag-ink-soft)',
          }}
        >
          Arrastrá del pool a un día, o tocá + en cada tarjeta.
        </p>
      </header>

      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
        <PoolPanel
          thisWeek={buckets.poolThisWeek}
          nextWeek={buckets.poolNextWeek}
          noDeadline={buckets.poolNoDeadline}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 'var(--ag-space-3)',
          }}
        >
          {days.map((d) => {
            const items = buckets.byDay[d] ?? [];
            const isToday = d === todayYmd;
            const isOpen = openDay === d;
            return (
              <DayCard
                key={d}
                label={dayLabel(d)}
                ymd={d}
                isToday={isToday}
                items={items}
                isQuickAddOpen={isOpen}
                onToggleQuickAdd={() => setOpenDay(isOpen ? null : d)}
                projects={projects}
                categories={categories}
                onCreate={(draft) => handleCreate(draft, d)}
              />
            );
          })}
        </div>
      </DndContext>
    </section>
  );
}

function PoolPanel({
  thisWeek,
  nextWeek,
  noDeadline,
}: {
  thisWeek: PlannerItem[];
  nextWeek: PlannerItem[];
  noDeadline: PlannerItem[];
}) {
  const { isOver, setNodeRef } = useDroppable({ id: NO_DAY });
  const total = thisWeek.length + nextWeek.length + noDeadline.length;
  return (
    <section
      ref={setNodeRef}
      style={{
        border: '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-base)',
        backgroundColor: isOver
          ? 'color-mix(in oklab, var(--ag-bg-elevated), transparent 20%)'
          : 'var(--ag-bg)',
        padding: 'var(--ag-space-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-3)',
        transition: 'background-color 160ms ease-out',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 'var(--ag-space-2)',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--ag-slate)',
          }}
        >
          Pendientes sin día · {total}
        </span>
        {isOver ? (
          <span
            style={{
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 12,
              color: 'var(--ag-ink-soft)',
            }}
          >
            soltá acá para volver al pool
          </span>
        ) : null}
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--ag-space-3)',
        }}
      >
        <PoolGroup label="Vence esta semana" tone="warning" items={thisWeek} />
        <PoolGroup label="Vence la próxima semana" tone="notice" items={nextWeek} />
        <PoolGroup label="Sin deadline" tone="muted" items={noDeadline} />
      </div>
    </section>
  );
}

function PoolGroup({
  label,
  tone,
  items,
}: {
  label: string;
  tone: 'warning' | 'notice' | 'muted';
  items: PlannerItem[];
}) {
  const [collapsed, setCollapsed] = useState(items.length === 0);
  const accentColor =
    tone === 'warning'
      ? 'var(--ag-scope-life)'
      : tone === 'notice'
        ? 'var(--ag-scope-year)'
        : 'var(--ag-ink-hint)';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-2)',
        borderLeft: `3px solid ${accentColor}`,
        paddingLeft: 'var(--ag-space-2)',
      }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        style={{
          appearance: 'none',
          background: 'transparent',
          border: 'none',
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          cursor: 'pointer',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ag-slate)',
          alignSelf: 'flex-start',
        }}
        aria-expanded={!collapsed}
      >
        {collapsed ? (
          <ChevronRight size={12} strokeWidth={1.5} />
        ) : (
          <ChevronDown size={12} strokeWidth={1.5} />
        )}
        {label} · {items.length}
      </button>
      {collapsed ? null : items.length === 0 ? (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 12,
            color: 'var(--ag-ink-hint)',
          }}
        >
          Vacío.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.slice(0, 30).map((a) => (
            <DraggableRow key={`${a.id}-pool`} item={a} sourceYmd={null} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DayCard({
  label,
  ymd,
  isToday,
  items,
  isQuickAddOpen,
  onToggleQuickAdd,
  projects,
  categories,
  onCreate,
}: {
  label: string;
  ymd: string;
  isToday: boolean;
  items: PlannerItem[];
  isQuickAddOpen: boolean;
  onToggleQuickAdd: () => void;
  projects: QuickAddProject[];
  categories: QuickAddCategory[];
  onCreate: (draft: QuickAddDraft) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `${DROP_PREFIX}${ymd}` });
  return (
    <article
      ref={setNodeRef}
      style={{
        border: '1px solid var(--ag-rule)',
        borderLeft: isToday ? '3px solid var(--ag-ink-primary)' : '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-base)',
        backgroundColor: isOver
          ? 'color-mix(in oklab, var(--ag-bg-elevated), transparent 20%)'
          : 'var(--ag-bg-elevated)',
        padding: 'var(--ag-space-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-2)',
        transition: 'background-color 160ms ease-out',
        minHeight: 120,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--ag-space-2)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: isToday ? 'var(--ag-ink-primary)' : 'var(--ag-slate)',
          }}
        >
          {label}
          {isToday ? ' · hoy' : ''}
          <span
            style={{
              marginLeft: 6,
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontWeight: 400,
              letterSpacing: '0.02em',
              textTransform: 'none',
              color: 'var(--ag-ink-hint)',
            }}
          >
            · {items.length}
          </span>
        </span>
        <button
          type="button"
          onClick={onToggleQuickAdd}
          aria-label={`Agregar tarea para ${label}`}
          style={{
            appearance: 'none',
            background: 'transparent',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-pill)',
            padding: '2px 8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'var(--ag-font-body)',
            fontSize: 11,
            color: 'var(--ag-ink-soft)',
            cursor: 'pointer',
          }}
        >
          {isQuickAddOpen ? (
            <ChevronDown size={12} strokeWidth={1.5} />
          ) : (
            <Plus size={12} strokeWidth={1.5} />
          )}
          {isQuickAddOpen ? 'Cerrar' : 'Tarea'}
        </button>
      </header>

      {isQuickAddOpen ? (
        <ActivityQuickAdd
          projects={projects}
          categories={categories}
          defaultDateISO={ymd}
          defaultOpen
          onCancel={onToggleQuickAdd}
          submitLabel="Agregar →"
          onCreate={onCreate}
        />
      ) : null}

      {items.length === 0 ? (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 12,
            color: 'var(--ag-ink-hint)',
          }}
        >
          {isOver ? 'Soltá acá' : 'Sin tareas.'}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map((a) => (
            <DraggableRow key={`${a.id}-${ymd}`} item={a} sourceYmd={ymd} />
          ))}
        </ul>
      )}
    </article>
  );
}

function DraggableRow({ item, sourceYmd }: { item: PlannerItem; sourceYmd: string | null }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId(item.id, sourceYmd),
  });
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Arrastrá ${item.title}`}
      style={{
        listStyle: 'none',
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <ActivityRow
        title={item.title}
        status={item.status}
        priority={item.priority}
        projectLabel={item.projectName}
        href={`/activity/${item.id}`}
        scheduledTime={item.scheduledTime ?? undefined}
        deadline={item.deadline ?? undefined}
        description={item.description}
        recurrenceRule={item.recurrenceRule ?? null}
      />
    </li>
  );
}
