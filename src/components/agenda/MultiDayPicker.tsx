'use client';

/**
 * MultiDayPicker — modal for assigning a single activity to multiple days
 * in /week. Triggered from a small "+ días" icon button on each day-instance
 * row of an activity in WeekSwimlane.
 *
 * UX:
 *   - 7-day chip grid for the currently-viewed week.
 *   - Tap chip → toggle membership in `scheduledDates` (Set semantics, never
 *     duplicates).
 *   - Currently-assigned days highlighted with `--ag-scope-day` ring.
 *   - Local draft state until "Guardar" — cancel discards.
 *
 * Pure visual. Parent owns the activity array and applies the new dates.
 */

import { useState } from 'react';
import { X } from 'lucide-react';

const DAY_LETTERS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

export interface MultiDayPickerDay {
  iso: string;
  letter: string;
  dayNumber: string;
}

interface MultiDayPickerProps {
  open: boolean;
  /** Activity title shown for context. */
  activityTitle: string;
  /** Days available to pick — the 7 days of the viewed week. */
  weekDays: MultiDayPickerDay[];
  /** Currently-assigned ISO dates for this activity. */
  initialDates: string[];
  onCancel: () => void;
  onSave: (nextDates: string[]) => void;
}

/**
 * Build 7-day descriptors for the week starting on the given Sunday.
 * Exposed so the parent can pass deterministic data matching its WeekSwimlane.
 */
export function buildWeekDays(weekStarting: Date): MultiDayPickerDay[] {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStarting);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      iso: `${y}-${m}-${day}`,
      letter: DAY_LETTERS[d.getDay()],
      dayNumber: String(d.getDate()),
    };
  });
}

/**
 * Outer wrapper: gates rendering on `open` and forces a fresh subtree (via
 * `key` on the inner component derived from `initialDates`) so the draft
 * state resets cleanly on every open without setState-in-effect.
 */
export function MultiDayPicker(props: MultiDayPickerProps) {
  if (!props.open) return null;
  return (
    <MultiDayPickerInner
      key={props.initialDates.join(',') + '::' + props.activityTitle}
      {...props}
    />
  );
}

function MultiDayPickerInner({
  activityTitle,
  weekDays,
  initialDates,
  onCancel,
  onSave,
}: MultiDayPickerProps) {
  const [draft, setDraft] = useState<string[]>(initialDates);

  function toggle(iso: string) {
    setDraft((prev) =>
      prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso],
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Asignar a más días"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        backgroundColor: 'color-mix(in oklab, var(--ag-ink-primary), transparent 60%)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingInline: 'var(--ag-space-4)',
        paddingBlock: 'var(--ag-space-4)',
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: 'var(--ag-bg)',
          border: '1px solid var(--ag-rule)',
          borderRadius: 'var(--ag-radius-card)',
          padding: 'var(--ag-space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-3)',
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 'var(--ag-space-2)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontSize: 18,
              fontWeight: 500,
              color: 'var(--ag-ink-primary)',
            }}
          >
            Asignar a más días
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar"
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--ag-ink-hint)',
              cursor: 'pointer',
              padding: 4,
              display: 'inline-flex',
            }}
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </header>

        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--ag-ink-soft)',
          }}
        >
          {activityTitle}
        </p>

        <div
          role="group"
          aria-label="Días de la semana"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 'var(--ag-space-2)',
          }}
        >
          {weekDays.map((d) => {
            const selected = draft.includes(d.iso);
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => toggle(d.iso)}
                aria-pressed={selected}
                style={{
                  appearance: 'none',
                  background: selected ? 'var(--ag-bg-elevated)' : 'transparent',
                  border: `1px solid ${selected ? 'var(--ag-scope-day)' : 'var(--ag-rule)'}`,
                  boxShadow: selected ? '0 0 0 2px color-mix(in oklab, var(--ag-scope-day), transparent 70%)' : 'none',
                  borderRadius: 'var(--ag-radius-base)',
                  padding: 'var(--ag-space-2) 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  color: selected ? 'var(--ag-ink-primary)' : 'var(--ag-ink-soft)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--ag-font-body)',
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                  }}
                >
                  {d.letter}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--ag-font-mono)',
                    fontSize: 14,
                    fontWeight: selected ? 600 : 400,
                  }}
                >
                  {d.dayNumber}
                </span>
              </button>
            );
          })}
        </div>

        <footer
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--ag-space-2)',
            paddingTop: 'var(--ag-space-2)',
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
              padding: '8px 14px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              color: 'var(--ag-ink-soft)',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            style={{
              appearance: 'none',
              backgroundColor: 'var(--ag-ink-primary)',
              border: 'none',
              borderRadius: 'var(--ag-radius-base)',
              padding: '8px 14px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--ag-accent-on)',
              cursor: 'pointer',
            }}
          >
            Guardar
          </button>
        </footer>
      </div>
    </div>
  );
}
