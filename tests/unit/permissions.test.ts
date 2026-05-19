import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  hasPermission,
  requirePermission,
  hasMinimumRole,
  isRouteAllowed,
  ROUTE_ACL,
} from '@/lib/auth/permissions';

// Mock config/roles if needed, but since we updated vitest alias it should resolve.
// Assuming 'admin', 'user', 'super_admin' exist in the system.

describe('RBAC Permissions', () => {
  describe('hasPermission', () => {
    it('allows super_admin to do anything', () => {
      expect(hasPermission('super_admin', 'users', 'delete')).toBe(true);
      expect(hasPermission('super_admin', 'settings', 'update')).toBe(true);
    });

    it('allows admin to manage users', () => {
      expect(hasPermission('admin', 'users', 'create')).toBe(true);
      expect(hasPermission('admin', 'users', 'update')).toBe(true);
      expect(hasPermission('admin', 'users', 'delete')).toBe(true);
    });

    it('denies user from deleting users', () => {
      expect(hasPermission('user', 'users', 'delete')).toBe(false);
    });

    it('returns false for undefined role', () => {
      expect(hasPermission(undefined, 'users', 'read')).toBe(false);
      expect(hasPermission(null, 'users', 'read')).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('does not throw if allowed', () => {
      expect(() => requirePermission('admin', 'users', 'create')).not.toThrow();
    });

    it('throws error if denied', () => {
      expect(() => requirePermission('user', 'users', 'delete')).toThrow(/Permission denied/);
    });
  });

  describe('hasMinimumRole', () => {
    // Assuming hierarchy user < admin < super_admin
    it('returns true if role meets minimum', () => {
      expect(hasMinimumRole('admin', 'admin')).toBe(true);
      expect(hasMinimumRole('super_admin', 'admin')).toBe(true);
    });

    it('returns false if role is lower', () => {
      expect(hasMinimumRole('user', 'admin')).toBe(false);
    });
  });

  describe('isRouteAllowed (Route ACL)', () => {
    describe('with empty ROUTE_ACL (factory default)', () => {
      it('allows all roles when ROUTE_ACL is empty', () => {
        expect(Object.keys(ROUTE_ACL).length).toBe(0);
        expect(isRouteAllowed('/dashboard', 'user')).toBe(true);
        expect(isRouteAllowed('/settings', 'user')).toBe(true);
        expect(isRouteAllowed('/settings/users', 'admin')).toBe(true);
      });

      it('returns false for undefined/null role', () => {
        expect(isRouteAllowed('/dashboard', undefined)).toBe(false);
        expect(isRouteAllowed('/dashboard', null)).toBe(false);
      });

      it('super_admin always passes', () => {
        expect(isRouteAllowed('/anything', 'super_admin')).toBe(true);
      });
    });

    describe('with populated ROUTE_ACL', () => {
      beforeEach(() => {
        // Temporarily populate ROUTE_ACL for testing
        Object.assign(ROUTE_ACL, {
          '/settings/users': ['admin', 'super_admin'],
          '/billing': ['admin', 'super_admin'],
          '/analytics': ['admin'],
        });
      });

      afterEach(() => {
        // Clean up — restore empty ACL
        for (const key of Object.keys(ROUTE_ACL)) {
          delete ROUTE_ACL[key];
        }
      });

      it('allows authorized role to access protected route', () => {
        expect(isRouteAllowed('/settings/users', 'admin')).toBe(true);
        expect(isRouteAllowed('/billing', 'admin')).toBe(true);
      });

      it('denies unauthorized role from protected route', () => {
        expect(isRouteAllowed('/settings/users', 'user')).toBe(false);
        expect(isRouteAllowed('/billing', 'user')).toBe(false);
        expect(isRouteAllowed('/analytics', 'user')).toBe(false);
      });

      it('sub-paths inherit parent ACL restriction', () => {
        // /settings/users/123 should match /settings/users ACL
        expect(isRouteAllowed('/settings/users/abc-123', 'admin')).toBe(true);
        expect(isRouteAllowed('/settings/users/abc-123', 'user')).toBe(false);
        expect(isRouteAllowed('/settings/users/nuevo', 'user')).toBe(false);
      });

      it('unlisted routes remain accessible to all authenticated', () => {
        expect(isRouteAllowed('/dashboard', 'user')).toBe(true);
        expect(isRouteAllowed('/profile', 'user')).toBe(true);
        expect(isRouteAllowed('/settings', 'user')).toBe(true); // /settings != /settings/users
      });

      it('super_admin bypasses all ACL restrictions', () => {
        expect(isRouteAllowed('/settings/users', 'super_admin')).toBe(true);
        expect(isRouteAllowed('/billing', 'super_admin')).toBe(true);
        expect(isRouteAllowed('/analytics', 'super_admin')).toBe(true);
      });
    });
  });
});
