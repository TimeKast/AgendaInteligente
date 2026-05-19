/**
 * Tests for super-admin utilities
 *
 * Tests the role-based super admin detection.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the roles config
vi.mock('@/config/roles', () => ({
  isSuperAdmin: (role: string) => role === 'super_admin',
}));

describe('isUserSuperAdmin', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns true when user has super_admin role', async () => {
    const { isUserSuperAdmin } = await import('@/lib/auth/super-admin');
    expect(isUserSuperAdmin({ role: 'super_admin' })).toBe(true);
  });

  it('returns false when user has admin role', async () => {
    const { isUserSuperAdmin } = await import('@/lib/auth/super-admin');
    expect(isUserSuperAdmin({ role: 'admin' })).toBe(false);
  });

  it('returns false when user has user role', async () => {
    const { isUserSuperAdmin } = await import('@/lib/auth/super-admin');
    expect(isUserSuperAdmin({ role: 'user' })).toBe(false);
  });

  it('returns false when user is null', async () => {
    const { isUserSuperAdmin } = await import('@/lib/auth/super-admin');
    expect(isUserSuperAdmin(null)).toBe(false);
  });

  it('returns false when user is undefined', async () => {
    const { isUserSuperAdmin } = await import('@/lib/auth/super-admin');
    expect(isUserSuperAdmin(undefined)).toBe(false);
  });

  it('returns false when user has no role', async () => {
    const { isUserSuperAdmin } = await import('@/lib/auth/super-admin');
    expect(isUserSuperAdmin({})).toBe(false);
  });
});

describe('logSuperAdminAction', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('delegates to logAuditEvent with super_admin_action event', async () => {
    const mockLogAuditEvent = vi.fn().mockResolvedValue(undefined);

    vi.doMock('@/lib/audit', () => ({
      logAuditEvent: mockLogAuditEvent,
    }));

    // Re-mock dependencies that super-admin.ts needs
    vi.doMock('@/lib/db/drizzle', () => ({ db: {} }));
    vi.doMock('@/lib/db/schema', () => ({ auditLogs: {} }));
    vi.doMock('@/lib/env', () => ({ isDatabaseConfigured: () => false }));

    const { logSuperAdminAction } = await import('@/lib/auth/super-admin');

    await logSuperAdminAction('user-123', 'admin@test.com', 'test_action', { key: 'value' });

    expect(mockLogAuditEvent).toHaveBeenCalledWith({
      event: 'super_admin_action',
      userId: 'user-123',
      email: 'admin@test.com',
      metadata: { action: 'test_action', key: 'value' },
    });
  });
});
