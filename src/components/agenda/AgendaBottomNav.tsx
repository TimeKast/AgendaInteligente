'use client';

/**
 * AgendaBottomNav — 64px tall, 5-item bottom navigation (mobile).
 *
 * Items: Today / Week / Goals / Chat / Settings.
 * Active state: ink-primary text + 2px top border + subtle bg-elevated fill.
 * NO blue accent — strictly warm-book tokens. Lucide icons stroke 1.5.
 *
 * Active route inferred from `usePathname()`. Each item is a `<Link>`.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, CalendarRange, Compass, MessageSquare, Settings } from 'lucide-react';
import type { ComponentType } from 'react';

interface NavItem {
  key: string;
  label: string;
  href: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}

const ITEMS: NavItem[] = [
  { key: 'today', label: 'Today', href: '/today', Icon: Calendar },
  { key: 'week', label: 'Week', href: '/week', Icon: CalendarRange },
  { key: 'goals', label: 'Goals', href: '/goals', Icon: Compass },
  { key: 'chat', label: 'Chat', href: '/chat', Icon: MessageSquare },
  { key: 'settings', label: 'Settings', href: '/settings', Icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === '/today') return pathname === '/today';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AgendaBottomNav() {
  const pathname = usePathname() ?? '/today';

  return (
    <nav
      aria-label="Navegación principal"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        backgroundColor: 'var(--ag-bg)',
        borderTop: '1px solid var(--ag-rule)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          height: 64,
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
        }}
      >
        {ITEMS.map(({ key, label, href, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={key} style={{ display: 'flex' }}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                style={{
                  flex: 1,
                  height: '100%',
                  background: active ? 'var(--ag-bg-elevated)' : 'transparent',
                  border: 'none',
                  borderTop: active ? '2px solid var(--ag-ink-primary)' : '2px solid transparent',
                  color: active ? 'var(--ag-ink-primary)' : 'var(--ag-ink-hint)',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  fontFamily: 'var(--ag-font-body)',
                  textDecoration: 'none',
                  transition: `color var(--ag-duration-base) var(--ag-ease), background-color var(--ag-duration-base) var(--ag-ease)`,
                }}
              >
                <Icon size={20} strokeWidth={1.5} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: active ? 500 : 400,
                    letterSpacing: '0.02em',
                  }}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
