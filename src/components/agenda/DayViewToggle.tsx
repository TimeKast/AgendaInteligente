/**
 * DayViewToggle — two-pill toggle ("Hoy" / "Mañana") for the /today page.
 *
 * Drives the `?date=YYYY-MM-DD` query param. We deliberately cap the
 * horizon at +1 day to keep the today screen focused — deeper navigation
 * belongs in /week.
 */

import Link from 'next/link';

interface DayViewToggleProps {
  /** True when the page is currently rendering tomorrow's data. */
  viewingTomorrow: boolean;
}

export function DayViewToggle({ viewingTomorrow }: DayViewToggleProps) {
  return (
    <span
      role="tablist"
      aria-label="Día visible"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-pill)',
        overflow: 'hidden',
        backgroundColor: 'var(--ag-bg)',
      }}
    >
      <Pill href="/today" active={!viewingTomorrow}>
        Hoy
      </Pill>
      <Pill href="/today?date=tomorrow" active={viewingTomorrow}>
        Mañana
      </Pill>
    </span>
  );
}

function Pill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      // `prefetch=false` so the unselected day doesn't eagerly hit the DB
      // just because the user mounted /today.
      prefetch={false}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 14px',
        fontFamily: 'var(--ag-font-body)',
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        color: active ? 'var(--ag-accent-on)' : 'var(--ag-ink-soft)',
        backgroundColor: active ? 'var(--ag-ink-primary)' : 'transparent',
        textDecoration: 'none',
        transition:
          'background-color var(--ag-duration-base) var(--ag-ease), color var(--ag-duration-base) var(--ag-ease)',
      }}
    >
      {children}
    </Link>
  );
}
