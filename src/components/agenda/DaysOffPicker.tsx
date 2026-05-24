'use client';

/**
 * DaysOffPicker — modal for adding a single date or a date range marked as
 * "no actividad" (vacations, holidays, personal days). Visual-only prototype:
 * native `<input type="date">` pair (from + to) keeps it dependency-free.
 *
 * Reset strategy: parent uses key-driven remount or local state reset on
 * close — modal owns transient form state.
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import type { DayOff } from './DayOffChip';

interface DaysOffPickerProps {
  open: boolean;
  onCancel: () => void;
  onSave: (dayOff: Omit<DayOff, 'id'>) => void;
}

export function DaysOffPicker({ open, onCancel, onSave }: DaysOffPickerProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [label, setLabel] = useState('');

  if (!open) return null;

  const canSubmit = from.length > 0;
  const effectiveTo = to && to >= from ? to : from;

  function reset() {
    setFrom('');
    setTo('');
    setLabel('');
  }

  function handleSave() {
    if (!canSubmit) return;
    onSave({
      from,
      to: effectiveTo,
      label: label.trim() || undefined,
    });
    reset();
  }

  function handleCancel() {
    reset();
    onCancel();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="days-off-picker-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') handleCancel();
      }}
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
      onClick={handleCancel}
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
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            id="days-off-picker-title"
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontSize: 19,
              fontWeight: 500,
              color: 'var(--ag-ink-primary)',
            }}
          >
            Agregar día sin actividad
          </h2>
          <button
            type="button"
            onClick={handleCancel}
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
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--ag-ink-soft)',
            lineHeight: 1.5,
          }}
        >
          Elegí un día o un rango. Si no ponés &ldquo;hasta&rdquo;, se entiende un solo día.
        </p>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
          <FieldLabel>Desde</FieldLabel>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            autoFocus
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
          <FieldLabel>Hasta (opcional)</FieldLabel>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
          <FieldLabel>Etiqueta (opcional)</FieldLabel>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Vacaciones, feriado, etc."
            style={inputStyle}
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
            onClick={handleCancel}
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
            onClick={handleSave}
            disabled={!canSubmit}
            style={{
              appearance: 'none',
              background: canSubmit ? 'var(--ag-ink-primary)' : 'var(--ag-bg-sunken)',
              border: 'none',
              borderRadius: 'var(--ag-radius-base)',
              padding: '10px 16px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              fontWeight: 500,
              color: canSubmit ? 'var(--ag-accent-on)' : 'var(--ag-ink-hint)',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  appearance: 'none',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--ag-rule)',
  padding: '8px 0',
  fontFamily: 'var(--ag-font-body)',
  fontSize: 16,
  color: 'var(--ag-ink-primary)',
  outline: 'none',
};
