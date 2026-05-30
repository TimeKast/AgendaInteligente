'use client';

/**
 * ProjectDetailClient — minimal wired edit view.
 *
 * Editable: name, description, deadline, outcomeExpected, status.
 * Inbox projects: name + category locked (CHECK constraint),
 * delete blocked.
 *
 * Status pills route through transitionProjectStatus so the BR-9
 * transition gate applies (active ↔ paused, anywhere → completed/killed).
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { updateProject, transitionProjectStatus, deleteProject } from '@/lib/actions/project';

export interface ProjectDetailInput {
  id: string;
  name: string;
  description: string | null;
  status: string;
  isInbox: boolean;
  categoryName: string;
  deadline: string | null;
  outcomeExpected: string | null;
  activityCount: number;
}

interface Props {
  initial: ProjectDetailInput;
}

const STATUS_OPTIONS: Array<{
  value: 'active' | 'paused' | 'completed' | 'killed';
  label: string;
}> = [
  { value: 'active', label: 'Activo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'completed', label: 'Completado' },
  { value: 'killed', label: 'Cancelado' },
];

export function ProjectDetailClient({ initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? '');
  const [deadline, setDeadline] = useState(initial.deadline ?? '');
  const [outcome, setOutcome] = useState(initial.outcomeExpected ?? '');
  const [status, setStatus] = useState(initial.status);
  const [isPending, startTransition] = useTransition();

  const dirty =
    (!initial.isInbox && name !== initial.name) ||
    description !== (initial.description ?? '') ||
    deadline !== (initial.deadline ?? '') ||
    outcome !== (initial.outcomeExpected ?? '');

  function handleSave() {
    startTransition(async () => {
      const result = await updateProject({
        id: initial.id,
        name: initial.isInbox ? undefined : name.trim(),
        description: description.trim() || null,
        deadline: deadline || null,
        outcomeExpected: outcome.trim() || null,
      });
      if (result.error) {
        toast.error(`No se pudo guardar: ${result.error}`);
        return;
      }
      toast.success('Proyecto guardado.');
      router.refresh();
    });
  }

  function handleStatusChange(next: 'active' | 'paused' | 'completed' | 'killed') {
    const prev = status;
    setStatus(next);
    startTransition(async () => {
      const result = await transitionProjectStatus({ id: initial.id, newStatus: next });
      if (result.error) {
        toast.error(`No se pudo cambiar status: ${result.error}`);
        setStatus(prev);
      } else {
        toast.success('Status actualizado.');
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (initial.isInbox) {
      toast.error('El proyecto Inbox no se puede borrar.');
      return;
    }
    if (!confirm('¿Borrar este proyecto?')) return;
    startTransition(async () => {
      const result = await deleteProject({ id: initial.id });
      if (result.error) {
        toast.error(`No se pudo borrar: ${result.error}`);
        return;
      }
      toast.success('Proyecto borrado.');
      router.push('/projects');
    });
  }

  return (
    <>
      <AgendaHeader
        dateLabel="Proyecto"
        backHref="/projects"
        rightSlot={
          !initial.isInbox ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              aria-label="Borrar proyecto"
              style={{
                appearance: 'none',
                background: 'transparent',
                border: 'none',
                color: 'var(--ag-ink-hint)',
                cursor: 'pointer',
                padding: 6,
              }}
            >
              <Trash2 size={18} strokeWidth={1.5} />
            </button>
          ) : undefined
        }
      />

      <main
        style={{
          paddingInline: 'var(--ag-space-4)',
          paddingTop: 'var(--ag-space-4)',
          paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-4)',
        }}
      >
        <Label text="Categoría">
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ag-ink-soft)' }}>
            {initial.categoryName || '—'}
          </p>
        </Label>

        <Label text="Nombre">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending || initial.isInbox}
            style={{ ...inputStyle, opacity: initial.isInbox ? 0.6 : 1 }}
          />
          {initial.isInbox && (
            <span style={{ fontSize: 12, color: 'var(--ag-ink-hint)', fontStyle: 'italic' }}>
              Inbox es proyecto del sistema — no editable.
            </span>
          )}
        </Label>

        <Label text="Descripción">
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPending}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </Label>

        <Label text="Status">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {STATUS_OPTIONS.map((o) => {
              const active = status === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleStatusChange(o.value)}
                  disabled={isPending || active}
                  style={{
                    appearance: 'none',
                    padding: '8px 14px',
                    borderRadius: 'var(--ag-radius-pill)',
                    border: active ? '1px solid var(--ag-ink-primary)' : '1px solid var(--ag-rule)',
                    backgroundColor: active ? 'var(--ag-ink-primary)' : 'transparent',
                    color: active ? 'var(--ag-accent-on)' : 'var(--ag-ink-soft)',
                    fontFamily: 'var(--ag-font-body)',
                    fontSize: 13,
                    cursor: active || isPending ? 'default' : 'pointer',
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </Label>

        <Label text="Deadline">
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={isPending}
            style={inputStyle}
          />
        </Label>

        <Label text="Resultado esperado">
          <textarea
            rows={3}
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            disabled={isPending}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="¿Qué cambia cuando este proyecto termina?"
          />
        </Label>

        <Label text="Actividades">
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ag-ink-soft)' }}>
            {initial.activityCount}{' '}
            {initial.activityCount === 1 ? 'actividad activa' : 'actividades activas'}
          </p>
        </Label>
      </main>

      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          padding: 'var(--ag-space-3) var(--ag-space-4)',
          paddingBottom: 'calc(var(--ag-space-3) + env(safe-area-inset-bottom, 0px))',
          backgroundColor: 'var(--ag-bg)',
          borderTop: '1px solid var(--ag-rule)',
        }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || isPending}
          style={{
            appearance: 'none',
            width: '100%',
            padding: '14px 20px',
            border: 'none',
            borderRadius: 'var(--ag-radius-base)',
            backgroundColor: dirty ? 'var(--ag-accent-primary)' : 'var(--ag-bg-sunken)',
            color: dirty ? 'var(--ag-accent-on)' : 'var(--ag-ink-hint)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 15,
            fontWeight: 500,
            cursor: dirty && !isPending ? 'pointer' : 'not-allowed',
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? 'Guardando…' : dirty ? 'Guardar' : 'Sin cambios'}
        </button>
      </footer>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--ag-radius-base)',
  border: '1px solid var(--ag-rule)',
  backgroundColor: 'var(--ag-bg-elevated)',
  color: 'var(--ag-ink-primary)',
  fontFamily: 'var(--ag-font-body)',
  fontSize: 15,
  outline: 'none',
};

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ag-slate)',
        }}
      >
        {text}
      </span>
      {children}
    </label>
  );
}
