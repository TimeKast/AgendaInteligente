/**
 * Roles Configuration Tests
 *
 * Tests for src/config/roles.ts — role hierarchy, utilities, display, and badge styles.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock env (roles.ts doesn't need it, but some imports might)
vi.mock('@/lib/env', () => ({
  getEnv: () => ({
    NEXT_PUBLIC_APP_NAME: 'TestApp',
    NEXT_PUBLIC_APP_URL: 'https://test.example.com',
  }),
}));

import {
  ROLES,
  ROLE_HIERARCHY,
  getRoleLevel,
  hasRoleOrHigher,
  isValidRole,
  getDefaultRole,
  isSuperAdmin,
  getRoleDisplayName,
  getAssignableRoles,
  getRoleStyle,
} from '@/config/roles';

describe('Roles Configuration', () => {
  describe('ROLES constant', () => {
    it('defines SUPER_ADMIN, ADMIN, USER', () => {
      expect(ROLES.SUPER_ADMIN).toBe('super_admin');
      expect(ROLES.ADMIN).toBe('admin');
      expect(ROLES.USER).toBe('user');
    });
  });

  describe('ROLE_HIERARCHY', () => {
    it('is defined and non-empty', () => {
      expect(ROLE_HIERARCHY).toBeDefined();
      expect(ROLE_HIERARCHY.length).toBeGreaterThanOrEqual(3);
    });

    it('has super_admin at highest privilege (index 0)', () => {
      expect(ROLE_HIERARCHY[0]).toBe('super_admin');
    });

    it('has user at lowest privilege (last index)', () => {
      expect(ROLE_HIERARCHY[ROLE_HIERARCHY.length - 1]).toBe('user');
    });
  });

  describe('getRoleLevel', () => {
    it('returns 0 for super_admin (highest)', () => {
      expect(getRoleLevel('super_admin')).toBe(0);
    });

    it('returns 1 for admin', () => {
      expect(getRoleLevel('admin')).toBe(1);
    });

    it('returns 2 for user', () => {
      expect(getRoleLevel('user')).toBe(2);
    });

    it('returns -1 for unknown role', () => {
      expect(getRoleLevel('hacker')).toBe(-1);
    });
  });

  describe('hasRoleOrHigher', () => {
    it('admin >= user is true', () => {
      expect(hasRoleOrHigher('admin', 'user')).toBe(true);
    });

    it('user >= admin is false', () => {
      expect(hasRoleOrHigher('user', 'admin')).toBe(false);
    });

    it('super_admin >= admin is true', () => {
      expect(hasRoleOrHigher('super_admin', 'admin')).toBe(true);
    });

    it('same role equals itself', () => {
      expect(hasRoleOrHigher('admin', 'admin')).toBe(true);
    });

    it('invalid role returns false', () => {
      expect(hasRoleOrHigher('hacker', 'user')).toBe(false);
    });
  });

  describe('isValidRole', () => {
    it('returns true for valid roles', () => {
      expect(isValidRole('super_admin')).toBe(true);
      expect(isValidRole('admin')).toBe(true);
      expect(isValidRole('user')).toBe(true);
    });

    it('returns false for invalid roles', () => {
      expect(isValidRole('invalid')).toBe(false);
      expect(isValidRole('ADMIN')).toBe(false);
      expect(isValidRole('')).toBe(false);
    });
  });

  describe('getDefaultRole', () => {
    it('returns user (lowest privilege)', () => {
      expect(getDefaultRole()).toBe('user');
    });
  });

  describe('isSuperAdmin', () => {
    it('returns true for super_admin', () => {
      expect(isSuperAdmin('super_admin')).toBe(true);
    });

    it('returns false for admin', () => {
      expect(isSuperAdmin('admin')).toBe(false);
    });

    it('returns false for user', () => {
      expect(isSuperAdmin('user')).toBe(false);
    });
  });

  describe('getRoleDisplayName', () => {
    it('returns display name for super_admin', () => {
      expect(getRoleDisplayName('super_admin')).toBe('Super Admin');
    });

    it('returns display name for admin', () => {
      expect(getRoleDisplayName('admin')).toBe('Administrador');
    });

    it('returns display name for user', () => {
      expect(getRoleDisplayName('user')).toBe('Usuario');
    });

    it('returns raw role string for unknown role', () => {
      expect(getRoleDisplayName('custom_role')).toBe('custom_role');
    });
  });

  describe('getAssignableRoles', () => {
    it('super_admin can assign all roles', () => {
      const roles = getAssignableRoles('super_admin');
      expect(roles).toContain('super_admin');
      expect(roles).toContain('admin');
      expect(roles).toContain('user');
    });

    it('admin can assign admin and user', () => {
      const roles = getAssignableRoles('admin');
      expect(roles).toContain('admin');
      expect(roles).toContain('user');
      expect(roles).not.toContain('super_admin');
    });

    it('user cannot assign any roles', () => {
      expect(getAssignableRoles('user')).toEqual([]);
    });

    it('invalid role cannot assign', () => {
      expect(getAssignableRoles('hacker')).toEqual([]);
    });
  });

  describe('getRoleStyle', () => {
    it('returns style for known role', () => {
      const style = getRoleStyle('super_admin');
      expect(style.badge).toBeDefined();
      expect(style.dot).toBeDefined();
      expect(style.text).toBeDefined();
    });

    it('returns default style for unknown role', () => {
      const style = getRoleStyle('unknown');
      expect(style.badge).toContain('slate');
    });
  });
});
