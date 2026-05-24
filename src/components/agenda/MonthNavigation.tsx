'use client';

/**
 * MonthNavigation — prev/next/today controls for the /month screen.
 *
 * Mirrors WeekNavigation but steps by MONTH instead of by week:
 *   - Chevrons step to the previous/next month.
 *   - Serif h2 shows "mes año" (e.g. "mayo 2026").
 *   - "Este mes" button resets to the current month (disabled when already
 *     viewing it).
 *   - Italic serif caption underneath when not viewing the current month
 *     ("Mes pasado", "Próximo mes", "Hace N meses", "En N meses").
 *
 * Pure visual prototype. Locale: es-MX.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthNavigationProps {
  /** First day (00:00) of the month being viewed. */
  monthStart: Date;
  /** Today's date for the offset caption. */
  today: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

const monthYearFmt = new Intl.DateTimeFormat('es-MX', {
  month: 'long',
  year: 'numeric',
});

/** Difference in whole months between two dates (b - a). */
function monthDiff(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function offsetCaption(monthStart: Date, today: Date): string | null {
  const currentMonthStart = firstOfMonth(today);
  const months = monthDiff(currentMonthStart, monthStart);
  if (months === 0) return null;
  if (months === 1) return 'Próximo mes';
  if (months === -1) return 'Mes pasado';
  if (months > 1) return `En ${months} meses`;
  return `Hace ${Math.abs(months)} meses`;
}

/** First day (00:00) of the month containing `d`. */
export function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Add `n` months, returning a new Date pointing at day 1 of that month. */
export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function MonthNavigation({
  monthStart,
  today,
  onPrev,
  onNext,
  onToday,
}: MonthNavigationProps) {
  const caption = offsetCaption(monthStart, today);
  // Capitalize the first letter so "mayo 2026" → "Mayo 2026".
  const raw = monthYearFmt.format(monthStart);
  const title = raw.charAt(0).toUpperCase() + raw.slice(1);

  return (
    <section
      aria-label="Navegación de mes"
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
          ariaLabel="Mes anterior"
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
            minWidth: 160,
            textAlign: 'center',
          }}
        >
          {title}
        </h2>

        <ArrowButton
          ariaLabel="Mes siguiente"
          onClick={onNext}
          icon={<ChevronRight size={20} strokeWidth={1.5} />}
        />

        <button
          type="button"
          onClick={onToday}
          aria-label="Ir al mes actual"
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
          Este mes
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
