'use client';

/**
 * TodayViewToggle — pill segmented control para el modo de organización
 * del pool sidebar en /today.
 *
 *   - 'fecha'  (default) → pool agrupado por scope temporal
 *                          (Hoy sin horario / Esta semana / Pendientes).
 *   - 'matriz'           → pool agrupado por cuadrante Eisenhower
 *                          (Q1 / Q2 / Q3 / Q4).
 *
 * En AMBAS vistas el calendar grid (06:00-22:00) sigue siendo el target
 * principal: cualquier ítem del pool se arrastra a una hora para programarlo.
 * La diferencia es solamente cómo se agrupan los ítems no programados.
 *
 * Pure presentational. State is owned by the parent page.
 */

import { Calendar, Grid2x2 } from 'lucide-react';

export type TodayView = 'fecha' | 'matriz';

const OPTIONS: Array<{ id: TodayView; label: string; Icon: typeof Calendar }> = [
  { id: 'fecha', label: 'Por fecha', Icon: Calendar },
  { id: 'matriz', label: 'Por matriz', Icon: Grid2x2 },
];

interface TodayViewToggleProps {
  value: TodayView;
  onChange: (next: TodayView) => void;
}

export function TodayViewToggle({ value, onChange }: TodayViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Modo de organización del pool"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        padding: 4,
        border: '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-pill)',
        backgroundColor: 'var(--ag-bg-elevated)',
      }}
    >
      {OPTIONS.map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            style={{
              appearance: 'none',
              border: 'none',
              backgroundColor: active ? 'var(--ag-ink-primary)' : 'transparent',
              color: active ? 'var(--ag-accent-on)' : 'var(--ag-ink-soft)',
              borderRadius: 'var(--ag-radius-pill)',
              padding: '6px 12px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              fontWeight: active ? 500 : 400,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: `background-color var(--ag-duration-base) var(--ag-ease)`,
            }}
          >
            <Icon size={14} strokeWidth={1.75} aria-hidden />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
