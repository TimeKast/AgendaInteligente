'use client';

/**
 * AgendaBottomNav — 64px tall, 7-item bottom navigation (mobile).
 *
 * Items: Today / Plan / Tasks / Goals / Chat / Categorías / Settings.
 * The "Plan" slot covers both /week (Semana tab) and /month (Mes tab) —
 * the inner WeekMonthTabs toggles between the two.
 * Stats moved to Settings (accessible as a sub-row).
 * Categorías promoted to top-level nav (sits BEFORE Settings).
 * Active state: ink-primary text + 2px top border + subtle bg-elevated fill.
 * NO blue accent — strictly warm-book tokens. Lucide icons stroke 1.5.
 *
 * 7 items at 375px → ~53px per cell. Icon shrinks to 16px and label to 9px
 * (vs 18/10) to avoid horizontal scroll on iPhone SE baseline.
 *
 * Active route inferred from `usePathname()`. Each item is a `<Link>`.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  CalendarRange,
  Compass,
  FolderTree,
  ListChecks,
  MessageSquare,
  Settings,
} from 'lucide-react';
import type { ComponentType } from 'react';

interface NavItem {
  key: string;
  label: string;
  href: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}

const ITEMS: NavItem[] = [
  { key: 'today', label: 'Today', href: '/today', Icon: Calendar },
  { key: 'week', label: 'Plan', href: '/week', Icon: CalendarRange },
  { key: 'tasks', label: 'Tasks', href: '/tasks', Icon: ListChecks },
  { key: 'goals', label: 'Goals', href: '/goals', Icon: Compass },
  { key: 'chat', label: 'Chat', href: '/chat', Icon: MessageSquare },
  { key: 'categories', label: 'Categorías', href: '/categories', Icon: FolderTree },
  { key: 'settings', label: 'Settings', href: '/settings', Icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === '/today') return pathname === '/today';
  // The Week tab covers both /week and /month — they share a nav slot via
  // the tab toggle inside each page (see WeekMonthTabs).
  if (href === '/week') {
    return (
      pathname === '/week' ||
      pathname.startsWith('/week/') ||
      pathname === '/month' ||
      pathname.startsWith('/month/')
    );
  }
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
          gridTemplateColumns: 'repeat(7, 1fr)',
        }}
      >
        {ITEMS.map(({ key, label, href, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={key} style={{ display: 'flex', minWidth: 0 }}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                style={{
                  flex: 1,
                  height: '100%',
                  minWidth: 0,
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
                  paddingInline: 2,
                }}
              >
                <Icon size={16} strokeWidth={1.5} />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: active ? 500 : 400,
                    letterSpacing: '0.02em',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
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
