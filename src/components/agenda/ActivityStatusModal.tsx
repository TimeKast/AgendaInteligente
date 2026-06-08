'use client';

/**
 * ActivityStatusModal — SCR-052. Change the status of an activity from a
 * tap on the row "⋯" menu (or, in spec, long-press / swipe).
 *
 * Status options:
 *   ◯ Pending / ● In progress / ◯ Done / ◯ Skipped / ◯ Blocked / ◯ Cancelled
 *
 * Selecting Skipped or Blocked expands a reason form (category radio +
 * optional textarea). Cancelled is terminal but takes no reason (the
 * agent doesn't challenge cancellations the way it does skips/blocks).
 * On confirm, calls onApply with the chosen status + reason.
 */

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export type ExtendedActivityStatus =
  | 'todo'
  | 'in_progress'
  | 'done'
  | 'skipped'
  | 'blocked'
  | 'cancelled';

export interface StatusReason {
  category: 'tiempo' | 'prioridad' | 'bloqueado' | 'no quise' | 'otro';
  note?: string;
}

interface ActivityStatusModalProps {
  open: boolean;
  title: string;
  currentStatus: ExtendedActivityStatus;
  onCancel: () => void;
  onApply: (next: ExtendedActivityStatus, reason?: StatusReason) => void;
}

const STATUS_OPTIONS: Array<{ id: ExtendedActivityStatus; label: string }> = [
  { id: 'todo', label: 'Por hacer' },
  { id: 'in_progress', label: 'En progreso' },
  { id: 'done', label: 'Hecha' },
  { id: 'skipped', label: 'Saltada' },
  { id: 'blocked', label: 'Bloqueada' },
  { id: 'cancelled', label: 'Cancelada' },
];

const REASON_CATEGORIES: StatusReason['category'][] = [
  'tiempo',
  'prioridad',
  'bloqueado',
  'no quise',
  'otro',
];

export function ActivityStatusModal({
  open,
  title,
  currentStatus,
  onCancel,
  onApply,
}: ActivityStatusModalProps) {
  const [status, setStatus] = useState<ExtendedActivityStatus>(currentStatus);
  const [reasonCat, setReasonCat] = useState<StatusReason['category']>('tiempo');
  const [reasonNote, setReasonNote] = useState('');

  useEffect(() => {
    if (!open) return;
    // Reset modal state when it re-opens. Same pattern as NewCategoryModal.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus(currentStatus);

    setReasonCat('tiempo');

    setReasonNote('');
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, currentStatus, onCancel]);

  if (!open) return null;

  const needsReason = status === 'skipped' || status === 'blocked';

  function submit() {
    if (needsReason) {
      onApply(status, { category: reasonCat, note: reasonNote.trim() || undefined });
    } else {
      onApply(status);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 'var(--ag-space-4)',
        backgroundColor: 'color-mix(in oklab, var(--ag-ink-primary), transparent 60%)',
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 440,
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
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 'var(--ag-space-2)',
          }}
        >
          <h2
            id="status-modal-title"
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontSize: 17,
              fontWeight: 500,
              color: 'var(--ag-ink-primary)',
              lineHeight: 1.35,
            }}
          >
            ☐ {title}
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
        </header>

        <div role="radiogroup" aria-label="Status">
          {STATUS_OPTIONS.map((opt) => (
            <StatusRadioRow
              key={opt.id}
              label={opt.label}
              checked={status === opt.id}
              onSelect={() => setStatus(opt.id)}
            />
          ))}
        </div>

        {needsReason ? (
          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ag-space-3)',
              paddingTop: 'var(--ag-space-3)',
              borderTop: '1px solid var(--ag-rule)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--ag-font-body)',
                fontSize: 12,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--ag-slate)',
              }}
            >
              ¿Qué pasó?
            </span>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ag-space-2)' }}>
              {REASON_CATEGORIES.map((cat) => {
                const active = reasonCat === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setReasonCat(cat)}
                    style={{
                      appearance: 'none',
                      backgroundColor: active ? 'var(--ag-ink-primary)' : 'var(--ag-bg-elevated)',
                      border: '1px solid var(--ag-rule)',
                      borderRadius: 'var(--ag-radius-pill)',
                      padding: '6px 12px',
                      fontFamily: 'var(--ag-font-body)',
                      fontSize: 13,
                      color: active ? 'var(--ag-accent-on)' : 'var(--ag-ink-soft)',
                      cursor: 'pointer',
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <textarea
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              placeholder="Una línea para vos (opcional)…"
              rows={2}
              style={{
                appearance: 'none',
                backgroundColor: 'transparent',
                border: '1px solid var(--ag-rule)',
                borderRadius: 'var(--ag-radius-base)',
                padding: '8px 10px',
                fontFamily: 'var(--ag-font-display)',
                fontStyle: reasonNote ? 'normal' : 'italic',
                fontSize: 14,
                color: 'var(--ag-ink-primary)',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </section>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--ag-space-2)' }}>
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
            type="button"
            onClick={submit}
            style={{
              appearance: 'none',
              backgroundColor: 'var(--ag-ink-primary)',
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
            Cambiar status →
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusRadioRow({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      style={{
        appearance: 'none',
        background: 'transparent',
        border: 'none',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--ag-space-3)',
        padding: 'var(--ag-space-2) 0',
        width: '100%',
        color: 'var(--ag-ink-primary)',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 18,
          height: 18,
          borderRadius: 'var(--ag-radius-pill)',
          boxShadow: 'inset 0 0 0 1px var(--ag-rule)',
          backgroundColor: checked ? 'var(--ag-ink-primary)' : 'transparent',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {checked ? (
          <span
            style={{
              position: 'absolute',
              inset: 4,
              borderRadius: 'var(--ag-radius-pill)',
              backgroundColor: 'var(--ag-accent-on)',
            }}
          />
        ) : null}
      </span>
      <span
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 15,
          color: 'var(--ag-ink-primary)',
        }}
      >
        {label}
      </span>
    </button>
  );
}
