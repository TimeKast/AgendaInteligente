'use client';

/**
 * MonthWeeksPlanner — week cards spanning the month + deadline-grouped pool.
 *
 * Same drag/drop semantics as the week planner but at month scope: the
 * drop targets are WEEKS, not days. Dropping a task on a week assigns
 * it to that week's Sunday (`scheduled_dates = [weekStartingYmd]`). For
 * day-level placement, the user clicks the week to jump to /week?date=…
 */

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, GripVertical, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  pointerWithin,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ActivityRow } from './ActivityRow';
import { updateActivity } from '@/lib/actions/activity';
import type {
  MonthActivitiesResult,
  MonthActivitySummary,
  MonthWeek,
} from '@/lib/db/queries/month-activities';

interface MonthWeeksPlannerProps {
  data: MonthActivitiesResult;
  /** YYYY-MM-DD of today. */
  todayYmd: string;
}

interface PlannerItem extends MonthActivitySummary {
  dates: string[];
}

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

function shortDate(ymd: string): string {
  const [, m, d] = ymd.split('-').map(Number);
  return `${d} ${SPANISH_MONTHS_SHORT[m - 1]}`;
}

function weekLabel(week: MonthWeek): string {
  return `${shortDate(week.days[0])} – ${shortDate(week.days[6])}`;
}

const DROP_PREFIX = 'week:';
const POOL = `${DROP_PREFIX}none`;

function dragId(activityId: string, sourceWeek: string | null): string {
  return `${activityId}::${sourceWeek ?? 'none'}`;
}
function parseDragId(id: string): { activityId: string } {
  return { activityId: id.split('::')[0] };
}

export function MonthWeeksPlanner({ data, todayYmd }: MonthWeeksPlannerProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Seed local items with their dates so drag updates are optimistic.
  const [items, setItems] = useState<PlannerItem[]>(() => {
    const seen = new Map<string, PlannerItem>();
    for (const w of data.weeks) {
      for (const a of w.items) {
        const existing = seen.get(a.id);
        if (existing) {
          for (const d of a.scheduledDates) {
            if (!existing.dates.includes(d)) existing.dates.push(d);
          }
        } else {
          seen.set(a.id, { ...a, dates: [...a.scheduledDates] });
        }
      }
    }
    for (const a of [...data.dueThisMonth, ...data.dueLater, ...data.noDeadline]) {
      if (!seen.has(a.id)) seen.set(a.id, { ...a, dates: [] });
    }
    return Array.from(seen.values());
  });

  const buckets = useMemo(() => {
    const dayToWeek = new Map<string, MonthWeek>();
    for (const w of data.weeks) for (const d of w.days) dayToWeek.set(d, w);

    const byWeek = new Map<string, PlannerItem[]>();
    for (const w of data.weeks) byWeek.set(w.weekStarting, []);
    const poolThisMonth: PlannerItem[] = [];
    const poolLater: PlannerItem[] = [];
    const poolNoDeadline: PlannerItem[] = [];

    for (const item of items) {
      const matchedWeeks = new Set<MonthWeek>();
      for (const d of item.dates) {
        const w = dayToWeek.get(d);
        if (w) matchedWeeks.add(w);
      }
      if (matchedWeeks.size > 0) {
        for (const w of matchedWeeks) byWeek.get(w.weekStarting)!.push(item);
        continue;
      }
      if (item.dates.length > 0) continue; // scheduled outside the month
      if (item.deadline && item.deadline >= data.monthStarting && item.deadline <= data.monthEnd) {
        poolThisMonth.push(item);
      } else if (item.deadline && item.deadline > data.monthEnd) {
        poolLater.push(item);
      } else {
        poolNoDeadline.push(item);
      }
    }
    return { byWeek, poolThisMonth, poolLater, poolNoDeadline };
  }, [items, data.weeks, data.monthStarting, data.monthEnd]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const { activityId } = parseDragId(String(active.id));
    const overId = String(over.id);
    if (!overId.startsWith(DROP_PREFIX)) return;
    const target = overId.slice(DROP_PREFIX.length);

    const current = items.find((it) => it.id === activityId);
    if (!current) return;

    // Drop on a week → anchor the task at that week's Sunday. Drop on the
    // pool → clear all dates.
    const nextDates = target === 'none' ? [] : [target];
    if (
      target === 'none'
        ? current.dates.length === 0
        : current.dates.length === 1 && current.dates[0] === target
    ) {
      return;
    }

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
          Planeación del mes
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
          Arrastrá del pool a una semana, o tocá la semana para refinar día a día.
        </p>
      </header>

      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
        <PoolPanel
          thisMonth={buckets.poolThisMonth}
          later={buckets.poolLater}
          noDeadline={buckets.poolNoDeadline}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--ag-space-3)',
          }}
        >
          {data.weeks.map((w) => {
            const items = buckets.byWeek.get(w.weekStarting) ?? [];
            const containsToday = w.days.includes(todayYmd);
            return (
              <WeekCard key={w.weekStarting} week={w} items={items} containsToday={containsToday} />
            );
          })}
        </div>
      </DndContext>
    </section>
  );
}

function PoolPanel({
  thisMonth,
  later,
  noDeadline,
}: {
  thisMonth: PlannerItem[];
  later: PlannerItem[];
  noDeadline: PlannerItem[];
}) {
  const { isOver, setNodeRef } = useDroppable({ id: POOL });
  const total = thisMonth.length + later.length + noDeadline.length;
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
        Pendientes sin semana · {total}
        {isOver ? ' · soltá acá' : ''}
      </span>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--ag-space-3)',
        }}
      >
        <PoolGroup label="Vence este mes" tone="warning" items={thisMonth} />
        <PoolGroup label="Vence después del mes" tone="notice" items={later} />
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
            <DraggableRow key={`${a.id}-pool`} item={a} sourceWeek={null} />
          ))}
        </ul>
      )}
    </div>
  );
}

function WeekCard({
  week,
  items,
  containsToday,
}: {
  week: MonthWeek;
  items: PlannerItem[];
  containsToday: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `${DROP_PREFIX}${week.weekStarting}` });
  return (
    <article
      ref={setNodeRef}
      style={{
        border: '1px solid var(--ag-rule)',
        borderLeft: containsToday ? '3px solid var(--ag-ink-primary)' : '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-base)',
        backgroundColor: isOver
          ? 'color-mix(in oklab, var(--ag-bg-elevated), transparent 20%)'
          : 'var(--ag-bg-elevated)',
        padding: 'var(--ag-space-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-2)',
        transition: 'background-color 160ms ease-out',
        minHeight: 140,
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
            color: containsToday ? 'var(--ag-ink-primary)' : 'var(--ag-slate)',
          }}
        >
          {weekLabel(week)}
          {containsToday ? ' · hoy' : ''}
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
        <Link
          href={`/week?date=${week.weekStarting}`}
          aria-label="Ver semana"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-pill)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 11,
            color: 'var(--ag-ink-soft)',
            textDecoration: 'none',
          }}
        >
          Abrir <ArrowRight size={11} strokeWidth={1.5} />
        </Link>
      </header>

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
          {items.slice(0, 12).map((a) => (
            <DraggableRow
              key={`${a.id}-${week.weekStarting}`}
              item={a}
              sourceWeek={week.weekStarting}
            />
          ))}
          {items.length > 12 ? (
            <li
              style={{
                fontFamily: 'var(--ag-font-display)',
                fontStyle: 'italic',
                fontSize: 12,
                color: 'var(--ag-ink-hint)',
                paddingLeft: 'var(--ag-space-2)',
              }}
            >
              +{items.length - 12} más
            </li>
          ) : null}
        </ul>
      )}
    </article>
  );
}

function DraggableRow({ item, sourceWeek }: { item: PlannerItem; sourceWeek: string | null }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId(item.id, sourceWeek),
  });
  const handle = (
    <button
      type="button"
      aria-label={`Arrastrá ${item.title}`}
      {...attributes}
      {...listeners}
      style={{
        appearance: 'none',
        background: 'transparent',
        border: 'none',
        color: 'var(--ag-ink-hint)',
        cursor: 'grab',
        touchAction: 'none',
        padding: 4,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <GripVertical size={14} strokeWidth={1.5} aria-hidden />
    </button>
  );
  return (
    <li
      ref={setNodeRef}
      style={{
        listStyle: 'none',
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
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
        dragHandle={handle}
      />
    </li>
  );
}
