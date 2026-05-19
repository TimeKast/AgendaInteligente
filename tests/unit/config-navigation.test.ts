/**
 * Navigation Configuration Tests
 *
 * Tests for src/config/navigation.ts — filtering, bottom nav, more sheet.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock lucide-react icons (they're React components)
vi.mock('lucide-react', () => ({
  Home: 'HomeIcon',
  Settings: 'SettingsIcon',
  Layers: 'LayersIcon',
  UserCircle: 'UserCircleIcon',
  Bell: 'BellIcon',
  Wrench: 'WrenchIcon',
  Users: 'UsersIcon',
}));

// Mock env
vi.mock('@/lib/env', () => ({
  getEnv: () => ({
    NEXT_PUBLIC_APP_NAME: 'TestApp',
    NEXT_PUBLIC_APP_URL: 'https://test.example.com',
  }),
}));

import {
  navigation,
  filterNavigationByRole,
  getBottomNavItems,
  getMoreSheetItems,
  type NavItem,
} from '@/config/navigation';

describe('Navigation Configuration', () => {
  describe('navigation array', () => {
    it('is defined and non-empty', () => {
      expect(navigation).toBeDefined();
      expect(navigation.length).toBeGreaterThan(0);
    });

    it('each item has name, href, and icon', () => {
      for (const item of navigation) {
        expect(item.name).toBeDefined();
        expect(item.href).toBeDefined();
        expect(item.icon).toBeDefined();
      }
    });

    it('has Dashboard as first item', () => {
      expect(navigation[0].name).toBe('Dashboard');
      expect(navigation[0].href).toBe('/dashboard');
    });
  });

  describe('filterNavigationByRole', () => {
    const testItems: NavItem[] = [
      { name: 'Public', href: '/public', icon: 'Icon' as unknown as NavItem['icon'] },
      {
        name: 'Admin Only',
        href: '/admin',
        icon: 'Icon' as unknown as NavItem['icon'],
        roles: ['admin', 'super_admin'],
      },
      {
        name: 'BottomOnly',
        href: '/bottom',
        icon: 'Icon' as unknown as NavItem['icon'],
        bottomNavOnly: true,
      },
      {
        name: 'Settings',
        href: '/settings',
        icon: 'Icon' as unknown as NavItem['icon'],
        collapsible: true,
        roles: ['admin'],
        children: [
          {
            name: 'General',
            href: '/settings/general',
            icon: 'Icon' as unknown as NavItem['icon'],
            roles: ['admin'],
          },
        ],
      },
    ];

    it('shows items without roles to all users', () => {
      const result = filterNavigationByRole(testItems, 'user');
      expect(result.some((i) => i.name === 'Public')).toBe(true);
    });

    it('excludes bottomNavOnly items', () => {
      const result = filterNavigationByRole(testItems, 'user');
      expect(result.some((i) => i.name === 'BottomOnly')).toBe(false);
    });

    it('shows role-restricted items to matching roles', () => {
      const result = filterNavigationByRole(testItems, 'admin');
      expect(result.some((i) => i.name === 'Admin Only')).toBe(true);
    });

    it('hides role-restricted items from non-matching roles', () => {
      const result = filterNavigationByRole(testItems, 'user');
      expect(result.some((i) => i.name === 'Admin Only')).toBe(false);
    });

    it('removes collapsible items with no visible children', () => {
      const result = filterNavigationByRole(testItems, 'user');
      expect(result.some((i) => i.name === 'Settings')).toBe(false);
    });

    it('keeps collapsible items with visible children', () => {
      const result = filterNavigationByRole(testItems, 'admin');
      expect(result.some((i) => i.name === 'Settings')).toBe(true);
    });

    it('handles undefined userRole', () => {
      const result = filterNavigationByRole(testItems);
      expect(result.some((i) => i.name === 'Public')).toBe(true);
      expect(result.some((i) => i.name === 'Admin Only')).toBe(false);
    });
  });

  describe('getBottomNavItems', () => {
    const testItems: NavItem[] = [
      {
        name: 'A',
        href: '/a',
        icon: 'I' as unknown as NavItem['icon'],
        bottomNav: true,
        bottomNavOrder: 3,
      },
      {
        name: 'B',
        href: '/b',
        icon: 'I' as unknown as NavItem['icon'],
        bottomNav: true,
        bottomNavOrder: 1,
      },
      { name: 'C', href: '/c', icon: 'I' as unknown as NavItem['icon'], bottomNav: false },
      {
        name: 'D',
        href: '/d',
        icon: 'I' as unknown as NavItem['icon'],
        bottomNav: true,
        bottomNavOrder: 2,
      },
      {
        name: 'E',
        href: '/e',
        icon: 'I' as unknown as NavItem['icon'],
        bottomNav: true,
        bottomNavOrder: 4,
      },
      {
        name: 'F',
        href: '/f',
        icon: 'I' as unknown as NavItem['icon'],
        bottomNav: true,
        bottomNavOrder: 5,
      },
    ];

    it('returns only bottomNav items', () => {
      const result = getBottomNavItems(testItems);
      expect(result.every((i) => i.bottomNav)).toBe(true);
    });

    it('returns max 4 items', () => {
      const result = getBottomNavItems(testItems);
      expect(result.length).toBeLessThanOrEqual(4);
    });

    it('sorts by bottomNavOrder', () => {
      const result = getBottomNavItems(testItems);
      expect(result[0].name).toBe('B');
      expect(result[1].name).toBe('D');
      expect(result[2].name).toBe('A');
      expect(result[3].name).toBe('E');
    });

    it('filters by role', () => {
      const roleItems: NavItem[] = [
        {
          name: 'Admin',
          href: '/a',
          icon: 'I' as unknown as NavItem['icon'],
          bottomNav: true,
          roles: ['admin'],
        },
        { name: 'Public', href: '/p', icon: 'I' as unknown as NavItem['icon'], bottomNav: true },
      ];
      const result = getBottomNavItems(roleItems, 'user');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Public');
    });
  });

  describe('getMoreSheetItems', () => {
    it('returns role-filtered items', () => {
      const items: NavItem[] = [
        { name: 'Public', href: '/pub', icon: 'I' as unknown as NavItem['icon'] },
        {
          name: 'Admin',
          href: '/admin',
          icon: 'I' as unknown as NavItem['icon'],
          roles: ['admin'],
        },
      ];
      const result = getMoreSheetItems(items, 'user');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Public');
    });

    it('includes all items for admin', () => {
      const items: NavItem[] = [
        { name: 'Public', href: '/pub', icon: 'I' as unknown as NavItem['icon'] },
        {
          name: 'Admin',
          href: '/admin',
          icon: 'I' as unknown as NavItem['icon'],
          roles: ['admin'],
        },
      ];
      const result = getMoreSheetItems(items, 'admin');
      expect(result.length).toBe(2);
    });

    it('removes collapsible with no children for that role', () => {
      const items: NavItem[] = [
        {
          name: 'Settings',
          href: '/settings',
          icon: 'I' as unknown as NavItem['icon'],
          collapsible: true,
          children: [
            {
              name: 'Admin Only',
              href: '/admin',
              icon: 'I' as unknown as NavItem['icon'],
              roles: ['admin'],
            },
          ],
        },
      ];
      const result = getMoreSheetItems(items, 'user');
      expect(result.length).toBe(0);
    });
  });
});
