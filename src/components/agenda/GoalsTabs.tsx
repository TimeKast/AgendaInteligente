/**
 * GoalsTabs — Quarter | Year | 5-Year | Life tabs for /goals.
 *
 * Tabs are links: ?scope=quarter|year|5year|life
 * 5-Year and Life are disabled (visual: ink-hint, no link, badge "v1.5"/"v2").
 *
 * Active state: 2px bottom border ink-primary + ink-primary text.
 * Inactive: ink-hint, no border.
 */

import Link from 'next/link';

type Tab = { key: string; label: string; disabledLabel?: string };

const TABS: Tab[] = [
  { key: 'quarter', label: 'Quarter' },
  { key: 'year', label: 'Year' },
  { key: '5year', label: '5-Year', disabledLabel: 'v1.5' },
  { key: 'life', label: 'Life', disabledLabel: 'v2' },
];

interface GoalsTabsProps {
  active: string;
}

export function GoalsTabs({ active }: GoalsTabsProps) {
  return (
    <nav
      aria-label="Scope"
      style={{
        display: 'flex',
        gap: 'var(--ag-space-4)',
        paddingInline: 'var(--ag-space-4)',
        borderBottom: '1px solid var(--ag-rule)',
      }}
    >
      {TABS.map((t) => {
        const isActive = t.key === active;
        const disabled = !!t.disabledLabel;

        const inner = (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              paddingBlock: 12,
              borderBottom: isActive ? '2px solid var(--ag-ink-primary)' : '2px solid transparent',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              fontWeight: isActive ? 500 : 400,
              color: disabled
                ? 'var(--ag-ink-hint)'
                : isActive
                  ? 'var(--ag-ink-primary)'
                  : 'var(--ag-ink-soft)',
            }}
          >
            {t.label}
            {disabled ? (
              <span
                style={{
                  fontFamily: 'var(--ag-font-mono)',
                  fontSize: 10,
                  color: 'var(--ag-ink-hint)',
                  letterSpacing: '0.02em',
                }}
              >
                {t.disabledLabel}
              </span>
            ) : null}
          </span>
        );

        if (disabled) {
          return (
            <span
              key={t.key}
              aria-disabled
              style={{ cursor: 'not-allowed', opacity: 0.85 }}
            >
              {inner}
            </span>
          );
        }

        return (
          <Link
            key={t.key}
            href={`/goals?scope=${t.key}`}
            style={{ textDecoration: 'none' }}
          >
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
