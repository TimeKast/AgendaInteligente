/**
 * DeadlineBadge (CMP-112) — inline caption showing how soon an activity is
 * due. Three semantic states based on days-to-deadline:
 *
 *   - > 7 días     → ink-hint, neutral. "Vence en Nd".
 *   - 0..7 días    → warning tone. "vence en Nd" / "vence hoy".
 *   - past (<0)    → danger tone.  "venció hace Nd".
 *
 * Compact caption typography (11px, no all-caps). The badge does NOT carry
 * the project chip's uppercase styling — it's editorial copy, not a label.
 *
 * `today` defaults to the current date but accepts an injectable value so
 * the prototype's frozen "today" (2026-05-22) keeps deterministic output.
 */

interface DeadlineBadgeProps {
  /** ISO YYYY-MM-DD deadline. */
  deadline: string;
  /** Optional "today" reference (ISO YYYY-MM-DD). Defaults to system date. */
  today?: string;
}

function parseIsoToDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = parseIsoToDate(fromIso);
  const to = parseIsoToDate(toIso);
  if (!from || !to) return 0;
  const MS = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / MS);
}

export function DeadlineBadge({ deadline, today }: DeadlineBadgeProps) {
  const todayIso = today ?? toIsoDate(new Date());
  const days = daysBetween(todayIso, deadline);

  let text: string;
  let color: string;

  if (days < 0) {
    const n = Math.abs(days);
    text = n === 1 ? 'venció hace 1d' : `venció hace ${n}d`;
    color = 'var(--ag-danger)';
  } else if (days === 0) {
    text = 'vence hoy';
    color = 'var(--ag-warning)';
  } else if (days <= 3) {
    text = days === 1 ? 'vence en 1d' : `vence en ${days}d`;
    color = 'var(--ag-warning)';
  } else if (days <= 7) {
    text = `Vence en ${days}d`;
    color = 'var(--ag-ink-soft)';
  } else {
    text = `Vence en ${days}d`;
    color = 'var(--ag-ink-hint)';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '1px 6px',
        borderRadius: 'var(--ag-radius-pill)',
        backgroundColor: 'transparent',
        border: `1px solid color-mix(in oklab, ${color}, transparent 65%)`,
        color,
        fontFamily: 'var(--ag-font-body)',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}
