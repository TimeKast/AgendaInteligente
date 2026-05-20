'use client';

/**
 * MutePickerModal — placeholder modal for "Silenciar agente" picker (SCR-030).
 *
 * Out of scope for this prototype round (visual only). Triggered via a row in
 * Settings → Notifications. Implemented as a thin centered modal with a few
 * preset durations.
 */

import { useState } from 'react';

interface MutePickerModalProps {
  triggerLabel?: string;
}

const OPTIONS = ['1 hora', 'Hasta mañana', 'Esta semana', 'Indefinido'];

export function MutePickerModal({ triggerLabel = 'Silenciar' }: MutePickerModalProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          appearance: 'none',
          border: '1px solid var(--ag-rule)',
          background: 'transparent',
          color: 'var(--ag-ink-soft)',
          padding: '6px 12px',
          borderRadius: 'var(--ag-radius-pill)',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        {selected ?? triggerLabel}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--ag-space-4)',
          }}
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(42, 40, 38, 0.32)',
              border: 'none',
              padding: 0,
            }}
          />
          <div
            style={{
              position: 'relative',
              backgroundColor: 'var(--ag-bg)',
              borderRadius: 'var(--ag-radius-card)',
              padding: 'var(--ag-space-5)',
              maxWidth: 320,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ag-space-3)',
              boxShadow: '0 2px 10px rgba(42, 40, 38, 0.12)',
            }}
          >
            <h4
              style={{
                margin: 0,
                fontFamily: 'var(--ag-font-display)',
                fontSize: 18,
                fontWeight: 500,
                color: 'var(--ag-ink-primary)',
              }}
            >
              Silenciar agente
            </h4>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
              {OPTIONS.map((opt) => (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(opt);
                      setOpen(false);
                    }}
                    style={{
                      appearance: 'none',
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--ag-rule)',
                      padding: '12px 4px',
                      fontFamily: 'var(--ag-font-body)',
                      fontSize: 15,
                      color: 'var(--ag-ink-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    {opt}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
