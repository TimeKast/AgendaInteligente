'use client';

/**
 * WeekDaysPlanner — 7 collapsible day cards for /week. Each card lists
 * activities scheduled for that day and exposes an inline quick-add
 * pre-filled with that day's date.
 *
 * Deliberately NOT drag-and-drop in this iteration — assigning a task
 * to a day means either creating it via the per-day quick-add or
 * editing an existing one and changing its date. Drag/drop across days
 * is a follow-up.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDown, Plus } from 'lucide-react';
import { ActivityRow } from './ActivityRow';
import {
  ActivityQuickAdd,
  type QuickAddDraft,
  type QuickAddProject,
  type QuickAddCategory,
} from './ActivityQuickAdd';
import { createActivity } from '@/lib/actions/activity';
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
          Asigná tareas a cada día. Toca + para agregar.
        </p>
      </header>

      {days.map((d) => {
        const items = byDay[d] ?? [];
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

      {noDay.length > 0 ? (
        <details
          style={{
            border: '1px dashed var(--ag-rule)',
            borderRadius: 'var(--ag-radius-base)',
            padding: 'var(--ag-space-3)',
            backgroundColor: 'transparent',
          }}
        >
          <summary
            style={{
              cursor: 'pointer',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              color: 'var(--ag-ink-soft)',
            }}
          >
            Sin día asignado · {noDay.length}
          </summary>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, marginTop: 'var(--ag-space-2)' }}>
            {noDay.slice(0, 30).map((a) => (
              <ActivityRow
                key={a.id}
                title={a.title}
                status={a.status}
                priority={a.priority}
                projectLabel={a.projectName}
                href={`/activity/${a.id}`}
                scheduledTime={a.scheduledTime ?? undefined}
                deadline={a.deadline ?? undefined}
                description={a.description}
                recurrenceRule={a.recurrenceRule ?? null}
              />
            ))}
          </ul>
        </details>
      ) : null}
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
  items: WeekActivitySummary[];
  isQuickAddOpen: boolean;
  onToggleQuickAdd: () => void;
  projects: QuickAddProject[];
  categories: QuickAddCategory[];
  onCreate: (draft: QuickAddDraft) => void;
}) {
  return (
    <article
      style={{
        border: '1px solid var(--ag-rule)',
        borderLeft: isToday ? '3px solid var(--ag-ink-primary)' : '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-base)',
        backgroundColor: 'var(--ag-bg-elevated)',
        padding: 'var(--ag-space-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-2)',
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
          Sin tareas.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map((a) => (
            <ActivityRow
              key={a.id}
              title={a.title}
              status={a.status}
              priority={a.priority}
              projectLabel={a.projectName}
              href={`/activity/${a.id}`}
              scheduledTime={a.scheduledTime ?? undefined}
              deadline={a.deadline ?? undefined}
              description={a.description}
              recurrenceRule={a.recurrenceRule ?? null}
            />
          ))}
        </ul>
      )}
    </article>
  );
}
