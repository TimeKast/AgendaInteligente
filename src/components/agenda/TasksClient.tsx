'use client';

/**
 * TasksClient — interactive shell for the /tasks page.
 *
 * Server component (src/app/(agendaInteligente)/tasks/page.tsx) loads
 * `listActivities` + project label map and hands them here.
 *
 * Quick-add + status transitions persist via createActivity /
 * transitionActivity in addition to optimistic local state.
 *
 * Filters / sort / search remain in-memory client state.
 */

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Search, X, FolderTree, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { ActivityRow, type ActivityStatus } from '@/components/agenda/ActivityRow';
import { FilterChips } from '@/components/agenda/FilterChips';
import { SortDropdown } from '@/components/agenda/SortDropdown';
import {
  ActivityQuickAdd,
  type QuickAddDraft,
  type QuickAddProject,
  type QuickAddCategory,
} from '@/components/agenda/ActivityQuickAdd';
import {
  ActivityStatusModal,
  type ExtendedActivityStatus,
  type StatusReason,
} from '@/components/agenda/ActivityStatusModal';
import { createActivity, transitionActivity } from '@/lib/actions/activity';

// Filter buckets. 'closed' = done (Cerrada). 'cancelled' = explicit drop.
// Both are hidden by default in the assignable lists (today/week pools)
// but stay browsable here under their own chips.
type StatusFilter = 'open' | 'closed' | 'cancelled' | 'blocked' | 'all';
type SortKey = 'date' | 'priority' | 'deadline' | 'project';

export interface Task {
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
  /** Optional free-form description — surfaced via row hover tooltip. */
  description?: string | null;
}

interface TasksClientProps {
  initialTasks: Task[];
  /** YYYY-MM-DD of the user's local "today" — used as quick-add default. */
  todayDate: string;
  /** Real project list — feeds the quick-add picker. Inbox-first. */
  projects: QuickAddProject[];
  /** Full category catalog — Inbox first. */
  categories: QuickAddCategory[];
}

// Disjoint slices so counts add up: open + closed + cancelled + blocked === all.
// A blocked task is NOT "abierta" — it's waiting on something external and
// gets its own bucket.
const OPEN_STATUSES: ActivityStatus[] = ['todo', 'in_progress'];

function matchesFilter(task: Task, filter: StatusFilter): boolean {
  switch (filter) {
    case 'open':
      return OPEN_STATUSES.includes(task.status);
    case 'closed':
      return task.status === 'done';
    case 'cancelled':
      return task.status === 'cancelled';
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

export function TasksClient({ initialTasks, todayDate, projects, categories }: TasksClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState<StatusFilter>('open');
  const [sort, setSort] = useState<SortKey>('date');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Task | null>(null);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      open: 0,
      closed: 0,
      cancelled: 0,
      blocked: 0,
      all: tasks.length,
    };
    for (const t of tasks) {
      if (OPEN_STATUSES.includes(t.status)) c.open++;
      if (t.status === 'done') c.closed++;
      if (t.status === 'cancelled') c.cancelled++;
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
    const scheduledDate = draft.dateISO ?? undefined;
    const optimistic: Task = {
      id: `optimistic:${Date.now()}`,
      title: draft.title,
      projectLabel: draft.projectLabel,
      status: 'todo',
      priority: draft.priority,
      scheduledTime: draft.scheduledTime,
      scheduledDate,
      // Strip optional time fragment for the optimistic row — Task.deadline
      // is YYYY-MM-DD in the rendering layer. Real ISO lands on revalidate.
      deadline: draft.deadline ? draft.deadline.slice(0, 10) : undefined,
      recurrenceRule: draft.recurrenceRule ?? null,
    };
    setTasks((items) => [optimistic, ...items]);
    startTransition(async () => {
      const result = await createActivity({
        title: draft.title,
        projectId: draft.projectId,
        priority: draft.priority,
        description: draft.description,
        scheduledTime: draft.scheduledTime ? `${draft.scheduledTime}:00` : null,
        scheduledDates: scheduledDate ? [scheduledDate] : [],
        recurrenceRule: draft.recurrenceRule ?? null,
        deadline: draft.deadline
          ? new Date(
              draft.deadline.includes('T') ? `${draft.deadline}:00` : `${draft.deadline}T23:59:59`
            ).toISOString()
          : null,
      });
      if (result.error) {
        toast.error(`No se pudo guardar: ${result.error}`);
        // Roll back the optimistic insert on failure so the UI stays consistent.
        setTasks((items) => items.filter((t) => t.id !== optimistic.id));
      }
    });
  }

  function applyStatus(target: Task, next: ExtendedActivityStatus, _reason?: StatusReason) {
    setTasks((items) => items.map((t) => (t.id === target.id ? { ...t, status: next } : t)));
    setStatusTarget(null);
    // Don't try to persist for optimistic rows (no real UUID yet) — they'll
    // sync on the next page revalidation.
    if (target.id.startsWith('optimistic:')) {
      toast('Status actualizado.');
      return;
    }
    const mapped: Record<
      ExtendedActivityStatus,
      'done' | 'blocked' | 'cancelled' | 'pending' | null
    > = {
      done: 'done',
      blocked: 'blocked',
      cancelled: 'cancelled',
      todo: 'pending',
      in_progress: null,
    };
    const toStatus = mapped[next];
    if (!toStatus) {
      toast('Status actualizado.');
      return;
    }
    startTransition(async () => {
      const result = await transitionActivity({ id: target.id, toStatus });
      if (result.error) {
        toast.error(`No se pudo actualizar: ${result.error}`);
        // Roll back.
        setTasks((items) =>
          items.map((t) => (t.id === target.id ? { ...t, status: target.status } : t))
        );
      } else {
        toast('Status actualizado.');
      }
    });
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
        className="ag-page-wide"
        style={{
          paddingInline: 'var(--ag-space-4)',
          paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
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
              projects={projects}
              categories={categories}
              defaultDateISO={todayDate}
              defaultOpen
              onCancel={() => setQuickAddOpen(false)}
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
                { id: 'open', label: `Pendientes (${counts.open})` },
                { id: 'blocked', label: `Bloqueadas (${counts.blocked})` },
                { id: 'closed', label: `Cerradas (${counts.closed})` },
                { id: 'cancelled', label: `Canceladas (${counts.cancelled})` },
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
                <Search
                  size={14}
                  strokeWidth={1.5}
                  aria-hidden
                  style={{ color: 'var(--ag-ink-hint)' }}
                />
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
                    <TaskListItem key={t.id} task={t} onOpenStatus={() => setStatusTarget(t)} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {visible.map((t) => (
              <TaskListItem key={t.id} task={t} onOpenStatus={() => setStatusTarget(t)} />
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

function TaskListItem({ task, onOpenStatus }: { task: Task; onOpenStatus: () => void }) {
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
        description={task.description ?? null}
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
