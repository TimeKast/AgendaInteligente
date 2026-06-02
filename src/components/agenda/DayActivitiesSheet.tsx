'use client';

/**
 * DayActivitiesSheet — bottom sheet modal shown when the user taps a day cell
 * in /month. Lists that day's activities and offers a "Quitar del día" action
 * for each one (clears the date → sends it back to the pool).
 *
 * Pure visual prototype. Mirrors the look of MultiDayPicker (warm-book sheet,
 * dim overlay, anchored to the bottom on mobile + centered on desktop).
 */

import { X, ArrowLeft } from 'lucide-react';

export interface DaySheetActivity {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  projectLabel: string;
}

interface DayActivitiesSheetProps {
  open: boolean;
  /** Human label (e.g. "Vie, 22 may 2026"). Falls back to ISO when empty. */
  dayLabel: string;
  isoDate: string;
  activities: DaySheetActivity[];
  onClose: () => void;
  /** User wants to send an activity back to the pool. */
  onRemoveFromDay: (activityId: string) => void;
}

export function DayActivitiesSheet({
  open,
  dayLabel,
  isoDate,
  activities,
  onClose,
  onRemoveFromDay,
}: DayActivitiesSheetProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Actividades de ${dayLabel || isoDate}`}
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
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
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
            {dayLabel || isoDate}
          </h2>
          <button
            type="button"
            onClick={onClose}
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

        {activities.length === 0 ? (
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--ag-ink-hint)',
              textAlign: 'center',
              paddingBlock: 'var(--ag-space-3)',
            }}
          >
            Sin tareas.
          </p>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ag-space-1)',
              maxHeight: '50vh',
              overflowY: 'auto',
            }}
          >
            {activities.map((a) => {
              const isDone = a.status === 'done';
              const isInProgress = a.status === 'in_progress';
              return (
                <li
                  key={a.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto auto',
                    alignItems: 'center',
                    gap: 'var(--ag-space-2)',
                    padding: '8px',
                    backgroundColor: 'var(--ag-bg-elevated)',
                    border: '1px solid var(--ag-rule)',
                    borderRadius: 'var(--ag-radius-base)',
                  }}
                >
                  <span
                    aria-label={isDone ? 'Hecha' : 'Por hacer'}
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: 14,
                      borderRadius: 'var(--ag-radius-xs)',
                      backgroundColor: isDone ? 'var(--ag-ink-primary)' : 'transparent',
                      boxShadow: isDone
                        ? 'inset 0 0 0 1px var(--ag-ink-primary)'
                        : 'inset 0 0 0 1px var(--ag-rule)',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--ag-font-body)',
                      fontSize: 13,
                      color: isDone ? 'var(--ag-ink-hint)' : 'var(--ag-ink-primary)',
                      textDecoration: isDone ? 'line-through' : 'none',
                      fontStyle: isInProgress ? 'italic' : 'normal',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {a.title}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--ag-font-mono)',
                      fontSize: 10,
                      color: 'var(--ag-slate)',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {a.projectLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveFromDay(a.id)}
                    aria-label={`Quitar ${a.title} de este día`}
                    title="Quitar del día"
                    style={{
                      appearance: 'none',
                      background: 'transparent',
                      border: '1px solid var(--ag-rule)',
                      borderRadius: 'var(--ag-radius-base)',
                      padding: '4px 6px',
                      color: 'var(--ag-ink-soft)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: 'var(--ag-font-body)',
                      fontSize: 11,
                    }}
                  >
                    <ArrowLeft size={12} strokeWidth={1.5} />
                    Quitar
                  </button>
                </li>
              );
            })}
          </ul>
        )}

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
            onClick={onClose}
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
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}
