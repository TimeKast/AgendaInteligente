'use client';

/**
 * SCR-040 — Project list / management.
 *
 * Visual-only prototype. Projects live in `useState`. Hardcoded seed list
 * mirrors the categories page pattern.
 *
 * Interactions:
 *   - "+ Nuevo" → NewProjectModal, on submit appends to state + toast.
 *   - Filter chips (All / Active / Paused / Completed / Killed) — local state.
 *   - Row tap → navigates to `/projects/[id]` (existing detail screen).
 *   - ⋯ menu → Rename / Change category / Change status / Delete (visual).
 *   - Inbox row pinned to the bottom, read-only (no actions).
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { ProjectRow, type ProjectItem } from '@/components/agenda/ProjectRow';
import { NewProjectModal } from '@/components/agenda/NewProjectModal';
import { ConfirmDeleteModal } from '@/components/agenda/ConfirmDeleteModal';
import { FilterChips } from '@/components/agenda/FilterChips';

type StatusFilter = 'all' | 'active' | 'paused' | 'completed' | 'killed';

const CATEGORIES = [
  { id: 'cat-1', name: 'Personal' },
  { id: 'cat-2', name: 'Empresa Genomma' },
  { id: 'cat-3', name: 'Side project Web3' },
  { id: 'cat-inbox', name: 'Inbox' },
];

const INITIAL: ProjectItem[] = [
  {
    id: 'proj-1',
    name: 'Lanzar AgendaInteligente v0.5',
    categoryName: 'Empresa Genomma',
    status: 'active',
    deadlineLabel: '30 jun 2026',
    activityCount: 8,
    doneCount: 5,
  },
  {
    id: 'proj-2',
    name: 'Side hustle Web3',
    categoryName: 'Side project Web3',
    status: 'active',
    deadlineLabel: null,
    activityCount: 3,
    doneCount: 1,
  },
  {
    id: 'proj-3',
    name: 'Aprender alemán B1',
    categoryName: 'Personal',
    status: 'active',
    deadlineLabel: '31 dic 2026',
    activityCount: 12,
    doneCount: 3,
  },
  {
    id: 'proj-4',
    name: 'Reorganizar finanzas',
    categoryName: 'Personal',
    status: 'paused',
    deadlineLabel: null,
    activityCount: 4,
    doneCount: 1,
  },
  {
    id: 'proj-5',
    name: 'Marketing beta',
    categoryName: 'Empresa Genomma',
    status: 'active',
    deadlineLabel: '30 jun 2026',
    activityCount: 5,
    doneCount: 2,
  },
];

const INBOX: ProjectItem = {
  id: 'proj-inbox',
  name: 'Inbox',
  categoryName: 'Inbox',
  status: 'active',
  deadlineLabel: null,
  activityCount: 1,
  doneCount: 0,
  system: true,
};

export default function ProjectListPage() {
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<ProjectItem | null>(null);

  const visible = useMemo(() => {
    if (filter === 'all') return projects;
    return projects.filter((p) => p.status === filter);
  }, [projects, filter]);

  function openCreate() {
    setCreateKey((k) => k + 1);
    setCreateOpen(true);
  }

  function handleCreate(payload: {
    name: string;
    categoryName: string;
    status: ProjectItem['status'];
    deadline: string;
  }) {
    const deadlineLabel = payload.deadline
      ? formatDeadline(payload.deadline)
      : null;
    setProjects((items) => [
      ...items,
      {
        id: `proj-${Date.now()}`,
        name: payload.name,
        categoryName: payload.categoryName,
        status: payload.status,
        deadlineLabel,
        activityCount: 0,
        doneCount: 0,
      },
    ]);
    setCreateOpen(false);
    toast('Proyecto creado.');
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    setProjects((items) => items.filter((p) => p.id !== pendingDelete.id));
    setPendingDelete(null);
    toast('Proyecto borrado.');
  }

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: projects.length,
      active: 0,
      paused: 0,
      completed: 0,
      killed: 0,
    };
    for (const p of projects) c[p.status]++;
    return c;
  }, [projects]);

  return (
    <>
      <AgendaHeader
        backHref="/settings"
        dateLabel="Proyectos"
        rightSlot={
          <button
            type="button"
            onClick={openCreate}
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
            + Nuevo
          </button>
        }
      />

      <main
        style={{
          maxWidth: 480,
          marginInline: 'auto',
          paddingInline: 'var(--ag-space-4)',
          paddingBottom: 'calc(var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div
          style={{
            paddingTop: 'var(--ag-space-3)',
            paddingBottom: 'var(--ag-space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-2)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--ag-ink-hint)',
            }}
          >
            {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'} · Inbox aparte.
          </p>
          <div style={{ overflowX: 'auto', marginInline: 'calc(var(--ag-space-4) * -1)', paddingInline: 'var(--ag-space-4)' }}>
            <FilterChips<StatusFilter>
              value={filter}
              onChange={setFilter}
              options={[
                { id: 'all', label: `Todos (${counts.all})` },
                { id: 'active', label: `Active (${counts.active})` },
                { id: 'paused', label: `Paused (${counts.paused})` },
                { id: 'completed', label: `Completed (${counts.completed})` },
                { id: 'killed', label: `Killed (${counts.killed})` },
              ]}
            />
          </div>
        </div>

        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {visible.map((p) => (
            <ProjectRow
              key={p.id}
              project={p}
              onRename={() => toast('Renombrar (demo).')}
              onChangeCategory={() => toast('Cambiar categoría (demo).')}
              onChangeStatus={() => toast('Cambiar status (demo).')}
              onDelete={(id) => {
                const proj = projects.find((x) => x.id === id);
                if (proj) setPendingDelete(proj);
              }}
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
              Sin proyectos en este filtro.
            </li>
          ) : null}
        </ul>

        {/* Inbox — system row, always at the bottom, never deletable */}
        <div
          style={{
            marginTop: 'var(--ag-space-3)',
            paddingTop: 'var(--ag-space-2)',
            borderTop: '1px solid var(--ag-rule)',
          }}
        >
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            <ProjectRow project={INBOX} />
          </ul>
        </div>

        <div style={{ paddingTop: 'var(--ag-space-5)' }}>
          <Link
            href="/settings"
            style={{
              display: 'inline-block',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              color: 'var(--ag-ink-hint)',
              textDecoration: 'none',
            }}
          >
            ← Volver a Settings
          </Link>
        </div>
      </main>

      <NewProjectModal
        key={createKey}
        open={createOpen}
        categories={CATEGORIES}
        onCancel={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />

      <ConfirmDeleteModal
        open={!!pendingDelete}
        title="Borrar proyecto"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" tiene ${pendingDelete.activityCount} ${pendingDelete.activityCount === 1 ? 'actividad' : 'actividades'}. Al borrar el proyecto se borran también.`
            : ''
        }
        caption="Podés cancelar dentro de 30 días."
        destructiveLabel="Borrar todo"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

const MONTHS_ES = [
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

function formatDeadline(iso: string): string {
  // ISO yyyy-mm-dd → "DD mmm YYYY" in es-mx neutral.
  const [y, m, d] = iso.split('-');
  const month = MONTHS_ES[Number(m) - 1] ?? '';
  return `${Number(d)} ${month} ${y}`;
}
