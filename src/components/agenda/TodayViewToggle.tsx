'use client';

/**
 * TodayViewToggle — pill segmented control for the Today view modes.
 *
 *   - 'calendar' (default) → drag-and-drop hour grid with pool sidebar.
 *   - 'matrix'             → Eisenhower 2x2 (Q1..Q4) by urgency × importance.
 *   - 'list'               → 4 vertical sections (sin horario / con horario /
 *                            esta semana / pendientes).
 *
 * Pure presentational. State is owned by the parent page.
 */

import { Calendar, Grid2x2, ListChecks } from 'lucide-react';

export type TodayView = 'calendar' | 'matrix' | 'list';

const OPTIONS: Array<{ id: TodayView; label: string; Icon: typeof Calendar }> = [
  { id: 'calendar', label: 'Calendario', Icon: Calendar },
  { id: 'matrix', label: 'Matriz', Icon: Grid2x2 },
  { id: 'list', label: 'Lista', Icon: ListChecks },
];

interface TodayViewToggleProps {
  value: TodayView;
  onChange: (next: TodayView) => void;
}

export function TodayViewToggle({ value, onChange }: TodayViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Modo de vista"
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
            <span>Vista {label.toLowerCase()}</span>
          </button>
        );
      })}
    </div>
  );
}
