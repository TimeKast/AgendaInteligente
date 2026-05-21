'use client';

/**
 * CloseDayModal — direct UI to close the day, non-conversational alternative
 * to the evening chat ritual.
 *
 * Sections:
 *   1. Wins planeadas — each row has a 3-way chip group (Cumplida / Avanzada /
 *      No la toqué).
 *        - Cumplida  → reveals a checkbox "Y además, cerrada (no más iteraciones)".
 *          Distinción: una tarea puede ser "cumplida" hoy (lo planeado pasó) pero
 *          NO "cerrada" (el objetivo subyacente sigue abierto, ej: gym recurrente).
 *        - Avanzada  → reveals a 0-100% slider.
 *        - No la toqué → reveals a textarea "¿qué pasó?"
 *   2. Una línea — textarea (italic serif placeholder).
 *
 * Submit → toast "Día cerrado." and close. Visual-only, no persistence.
 *
 * Layout: bottom sheet on mobile, centered modal on desktop — same pattern as
 * VoiceCaptureSheet / ActivityStatusModal.
 *
 * Visual:
 *  - Scope accent bar (Day) on the left of the sheet.
 *  - Hairline section dividers in --ag-rule.
 */

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export type WinOutcome = 'done' | 'partial' | 'missed';

export interface CloseDayWinInput {
  id: string;
  title: string;
}

export interface CloseDayWinResult {
  id: string;
  outcome: WinOutcome;
  /** Only meaningful when outcome === 'done'. True = objetivo cerrado, no más iteraciones. */
  closed: boolean;
  /** 0-100; only meaningful when outcome === 'partial'. */
  partialPct: number;
  /** Reason text; only meaningful when outcome === 'missed'. */
  missedReason: string;
}

export interface CloseDayPayload {
  wins: CloseDayWinResult[];
  oneLine: string;
}

interface CloseDayModalProps {
  open: boolean;
  wins: CloseDayWinInput[];
  onCancel: () => void;
  onSubmit: (payload: CloseDayPayload) => void;
}

const OUTCOME_OPTIONS: Array<{ id: WinOutcome; label: string; glyph: string }> = [
  { id: 'done', label: 'Cumplida', glyph: '✓' },
  { id: 'partial', label: 'Avanzada', glyph: '◐' },
  { id: 'missed', label: 'No la toqué', glyph: '⊘' },
];

export function CloseDayModal({ open, wins, onCancel, onSubmit }: CloseDayModalProps) {
  // Per-win state (outcome + closed + partial pct + missed reason).
  const [winState, setWinState] = useState<Record<string, CloseDayWinResult>>({});
  const [oneLine, setOneLine] = useState('');

  // Reset form whenever the modal re-opens. Wins list might also change.
  useEffect(() => {
    if (!open) return;
    // Reset form fields when the modal re-opens. Same pattern as
    // ActivityStatusModal / NewCategoryModal / GoalReviewModal in this folder.
    /* eslint-disable react-hooks/set-state-in-effect */
    setWinState(() => {
      const next: Record<string, CloseDayWinResult> = {};
      for (const w of wins) {
        next[w.id] = {
          id: w.id,
          outcome: 'done',
          closed: false,
          partialPct: 50,
          missedReason: '',
        };
      }
      return next;
    });
    setOneLine('');
    /* eslint-enable react-hooks/set-state-in-effect */

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, wins, onCancel]);

  if (!open) return null;

  function setOutcome(winId: string, outcome: WinOutcome) {
    setWinState((prev) => ({
      ...prev,
      [winId]: { ...prev[winId], outcome },
    }));
  }
  function setClosed(winId: string, closed: boolean) {
    setWinState((prev) => ({
      ...prev,
      [winId]: { ...prev[winId], closed },
    }));
  }
  function setPartial(winId: string, pct: number) {
    setWinState((prev) => ({
      ...prev,
      [winId]: { ...prev[winId], partialPct: pct },
    }));
  }
  function setMissedReason(winId: string, reason: string) {
    setWinState((prev) => ({
      ...prev,
      [winId]: { ...prev[winId], missedReason: reason },
    }));
  }

  function submit() {
    onSubmit({
      wins: wins.map((w) => winState[w.id]).filter(Boolean),
      oneLine: oneLine.trim(),
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="close-day-title"
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
        onClick={onCancel}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(42, 40, 38, 0.32)',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: 'var(--ag-bg)',
          borderTopLeftRadius: 'var(--ag-radius-card)',
          borderTopRightRadius: 'var(--ag-radius-card)',
          padding: 'var(--ag-space-5) var(--ag-space-5) var(--ag-space-6)',
          paddingLeft: 'calc(var(--ag-space-5) + 4px)',
          paddingBottom: 'calc(var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -2px 10px rgba(42, 40, 38, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-4)',
        }}
      >
        {/* Scope accent bar — Day */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            backgroundColor: 'var(--ag-scope-day)',
          }}
        />

        {/* Handle */}
        <span
          aria-hidden
          style={{
            display: 'block',
            width: 40,
            height: 4,
            borderRadius: 'var(--ag-radius-pill)',
            backgroundColor: 'var(--ag-rule)',
            margin: '0 auto var(--ag-space-2)',
          }}
        />

        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 'var(--ag-space-2)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-1)' }}>
            <h2
              id="close-day-title"
              style={{
                margin: 0,
                fontFamily: 'var(--ag-font-display)',
                fontSize: 22,
                fontWeight: 500,
                color: 'var(--ag-ink-primary)',
                lineHeight: 1.25,
              }}
            >
              Cerrá el día
            </h2>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--ag-font-display)',
                fontStyle: 'italic',
                fontSize: 15,
                color: 'var(--ag-ink-hint)',
              }}
            >
              ¿Qué pasó realmente?
            </p>
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

        {/* Wins section */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-3)' }}>
          <SectionCaption>Wins planeadas</SectionCaption>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {wins.map((w, idx) => {
              const result = winState[w.id];
              if (!result) return null;
              return (
                <li
                  key={w.id}
                  style={{
                    paddingBlock: 'var(--ag-space-3)',
                    borderTop: idx === 0 ? '1px solid var(--ag-rule)' : 'none',
                    borderBottom: '1px solid var(--ag-rule)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--ag-space-2)',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontFamily: 'var(--ag-font-body)',
                      fontSize: 15,
                      color: 'var(--ag-ink-primary)',
                    }}
                  >
                    {w.title}
                  </p>
                  <div
                    role="radiogroup"
                    aria-label={`Resultado de ${w.title}`}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ag-space-2)' }}
                  >
                    {OUTCOME_OPTIONS.map((opt) => {
                      const active = result.outcome === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setOutcome(w.id, opt.id)}
                          style={{
                            appearance: 'none',
                            backgroundColor: active
                              ? 'var(--ag-ink-primary)'
                              : 'var(--ag-bg-elevated)',
                            border: '1px solid var(--ag-rule)',
                            borderRadius: 'var(--ag-radius-pill)',
                            padding: '6px 12px',
                            fontFamily: 'var(--ag-font-body)',
                            fontSize: 13,
                            color: active ? 'var(--ag-accent-on)' : 'var(--ag-ink-soft)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span aria-hidden>{opt.glyph}</span>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {result.outcome === 'done' ? (
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--ag-space-2)',
                        cursor: 'pointer',
                        paddingTop: 'var(--ag-space-1)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={result.closed}
                        onChange={(e) => setClosed(w.id, e.target.checked)}
                        aria-label={`Cerrar definitivamente ${w.title}`}
                        style={{
                          width: 16,
                          height: 16,
                          accentColor: 'var(--ag-ink-primary)',
                          cursor: 'pointer',
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'var(--ag-font-display)',
                          fontStyle: 'italic',
                          fontSize: 14,
                          color: 'var(--ag-ink-soft)',
                        }}
                      >
                        Y además, cerrada (no más iteraciones)
                      </span>
                    </label>
                  ) : null}

                  {result.outcome === 'partial' ? (
                    <PercentSlider
                      value={result.partialPct}
                      onChange={(v) => setPartial(w.id, v)}
                    />
                  ) : null}

                  {result.outcome === 'missed' ? (
                    <textarea
                      value={result.missedReason}
                      onChange={(e) => setMissedReason(w.id, e.target.value)}
                      placeholder="¿qué pasó?"
                      rows={2}
                      style={{
                        appearance: 'none',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--ag-rule)',
                        borderRadius: 'var(--ag-radius-base)',
                        padding: '8px 10px',
                        fontFamily: 'var(--ag-font-display)',
                        fontStyle: result.missedReason ? 'normal' : 'italic',
                        fontSize: 14,
                        color: 'var(--ag-ink-primary)',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>

        {/* One-line section */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
          <SectionCaption>Una línea</SectionCaption>
          <textarea
            value={oneLine}
            onChange={(e) => setOneLine(e.target.value)}
            placeholder="Una frase sobre el día"
            rows={2}
            style={{
              appearance: 'none',
              backgroundColor: 'transparent',
              border: '1px solid var(--ag-rule)',
              borderRadius: 'var(--ag-radius-base)',
              padding: '10px 12px',
              fontFamily: 'var(--ag-font-display)',
              fontStyle: oneLine ? 'normal' : 'italic',
              fontSize: 15,
              color: 'var(--ag-ink-primary)',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </section>

        {/* Footer */}
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
            Guardar →
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionCaption({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </span>
  );
}

function PercentSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 44px',
        alignItems: 'center',
        gap: 'var(--ag-space-3)',
      }}
    >
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Porcentaje avanzado"
        style={sliderStyle}
      />
      <span
        aria-hidden
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 13,
          color: 'var(--ag-ink-soft)',
          textAlign: 'right',
        }}
      >
        {value}%
      </span>
    </label>
  );
}

const sliderStyle: React.CSSProperties = {
  width: '100%',
  accentColor: 'var(--ag-ink-primary)',
  cursor: 'pointer',
};
