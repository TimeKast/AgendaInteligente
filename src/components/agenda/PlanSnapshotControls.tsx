'use client';

/**
 * PlanSnapshotControls — "Congelar plan" button + status banner for /week and
 * /month.
 *
 * Concept (prototype):
 *   The user plans the period (week / month), taps "Congelar plan", and the
 *   parent stores a snapshot of `taskPlacements` (taskId → scheduledDates[])
 *   at that moment. Tasks can still be dragged afterwards — life happens —
 *   but the original plan stays accessible via "Ver plan original" so the
 *   user can compare planned vs actual.
 *
 * UX states:
 *   - No snapshot       → primary action "Congelar plan" (Pin icon).
 *   - With snapshot     → caption banner "Plan congelado · {label}" + two
 *                         secondary actions: "Re-congelar" (asks confirm) and
 *                         "Ver plan original".
 *
 * Visual: subtle row, no all-caps button labels, no decorative emojis. The
 * Pin icon (Lucide) carries the "frozen" semantics.
 */

import { useState } from 'react';
import { History, Pin } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export interface PlanSnapshot {
  /** ISO datetime when the snapshot was captured. */
  capturedAt: string;
  /** taskId → scheduledDates[] at the moment of capture. */
  taskPlacements: Record<string, string[]>;
}

interface PlanSnapshotControlsProps {
  snapshot: PlanSnapshot | null;
  /** Capture a fresh snapshot (replaces any existing one). */
  onCapture: () => void;
  /** Open the read-only snapshot viewer. */
  onView: () => void;
  /** Scope label for the button — "semana" or "mes". Drives microcopy only. */
  scopeLabel: 'semana' | 'mes';
}

const BANNER_FMT = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function formatBannerLabel(iso: string): string {
  const d = new Date(iso);
  // "23 may, 14:32" — strip stray dots from the abbreviated month.
  return BANNER_FMT.format(d).replace(/\./g, '');
}

export function PlanSnapshotControls({
  snapshot,
  onCapture,
  onView,
  scopeLabel,
}: PlanSnapshotControlsProps) {
  const [confirmReCapture, setConfirmReCapture] = useState(false);

  if (!snapshot) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--ag-space-2)',
        }}
      >
        <button
          type="button"
          onClick={onCapture}
          style={{
            appearance: 'none',
            background: 'transparent',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-pill)',
            padding: '6px 12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-soft)',
            cursor: 'pointer',
          }}
        >
          <Pin size={14} strokeWidth={1.5} aria-hidden />
          Congelar plan
        </button>
        <span
          style={{
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 12,
            color: 'var(--ag-ink-hint)',
          }}
        >
          Guarda tu plan original de la {scopeLabel} para comparar después.
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 'var(--ag-space-2)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-soft)',
          }}
        >
          <Pin size={14} strokeWidth={1.75} color="var(--ag-scope-day)" aria-hidden />
          Plan congelado
          <span
            style={{
              fontFamily: 'var(--ag-font-mono)',
              fontSize: 12,
              color: 'var(--ag-ink-hint)',
              letterSpacing: '0.02em',
            }}
          >
            · {formatBannerLabel(snapshot.capturedAt)}
          </span>
        </span>

        <button
          type="button"
          onClick={onView}
          style={{
            appearance: 'none',
            background: 'transparent',
            border: 'none',
            padding: '4px 6px',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-soft)',
            textDecoration: 'underline',
            textDecorationStyle: 'dotted',
            textUnderlineOffset: 3,
            cursor: 'pointer',
          }}
        >
          Ver plan original
        </button>

        <button
          type="button"
          onClick={() => setConfirmReCapture(true)}
          style={{
            appearance: 'none',
            background: 'transparent',
            border: 'none',
            padding: '4px 6px',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
            textDecoration: 'underline',
            textDecorationStyle: 'dotted',
            textUnderlineOffset: 3,
            cursor: 'pointer',
          }}
        >
          Re-congelar
        </button>
      </div>

      <ConfirmDeleteModal
        open={confirmReCapture}
        title="¿Re-congelar el plan?"
        description="Vas a sobrescribir el plan original con el estado actual. El plan anterior se pierde."
        caption="Esta acción no se puede deshacer."
        destructiveLabel="Sobrescribir"
        onCancel={() => setConfirmReCapture(false)}
        onConfirm={() => {
          onCapture();
          setConfirmReCapture(false);
        }}
      />
    </>
  );
}

/** Small inline indicator shown next to a task that has moved off its planned
 *  position. Lives inside the row trailing area. Italic-serif caption +
 *  History icon, ink-hint color. */
export function MovedFromIndicator({ fromLabel }: { fromLabel: string }) {
  return (
    <span
      title={`Movido desde ${fromLabel}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: 'var(--ag-font-display)',
        fontStyle: 'italic',
        fontSize: 11,
        color: 'var(--ag-ink-hint)',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      <History size={11} strokeWidth={1.5} aria-hidden />
      Movido desde {fromLabel}
    </span>
  );
}
