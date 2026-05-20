'use client';

/**
 * GoalReviewModal — SCR-053. Calificación 1-10 + notes + auto-suggested status.
 *
 * Status is derived from score:
 *   - score >= 8  → achieved
 *   - score 4-7   → partial
 *   - score <= 3  → abandoned
 *
 * The user can override the radio. Visual only — onSave receives the values
 * but the parent does NOT persist them.
 */

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

export type ReviewStatus = 'achieved' | 'partial' | 'abandoned';

function suggestStatus(score: number): ReviewStatus {
  if (score >= 8) return 'achieved';
  if (score <= 3) return 'abandoned';
  return 'partial';
}

interface GoalReviewModalProps {
  open: boolean;
  goalTitle: string;
  goalQuestion?: string;
  onCancel: () => void;
  onSave: (data: { score: number; notes: string; status: ReviewStatus }) => void;
}

export function GoalReviewModal({
  open,
  goalTitle,
  goalQuestion = '¿Cuánto cumpliste vs lo esperado?',
  onCancel,
  onSave,
}: GoalReviewModalProps) {
  const [score, setScore] = useState(7);
  const [notes, setNotes] = useState('');
  const [statusOverride, setStatusOverride] = useState<ReviewStatus | null>(null);

  const suggested = useMemo(() => suggestStatus(score), [score]);
  const selectedStatus = statusOverride ?? suggested;

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScore(7);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotes('');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatusOverride(null);
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-review-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--ag-space-4)',
        backgroundColor: 'color-mix(in oklab, var(--ag-ink-primary), transparent 60%)',
      }}
      onClick={onCancel}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ score, notes: notes.trim(), status: selectedStatus });
        }}
        style={{
          maxWidth: 480,
          width: '100%',
          backgroundColor: 'var(--ag-bg)',
          borderRadius: 'var(--ag-radius-card)',
          padding: 'var(--ag-space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-4)',
          boxShadow: '0 4px 24px rgba(42, 40, 38, 0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2
            id="goal-review-title"
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontSize: 19,
              fontWeight: 500,
              color: 'var(--ag-ink-primary)',
            }}
          >
            Review goal
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar"
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--ag-ink-soft)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontSize: 16,
            fontStyle: 'italic',
            color: 'var(--ag-ink-soft)',
          }}
        >
          {goalTitle}
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid var(--ag-rule)', margin: 0 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
          <label
            htmlFor="goal-score"
            style={{
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 15,
              color: 'var(--ag-ink-primary)',
            }}
          >
            {goalQuestion}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ag-space-3)' }}>
            <span style={{ fontFamily: 'var(--ag-font-mono)', fontSize: 12, color: 'var(--ag-ink-hint)' }}>
              1
            </span>
            <input
              id="goal-score"
              type="range"
              min={1}
              max={10}
              step={1}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              style={{
                flex: 1,
                accentColor: 'var(--ag-ink-primary)',
              }}
            />
            <span style={{ fontFamily: 'var(--ag-font-mono)', fontSize: 12, color: 'var(--ag-ink-hint)' }}>
              10
            </span>
          </div>
          <span
            style={{
              alignSelf: 'center',
              fontFamily: 'var(--ag-font-mono)',
              fontSize: 18,
              color: 'var(--ag-ink-primary)',
            }}
          >
            {score}
          </span>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--ag-rule)', margin: 0 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
          <label
            htmlFor="goal-notes"
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--ag-slate)',
            }}
          >
            Notas (opcional)
          </label>
          <textarea
            id="goal-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="¿Qué aprendiste de este trimestre?"
            style={{
              appearance: 'none',
              backgroundColor: 'var(--ag-bg-elevated)',
              border: '1px solid var(--ag-rule)',
              borderRadius: 'var(--ag-radius-base)',
              padding: 'var(--ag-space-3)',
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 14,
              lineHeight: 1.5,
              color: 'var(--ag-ink-primary)',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--ag-rule)', margin: 0 }} />

        <fieldset
          style={{
            border: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-2)',
          }}
        >
          <legend
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--ag-slate)',
              marginBottom: 4,
            }}
          >
            Status sugerido
          </legend>
          {(['achieved', 'partial', 'abandoned'] as ReviewStatus[]).map((s) => {
            const checked = selectedStatus === s;
            const isAuto = !statusOverride && s === suggested;
            const labelMap: Record<ReviewStatus, string> = {
              achieved: 'Achieved',
              partial: 'Partial',
              abandoned: 'Abandoned',
            };
            return (
              <label
                key={s}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--ag-space-2)',
                  padding: '8px 10px',
                  border: `1px solid ${checked ? 'var(--ag-ink-primary)' : 'var(--ag-rule)'}`,
                  borderRadius: 'var(--ag-radius-base)',
                  backgroundColor: checked ? 'var(--ag-bg-sunken)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="goal-status"
                  checked={checked}
                  onChange={() => setStatusOverride(s)}
                  style={{ accentColor: 'var(--ag-ink-primary)' }}
                />
                <span
                  style={{
                    fontFamily: 'var(--ag-font-body)',
                    fontSize: 14,
                    color: 'var(--ag-ink-primary)',
                    flex: 1,
                  }}
                >
                  {labelMap[s]}
                </span>
                {isAuto ? (
                  <span
                    style={{
                      fontFamily: 'var(--ag-font-display)',
                      fontStyle: 'italic',
                      fontSize: 12,
                      color: 'var(--ag-ink-hint)',
                    }}
                  >
                    sugerido
                  </span>
                ) : null}
              </label>
            );
          })}
        </fieldset>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--ag-space-2)',
            marginTop: 'var(--ag-space-2)',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: '1px solid var(--ag-rule)',
              borderRadius: 'var(--ag-radius-base)',
              padding: '10px 16px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              color: 'var(--ag-ink-soft)',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            style={{
              appearance: 'none',
              background: 'var(--ag-ink-primary)',
              border: 'none',
              borderRadius: 'var(--ag-radius-base)',
              padding: '10px 16px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--ag-accent-on)',
              cursor: 'pointer',
            }}
          >
            Guardar review
          </button>
        </div>
      </form>
    </div>
  );
}
