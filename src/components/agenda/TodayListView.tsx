'use client';

/**
 * TodayListView — 4 vertical sections command-center view for /today.
 *
 *   HOY SIN HORARIO  → today + scheduledTime=null
 *   HOY CON HORARIO  → today + scheduledTime!=null (compact list, not the grid)
 *   ESTA SEMANA      → not today, but scheduled this week
 *   PENDIENTES       → no scheduledDate (backlog)
 *
 * Each section header carries a count badge. Each row gets a small colored
 * dot indicator for its Eisenhower quadrant for quick scanning.
 */

import Link from 'next/link';
import type { ActivityStatus } from './ActivityRow';
import { ActivityRow } from './ActivityRow';
import type { Quadrant } from './EisenhowerMatrix';

export interface ListActivity {
  id: string;
  title: string;
  status: ActivityStatus;
  priority: number;
  projectLabel: string;
  scheduledTime?: string;
  /** ISO YYYY-MM-DD. Undefined if pool/backlog. */
  scheduledDate?: string;
  deadline?: string;
  progressPercent?: number;
  quadrant?: Quadrant;
}

interface TodayListViewProps {
  todayISO: string;
  /** ISO range start (sunday) and end (saturday) for "this week". */
  weekStartISO: string;
  weekEndISO: string;
  activities: ListActivity[];
}

const QUADRANT_COLORS: Record<Quadrant, string> = {
  1: 'var(--ag-scope-life)',
  2: 'var(--ag-scope-quarter)',
  3: 'var(--ag-scope-year)',
  4: 'var(--ag-ink-hint)',
};

export function TodayListView({
  todayISO,
  weekStartISO,
  weekEndISO,
  activities,
}: TodayListViewProps) {
  const todayPool: ListActivity[] = [];
  const todayScheduled: ListActivity[] = [];
  const thisWeek: ListActivity[] = [];
  const pending: ListActivity[] = [];

  for (const a of activities) {
    if (a.scheduledDate === todayISO) {
      if (a.scheduledTime) todayScheduled.push(a);
      else todayPool.push(a);
    } else if (
      a.scheduledDate &&
      a.scheduledDate >= weekStartISO &&
      a.scheduledDate <= weekEndISO &&
      a.scheduledDate !== todayISO
    ) {
      thisWeek.push(a);
    } else if (!a.scheduledDate) {
      pending.push(a);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-5)',
      }}
    >
      <ListSection title="Hoy sin horario" items={todayPool} />
      <ListSection title="Hoy con horario" items={todayScheduled} />
      <ListSection title="Esta semana" items={thisWeek} />
      <ListSection title="Pendientes" items={pending} />
    </div>
  );
}

function ListSection({ title, items }: { title: string; items: ListActivity[] }) {
  return (
    <section>
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          paddingBlock: 'var(--ag-space-2)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-body)',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--ag-ink-hint)',
          }}
        >
          {title}
        </h2>
        <span
          style={{
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 12,
            color: 'var(--ag-ink-hint)',
          }}
        >
          · {items.length}
        </span>
      </header>
      {items.length === 0 ? (
        <p
          style={{
            margin: 0,
            paddingBlock: 'var(--ag-space-2)',
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
          }}
        >
          Sin actividades.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map((a) => (
            <li key={a.id} style={{ display: 'flex', alignItems: 'stretch' }}>
              {a.quadrant ? (
                <span
                  aria-label={`Cuadrante Q${a.quadrant}`}
                  title={`Q${a.quadrant}`}
                  style={{
                    width: 6,
                    flexShrink: 0,
                    backgroundColor: QUADRANT_COLORS[a.quadrant],
                    borderTopLeftRadius: 'var(--ag-radius-sm)',
                    borderBottomLeftRadius: 'var(--ag-radius-sm)',
                    marginRight: 6,
                  }}
                />
              ) : null}
              <div style={{ flex: 1, minWidth: 0 }}>
                <ActivityRow
                  title={a.title}
                  status={a.status}
                  scheduledTime={a.scheduledTime}
                  priority={a.priority}
                  projectLabel={a.projectLabel}
                  href={`/activity/${a.id}`}
                  deadline={a.deadline}
                  progressPercent={a.progressPercent}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Convenience: a thin Link wrapper for the "Ver todas" footer style hint,
 * exported so the parent page can reuse the visual treatment if needed.
 */
export function ListViewMoreLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-block',
        marginTop: 'var(--ag-space-2)',
        fontFamily: 'var(--ag-font-body)',
        fontSize: 13,
        color: 'var(--ag-ink-soft)',
        textDecoration: 'none',
      }}
    >
      {label} →
    </Link>
  );
}
