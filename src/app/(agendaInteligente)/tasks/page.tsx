'use client';

/**
 * /tasks — All Tasks view.
 *
 * Cross-project flat list of activities. Visual-only prototype with
 * hardcoded seed. Filters (status group) + sort (date / priority /
 * deadline / project) + optional text search. Tap row → /activity/[id].
 *
 * Mobile-first: list of ActivityRow. Pool tasks (no scheduledDates)
 * surface a "Sin día" caption. Recurring tasks show the Repeat icon
 * inline next to the title via ActivityRow.recurrenceRule.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X, FolderTree, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import {
  ActivityRow,
  type ActivityStatus,
} from '@/components/agenda/ActivityRow';
import { FilterChips } from '@/components/agenda/FilterChips';
import { SortDropdown } from '@/components/agenda/SortDropdown';
import {
  ActivityQuickAdd,
  type QuickAddDraft,
} from '@/components/agenda/ActivityQuickAdd';
import {
  ActivityStatusModal,
  type ExtendedActivityStatus,
  type StatusReason,
} from '@/components/agenda/ActivityStatusModal';

type StatusFilter = 'open' | 'done' | 'skipped' | 'blocked' | 'all';
type SortKey = 'date' | 'priority' | 'deadline' | 'project';

interface Task {
  id: string;
  title: string;
  projectLabel: string;
  status: ActivityStatus;
  priority: number;
  /** Optional HH:mm scheduled time. */
  scheduledTime?: string;
  /** ISO YYYY-MM-DD scheduled date — undefined if pool/no-day. */
  scheduledDate?: string;
  /** ISO YYYY-MM-DD deadline. */
  deadline?: string;
  /** 0..100 progress. */
  progressPercent?: number;
  /** Simplified recurrence DSL — see RecurrencePicker. */
  recurrenceRule?: string | null;
}

/** Frozen prototype "today" matching the rest of the app. */
const PROTO_TODAY = '2026-05-22';

const INITIAL_TASKS: Task[] = [
  {
    id: 't-001',
    title: 'Llamar a Juan',
    projectLabel: 'Empresa Genomma',
    status: 'todo',
    priority: 4,
    scheduledTime: '09:00',
    scheduledDate: '2026-05-22',
    deadline: '2026-05-25',
  },
  {
    id: 't-002',
    title: 'Gym',
    projectLabel: 'Personal',
    status: 'in_progress',
    priority: 3,
    scheduledTime: '07:00',
    scheduledDate: '2026-05-22',
    progressPercent: 40,
    recurrenceRule: 'weekly:MO,WE,FR',
  },
  {
    id: 't-003',
    title: 'Revisar emails',
    projectLabel: 'Inbox',
    status: 'todo',
    priority: 2,
    scheduledDate: '2026-05-22',
    recurrenceRule: 'daily',
  },
  {
    id: 't-004',
    title: 'Reporte mensual',
    projectLabel: 'Empresa Genomma',
    status: 'todo',
    priority: 5,
    deadline: '2026-06-01',
    scheduledDate: '2026-05-29',
    recurrenceRule: 'monthly:1',
  },
  {
    id: 't-005',
    title: 'Diseñar landing v0.5',
    projectLabel: 'Empresa Genomma',
    status: 'in_progress',
    priority: 4,
    scheduledDate: '2026-05-23',
    deadline: '2026-05-30',
    progressPercent: 65,
  },
  {
    id: 't-006',
    title: 'Auditoría smart contract',
    projectLabel: 'Side project Web3',
    status: 'blocked',
    priority: 5,
    deadline: '2026-05-20',
  },
  {
    id: 't-007',
    title: 'Comprar regalo Mamá',
    projectLabel: 'Personal',
    status: 'todo',
    priority: 3,
    deadline: '2026-05-26',
  },
  {
    id: 't-008',
    title: 'Estudiar alemán — capítulo 4',
    projectLabel: 'Personal',
    status: 'todo',
    priority: 2,
    scheduledDate: '2026-05-24',
    progressPercent: 25,
  },
  {
    id: 't-009',
    title: 'Pagar tarjeta',
    projectLabel: 'Personal',
    status: 'done',
    priority: 4,
    scheduledDate: '2026-05-21',
  },
  {
    id: 't-010',
    title: 'Kickoff Q2 strategy',
    projectLabel: 'Empresa Genomma',
    status: 'done',
    priority: 5,
    scheduledDate: '2026-05-20',
  },
  {
    id: 't-011',
    title: 'Refactor schema usuarios',
    projectLabel: 'Side project Web3',
    status: 'todo',
    priority: 3,
    deadline: '2026-06-10',
  },
  {
    id: 't-012',
    title: 'Hacer cita al dentista',
    projectLabel: 'Personal',
    status: 'skipped',
    priority: 2,
  },
  {
    id: 't-013',
    title: 'Leer libro de la semana',
    projectLabel: 'Personal',
    status: 'todo',
    priority: 1,
  },
  {
    id: 't-014',
    title: 'Investigar competencia',
    projectLabel: 'Empresa Genomma',
    status: 'todo',
    priority: 3,
    deadline: '2026-07-15',
  },
  {
    id: 't-015',
    title: 'Renovar dominio',
    projectLabel: 'Side project Web3',
    status: 'todo',
    priority: 2,
    deadline: '2026-05-28',
  },
];

const OPEN_STATUSES: ActivityStatus[] = ['todo', 'in_progress', 'blocked'];

function matchesFilter(task: Task, filter: StatusFilter): boolean {
  switch (filter) {
    case 'open':
      return OPEN_STATUSES.includes(task.status);
    case 'done':
      return task.status === 'done';
    case 'skipped':
      return task.status === 'skipped';
    case 'blocked':
      return task.status === 'blocked';
    case 'all':
      return true;
  }
}

function compareTasks(a: Task, b: Task, sort: SortKey): number {
  switch (sort) {
    case 'date': {
      // scheduled_date desc, nulls last
      if (!a.scheduledDate && !b.scheduledDate) return 0;
      if (!a.scheduledDate) return 1;
      if (!b.scheduledDate) return -1;
      return b.scheduledDate.localeCompare(a.scheduledDate);
    }
    case 'priority':
      return b.priority - a.priority;
    case 'deadline': {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    }
    case 'project':
      return a.projectLabel.localeCompare(b.projectLabel, 'es');
  }
}

function groupByProject(tasks: Task[]): Array<{ project: string; items: Task[] }> {
  const map = new Map<string, Task[]>();
  for (const t of tasks) {
    const arr = map.get(t.projectLabel) ?? [];
    arr.push(t);
    map.set(t.projectLabel, arr);
  }
  return Array.from(map.entries())
    .map(([project, items]) => ({ project, items }))
    .sort((a, b) => a.project.localeCompare(b.project, 'es'));
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [filter, setFilter] = useState<StatusFilter>('open');
  const [sort, setSort] = useState<SortKey>('date');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Task | null>(null);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      open: 0,
      done: 0,
      skipped: 0,
      blocked: 0,
      all: tasks.length,
    };
    for (const t of tasks) {
      if (OPEN_STATUSES.includes(t.status)) c.open++;
      if (t.status === 'done') c.done++;
      if (t.status === 'skipped') c.skipped++;
      if (t.status === 'blocked') c.blocked++;
    }
    return c;
  }, [tasks]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = tasks.filter((t) => {
      if (!matchesFilter(t, filter)) return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...filtered].sort((a, b) => compareTasks(a, b, sort));
  }, [tasks, filter, sort, query]);

  const grouped = useMemo(() => groupByProject(visible), [visible]);

  function handleCreate(draft: QuickAddDraft) {
    const next: Task = {
      id: `t-${Date.now()}`,
      title: draft.title,
      projectLabel: draft.projectLabel,
      status: 'todo',
      priority: draft.priority,
      scheduledTime: draft.scheduledTime,
      scheduledDate: draft.dateLabel === 'Hoy' ? PROTO_TODAY : undefined,
      deadline: draft.deadline,
      recurrenceRule: draft.recurrenceRule ?? null,
    };
    setTasks((items) => [next, ...items]);
  }

  function applyStatus(
    target: Task,
    next: ExtendedActivityStatus,
    _reason?: StatusReason,
  ) {
    setTasks((items) =>
      items.map((t) => (t.id === target.id ? { ...t, status: next } : t)),
    );
    setStatusTarget(null);
    toast('Status actualizado.');
  }

  return (
    <>
      <AgendaHeader
        dateLabel="Tareas"
        rightSlot={
          <button
            type="button"
            onClick={() => setQuickAddOpen((v) => !v)}
            aria-expanded={quickAddOpen}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              color: 'var(--ag-ink-soft)',
              cursor: 'pointer',
              padding: 'var(--ag-space-2)',
            }}
          >
            + Nueva
          </button>
        }
      />

      <main
        style={{
          maxWidth: 640,
          marginInline: 'auto',
          paddingInline: 'var(--ag-space-4)',
          paddingBottom:
            'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Quick links to organization catalogs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--ag-space-2)',
            paddingTop: 'var(--ag-space-3)',
          }}
        >
          <TasksQuickLink
            href="/categories"
            icon={<FolderTree size={14} strokeWidth={1.5} aria-hidden />}
            label="Categorías"
          />
          <TasksQuickLink
            href="/projects"
            icon={<Briefcase size={14} strokeWidth={1.5} aria-hidden />}
            label="Proyectos"
          />
        </div>

        {quickAddOpen ? (
          <div style={{ paddingTop: 'var(--ag-space-3)' }}>
            <ActivityQuickAdd
              onCreate={(draft) => {
                handleCreate(draft);
                setQuickAddOpen(false);
              }}
            />
          </div>
        ) : null}

        {/* Filters + sort + search */}
        <div
          style={{
            paddingTop: 'var(--ag-space-3)',
            paddingBottom: 'var(--ag-space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-2)',
          }}
        >
          <div
            style={{
              overflowX: 'auto',
              marginInline: 'calc(var(--ag-space-4) * -1)',
              paddingInline: 'var(--ag-space-4)',
            }}
          >
            <FilterChips<StatusFilter>
              value={filter}
              onChange={setFilter}
              options={[
                { id: 'open', label: `Abiertas (${counts.open})` },
                { id: 'done', label: `Done (${counts.done})` },
                { id: 'skipped', label: `Skipped (${counts.skipped})` },
                { id: 'blocked', label: `Bloqueadas (${counts.blocked})` },
                { id: 'all', label: `Todas (${counts.all})` },
              ]}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--ag-space-2)',
              flexWrap: 'wrap',
            }}
          >
            <SortDropdown<SortKey>
              label="Orden"
              value={sort}
              onChange={setSort}
              options={[
                { id: 'date', label: 'Fecha' },
                { id: 'priority', label: 'Prioridad' },
                { id: 'deadline', label: 'Deadline' },
                { id: 'project', label: 'Proyecto' },
              ]}
            />
            {searchOpen ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  flex: 1,
                  minWidth: 0,
                  border: '1px solid var(--ag-rule)',
                  borderRadius: 'var(--ag-radius-pill)',
                  padding: '4px 8px 4px 12px',
                }}
              >
                <Search size={14} strokeWidth={1.5} aria-hidden style={{ color: 'var(--ag-ink-hint)' }} />
                <input
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar…"
                  aria-label="Buscar tareas"
                  style={{
                    appearance: 'none',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    flex: 1,
                    minWidth: 0,
                    fontFamily: 'var(--ag-font-body)',
                    fontSize: 13,
                    color: 'var(--ag-ink-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSearchOpen(false);
                  }}
                  aria-label="Cerrar búsqueda"
                  style={{
                    appearance: 'none',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--ag-ink-hint)',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'inline-flex',
                  }}
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Buscar"
                style={{
                  appearance: 'none',
                  background: 'transparent',
                  border: '1px solid var(--ag-rule)',
                  borderRadius: 'var(--ag-radius-pill)',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  color: 'var(--ag-ink-soft)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily: 'var(--ag-font-body)',
                  fontSize: 13,
                }}
              >
                <Search size={14} strokeWidth={1.5} aria-hidden />
                Buscar
              </button>
            )}
          </div>
        </div>

        {/* Task list — flat or grouped by project */}
        {visible.length === 0 ? (
          <p
            style={{
              margin: 0,
              paddingBlock: 'var(--ag-space-5)',
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--ag-ink-hint)',
            }}
          >
            Sin tareas en este filtro.
          </p>
        ) : sort === 'project' ? (
          <div>
            {grouped.map((g) => (
              <section key={g.project} style={{ marginBottom: 'var(--ag-space-4)' }}>
                <TaskGroupHeader label={g.project} count={g.items.length} />
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {g.items.map((t) => (
                    <TaskListItem
                      key={t.id}
                      task={t}
                      onOpenStatus={() => setStatusTarget(t)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {visible.map((t) => (
              <TaskListItem
                key={t.id}
                task={t}
                onOpenStatus={() => setStatusTarget(t)}
              />
            ))}
          </ul>
        )}
      </main>

      <ActivityStatusModal
        open={!!statusTarget}
        title={statusTarget?.title ?? ''}
        currentStatus={(statusTarget?.status ?? 'todo') as ExtendedActivityStatus}
        onCancel={() => setStatusTarget(null)}
        onApply={(next, reason) => {
          if (statusTarget) applyStatus(statusTarget, next, reason);
        }}
      />
    </>
  );
}

/**
 * TasksQuickLink — small ghost link button used in the tasks toolbar.
 * Mobile (<640px): icon-only, label is `aria-label` only.
 * Desktop: icon + visible text label.
 */
function TasksQuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        border: '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-pill)',
        padding: '6px 10px',
        fontFamily: 'var(--ag-font-body)',
        fontSize: 13,
        color: 'var(--ag-ink-soft)',
        textDecoration: 'none',
        backgroundColor: 'transparent',
      }}
    >
      {icon}
      <span className="ag-quicklink-label">{label}</span>
      <style>{`
        .ag-quicklink-label {
          display: none;
        }
        @media (min-width: 640px) {
          .ag-quicklink-label {
            display: inline;
          }
        }
      `}</style>
    </Link>
  );
}

function TaskGroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <h2
      style={{
        margin: 0,
        paddingBlock: 'var(--ag-space-2)',
        fontFamily: 'var(--ag-font-body)',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--ag-slate)',
      }}
    >
      {label}
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
        · {count}
      </span>
    </h2>
  );
}

function TaskListItem({
  task,
  onOpenStatus,
}: {
  task: Task;
  onOpenStatus: () => void;
}) {
  const noDay = !task.scheduledDate;
  return (
    <>
      <ActivityRow
        title={task.title}
        status={task.status}
        scheduledTime={task.scheduledTime}
        priority={task.priority}
        projectLabel={task.projectLabel}
        href={`/activity/${task.id}`}
        deadline={task.deadline}
        progressPercent={task.progressPercent}
        recurrenceRule={task.recurrenceRule ?? null}
        trailingSlot={
          <button
            type="button"
            onClick={onOpenStatus}
            aria-label={`Cambiar status de ${task.title}`}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              padding: 'var(--ag-space-2)',
              color: 'var(--ag-ink-hint)',
              cursor: 'pointer',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ⋯
          </button>
        }
      />
      {noDay ? (
        <p
          style={{
            margin: 0,
            paddingLeft: 30,
            paddingBottom: 'var(--ag-space-2)',
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 12,
            color: 'var(--ag-ink-hint)',
          }}
        >
          Sin día
        </p>
      ) : null}
    </>
  );
}
