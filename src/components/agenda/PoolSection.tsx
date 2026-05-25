'use client';

/**
 * PoolSection — drop-target list of unscheduled tasks (no `scheduledTime`).
 *
 * Used as one of the pool sidebar slots on /today. Same component, two view
 * groupings:
 *
 *   - Por fecha:  HOY SIN HORARIO / ESTA SEMANA / PENDIENTES
 *   - Por matriz: Q1 / Q2 / Q3 / Q4
 *
 * Visuals: uppercase caption label + bordered ul list. When a drag is active,
 * a faint bg-elevated tint signals the drop target; an italic "Soltá acá"
 * hint appears if the pool is empty.
 *
 * `collapsible` opt-in adds a chevron toggle next to the caption. Default
 * open. Useful for ESTA SEMANA / PENDIENTES / Q3 / Q4 que pueden tener mucho
 * contenido.
 */

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';

interface PoolSectionProps {
  /** Unique droppable id (e.g. "pool:today"). */
  id: string;
  /** Caption label, rendered uppercase. */
  label: string;
  /** True while ANY drag is in flight. */
  isDragging: boolean;
  /** True when the underlying list has no items (controls the empty hint). */
  empty: boolean;
  children: ReactNode;
  /** Optional footer (e.g. inline ActivityQuickAdd). */
  footer?: ReactNode;
  /** Optional header rendered ABOVE the item list (e.g. inline ActivityQuickAdd
   *  to make capture the first action in the section). */
  header?: ReactNode;
  /** Optional count badge next to the caption. */
  count?: number;
  /** Optional accent color (matriz vistas usan accent por cuadrante). */
  accentColor?: string;
  /** Allow collapse/expand via chevron. Default false. */
  collapsible?: boolean;
  /** Initial collapsed state (only relevant when collapsible). */
  defaultCollapsed?: boolean;
}

export function PoolSection({
  id,
  label,
  isDragging,
  empty,
  children,
  footer,
  header,
  count,
  accentColor,
  collapsible = false,
  defaultCollapsed = false,
}: PoolSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  // Even when collapsed, the drop target should still accept ítems — they
  // expand the section visually al soltar. Para mantener simple el prototipo,
  // si está colapsado y arrastrás, expandimos el contenido de inmediato.
  const showContent = !collapsible || !collapsed || (isDragging && isOver);

  const Caption = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--ag-font-body)',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.12em',
        color: accentColor ?? 'var(--ag-ink-hint)',
        textTransform: 'uppercase',
      }}
    >
      {label}
      {typeof count === 'number' ? (
        <span
          aria-hidden
          style={{
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 11,
            color: 'var(--ag-ink-hint)',
            letterSpacing: 'normal',
            textTransform: 'none',
          }}
        >
          · {count}
        </span>
      ) : null}
    </span>
  );

  return (
    <section aria-label={label}>
      {collapsible ? (
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          style={{
            appearance: 'none',
            background: 'transparent',
            border: 'none',
            padding: 'var(--ag-space-2) 0',
            margin: 0,
            cursor: 'pointer',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--ag-space-2)',
            textAlign: 'left',
          }}
        >
          {Caption}
          <ChevronDown
            size={12}
            strokeWidth={1.75}
            aria-hidden
            style={{
              color: 'var(--ag-ink-hint)',
              transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              transition: 'transform var(--ag-duration-base) var(--ag-ease)',
            }}
          />
        </button>
      ) : (
        <p style={{ margin: 0, paddingBlock: 'var(--ag-space-2)' }}>{Caption}</p>
      )}

      <div
        ref={setNodeRef}
        style={{
          backgroundColor:
            isOver && isDragging
              ? 'color-mix(in oklab, var(--ag-bg-elevated), transparent 30%)'
              : 'transparent',
          borderRadius: 'var(--ag-radius-base)',
          transition: 'background-color 160ms ease-out',
          minHeight: empty ? 56 : undefined,
        }}
      >
        {showContent ? (
          <>
            {header ?? null}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{children}</ul>
            {empty && isDragging ? (
              <p
                style={{
                  margin: 0,
                  paddingBlock: 'var(--ag-space-2)',
                  paddingInline: 'var(--ag-space-2)',
                  fontFamily: 'var(--ag-font-display)',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: 'var(--ag-ink-hint)',
                  opacity: 0.85,
                }}
              >
                Soltá acá
              </p>
            ) : null}
            {empty && !isDragging ? (
              <p
                style={{
                  margin: 0,
                  paddingBlock: 'var(--ag-space-2)',
                  paddingInline: 'var(--ag-space-2)',
                  fontFamily: 'var(--ag-font-body)',
                  fontSize: 13,
                  color: 'var(--ag-ink-hint)',
                }}
              >
                Sin actividades.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
      {footer ?? null}
    </section>
  );
}
