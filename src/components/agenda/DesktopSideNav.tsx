'use client';

/**
 * DesktopSideNav — 240px vertical nav rendered on screens ≥1024px in place of
 * the mobile AgendaBottomNav. Same 5 destinations (Today/Week/Goals/Chat/
 * Settings) plus a small "Configurar" subgroup (Categorías) hinted in the
 * desktop wireframe. Pure prototype — no settings persistence.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Calendar,
  CalendarRange,
  Compass,
  MessageSquare,
  Settings,
  Folder,
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
  { key: 'week', label: 'Week', href: '/week', Icon: CalendarRange },
  { key: 'goals', label: 'Goals', href: '/goals', Icon: Compass },
  { key: 'stats', label: 'Stats', href: '/stats', Icon: BarChart3 },
  { key: 'chat', label: 'Chat', href: '/chat', Icon: MessageSquare },
  { key: 'settings', label: 'Settings', href: '/settings', Icon: Settings },
];

const SECONDARY: NavItem[] = [
  { key: 'categories', label: 'Categorías', href: '/categories', Icon: Folder },
];

function isActive(pathname: string, href: string) {
  if (href === '/today') return pathname === '/today';
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
      <hr
        style={{
          margin: '12px 8px',
          border: 'none',
          borderTop: '1px solid var(--ag-rule)',
        }}
      />
      <NavList items={SECONDARY} pathname={pathname} />
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
              <Icon size={18} strokeWidth={1.5} aria-hidden />
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
