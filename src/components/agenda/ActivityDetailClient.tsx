'use client';

/**
 * ActivityDetailClient — minimal wired detail/edit view.
 *
 * Trade-off: this replaces the 503-line prototype with a focused
 * editable view (title, description, deadline, progress, status).
 * The prototype's elaborate animations + collapsible sections are
 * out of scope for the wiring slice; can be re-introduced later
 * without changing the action surface.
 *
 * Actions:
 *   - Save (dirty form) → updateActivity
 *   - Status transitions → transitionActivity
 *   - Delete → deleteActivity → router.push('/tasks')
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Target, Trash2 } from 'lucide-react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { updateActivity, transitionActivity, deleteActivity } from '@/lib/actions/activity';
import { linkGoal, unlinkGoal } from '@/lib/actions/goal-link';
import { RecurrencePicker, type RecurrenceRule } from '@/components/agenda/RecurrencePicker';
import type { ActivityGoalRow } from '@/lib/db/queries/activity-detail';

export interface ActivityDetailInput {
  id: string;
  title: string;
  description: string | null;
  projectName: string;
  status: string;
  priority: number;
  scheduledDates: string[];
  scheduledTime: string | null;
  durationMinutes: number | null;
  deadline: string | null;
  progressPercent: number | null;
  /**
   * Series-level recurrence rule. When the row is a materialized
   * instance, this is the parent template's rule (resolved server-side
   * in `loadActivityDetail`). Editing it always writes to the series.
   */
  recurrenceRule: string | null;
  /**
   * When non-null, this row is a materialized child instance and the
   * recurrence rule lives on the parent. The save handler routes the
   * `recurrenceRule` write to this id instead of `id`. NULL = pure row
   * or parent template (recurrence rule writes to `id` directly).
   */
  recurrenceParentId: string | null;
}

interface Props {
  initial: ActivityDetailInput;
  goals: ActivityGoalRow[];
}

const STATUS_OPTIONS: Array<{
  value: 'done' | 'blocked' | 'cancelled' | 'pending';
  label: string;
}> = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'blocked', label: 'Bloqueada' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'done', label: 'Cerrada' },
];

export function ActivityDetailClient({ initial, goals }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? '');
  const [deadline, setDeadline] = useState(initial.deadline ?? '');
  const [progress, setProgress] = useState(initial.progressPercent ?? 0);
  const [status, setStatus] = useState(initial.status);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>(
    (initial.recurrenceRule ?? null) as RecurrenceRule
  );
  const [linkedGoals, setLinkedGoals] = useState<Set<string>>(
    () => new Set(goals.filter((g) => g.linked).map((g) => g.id))
  );
  const [isPending, startTransition] = useTransition();

  function toggleGoal(goalId: string) {
    const wasLinked = linkedGoals.has(goalId);
    const next = new Set(linkedGoals);
    if (wasLinked) next.delete(goalId);
    else next.add(goalId);
    setLinkedGoals(next);
    startTransition(async () => {
      const result = wasLinked
        ? await unlinkGoal({ goalId, targetType: 'activity', targetId: initial.id })
        : await linkGoal({ goalId, targetType: 'activity', targetId: initial.id });
      if (result.error) {
        toast.error(`No se pudo ${wasLinked ? 'desvincular' : 'vincular'}: ${result.error}`);
        // Roll back
        setLinkedGoals((prev) => {
          const rb = new Set(prev);
          if (wasLinked) rb.add(goalId);
          else rb.delete(goalId);
          return rb;
        });
        return;
      }
      router.refresh();
    });
  }

  const recurrenceDirty = (recurrence ?? null) !== (initial.recurrenceRule ?? null);
  const dirty =
    title !== initial.title ||
    description !== (initial.description ?? '') ||
    deadline !== (initial.deadline ?? '') ||
    progress !== (initial.progressPercent ?? 0) ||
    recurrenceDirty;

  function handleSave() {
    startTransition(async () => {
      // Per-row fields: title / description / deadline / progress all
      // belong to THIS row. Recurrence rule, on the other hand, lives
      // on the series — when the row is a materialized instance we
      // write it to the parent template instead.
      const result = await updateActivity({
        id: initial.id,
        title: title.trim(),
        description: description.trim() || null,
        deadline: deadline ? new Date(`${deadline}T23:59:59`).toISOString() : null,
        progressPercent: progress,
      });
      if (result.error) {
        toast.error(`No se pudo guardar: ${result.error}`);
        return;
      }

      if (recurrenceDirty) {
        const targetId = initial.recurrenceParentId ?? initial.id;
        const r2 = await updateActivity({
          id: targetId,
          recurrenceRule: recurrence ?? null,
        });
        if (r2.error) {
          toast.error(`Se guardó la tarea pero no la recurrencia: ${r2.error}`);
          router.refresh();
          return;
        }
      }

      toast.success('Guardado.');
      router.refresh();
    });
  }

  function handleStatusChange(next: 'done' | 'blocked' | 'cancelled' | 'pending') {
    const prev = status;
    setStatus(next);
    startTransition(async () => {
      const result = await transitionActivity({ id: initial.id, toStatus: next });
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
    if (!confirm('¿Borrar esta actividad?')) return;
    startTransition(async () => {
      const result = await deleteActivity({ id: initial.id });
      if (result.error) {
        toast.error(`No se pudo borrar: ${result.error}`);
        return;
      }
      toast.success('Actividad borrada.');
      router.push('/tasks');
    });
  }

  return (
    <>
      <AgendaHeader
        dateLabel="Actividad"
        backHref="/tasks"
        rightSlot={
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            aria-label="Borrar actividad"
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
        }
      />

      <main
        style={{
          paddingInline: 'var(--ag-space-4)',
          paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-4)',
          paddingTop: 'var(--ag-space-4)',
        }}
      >
        <Label text="Proyecto">
          <p style={{ margin: 0, ...textStyle, color: 'var(--ag-ink-soft)' }}>
            {initial.projectName || '—'}
          </p>
        </Label>

        <Label text="Título">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isPending}
            style={inputStyle}
          />
        </Label>

        <Label text="Descripción">
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPending}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 90 }}
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

        <Label text={`Avance: ${progress}%`}>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            disabled={isPending}
            style={{ width: '100%' }}
          />
        </Label>

        {(initial.scheduledDates.length > 0 || initial.scheduledTime) && (
          <Label text="Programación">
            <p style={{ margin: 0, ...textStyle, color: 'var(--ag-ink-soft)' }}>
              {initial.scheduledDates.length > 0 ? initial.scheduledDates.join(', ') : 'Sin fecha'}
              {initial.scheduledTime && ` · ${initial.scheduledTime.slice(0, 5)}`}
              {initial.durationMinutes && ` · ${initial.durationMinutes} min`}
            </p>
          </Label>
        )}

        <Label text="Recurrencia">
          <RecurrencePicker
            value={recurrence}
            onChange={setRecurrence}
            referenceDate={initial.scheduledDates[0]}
          />
          {initial.recurrenceParentId && (
            <p
              style={{
                margin: '6px 0 0',
                fontFamily: 'var(--ag-font-display)',
                fontStyle: 'italic',
                fontSize: 12,
                color: 'var(--ag-ink-hint)',
              }}
            >
              Cambiar la recurrencia afecta a toda la serie.
            </p>
          )}
        </Label>

        <Label text="Metas vinculadas">
          {goals.length === 0 ? (
            <p
              style={{ margin: 0, ...textStyle, color: 'var(--ag-ink-hint)', fontStyle: 'italic' }}
            >
              No tienes metas activas todavía. Crea una en /goals para poder vincularla.
            </p>
          ) : (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              {goals.map((g) => {
                const isLinked = linkedGoals.has(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGoal(g.id)}
                    disabled={isPending}
                    aria-pressed={isLinked}
                    title={
                      isLinked
                        ? 'Vinculada — clic para desvincular'
                        : 'Clic para vincular esta meta'
                    }
                    style={{
                      appearance: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      borderRadius: 'var(--ag-radius-pill)',
                      border: '1px solid var(--ag-rule)',
                      backgroundColor: isLinked ? 'var(--ag-ink-primary)' : 'transparent',
                      color: isLinked ? 'var(--ag-accent-on)' : 'var(--ag-ink-soft)',
                      fontFamily: 'var(--ag-font-body)',
                      fontSize: 12,
                      cursor: isPending ? 'wait' : 'pointer',
                    }}
                  >
                    <Target size={12} strokeWidth={1.5} aria-hidden />
                    {g.title}
                    {g.deadline ? (
                      <span style={{ opacity: 0.7, fontSize: 10 }}>· {g.deadline.slice(0, 7)}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </Label>
      </main>

      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
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
          {isPending ? 'Guardando…' : dirty ? 'Guardar cambios' : 'Sin cambios'}
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

const textStyle: React.CSSProperties = {
  fontFamily: 'var(--ag-font-body)',
  fontSize: 14,
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
