'use client';

/**
 * CloseDayModal — direct UI to close the day, non-conversational alternative
 * to the evening chat ritual.
 *
 * Simplificación (iteración):
 *   - Se eliminó la sección WINS (era redundante con ACTIVIDADES).
 *   - Solo se muestran las actividades de hoy con 3 outcomes por fila:
 *       Hecha    → checkbox "Y además, cerrada (no más iteraciones)"
 *       Avanzada → slider 0-100% (default: progressPercent existente, o 50%)
 *       No la toqué → reveals nothing extra (single tap commit)
 *   - One-line al final ("Una frase sobre el día").
 *
 * Layout: bottom sheet en mobile, centered modal en desktop (mismo patrón
 * que VoiceCaptureSheet / ActivityStatusModal). Sticky footer Cancelar /
 * Guardar.
 *
 * Visual:
 *  - Scope accent bar (Day) on the left of the sheet.
 *  - Hairline section dividers in --ag-rule.
 */

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export type ActivityOutcome = 'done' | 'partial' | 'missed';

export interface CloseDayActivityInput {
  id: string;
  title: string;
  projectLabel: string;
  /** 0..100 starting progress (optional, defaults 50 when "Avanzada"). */
  progressPercent?: number;
}

export interface CloseDayActivityResult {
  id: string;
  outcome: ActivityOutcome;
  /** Only meaningful when outcome === 'partial'. */
  partialPct: number;
  /**
   * Solo aplica cuando outcome === 'done'. True = la actividad queda cerrada
   * (no más iteraciones, el agente no la vuelve a sugerir). Distinción semántica
   * de "cumplir" vs "cerrar": una tarea recurrente (gym) puede cumplirse hoy
   * sin cerrarse jamás.
   */
  closed: boolean;
}

export interface CloseDayPayload {
  activities: CloseDayActivityResult[];
  oneLine: string;
}

interface CloseDayModalProps {
  open: boolean;
  activities: CloseDayActivityInput[];
  onCancel: () => void;
  onSubmit: (payload: CloseDayPayload) => void;
}

const OUTCOME_OPTIONS: Array<{ id: ActivityOutcome; label: string; glyph: string }> = [
  { id: 'done', label: 'Hecha', glyph: '✓' },
  { id: 'partial', label: 'Avanzada', glyph: '◐' },
  { id: 'missed', label: 'No la toqué', glyph: '⊘' },
];

export function CloseDayModal({
  open,
  activities,
  onCancel,
  onSubmit,
}: CloseDayModalProps) {
  const [activityState, setActivityState] = useState<
    Record<string, CloseDayActivityResult>
  >({});
  const [oneLine, setOneLine] = useState('');

  // Reset form whenever the modal re-opens.
  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setActivityState(() => {
      const next: Record<string, CloseDayActivityResult> = {};
      for (const a of activities) {
        // Default outcome: if activity has progress 100 → done; if 0 → missed;
        // otherwise partial. Esto refleja el estado actual del día.
        let outcome: ActivityOutcome = 'partial';
        const pct = a.progressPercent ?? 0;
        if (pct >= 100) outcome = 'done';
        else if (pct === 0) outcome = 'missed';
        next[a.id] = {
          id: a.id,
          outcome,
          partialPct: a.progressPercent ?? 50,
          closed: false,
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
  }, [open, activities, onCancel]);

  if (!open) return null;

  function setActivityOutcome(id: string, outcome: ActivityOutcome) {
    setActivityState((prev) => ({
      ...prev,
      [id]: { ...prev[id], outcome },
    }));
  }
  function setActivityPartial(id: string, pct: number) {
    setActivityState((prev) => ({
      ...prev,
      [id]: { ...prev[id], partialPct: pct },
    }));
  }
  function setActivityClosed(id: string, closed: boolean) {
    setActivityState((prev) => ({
      ...prev,
      [id]: { ...prev[id], closed },
    }));
  }

  function submit() {
    onSubmit({
      activities: activities.map((a) => activityState[a.id]).filter(Boolean),
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
          maxWidth: 720,
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: 'var(--ag-bg)',
          borderTopLeftRadius: 'var(--ag-radius-card)',
          borderTopRightRadius: 'var(--ag-radius-card)',
          padding: 'var(--ag-space-5) var(--ag-space-5) 0',
          paddingLeft: 'calc(var(--ag-space-5) + 4px)',
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
              ¿Qué pasó realmente con tu lista de hoy?
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

        {/* Activities section */}
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-2)',
          }}
        >
          <SectionCaption>Actividades de hoy</SectionCaption>
          <ActivitiesGrid>
            {activities.map((act, idx) => {
              const result = activityState[act.id];
              if (!result) return null;
              return (
                <article
                  key={act.id}
                  style={{
                    paddingBlock: 'var(--ag-space-3)',
                    borderTop: idx < 2 ? '1px solid var(--ag-rule)' : 'none',
                    borderBottom: '1px solid var(--ag-rule)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--ag-space-2)',
                  }}
                >
                  <header
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 'var(--ag-space-2)',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontFamily: 'var(--ag-font-body)',
                        fontSize: 14,
                        color: 'var(--ag-ink-primary)',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {act.title}
                    </p>
                    <span
                      style={{
                        fontFamily: 'var(--ag-font-body)',
                        fontSize: 11,
                        color: 'var(--ag-ink-hint)',
                        border: '1px solid var(--ag-rule)',
                        borderRadius: 'var(--ag-radius-pill)',
                        padding: '2px 8px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {act.projectLabel}
                    </span>
                  </header>
                  <div
                    role="radiogroup"
                    aria-label={`Resultado de ${act.title}`}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    {OUTCOME_OPTIONS.map((opt) => {
                      const active = result.outcome === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setActivityOutcome(act.id, opt.id)}
                          style={{
                            appearance: 'none',
                            backgroundColor: active
                              ? 'var(--ag-ink-primary)'
                              : 'var(--ag-bg-elevated)',
                            border: '1px solid var(--ag-rule)',
                            borderRadius: 'var(--ag-radius-pill)',
                            padding: '4px 10px',
                            fontFamily: 'var(--ag-font-body)',
                            fontSize: 12,
                            color: active
                              ? 'var(--ag-accent-on)'
                              : 'var(--ag-ink-soft)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span aria-hidden>{opt.glyph}</span>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {result.outcome === 'partial' ? (
                    <PercentSlider
                      value={result.partialPct}
                      onChange={(v) => setActivityPartial(act.id, v)}
                    />
                  ) : null}
                  {result.outcome === 'done' ? (
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--ag-space-2)',
                        cursor: 'pointer',
                        paddingTop: 'var(--ag-space-1)',
                      }}
                      title="Si la cerrás, el agente no va a volver a sugerirla."
                    >
                      <input
                        type="checkbox"
                        checked={result.closed}
                        onChange={(e) => setActivityClosed(act.id, e.target.checked)}
                        aria-label={`Cerrar definitivamente ${act.title}`}
                        style={{
                          width: 14,
                          height: 14,
                          accentColor: 'var(--ag-ink-primary)',
                          cursor: 'pointer',
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'var(--ag-font-display)',
                          fontStyle: 'italic',
                          fontSize: 13,
                          color: 'var(--ag-ink-soft)',
                        }}
                      >
                        Y además, cerrada (no más iteraciones)
                      </span>
                    </label>
                  ) : null}
                </article>
              );
            })}
            {activities.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  paddingBlock: 'var(--ag-space-3)',
                  fontFamily: 'var(--ag-font-display)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--ag-ink-hint)',
                }}
              >
                Hoy no hay actividades para revisar.
              </p>
            ) : null}
          </ActivitiesGrid>
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

        {/* Footer — sticky to bottom so it stays visible even when modal scrolls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--ag-space-2)',
            marginTop: 'var(--ag-space-2)',
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'var(--ag-bg)',
            paddingBlock: 'var(--ag-space-3)',
            paddingBottom:
              'calc(var(--ag-space-4) + env(safe-area-inset-bottom, 0px))',
            borderTop: '1px solid var(--ag-rule)',
            marginInline: 'calc(var(--ag-space-5) * -1)',
            paddingInline: 'var(--ag-space-5)',
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

function ActivitiesGrid({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="ag-close-day-activities">{children}</div>
      <style>{`
        .ag-close-day-activities {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
        }
        @media (min-width: 720px) {
          .ag-close-day-activities {
            grid-template-columns: 1fr 1fr;
            column-gap: var(--ag-space-3);
          }
        }
      `}</style>
    </>
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
