'use client';

/**
 * GoalDetailClient — minimal wired edit view.
 *
 * Editable fields: title, description, deadline, outcomeExpected,
 * notesCost, status, review (score + notes). Save → updateGoal.
 * Delete → deleteGoal → /goals.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { updateGoal, deleteGoal } from '@/lib/actions/goal';

export interface GoalDetailInput {
  id: string;
  title: string;
  description: string | null;
  scope: string;
  deadline: string | null;
  outcomeExpected: string | null;
  notesCost: string | null;
  status: string;
  reviewScore: number | null;
  reviewNotes: string | null;
}

interface Props {
  initial: GoalDetailInput;
}

const SCOPE_LABEL: Record<string, string> = {
  quarter: 'Trimestre',
  year: 'Año',
  '5year': '5 años',
  life: 'Vida',
};

const STATUS_OPTIONS: Array<{
  value: 'active' | 'achieved' | 'partial' | 'abandoned';
  label: string;
}> = [
  { value: 'active', label: 'Activa' },
  { value: 'achieved', label: 'Lograda' },
  { value: 'partial', label: 'Parcial' },
  { value: 'abandoned', label: 'Abandonada' },
];

export function GoalDetailClient({ initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? '');
  const [deadline, setDeadline] = useState(initial.deadline ?? '');
  const [outcome, setOutcome] = useState(initial.outcomeExpected ?? '');
  const [cost, setCost] = useState(initial.notesCost ?? '');
  const [status, setStatus] = useState(initial.status);
  const [reviewScore, setReviewScore] = useState<number>(initial.reviewScore ?? 5);
  const [reviewNotes, setReviewNotes] = useState(initial.reviewNotes ?? '');
  const [isPending, startTransition] = useTransition();

  const dirty =
    title !== initial.title ||
    description !== (initial.description ?? '') ||
    deadline !== (initial.deadline ?? '') ||
    outcome !== (initial.outcomeExpected ?? '') ||
    cost !== (initial.notesCost ?? '') ||
    status !== initial.status ||
    reviewScore !== (initial.reviewScore ?? 5) ||
    reviewNotes !== (initial.reviewNotes ?? '');

  function handleSave() {
    startTransition(async () => {
      const result = await updateGoal({
        id: initial.id,
        title: title.trim(),
        description: description.trim() || null,
        deadline: deadline || null,
        outcomeExpected: outcome.trim() || null,
        notesCost: cost.trim() || null,
        status,
        reviewScore: status === 'active' ? null : reviewScore,
        reviewNotes: status === 'active' ? null : reviewNotes.trim() || null,
      });
      if (result.error) {
        toast.error(`No se pudo guardar: ${result.error}`);
        return;
      }
      toast.success('Meta guardada.');
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm('¿Borrar esta meta?')) return;
    startTransition(async () => {
      const result = await deleteGoal({ id: initial.id });
      if (result.error) {
        toast.error(`No se pudo borrar: ${result.error}`);
        return;
      }
      toast.success('Meta borrada.');
      router.push('/goals');
    });
  }

  const isReviewMode = status !== 'active';

  return (
    <>
      <AgendaHeader
        dateLabel="Meta"
        backHref="/goals"
        rightSlot={
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            aria-label="Borrar meta"
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
          paddingTop: 'var(--ag-space-4)',
          paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-4)',
        }}
      >
        <Label text="Scope">
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ag-ink-soft)' }}>
            {SCOPE_LABEL[initial.scope] ?? initial.scope}
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
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPending}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
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

        <Label text="¿Qué cambia si lo logro?">
          <textarea
            rows={3}
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            disabled={isPending}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Visualiza el outcome concreto."
          />
        </Label>

        <Label text="¿Qué estoy dispuesto a sacrificar?">
          <textarea
            rows={3}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            disabled={isPending}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Trade-off explícito."
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
                  onClick={() => setStatus(o.value)}
                  disabled={isPending}
                  style={{
                    appearance: 'none',
                    padding: '8px 14px',
                    borderRadius: 'var(--ag-radius-pill)',
                    border: active ? '1px solid var(--ag-ink-primary)' : '1px solid var(--ag-rule)',
                    backgroundColor: active ? 'var(--ag-ink-primary)' : 'transparent',
                    color: active ? 'var(--ag-accent-on)' : 'var(--ag-ink-soft)',
                    fontFamily: 'var(--ag-font-body)',
                    fontSize: 13,
                    cursor: isPending ? 'wait' : 'pointer',
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </Label>

        {isReviewMode && (
          <>
            <Label text={`Score: ${reviewScore}/10`}>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={reviewScore}
                onChange={(e) => setReviewScore(Number(e.target.value))}
                disabled={isPending}
                style={{ width: '100%' }}
              />
            </Label>
            <Label text="Notas del review">
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                disabled={isPending}
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="¿Qué aprendí?"
              />
            </Label>
          </>
        )}
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
