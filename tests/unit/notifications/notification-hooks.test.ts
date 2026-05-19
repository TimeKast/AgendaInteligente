/**
 * Notification Hooks — Unit Tests
 *
 * Tests for:
 * - lib/hooks/useNotifications.ts
 * - lib/hooks/usePushSubscription.ts
 *
 * Since RTL is not installed, these tests verify:
 * - Module exports and types
 * - Return shape expectations
 * - Push support detection logic
 *
 * @see NOTIF-018
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks — useNotifications dependencies
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: vi.fn((init: unknown) => [init, vi.fn()]),
    useEffect: vi.fn(),
    useCallback: vi.fn((fn: unknown) => fn),
    useRef: vi.fn((init: unknown) => ({ current: init })),
    useTransition: vi.fn(() => [false, (fn: () => void) => fn()]),
  };
});

vi.mock('@/lib/actions/notifications', () => ({
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
}));

// Polling hook fetches /api/notifications/poll on mount + every 30s while
// the tab is visible. Stub fetch so the hook can be invoked without errors.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [], unreadCount: 0 }),
      })
    )
  );
});

vi.mock('@/lib/hooks/useMounted', () => ({
  useMounted: vi.fn(() => true),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Import after mocks
// ─────────────────────────────────────────────────────────────────────────────

import { useNotifications } from '@/lib/hooks/useNotifications';
import { usePushSubscription } from '@/lib/hooks/usePushSubscription';

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Notification Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── useNotifications ───────────────────────────────────────────────────

  describe('useNotifications', () => {
    it('exports a function', () => {
      expect(typeof useNotifications).toBe('function');
    });

    it('returns the expected shape', () => {
      const result = useNotifications();

      // Check all expected keys exist
      expect(result).toHaveProperty('notifications');
      expect(result).toHaveProperty('unreadCount');
      expect(result).toHaveProperty('markAsRead');
      expect(result).toHaveProperty('markAllAsRead');
      expect(result).toHaveProperty('deleteNotification');
      expect(result).toHaveProperty('isConnected');
      expect(result).toHaveProperty('isPending');
    });

    it('returns functions for markAsRead, markAllAsRead, deleteNotification', () => {
      const result = useNotifications();

      expect(typeof result.markAsRead).toBe('function');
      expect(typeof result.markAllAsRead).toBe('function');
      expect(typeof result.deleteNotification).toBe('function');
    });

    it('initializes with empty notifications', () => {
      const result = useNotifications();
      expect(result.notifications).toEqual([]);
    });

    it('initializes with unreadCount 0', () => {
      const result = useNotifications();
      expect(result.unreadCount).toBe(0);
    });

    it('isConnected defaults to true (polling hook is optimistic until first failure)', () => {
      const result = useNotifications();
      expect(result.isConnected).toBe(true);
    });

    it('isPending starts as false', () => {
      const result = useNotifications();
      expect(result.isPending).toBe(false);
    });
  });

  // ── usePushSubscription ────────────────────────────────────────────────

  describe('usePushSubscription', () => {
    it('exports a function', () => {
      expect(typeof usePushSubscription).toBe('function');
    });

    it('returns the expected shape', () => {
      const result = usePushSubscription();

      expect(result).toHaveProperty('isSubscribed');
      expect(result).toHaveProperty('isSupported');
      expect(result).toHaveProperty('subscribe');
      expect(result).toHaveProperty('unsubscribe');
      expect(result).toHaveProperty('isLoading');
      expect(result).toHaveProperty('error');
    });

    it('returns functions for subscribe and unsubscribe', () => {
      const result = usePushSubscription();

      expect(typeof result.subscribe).toBe('function');
      expect(typeof result.unsubscribe).toBe('function');
    });

    it('initializes isSubscribed as false', () => {
      const result = usePushSubscription();
      expect(result.isSubscribed).toBe(false);
    });

    it('initializes isLoading as false', () => {
      const result = usePushSubscription();
      expect(result.isLoading).toBe(false);
    });

    it('initializes error as null', () => {
      const result = usePushSubscription();
      expect(result.error).toBeNull();
    });

    it('detects lack of PushManager support', () => {
      // In jsdom, neither serviceWorker nor PushManager exist
      const result = usePushSubscription();
      // isSupported should be false since jsdom lacks PushManager
      expect(result.isSupported).toBe(false);
    });
  });
});
