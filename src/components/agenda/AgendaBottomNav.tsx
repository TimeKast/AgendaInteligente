'use client';

/**
 * AgendaBottomNav — horizontal bottom nav, rendered on ALL breakpoints.
 *
 * Items: Today / Plan / Tasks / Goals / Chat / Categorías / Settings.
 * The "Plan" slot covers both /week and /month — the inner WeekMonthTabs
 * toggles between the two.
 *
 * Responsive sizing (handled via the `.ag-bottom-nav` CSS class scoped in this
 * file via a <style jsx global>-equivalent: an inline injected <style> tag):
 *   - Mobile (<768px): 64px tall, icons 16px, label 9px — compact for iPhone SE
 *     baseline (375px / 7 items ≈ 53px per cell).
 *   - Desktop (≥768px): 72px tall, icons 22px, label 13px sentence case —
 *     generous breathing room (≈110px+ per cell at 768px; scales up).
 *
 * Active state: ink-primary text + 2px top border + subtle bg-elevated fill.
 * NO blue accent — strictly warm-book tokens. Lucide icons stroke 1.5.
 * Active route inferred from `usePathname()`. Each item is a `<Link>`.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  CalendarRange,
  Compass,
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

// Responsive sizing via a scoped style tag. Inline `style` can't host media
// queries; this keeps everything in the component file without touching
// globals.css. Two icon instances (compact + generous) toggled by viewport.
const RESPONSIVE_CSS = `
[data-theme='agenda'] .ag-bottom-nav-list { height: 64px; }
[data-theme='agenda'] .ag-bottom-nav-icon-desktop { display: none; }
[data-theme='agenda'] .ag-bottom-nav-icon-mobile { display: inline-flex; }
[data-theme='agenda'] .ag-bottom-nav-label { font-size: 9px; }
@media (min-width: 768px) {
  [data-theme='agenda'] .ag-bottom-nav-list { height: 72px; }
  [data-theme='agenda'] .ag-bottom-nav-icon-desktop { display: inline-flex; }
  [data-theme='agenda'] .ag-bottom-nav-icon-mobile { display: none; }
  [data-theme='agenda'] .ag-bottom-nav-label { font-size: 13px; letter-spacing: 0.01em; }
  [data-theme='agenda'] .ag-bottom-nav-item { gap: 4px; }
}
`;

export function AgendaBottomNav() {
  const pathname = usePathname() ?? '/today';

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>
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
          className="ag-bottom-nav-list"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${ITEMS.length}, 1fr)`,
          }}
        >
          {ITEMS.map(({ key, label, href, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={key} style={{ display: 'flex', minWidth: 0 }}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className="ag-bottom-nav-item"
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
                  <span aria-hidden className="ag-bottom-nav-icon-mobile">
                    <Icon size={16} strokeWidth={1.5} />
                  </span>
                  <span aria-hidden className="ag-bottom-nav-icon-desktop">
                    <Icon size={22} strokeWidth={1.5} />
                  </span>
                  <span
                    className="ag-bottom-nav-label"
                    style={{
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
    </>
  );
}
