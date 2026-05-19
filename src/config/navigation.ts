'use client';

import { Home, Settings, UserCircle, Bell, Wrench, Users, type LucideIcon } from 'lucide-react';
import { ROLES } from '@/config/roles';
import { isNotificationsEnabled } from '@/lib/env';

/**
 * Navigation item type used across Sidebar, BottomNav, and BottomNavMoreSheet
 */
export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
  collapsible?: boolean;
  /**
   * Optional: roles that can see this item
   * If not specified, item is visible to all authenticated users
   */
  roles?: string[];
  /**
   * Show this item as a primary tab in the mobile BottomNav.
   * Maximum 4 items — remaining items appear in the "Más" sheet.
   */
  bottomNav?: boolean;
  /**
   * Sort order for BottomNav tabs (lower = leftmost).
   * Only used when `bottomNav: true`.
   */
  bottomNavOrder?: number;
  /**
   * If true, this item only appears in BottomNav, not in the Sidebar.
   * Useful for items like Profile that are already accessible via Sidebar children.
   */
  bottomNavOnly?: boolean;
  /**
   * Override href when rendered in BottomNav (for collapsible parent items
   * whose `href` doesn't have an actual page, e.g. `/settings` → `/settings/general`).
   */
  bottomNavHref?: string;
  /**
   * Short label for BottomNav (max 10 chars recommended).
   * Falls back to `name` if not set. Keep labels concise to avoid
   * truncation or overflow on narrow mobile screens.
   * ⚠️ Se recomienda no poner labels mayores a 10 caracteres.
   */
  bottomNavLabel?: string;
  /**
   * Optional feature flag key. When set, the item is only visible
   * if the corresponding feature is enabled.
   * Currently supported: 'notifications'
   */
  featureFlag?: 'notifications';
}

/**
 * ──────────────────────────────────────────────────────
 * BottomNav Configuration Guide (for AI agents)
 * ──────────────────────────────────────────────────────
 *
 * The mobile BottomNav reads from this same navigation array.
 * To customize which items appear as primary tabs:
 *
 * 1. Set `bottomNav: true` on items you want as primary tabs
 * 2. Set `bottomNavOrder` to control left-to-right position
 * 3. Maximum 4 items — the 5th slot is auto "Más" (more)
 * 4. Items with `roles` are auto-filtered by user role
 * 5. Remaining nav items appear in the "Más" sheet
 * 6. Items marked `// TEMPLATE:` should be removed in production apps
 *
 * See: .claude/skills/sk-navigation/SKILL.md for full guide
 * ──────────────────────────────────────────────────────
 */

/**
 * Main navigation configuration
 * Used by: Sidebar.tsx, BottomNav.tsx, BottomNavMoreSheet.tsx
 */
export const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    bottomNav: true,
    bottomNavOrder: 1,
  },
  {
    name: 'Configuración',
    href: '/settings',
    icon: Settings,
    collapsible: true,
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    bottomNav: true,
    bottomNavOrder: 3,
    bottomNavHref: '/settings/general', // BottomNav links to first child (avoids /settings 404)
    bottomNavLabel: 'Config', // Max 10 chars — full name in Sidebar
    children: [
      {
        name: 'General',
        href: '/settings/general',
        icon: Wrench,
        roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      },
      {
        name: 'Usuarios',
        href: '/settings/users',
        icon: Users,
        roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      },
    ],
  },
  {
    name: 'Perfil',
    href: '/profile',
    icon: UserCircle,
    bottomNav: true,
    bottomNavOrder: 4,
    bottomNavOnly: true, // Hidden from Sidebar (accessed via avatar menu)
  },
  {
    name: 'Notificaciones',
    href: '/notifications',
    icon: Bell,
    featureFlag: 'notifications',
    bottomNavOnly: true, // Hidden from Sidebar (desktop uses header bell)
  },
];

/**
 * Filter navigation items based on user role.
 * Excludes `bottomNavOnly` items (they only appear in BottomNav, not Sidebar).
 */
export function filterNavigationByRole(items: NavItem[], userRole?: string): NavItem[] {
  return items
    .filter((item) => {
      if (item.bottomNavOnly) return false;
      // Feature flag gating
      if (item.featureFlag === 'notifications' && !isNotificationsEnabled()) return false;
      if (!item.roles || item.roles.length === 0) return true;
      return userRole && item.roles.includes(userRole);
    })
    .map((item) => ({
      ...item,
      children: item.children ? filterNavigationByRole(item.children, userRole) : undefined,
    }))
    .filter((item) => {
      if (item.collapsible && (!item.children || item.children.length === 0)) return false;
      return true;
    });
}

/**
 * Get items for the mobile BottomNav (max 4, sorted by bottomNavOrder).
 */
export function getBottomNavItems(items: NavItem[], userRole?: string): NavItem[] {
  return items
    .filter((item) => {
      if (!item.bottomNav) return false;
      if (!item.roles || item.roles.length === 0) return true;
      return userRole && item.roles.includes(userRole);
    })
    .sort((a, b) => (a.bottomNavOrder ?? 99) - (b.bottomNavOrder ?? 99))
    .slice(0, 4);
}

/**
 * Get ALL items for the "Más" (More) sheet, preserving parent-child groups.
 * Returns items with their children intact for grouped/sectioned rendering.
 */
export function getMoreSheetItems(items: NavItem[], userRole?: string): NavItem[] {
  return items
    .filter((item) => {
      // Feature flag gating
      if (item.featureFlag === 'notifications' && !isNotificationsEnabled()) return false;
      if (!item.roles || item.roles.length === 0) return true;
      return userRole && item.roles.includes(userRole);
    })
    .map((item) => ({
      ...item,
      children: item.children ? filterNavigationByRole(item.children, userRole) : undefined,
    }))
    .filter((item) => {
      // Remove collapsible items with no visible children
      if (item.collapsible && (!item.children || item.children.length === 0)) return false;
      return true;
    });
}
