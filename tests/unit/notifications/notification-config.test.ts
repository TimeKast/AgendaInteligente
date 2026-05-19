/**
 * Notification Config — Unit Tests
 *
 * Tests for src/config/notifications.ts
 *
 * @see NOTIF-018
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

const mockEnv: Record<string, string | undefined> = {};

vi.mock('@/lib/env', () => ({
  isNotificationsEnabled: () => {
    const val = mockEnv.NEXT_PUBLIC_NOTIFICATIONS_ENABLED;
    if (val === undefined || val === '') return false;
    return val.toLowerCase() !== 'false' && val !== '0';
  },
  isPushConfigured: () => {
    return !!(mockEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY && mockEnv.VAPID_PRIVATE_KEY);
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Import after mocks
// ─────────────────────────────────────────────────────────────────────────────

import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CONFIG,
  getCategoryIds,
  getCategory,
  isCategoryLocked,
  getDefaultChannels,
  isValidNotificationType,
  isValidChannel,
  isNotificationsEnabled,
  isPushConfigured,
} from '@/config/notifications';

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Notification Config', () => {
  beforeEach(() => {
    // Reset mock env
    Object.keys(mockEnv).forEach((key) => delete mockEnv[key]);
  });

  // ── Constants ───────────────────────────────────────────────────────────

  describe('NOTIFICATION_CATEGORIES', () => {
    it('ships only the general category by default (single-category kit)', () => {
      expect(NOTIFICATION_CATEGORIES).toHaveProperty('general');
      expect(NOTIFICATION_CATEGORIES).not.toHaveProperty('system');
      expect(NOTIFICATION_CATEGORIES).not.toHaveProperty('security');
    });

    it('general is not locked (user can opt out push/email)', () => {
      expect(NOTIFICATION_CATEGORIES.general.locked).toBe(false);
    });

    it('each category has required fields', () => {
      Object.values(NOTIFICATION_CATEGORIES).forEach((cat) => {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('label');
        expect(cat).toHaveProperty('icon');
        expect(cat).toHaveProperty('description');
        expect(cat).toHaveProperty('locked');
        expect(cat).toHaveProperty('defaultChannels');
        expect(Array.isArray(cat.defaultChannels)).toBe(true);
      });
    });
  });

  describe('NOTIFICATION_TYPES', () => {
    it('contains all expected types', () => {
      expect(NOTIFICATION_TYPES.INFO).toBe('info');
      expect(NOTIFICATION_TYPES.SUCCESS).toBe('success');
      expect(NOTIFICATION_TYPES.WARNING).toBe('warning');
      expect(NOTIFICATION_TYPES.ERROR).toBe('error');
      expect(NOTIFICATION_TYPES.SYSTEM).toBe('system');
    });
  });

  describe('NOTIFICATION_CHANNELS', () => {
    it('contains all expected channels', () => {
      expect(NOTIFICATION_CHANNELS.IN_APP).toBe('in_app');
      expect(NOTIFICATION_CHANNELS.PUSH).toBe('push');
      expect(NOTIFICATION_CHANNELS.EMAIL).toBe('email');
    });
  });

  describe('NOTIFICATION_CONFIG', () => {
    it('has retention settings', () => {
      expect(NOTIFICATION_CONFIG.retention.days).toBe(30);
      expect(NOTIFICATION_CONFIG.retention.maxPerUser).toBe(200);
    });
  });

  // ── Utility Functions ──────────────────────────────────────────────────

  describe('getCategoryIds', () => {
    it('returns the shipped category (general)', () => {
      const ids = getCategoryIds();
      expect(ids).toContain('general');
      expect(ids.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getCategory', () => {
    it('returns category by ID', () => {
      const cat = getCategory('general');
      expect(cat?.id).toBe('general');
      expect(cat?.label).toBe('General');
    });

    it('returns undefined for unknown category', () => {
      expect(getCategory('nonexistent')).toBeUndefined();
    });
  });

  describe('isCategoryLocked', () => {
    it('general is not locked', () => {
      expect(isCategoryLocked('general')).toBe(false);
    });

    it('returns false for unknown categories', () => {
      expect(isCategoryLocked('nonexistent')).toBe(false);
    });
  });

  describe('getDefaultChannels', () => {
    it('general defaults to in_app only', () => {
      const channels = getDefaultChannels('general');
      expect(channels).toEqual(['in_app']);
    });

    it('returns [in_app] for unknown category', () => {
      expect(getDefaultChannels('nonexistent')).toEqual(['in_app']);
    });
  });

  describe('isValidNotificationType', () => {
    it('validates known types', () => {
      expect(isValidNotificationType('info')).toBe(true);
      expect(isValidNotificationType('success')).toBe(true);
      expect(isValidNotificationType('warning')).toBe(true);
      expect(isValidNotificationType('error')).toBe(true);
      expect(isValidNotificationType('system')).toBe(true);
    });

    it('rejects unknown types', () => {
      expect(isValidNotificationType('invalid')).toBe(false);
      expect(isValidNotificationType('')).toBe(false);
    });
  });

  describe('isValidChannel', () => {
    it('validates known channels', () => {
      expect(isValidChannel('in_app')).toBe(true);
      expect(isValidChannel('push')).toBe(true);
      expect(isValidChannel('email')).toBe(true);
    });

    it('rejects unknown channels', () => {
      expect(isValidChannel('sms')).toBe(false);
      expect(isValidChannel('')).toBe(false);
    });
  });

  // ── Env Helpers ────────────────────────────────────────────────────────

  describe('isNotificationsEnabled', () => {
    it('returns false by default (env not set)', () => {
      expect(isNotificationsEnabled()).toBe(false);
    });

    it('returns true when enabled', () => {
      mockEnv.NEXT_PUBLIC_NOTIFICATIONS_ENABLED = 'true';
      expect(isNotificationsEnabled()).toBe(true);
    });

    it('returns false when explicitly disabled', () => {
      mockEnv.NEXT_PUBLIC_NOTIFICATIONS_ENABLED = 'false';
      expect(isNotificationsEnabled()).toBe(false);
    });
  });

  describe('isPushConfigured', () => {
    it('returns false when VAPID keys missing', () => {
      expect(isPushConfigured()).toBe(false);
    });

    it('returns true when both VAPID keys present', () => {
      mockEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-public';
      mockEnv.VAPID_PRIVATE_KEY = 'test-private';
      expect(isPushConfigured()).toBe(true);
    });
  });
});
