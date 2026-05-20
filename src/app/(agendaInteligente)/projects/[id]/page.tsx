'use client';

/**
 * SCR-041 — Project detail.
 *
 * Visual-only. Hardcoded data regardless of [id]. Demonstrates:
 *   - Title / category chip / status badge header
 *   - Outcome + deadline
 *   - Filter chips (All / Pending / Done) + Sort dropdown (Date / Priority)
 *   - Linked activities (ProjectActivityRow → /activity/[id])
 *   - Linked goals chip
 *   - Footer with "Editar proyecto" + "Cambiar status ↓" (opens
 *     ConfirmDeleteModal for "killed" / "completed").
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, ChevronDown } from 'lucide-react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { ProjectChip } from '@/components/agenda/ProjectChip';
import { ProjectActivityRow } from '@/components/agenda/ProjectActivityRow';
import { StatusBadge, type ProjectStatus } from '@/components/agenda/StatusBadge';
import { FilterChips } from '@/components/agenda/FilterChips';
import { SortDropdown } from '@/components/agenda/SortDropdown';
import { ConfirmDeleteModal } from '@/components/agenda/ConfirmDeleteModal';
import type { ActivityStatus } from '@/components/agenda/ActivityRow';

type FilterId = 'all' | 'pending' | 'done';
type SortId = 'date' | 'priority';

interface ProjectActivity {
  id: string;
  title: string;
  status: ActivityStatus;
  dateLabel: string;
  priority: number;
  /** ISO yyyy-mm-dd for sort */
  dueAt: string;
}

const ACTIVITIES: ProjectActivity[] = [
  { id: '101', title: 'Setup repo + dependencies', status: 'done', dateLabel: '2 may', priority: 3, dueAt: '2026-05-02' },
  { id: '102', title: 'Discovery brief', status: 'done', dateLabel: '5 may', priority: 4, dueAt: '2026-05-05' },
  { id: '103', title: 'Docs phase', status: 'done', dateLabel: '12 may', priority: 4, dueAt: '2026-05-12' },
  { id: '104', title: 'Tokens + design system', status: 'done', dateLabel: '18 may', priority: 5, dueAt: '2026-05-18' },
  { id: '105', title: 'Design phase wireframes', status: 'done', dateLabel: '20 may', priority: 5, dueAt: '2026-05-20' },
  { id: '106', title: 'Implementation sprint 1', status: 'in_progress', dateLabel: '28 may', priority: 5, dueAt: '2026-05-28' },
  { id: '107', title: 'Beta invites copy', status: 'todo', dateLabel: '10 jun', priority: 3, dueAt: '2026-06-10' },
  { id: '108', title: 'Landing page launch', status: 'todo', dateLabel: '20 jun', priority: 4, dueAt: '2026-06-20' },
];

const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  killed: 'Killed',
};

export default function ProjectDetailPage() {
  const [filter, setFilter] = useState<FilterId>('all');
  const [sort, setSort] = useState<SortId>('date');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ProjectStatus | null>(null);

  const visible = useMemo(() => {
    const filtered = ACTIVITIES.filter((a) => {
      if (filter === 'pending') return a.status !== 'done';
      if (filter === 'done') return a.status === 'done';
      return true;
    });
    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'priority') return b.priority - a.priority;
      return a.dueAt.localeCompare(b.dueAt);
    });
    return sorted;
  }, [filter, sort]);

  const total = ACTIVITIES.length;
  const done = ACTIVITIES.filter((a) => a.status === 'done').length;
  const pending = total - done;

  function chooseStatus(next: ProjectStatus) {
    setStatusMenuOpen(false);
    if (next === 'killed' || next === 'completed') {
      setPendingStatus(next);
    } else {
      setStatus(next);
    }
  }

  return (
    <>
      <AgendaHeader
        backHref="/categories"
        dateLabel="Lanzar AgendaInteligente"
        rightSlot={
          <button
            type="button"
            aria-label="Más acciones"
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--ag-ink-soft)',
              cursor: 'pointer',
              padding: 6,
            }}
          >
            <MoreHorizontal size={20} strokeWidth={1.5} />
          </button>
        }
      />

      <main
        style={{
          maxWidth: 480,
          marginInline: 'auto',
          paddingInline: 'var(--ag-space-4)',
          paddingBottom: 'calc(var(--ag-space-8) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Meta header */}
        <section
          style={{
            paddingTop: 'var(--ag-space-4)',
            paddingBottom: 'var(--ag-space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 'var(--ag-space-2)',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <ProjectChip label="Empresa Genomma" />
            <StatusBadge status={status} />
          </div>

          <dl style={{ margin: 0, display: 'grid', gap: 'var(--ag-space-2)' }}>
            <div style={{ display: 'flex', gap: 'var(--ag-space-2)' }}>
              <dt
                style={{
                  fontFamily: 'var(--ag-font-body)',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--ag-slate)',
                  minWidth: 80,
                }}
              >
                Deadline
              </dt>
              <dd style={{ margin: 0, fontFamily: 'var(--ag-font-body)', fontSize: 14, color: 'var(--ag-ink-primary)' }}>
                30 junio 2026
              </dd>
            </div>
            <div style={{ display: 'flex', gap: 'var(--ag-space-2)' }}>
              <dt
                style={{
                  fontFamily: 'var(--ag-font-body)',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--ag-slate)',
                  minWidth: 80,
                }}
              >
                Outcome
              </dt>
              <dd
                style={{
                  margin: 0,
                  fontFamily: 'var(--ag-font-display)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: 'var(--ag-ink-soft)',
                }}
              >
                MVP en producción con primeros 20 users beta.
              </dd>
            </div>
          </dl>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--ag-rule)', margin: 0 }} />

        {/* Stats + controls */}
        <section
          style={{
            paddingBlock: 'var(--ag-space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-3)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              color: 'var(--ag-ink-hint)',
              letterSpacing: '0.02em',
            }}
          >
            {total} actividades · {done} done · {pending} pending
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 'var(--ag-space-3)',
              flexWrap: 'wrap',
            }}
          >
            <FilterChips
              value={filter}
              onChange={setFilter}
              options={[
                { id: 'all', label: 'Todas' },
                { id: 'pending', label: 'Pendientes' },
                { id: 'done', label: 'Done' },
              ]}
            />
            <SortDropdown
              label="Sort"
              value={sort}
              onChange={setSort}
              options={[
                { id: 'date', label: 'Date' },
                { id: 'priority', label: 'Priority' },
              ]}
            />
          </div>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {visible.map((a) => (
              <ProjectActivityRow
                key={a.id}
                href={`/activity/${a.id}`}
                title={a.title}
                status={a.status}
                dateLabel={a.dateLabel}
                priority={a.priority}
              />
            ))}
            {visible.length === 0 ? (
              <li
                style={{
                  listStyle: 'none',
                  paddingBlock: 'var(--ag-space-4)',
                  fontFamily: 'var(--ag-font-display)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--ag-ink-hint)',
                }}
              >
                Sin actividades en este filtro.
              </li>
            ) : null}
          </ul>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--ag-rule)', margin: 0 }} />

        {/* Goals linked */}
        <section
          style={{
            paddingBlock: 'var(--ag-space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-3)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--ag-slate)',
            }}
          >
            Goals vinculados
          </h2>
          <div
            style={{
              display: 'flex',
              gap: 'var(--ag-space-2)',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <Link
              href="/goals/1"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: 'var(--ag-radius-pill)',
                border: '1px solid var(--ag-rule)',
                backgroundColor: 'var(--ag-bg-elevated)',
                color: 'var(--ag-ink-primary)',
                fontFamily: 'var(--ag-font-body)',
                fontSize: 13,
                textDecoration: 'none',
              }}
            >
              Lanzar AI v0.5
            </Link>
            <button
              type="button"
              style={{
                appearance: 'none',
                background: 'transparent',
                border: 'none',
                padding: 0,
                fontFamily: 'var(--ag-font-body)',
                fontSize: 13,
                color: 'var(--ag-ink-soft)',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              + Vincular
            </button>
          </div>
        </section>

        {/* Footer actions */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'var(--ag-bg)',
            paddingBlock: 'var(--ag-space-4)',
            paddingBottom: 'calc(var(--ag-space-4) + env(safe-area-inset-bottom, 0px))',
            display: 'flex',
            gap: 'var(--ag-space-2)',
            borderTop: '1px solid var(--ag-rule)',
            marginInline: 'calc(var(--ag-space-4) * -1)',
            paddingInline: 'var(--ag-space-4)',
          }}
        >
          <button
            type="button"
            style={{
              flex: 1,
              appearance: 'none',
              background: 'var(--ag-ink-primary)',
              color: 'var(--ag-accent-on)',
              border: 'none',
              borderRadius: 'var(--ag-radius-base)',
              padding: '12px 16px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Editar proyecto
          </button>

          <div style={{ position: 'relative', flex: 1 }}>
            <button
              type="button"
              onClick={() => setStatusMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={statusMenuOpen}
              style={{
                width: '100%',
                appearance: 'none',
                background: 'transparent',
                border: '1px solid var(--ag-rule)',
                color: 'var(--ag-ink-primary)',
                borderRadius: 'var(--ag-radius-base)',
                padding: '12px 14px',
                fontFamily: 'var(--ag-font-body)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              Cambiar status
              <ChevronDown size={14} strokeWidth={1.75} aria-hidden />
            </button>
            {statusMenuOpen ? (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 'calc(100% + 6px)',
                  minWidth: 180,
                  backgroundColor: 'var(--ag-bg)',
                  border: '1px solid var(--ag-rule)',
                  borderRadius: 'var(--ag-radius-base)',
                  boxShadow: '0 4px 16px rgba(42, 40, 38, 0.12)',
                  padding: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 20,
                }}
              >
                {(['active', 'paused', 'completed', 'killed'] as ProjectStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="menuitem"
                    onClick={() => chooseStatus(s)}
                    style={{
                      appearance: 'none',
                      background: status === s ? 'var(--ag-bg-sunken)' : 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: 'var(--ag-radius-sm)',
                      fontFamily: 'var(--ag-font-body)',
                      fontSize: 14,
                      color:
                        s === 'killed'
                          ? 'var(--ag-danger)'
                          : 'var(--ag-ink-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <ConfirmDeleteModal
        open={!!pendingStatus}
        title={pendingStatus === 'killed' ? 'Matar el proyecto' : 'Cerrar el proyecto'}
        description={
          pendingStatus === 'killed'
            ? `Al pasar "Lanzar AgendaInteligente" a killed, sus ${pending} actividades pendientes quedan archivadas.`
            : `Al cerrar como completed, sus ${pending} actividades pendientes se marcan como skipped.`
        }
        caption={
          pendingStatus === 'killed'
            ? 'Podés cancelar dentro de 30 días.'
            : 'Esto es reversible desde el menú de status.'
        }
        destructiveLabel={pendingStatus === 'killed' ? 'Matar proyecto' : 'Cerrar proyecto'}
        onCancel={() => setPendingStatus(null)}
        onConfirm={() => {
          if (pendingStatus) setStatus(pendingStatus);
          setPendingStatus(null);
        }}
      />
    </>
  );
}
