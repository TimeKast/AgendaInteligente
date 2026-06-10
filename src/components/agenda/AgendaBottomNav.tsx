'use client';

/**
 * AgendaBottomNav — responsive primary nav.
 *
 * Mobile (<768px): horizontal bottom nav.
 * Desktop (>=768px): fixed left icon sidebar/rail. This preserves the desktop
 * interaction Teddy asked for: icons live in the sidebar, not at the bottom.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  CalendarRange,
  Compass,
  LayoutDashboard,
  ListChecks,
  Settings,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  key: string;
  label: string;
  href: string;
  Icon: LucideIcon;
}

const ITEMS: NavItem[] = [
  { key: 'resumen', label: 'Resumen', href: '/resumen', Icon: LayoutDashboard },
  { key: 'today', label: 'Today', href: '/today', Icon: Calendar },
  { key: 'week', label: 'Plan', href: '/week', Icon: CalendarRange },
  { key: 'tasks', label: 'Tasks', href: '/tasks', Icon: ListChecks },
  { key: 'goals', label: 'Goals', href: '/goals', Icon: Compass },
  { key: 'settings', label: 'Settings', href: '/settings', Icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === '/today') return pathname === '/today';
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

const RESPONSIVE_CSS = `
[data-theme='agenda'] .ag-bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  background-color: var(--ag-bg);
  border-top: 1px solid var(--ag-rule);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

[data-theme='agenda'] .ag-bottom-nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(${ITEMS.length}, 1fr);
  height: 64px;
}

[data-theme='agenda'] .ag-bottom-nav-li {
  display: flex;
  min-width: 0;
}

[data-theme='agenda'] .ag-bottom-nav-item {
  flex: 1;
  height: 100%;
  min-width: 0;
  background: transparent;
  border: none;
  border-top: 2px solid transparent;
  color: var(--ag-ink-hint);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  font-family: var(--ag-font-body);
  text-decoration: none;
  transition: color var(--ag-duration-base) var(--ag-ease), background-color var(--ag-duration-base) var(--ag-ease), border-color var(--ag-duration-base) var(--ag-ease);
  padding-inline: 2px;
}

[data-theme='agenda'] .ag-bottom-nav-item[data-active='true'] {
  background: var(--ag-bg-elevated);
  border-top-color: var(--ag-ink-primary);
  color: var(--ag-ink-primary);
}

[data-theme='agenda'] .ag-bottom-nav-label {
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.02em;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

[data-theme='agenda'] .ag-bottom-nav-item[data-active='true'] .ag-bottom-nav-label {
  font-weight: 500;
}

@media (min-width: 768px) {
  [data-theme='agenda'] .ag-bottom-nav {
    top: 0;
    right: auto;
    bottom: 0;
    width: 84px;
    border-top: 0;
    border-right: 1px solid var(--ag-rule);
    padding-bottom: 0;
    padding-top: calc(var(--ag-space-4) + env(safe-area-inset-top, 0px));
  }

  [data-theme='agenda'] .ag-bottom-nav-list {
    height: auto;
    display: flex;
    flex-direction: column;
    gap: var(--ag-space-2);
    padding: var(--ag-space-2);
  }

  [data-theme='agenda'] .ag-bottom-nav-li {
    min-width: auto;
  }

  [data-theme='agenda'] .ag-bottom-nav-item {
    flex: none;
    width: 100%;
    min-height: 64px;
    border-top: 0;
    border-left: 2px solid transparent;
    border-radius: calc(var(--ag-radius-base) + 2px);
    gap: 4px;
    padding: var(--ag-space-2) 4px;
  }

  [data-theme='agenda'] .ag-bottom-nav-item[data-active='true'] {
    border-left-color: var(--ag-ink-primary);
  }

  [data-theme='agenda'] .ag-bottom-nav-label {
    font-size: 10px;
    letter-spacing: 0.01em;
  }
}
`;

export function AgendaBottomNav() {
  const pathname = usePathname() ?? '/today';

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>
      <nav className="ag-bottom-nav" aria-label="Navegación principal">
        <ul className="ag-bottom-nav-list">
          {ITEMS.map(({ key, label, href, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={key} className="ag-bottom-nav-li">
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className="ag-bottom-nav-item"
                  data-active={active ? 'true' : 'false'}
                >
                  <Icon size={22} strokeWidth={1.5} aria-hidden />
                  <span className="ag-bottom-nav-label">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
