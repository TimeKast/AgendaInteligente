'use client';

/**
 * WeekDaysPlanner — 7 collapsible day cards for /week, drag-enabled.
 *
 * Each card is a droppable target keyed by its YYYY-MM-DD. Activities
 * inside the cards are draggable. Drop semantics:
 *
 *   activity → day card    → scheduled_dates = [targetDay]
 *   activity → "Sin día"   → scheduled_dates = []
 *
 * The drag is a MOVE: the activity loses its prior dates (no copy
 * across days). For multi-day rituals use the activity detail page.
 *
 * State flow:
 *   1. Local items[] state seeds from server data.
 *   2. onDragEnd updates items[] optimistically + fires updateActivity.
 *   3. On action failure → revert.
 */

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDown, GripVertical, Plus } from 'lucide-react';
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
import {
  ActivityQuickAdd,
  type QuickAddDraft,
  type QuickAddProject,
  type QuickAddCategory,
} from './ActivityQuickAdd';
import { createActivity, updateActivity } from '@/lib/actions/activity';
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

/** Compose the draggable id so the SAME activity in multiple buckets has unique ids. */
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

  // Seed local list from the server-side bucket result. Each unique
  // activity appears once with its full date list (within the visible
  // week). Items outside the week have dates: [].
  const [items, setItems] = useState<PlannerItem[]>(() => {
    const seen = new Map<string, PlannerItem>();
    for (const d of days) {
      for (const a of byDay[d] ?? []) {
        const existing = seen.get(a.id);
        if (existing) {
          existing.dates.push(d);
        } else {
          seen.set(a.id, { ...a, dates: [d] });
        }
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
    const noDayLocal: PlannerItem[] = [];
    for (const item of items) {
      const matched = item.dates.filter((d) => dayLookup.has(d));
      if (matched.length > 0) {
        for (const d of matched) byDayLocal[d].push(item);
      } else {
        noDayLocal.push(item);
      }
    }
    for (const d of days) {
      byDayLocal[d].sort((x, y) => {
        const tx = x.scheduledTime ?? '99:99';
        const ty = y.scheduledTime ?? '99:99';
        if (tx !== ty) return tx.localeCompare(ty);
        return y.priority - x.priority;
      });
    }
    noDayLocal.sort((x, y) => y.priority - x.priority);
    return { byDay: byDayLocal, noDay: noDayLocal };
  }, [items, days]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const { activityId } = parseDragId(String(active.id));
    const overId = String(over.id);
    if (!overId.startsWith(DROP_PREFIX)) return;
    const target = overId.slice(DROP_PREFIX.length); // YMD or "none"

    const current = items.find((it) => it.id === activityId);
    if (!current) return;
    // If dropping on the only day the item is in, no-op.
    if (target === 'none' && current.dates.length === 0) return;
    if (target !== 'none' && current.dates.length === 1 && current.dates[0] === target) return;

    const nextDates = target === 'none' ? [] : [target];
    const prevDates = current.dates;

    setItems((prev) => prev.map((it) => (it.id === activityId ? { ...it, dates: nextDates } : it)));

    startTransition(async () => {
      const result = await updateActivity({ id: activityId, scheduledDates: nextDates });
      if (result.error) {
        toast.error(`No se pudo mover: ${result.error}`);
        // Rollback
        setItems((prev) =>
          prev.map((it) => (it.id === activityId ? { ...it, dates: prevDates } : it))
        );
        return;
      }
      router.refresh();
    });
  }

  function handleCreate(draft: QuickAddDraft, targetDay: string) {
    startTransition(async () => {
      const result = await createActivity({
        title: draft.title,
        projectId: draft.projectId,
        priority: draft.priority,
        description: draft.description,
        scheduledTime: draft.scheduledTime ? `${draft.scheduledTime}:00` : null,
        scheduledDates: [targetDay],
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
          Planeación día a día
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
          Arrastrá tareas entre días o tocá + para agregar.
        </p>
      </header>

      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
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

        <NoDayDropZone items={buckets.noDay} />
      </DndContext>
    </section>
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
              marginLeft: 8,
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
            padding: '4px 10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'var(--ag-font-body)',
            fontSize: 12,
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
            fontSize: 13,
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

function NoDayDropZone({ items }: { items: PlannerItem[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: NO_DAY });
  return (
    <details
      ref={setNodeRef}
      style={{
        border: '1px dashed var(--ag-rule)',
        borderRadius: 'var(--ag-radius-base)',
        padding: 'var(--ag-space-3)',
        backgroundColor: isOver
          ? 'color-mix(in oklab, var(--ag-bg-elevated), transparent 30%)'
          : 'transparent',
        transition: 'background-color 160ms ease-out',
      }}
      open={isOver || items.length === 0}
    >
      <summary
        style={{
          cursor: 'pointer',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 13,
          color: 'var(--ag-ink-soft)',
        }}
      >
        Sin día asignado · {items.length}
        {isOver ? ' · soltá acá' : ''}
      </summary>
      {items.length === 0 ? (
        <p
          style={{
            margin: 0,
            paddingTop: 'var(--ag-space-2)',
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 12,
            color: 'var(--ag-ink-hint)',
          }}
        >
          Vacío.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, marginTop: 'var(--ag-space-2)' }}>
          {items.slice(0, 30).map((a) => (
            <DraggableRow key={`${a.id}-none`} item={a} sourceYmd={null} />
          ))}
        </ul>
      )}
    </details>
  );
}

function DraggableRow({ item, sourceYmd }: { item: PlannerItem; sourceYmd: string | null }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId(item.id, sourceYmd),
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
      <GripVertical size={16} strokeWidth={1.5} aria-hidden />
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
