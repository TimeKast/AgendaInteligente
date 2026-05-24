'use client';

/**
 * WeekMonthTabs — small "Semana | Mes" segmented control sitting under the
 * AgendaHeader on `/week` and `/month`.
 *
 * Both pages share the same nav slot (no 7th bottom-nav item). The toggle is
 * the only entry point to switch between the weekly swimlane and the monthly
 * calendar grid. Pure visual — uses next/link so each tap is a hard route
 * change (state lives per-page, not lifted).
 */

import Link from 'next/link';

type Active = 'week' | 'month';

interface WeekMonthTabsProps {
  active: Active;
}

const TABS: { key: Active; label: string; href: string }[] = [
  { key: 'week', label: 'Semana', href: '/week' },
  { key: 'month', label: 'Mes', href: '/month' },
];

export function WeekMonthTabs({ active }: WeekMonthTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Vista de planeación"
      style={{
        display: 'flex',
        justifyContent: 'center',
        paddingInline: 'var(--ag-space-4)',
        paddingTop: 'var(--ag-space-2)',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          padding: 2,
          border: '1px solid var(--ag-rule)',
          borderRadius: 'var(--ag-radius-pill)',
          backgroundColor: 'var(--ag-bg-elevated)',
        }}
      >
        {TABS.map((t) => {
          const isActive = t.key === active;
          return (
            <Link
              key={t.key}
              href={t.href}
              role="tab"
              aria-selected={isActive}
              style={{
                appearance: 'none',
                background: isActive ? 'var(--ag-bg)' : 'transparent',
                border: '1px solid transparent',
                borderRadius: 'var(--ag-radius-pill)',
                padding: '6px 18px',
                minWidth: 84,
                textAlign: 'center',
                fontFamily: 'var(--ag-font-body)',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--ag-ink-primary)' : 'var(--ag-ink-soft)',
                textDecoration: 'none',
                boxShadow: isActive
                  ? '0 1px 2px rgba(42, 40, 38, 0.06)'
                  : 'none',
                cursor: isActive ? 'default' : 'pointer',
                transition:
                  'background-color var(--ag-duration-base) var(--ag-ease), color var(--ag-duration-base) var(--ag-ease)',
              }}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
