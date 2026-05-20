'use client';

/**
 * VoiceCaptureSheet — SCR-050 modal.
 *
 * Custom built (no shadcn Sheet) to keep the warm-book skin pristine:
 *   - Mobile (<640px): bottom sheet, slides from bottom.
 *   - Desktop:         centered modal, max-w-480px.
 *   - Backdrop:        soft warm overlay (no blur, no glass).
 *
 * Two states:
 *   1. recording → waveform + italic serif streaming transcription.
 *   2. preview   → VoicePreviewCard.
 *
 * "Guardar" closes the sheet and triggers a small visual toast in the parent
 * via console for the prototype (real toast system intentionally avoided to
 * not pull in a neumo-styled dep).
 */

import { useEffect, useState } from 'react';
import { WaveformAnim } from './WaveformAnim';
import { VoicePreviewCard } from './VoicePreviewCard';

interface VoiceCaptureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Stage = 'recording' | 'preview';

export function VoiceCaptureSheet({ open, onOpenChange }: VoiceCaptureSheetProps) {
  // Deriving stage from `open` resets the stage every time the sheet opens
  // (recording is always the first step) without using a cascading effect.
  const [stage, setStage] = useState<Stage>('recording');
  const [openSeed, setOpenSeed] = useState(open);
  if (open !== openSeed) {
    setOpenSeed(open);
    if (open) setStage('recording');
  }

  const [toast, setToast] = useState<string | null>(null);

  // Auto-hide toast.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  if (!open && !toast) return null;

  return (
    <>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Capturar con voz"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => onOpenChange(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(42, 40, 38, 0.32)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              animation: 'ag-fade-in 200ms var(--ag-ease)',
            }}
          />

          {/* Sheet */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 480,
              backgroundColor: 'var(--ag-bg)',
              borderTopLeftRadius: 'var(--ag-radius-card)',
              borderTopRightRadius: 'var(--ag-radius-card)',
              padding: 'var(--ag-space-5) var(--ag-space-5) var(--ag-space-6)',
              paddingBottom: 'calc(var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
              boxShadow: '0 -2px 10px rgba(42, 40, 38, 0.08)',
              animation: 'ag-slide-up 220ms var(--ag-ease)',
            }}
          >
            {/* Handle */}
            <span
              aria-hidden
              style={{
                display: 'block',
                width: 40,
                height: 4,
                borderRadius: 'var(--ag-radius-pill)',
                backgroundColor: 'var(--ag-rule)',
                margin: '0 auto var(--ag-space-4)',
              }}
            />

            {stage === 'recording' ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--ag-space-5)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--ag-font-body)',
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--ag-slate)',
                    textAlign: 'center',
                  }}
                >
                  Escuchando…
                </span>

                <WaveformAnim />

                <p
                  style={{
                    margin: 0,
                    fontFamily: 'var(--ag-font-display)',
                    fontStyle: 'italic',
                    fontSize: 17,
                    lineHeight: 1.5,
                    color: 'var(--ag-ink-soft)',
                    textAlign: 'center',
                  }}
                >
                  agendá llamar a juan mañana 10am proyecto personal alta prioridad…
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 'var(--ag-space-3)',
                    marginTop: 'var(--ag-space-2)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    style={ghostBtn}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage('preview')}
                    style={primaryBtn}
                  >
                    Listo →
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--ag-space-5)',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--ag-font-display)',
                    fontSize: 22,
                    fontWeight: 500,
                    color: 'var(--ag-ink-primary)',
                  }}
                >
                  Confirmar captura
                </h2>

                <VoicePreviewCard />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 'var(--ag-space-2)',
                    flexWrap: 'wrap',
                  }}
                >
                  <button type="button" onClick={() => onOpenChange(false)} style={ghostBtn}>
                    Cancelar
                  </button>
                  <button type="button" onClick={() => setStage('recording')} style={ghostBtn}>
                    Editar más
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      setToast('Guardado.');
                    }}
                    style={primaryBtn}
                  >
                    Guardar →
                  </button>
                </div>
              </div>
            )}
          </div>

          <style>{keyframes}</style>
        </div>
      ) : null}

      {/* Tiny toast — custom, no sonner */}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 'calc(64px + 24px + env(safe-area-inset-bottom, 0px))',
            zIndex: 80,
            backgroundColor: 'var(--ag-ink-primary)',
            color: 'var(--ag-accent-on)',
            padding: '10px 16px',
            borderRadius: 'var(--ag-radius-pill)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 14,
            boxShadow: '0 1px 2px rgba(42, 40, 38, 0.12), 0 2px 6px rgba(42, 40, 38, 0.08)',
            animation: 'ag-fade-in 180ms var(--ag-ease)',
          }}
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}

const ghostBtn: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid var(--ag-rule)',
  background: 'transparent',
  color: 'var(--ag-ink-soft)',
  padding: '10px 16px',
  borderRadius: 'var(--ag-radius-base)',
  fontFamily: 'var(--ag-font-body)',
  fontSize: 15,
  cursor: 'pointer',
  flex: 1,
  minWidth: 100,
};

const primaryBtn: React.CSSProperties = {
  appearance: 'none',
  border: 'none',
  background: 'var(--ag-accent-primary)',
  color: 'var(--ag-accent-on)',
  padding: '10px 16px',
  borderRadius: 'var(--ag-radius-base)',
  fontFamily: 'var(--ag-font-body)',
  fontSize: 15,
  fontWeight: 500,
  cursor: 'pointer',
  flex: 1,
  minWidth: 100,
};

const keyframes = `
  @keyframes ag-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes ag-slide-up {
    from { transform: translateY(16px); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
`;
