'use client';

/**
 * DesktopSideNav — 240px vertical nav rendered on screens ≥1024px in place of
 * the mobile AgendaBottomNav.
 *
 * Order: Today / Plan / Tasks / Goals / Stats / Chat / Categorías / Settings.
 * Categorías sits BEFORE Settings (last functional before the final Settings).
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Calendar,
  CalendarRange,
  Compass,
  FolderTree,
  ListChecks,
  MessageSquare,
  Settings,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  key: string;
  label: string;
  href: string;
  Icon: LucideIcon;
}

const PRIMARY: NavItem[] = [
  { key: 'today', label: 'Today', href: '/today', Icon: Calendar },
  { key: 'week', label: 'Plan', href: '/week', Icon: CalendarRange },
  { key: 'tasks', label: 'Tasks', href: '/tasks', Icon: ListChecks },
  { key: 'goals', label: 'Goals', href: '/goals', Icon: Compass },
  { key: 'stats', label: 'Stats', href: '/stats', Icon: BarChart3 },
  { key: 'chat', label: 'Chat', href: '/chat', Icon: MessageSquare },
  { key: 'categories', label: 'Categorías', href: '/categories', Icon: FolderTree },
  { key: 'settings', label: 'Settings', href: '/settings', Icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === '/today') return pathname === '/today';
  // The Week item also lights up on /month — both share the same nav slot
  // via the WeekMonthTabs toggle inside the pages.
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

export function DesktopSideNav() {
  const pathname = usePathname() ?? '/today';

  return (
    <nav
      aria-label="Navegación principal"
      style={{
        position: 'sticky',
        top: 56, // sits under AgendaHeader (56px sticky)
        alignSelf: 'flex-start',
        width: 240,
        flexShrink: 0,
        height: 'calc(100dvh - 56px)',
        borderRight: '1px solid var(--ag-rule)',
        padding: '12px 8px',
        overflowY: 'auto',
        backgroundColor: 'var(--ag-bg)',
      }}
    >
      <NavList items={PRIMARY} pathname={pathname} />
    </nav>
  );
}

function NavList({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {items.map(({ key, label, href, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={key}>
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 'var(--ag-radius-base)',
                background: active ? 'var(--ag-bg-elevated)' : 'transparent',
                color: active ? 'var(--ag-ink-primary)' : 'var(--ag-ink-soft)',
                fontFamily: 'var(--ag-font-body)',
                fontSize: 14,
                fontWeight: active ? 500 : 400,
                textDecoration: 'none',
                transition: `background-color var(--ag-duration-base) var(--ag-ease), color var(--ag-duration-base) var(--ag-ease)`,
              }}
            >
              <Icon size={20} strokeWidth={1.5} aria-hidden />
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
