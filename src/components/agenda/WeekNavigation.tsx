'use client';

/**
 * WeekNavigation — prev/next/today controls for the Week screen (SCR-021).
 *
 * Visual signature:
 *  - Two chevron buttons surround a serif date range title.
 *  - Small ghost "Hoy" button at the right resets to the current week.
 *  - Italic serif caption underneath when not viewing the current week
 *    (e.g. "Próxima semana", "Semana pasada", "Hace 2 semanas").
 *
 * Pure visual prototype: header text re-renders with the new range but the
 * surrounding week data (DayCard, wins, etc.) is hardcoded by the parent.
 *
 * Locale: es-MX (matches AI-1 LatAm neutral). All formatting via native
 * `Intl.DateTimeFormat` — no date-fns dependency.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekNavigationProps {
  /** Sunday of the week being viewed (BR-7: weeks start on Sunday in user TZ). */
  weekStarting: Date;
  /** Today's date, used to compute the "offset" caption. */
  today: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Strip time-of-day so date diffs are stable across DST shifts. */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

const monthDayFmt = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' });

function formatRange(weekStarting: Date): string {
  const end = addDays(weekStarting, 6);
  // Strip trailing dots that some locales add to abbreviated months ("may." → "may").
  const left = monthDayFmt.format(weekStarting).replace(/\.$/, '');
  const right = monthDayFmt.format(end).replace(/\.$/, '');
  return `${left} — ${right}`;
}

/**
 * Returns the caption shown under the date range, or null if the user is
 * viewing the current week (no caption needed).
 */
function offsetCaption(weekStarting: Date, today: Date): string | null {
  const currentWeekStart = sundayOf(today);
  const diffDays = Math.round(
    (startOfDay(weekStarting).getTime() - startOfDay(currentWeekStart).getTime()) / DAY_MS,
  );
  const weeks = diffDays / 7;
  if (weeks === 0) return null;
  if (weeks === 1) return 'Próxima semana';
  if (weeks === -1) return 'Semana pasada';
  if (weeks > 1) return `En ${weeks} semanas`;
  return `Hace ${Math.abs(weeks)} semanas`;
}

/** Sunday of the given date (BR-7). */
export function sundayOf(d: Date): Date {
  const base = startOfDay(d);
  // getDay(): 0 = Sunday, 1 = Monday, ... 6 = Saturday.
  return addDays(base, -base.getDay());
}

export function WeekNavigation({
  weekStarting,
  today,
  onPrev,
  onNext,
  onToday,
}: WeekNavigationProps) {
  const caption = offsetCaption(weekStarting, today);

  return (
    <section
      aria-label="Navegación de semana"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--ag-space-1)',
        paddingInline: 'var(--ag-space-4)',
        paddingBlock: 'var(--ag-space-3)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--ag-space-2)',
          width: '100%',
        }}
      >
        <ArrowButton
          ariaLabel="Semana anterior"
          onClick={onPrev}
          icon={<ChevronLeft size={20} strokeWidth={1.5} />}
        />

        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontSize: 18,
            fontWeight: 500,
            color: 'var(--ag-ink-primary)',
            letterSpacing: '-0.005em',
            minWidth: 140,
            textAlign: 'center',
          }}
        >
          {formatRange(weekStarting)}
        </h2>

        <ArrowButton
          ariaLabel="Semana siguiente"
          onClick={onNext}
          icon={<ChevronRight size={20} strokeWidth={1.5} />}
        />

        <button
          type="button"
          onClick={onToday}
          aria-label="Ir a la semana actual"
          disabled={caption === null}
          style={{
            appearance: 'none',
            background: 'transparent',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-pill)',
            padding: '4px 10px',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: caption === null ? 'var(--ag-ink-hint)' : 'var(--ag-ink-soft)',
            cursor: caption === null ? 'default' : 'pointer',
            marginLeft: 'var(--ag-space-2)',
            opacity: caption === null ? 0.5 : 1,
          }}
        >
          Hoy
        </button>
      </div>

      {caption ? (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
          }}
        >
          {caption}
        </p>
      ) : null}
    </section>
  );
}

function ArrowButton({
  ariaLabel,
  onClick,
  icon,
}: {
  ariaLabel: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        appearance: 'none',
        background: 'transparent',
        border: 'none',
        borderRadius: 'var(--ag-radius-pill)',
        width: 36,
        height: 36,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ag-ink-soft)',
        cursor: 'pointer',
      }}
    >
      {icon}
    </button>
  );
}
