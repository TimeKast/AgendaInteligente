'use client';

/**
 * AccountDeletionModal — SCR-037 friction-confirm destructive modal.
 *
 * Requires typing the literal "BORRAR" before the destructive button enables.
 * Visual-only — calls onConfirm if user proceeds.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface AccountDeletionModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const CONFIRM_TOKEN = 'BORRAR';

export function AccountDeletionModal({
  open,
  onCancel,
  onConfirm,
}: AccountDeletionModalProps) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTyped('');
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  const canConfirm = typed.trim() === CONFIRM_TOKEN;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-delete-title"
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
            alignItems: 'center',
            gap: 'var(--ag-space-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ag-space-2)' }}>
            <AlertTriangle size={18} strokeWidth={1.75} color="var(--ag-danger)" aria-hidden />
            <h2
              id="account-delete-title"
              style={{
                margin: 0,
                fontFamily: 'var(--ag-font-display)',
                fontSize: 19,
                fontWeight: 500,
                color: 'var(--ag-ink-primary)',
              }}
            >
              Borrar cuenta
            </h2>
          </div>
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

        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-body)',
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--ag-ink-soft)',
          }}
        >
          Vas a iniciar el borrado de tu cuenta. Tus datos quedan en soft delete por 30
          días: si cambiás de opinión, restaurás todo desde el login.
        </p>

        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
            lineHeight: 1.5,
          }}
        >
          Tokens OAuth y contraseñas se borran inmediatamente. El resto en 30 días vía
          cron.
        </p>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
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
            Para confirmar, escribí {CONFIRM_TOKEN}
          </span>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoFocus
            autoCapitalize="characters"
            spellCheck={false}
            placeholder={CONFIRM_TOKEN}
            style={{
              appearance: 'none',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--ag-rule)',
              padding: '8px 0',
              fontFamily: 'var(--ag-font-mono)',
              fontSize: 16,
              letterSpacing: '0.05em',
              color: 'var(--ag-ink-primary)',
              outline: 'none',
            }}
          />
        </label>

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
            disabled={!canConfirm}
            style={{
              appearance: 'none',
              background: canConfirm
                ? 'color-mix(in oklab, var(--ag-danger), transparent 88%)'
                : 'var(--ag-bg-sunken)',
              border: canConfirm
                ? '1px solid color-mix(in oklab, var(--ag-danger), transparent 60%)'
                : '1px solid var(--ag-rule)',
              borderRadius: 'var(--ag-radius-base)',
              padding: '10px 16px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              fontWeight: 500,
              color: canConfirm ? 'var(--ag-danger)' : 'var(--ag-ink-hint)',
              cursor: canConfirm ? 'pointer' : 'not-allowed',
            }}
          >
            Borrar cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
