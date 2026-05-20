'use client';

/**
 * ConfirmDeleteModal — SCR-054. Reusable destructive confirmation modal.
 *
 * Visual-only. Used by:
 *   - Category delete cascade (CategoryListPage)
 *   - Project status change to "killed" / "completed"
 *
 * The "Borrar" / destructive action uses --ag-danger as the label color and
 * a subtle danger-tinted background — no jarring red blocks.
 */

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  description: string;
  /** Italic-serif caption appended below the description. */
  caption?: string;
  /** Label for the destructive action. Defaults to "Borrar". */
  destructiveLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({
  open,
  title,
  description,
  caption,
  destructiveLabel = 'Borrar',
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    if (!open) return;
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
      aria-labelledby="confirm-delete-title"
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
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 420,
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--ag-space-2)',
          }}
        >
          <AlertTriangle size={18} strokeWidth={1.75} color="var(--ag-danger)" aria-hidden />
          <h2
            id="confirm-delete-title"
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontSize: 19,
              fontWeight: 500,
              color: 'var(--ag-ink-primary)',
            }}
          >
            {title}
          </h2>
        </div>

        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-body)',
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--ag-ink-soft)',
          }}
        >
          {description}
        </p>

        {caption ? (
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--ag-ink-hint)',
            }}
          >
            {caption}
          </p>
        ) : null}

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
            type="button"
            onClick={onConfirm}
            style={{
              appearance: 'none',
              background: 'color-mix(in oklab, var(--ag-danger), transparent 88%)',
              border: '1px solid color-mix(in oklab, var(--ag-danger), transparent 60%)',
              borderRadius: 'var(--ag-radius-base)',
              padding: '10px 16px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--ag-danger)',
              cursor: 'pointer',
            }}
          >
            {destructiveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
