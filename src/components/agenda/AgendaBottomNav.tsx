'use client';

/**
 * AgendaBottomNav — 64px tall, 5-item bottom navigation (mobile).
 *
 * Items: Today / Week / Goals / Chat / Settings.
 * Active state: ink-primary text + 2px top border + subtle bg-elevated fill.
 * NO blue accent — strictly warm-book tokens. Lucide icons stroke 1.5.
 *
 * NOTE: Items don't route in this prototype (only Today exists). They
 * render as buttons so the active visual treatment is demonstrable but
 * pressing them is a no-op (logged to console).
 */

import { Calendar, CalendarRange, Compass, MessageSquare, Settings } from 'lucide-react';
import type { ComponentType } from 'react';

interface NavItem {
  key: string;
  label: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}

const ITEMS: NavItem[] = [
  { key: 'today', label: 'Today', Icon: Calendar },
  { key: 'week', label: 'Week', Icon: CalendarRange },
  { key: 'goals', label: 'Goals', Icon: Compass },
  { key: 'chat', label: 'Chat', Icon: MessageSquare },
  { key: 'settings', label: 'Settings', Icon: Settings },
];

interface AgendaBottomNavProps {
  activeKey?: string;
}

export function AgendaBottomNav({ activeKey = 'today' }: AgendaBottomNavProps) {
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
        {ITEMS.map(({ key, label, Icon }) => {
          const active = key === activeKey;
          return (
            <li key={key} style={{ display: 'flex' }}>
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  console.log(`nav: ${key}`);
                }}
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
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
