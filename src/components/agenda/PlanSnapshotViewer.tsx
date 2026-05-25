'use client';

/**
 * PlanSnapshotViewer — read-only modal that shows the captured plan.
 *
 * Renders a flat day-by-day list of which tasks were originally assigned to
 * which days (or "Sin fecha" for tasks in the pool at capture time). Used by
 * /week and /month — both pass the snapshot + a current task title map so we
 * can render human-readable titles even if a task was deleted afterwards
 * (graceful fallback to its id).
 *
 * No editing affordances on purpose — the snapshot is meant as evidence of
 * what was planned vs what actually happened.
 */

import { useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import type { PlanSnapshot } from './PlanSnapshotControls';

interface PlanSnapshotViewerProps {
  open: boolean;
  snapshot: PlanSnapshot | null;
  /** taskId → current title (for rendering). Falls back to id if missing. */
  taskTitles: Record<string, string>;
  /** Only the ISO dates inside this range are grouped as days; anything else
   *  shows up under "Otros días". Optional — if omitted, every date is shown. */
  visibleIsoDates?: string[];
  /** Locale-aware label for a date row (e.g. "Lun 19 may"). */
  formatDayLabel: (iso: string) => string;
  onClose: () => void;
}

const HEADER_FMT = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

function formatCapturedAt(iso: string): string {
  const d = new Date(iso);
  // "23 de mayo, 14:32" — Intl with `, hh:mm`. Strip stray dots.
  return HEADER_FMT.format(d).replace(/\./g, '');
}

export function PlanSnapshotViewer({
  open,
  snapshot,
  taskTitles,
  visibleIsoDates,
  formatDayLabel,
  onClose,
}: PlanSnapshotViewerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const grouped = useMemo(() => {
    const byDay: Record<string, string[]> = {};
    const pool: string[] = [];
    const others: Record<string, string[]> = {};
    if (!snapshot) return { byDay, pool, others, allDayIsos: [], otherIsos: [] };

    const visibleSet = visibleIsoDates ? new Set(visibleIsoDates) : null;

    for (const [taskId, dates] of Object.entries(snapshot.taskPlacements)) {
      if (dates.length === 0) {
        pool.push(taskId);
        continue;
      }
      for (const iso of dates) {
        if (visibleSet && !visibleSet.has(iso)) {
          if (!others[iso]) others[iso] = [];
          others[iso].push(taskId);
        } else {
          if (!byDay[iso]) byDay[iso] = [];
          byDay[iso].push(taskId);
        }
      }
    }

    // Day order: follow `visibleIsoDates` when provided so the list reads
    // chronologically left-to-right; otherwise sort lexicographically (ISO).
    const allDayIsos = visibleIsoDates
      ? visibleIsoDates.filter((iso) => byDay[iso] !== undefined)
      : Object.keys(byDay).sort();
    const otherIsos = Object.keys(others).sort();

    return { byDay, pool, others, allDayIsos, otherIsos };
  }, [snapshot, visibleIsoDates]);

  if (!open || !snapshot) return null;

  const totalTasks = Object.values(snapshot.taskPlacements).filter(
    (dates) => dates.length > 0,
  ).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-snapshot-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--ag-space-4)',
        backgroundColor: 'color-mix(in oklab, var(--ag-ink-primary), transparent 60%)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 520,
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--ag-bg)',
          borderRadius: 'var(--ag-radius-card)',
          boxShadow: '0 4px 24px rgba(42, 40, 38, 0.18)',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 'var(--ag-space-3)',
            padding: 'var(--ag-space-4) var(--ag-space-5)',
            borderBottom: '1px solid var(--ag-rule)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2
              id="plan-snapshot-title"
              style={{
                margin: 0,
                fontFamily: 'var(--ag-font-display)',
                fontSize: 19,
                fontWeight: 500,
                color: 'var(--ag-ink-primary)',
              }}
            >
              Plan original
            </h2>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--ag-font-display)',
                fontStyle: 'italic',
                fontSize: 13,
                color: 'var(--ag-ink-hint)',
              }}
            >
              Capturado el {formatCapturedAt(snapshot.capturedAt)} ·
              {' '}
              {totalTasks} {totalTasks === 1 ? 'tarea' : 'tareas'} · read-only
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--ag-ink-hint)',
              cursor: 'pointer',
              padding: 4,
              display: 'inline-flex',
            }}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </header>

        <div
          style={{
            overflowY: 'auto',
            padding: 'var(--ag-space-4) var(--ag-space-5) var(--ag-space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-4)',
          }}
        >
          {grouped.allDayIsos.length === 0 && grouped.otherIsos.length === 0 && grouped.pool.length === 0 ? (
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--ag-font-display)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--ag-ink-hint)',
                textAlign: 'center',
              }}
            >
              No había tareas asignadas al congelar.
            </p>
          ) : null}

          {grouped.allDayIsos.map((iso) => (
            <SnapshotDayGroup
              key={iso}
              label={formatDayLabel(iso)}
              taskIds={grouped.byDay[iso]}
              taskTitles={taskTitles}
            />
          ))}

          {grouped.otherIsos.length > 0 ? (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
              <h3 style={sectionHeadingStyle}>Otros días</h3>
              {grouped.otherIsos.map((iso) => (
                <SnapshotDayGroup
                  key={iso}
                  label={formatDayLabel(iso)}
                  taskIds={grouped.others[iso]}
                  taskTitles={taskTitles}
                />
              ))}
            </section>
          ) : null}

          {grouped.pool.length > 0 ? (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
              <h3 style={sectionHeadingStyle}>Sin fecha (pendientes)</h3>
              <SnapshotTaskList taskIds={grouped.pool} taskTitles={taskTitles} />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const sectionHeadingStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--ag-font-body)',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--ag-ink-hint)',
};

function SnapshotDayGroup({
  label,
  taskIds,
  taskTitles,
}: {
  label: string;
  taskIds: string[];
  taskTitles: Record<string, string>;
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-1)' }}>
      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-body)',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ag-slate)',
        }}
      >
        {label}
        <span
          style={{
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 11,
            color: 'var(--ag-ink-hint)',
            letterSpacing: 'normal',
            textTransform: 'none',
            marginInlineStart: 6,
          }}
        >
          · {taskIds.length}
        </span>
      </h3>
      <SnapshotTaskList taskIds={taskIds} taskTitles={taskTitles} />
    </section>
  );
}

function SnapshotTaskList({
  taskIds,
  taskTitles,
}: {
  taskIds: string[];
  taskTitles: Record<string, string>;
}) {
  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {taskIds.map((id) => (
        <li
          key={id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--ag-space-2)',
            padding: '6px 8px',
            backgroundColor: 'var(--ag-bg-elevated)',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-base)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-primary)',
          }}
        >
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: 'var(--ag-ink-hint)',
              flexShrink: 0,
            }}
          />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {taskTitles[id] ?? id}
          </span>
        </li>
      ))}
    </ul>
  );
}
