'use client';

/**
 * useNotifications — Main notification orchestrator hook
 *
 * Fetches notifications + unread count from /api/notifications/poll on a
 * 30s interval while the tab is visible. Pauses when hidden. Refetches
 * immediately on visibility resume.
 *
 * Why polling instead of SSE:
 * Vercel serverless bills wall-clock time → SSE = 100% utilization per
 * active user. Polling 30s ≈ 1% of that cost. Trade-off: notif latency
 * rises from <5s to up to 30s (avg ~15s), acceptable for in-app notifs.
 *
 * @see /api/notifications/poll
 * @see project/factory/migration-brief-vercel-notifications-2026-04-26.md
 */

import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import {
  markAsRead as markAsReadAction,
  markAllAsRead as markAllAsReadAction,
  deleteNotification as deleteNotificationAction,
} from '@/lib/actions/notifications';

// =============================================================================
// Types
// =============================================================================

export interface Notification {
  id: string;
  title: string;
  body?: string;
  type: string;
  category: string;
  url?: string | null;
  read?: boolean;
  isRead?: boolean;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface UseNotificationsOptions {
  /** Whether the hook is enabled. Default: true */
  enabled?: boolean;
}

export interface UseNotificationsReturn {
  /** Notifications received from the latest poll (newest first) */
  notifications: Notification[];
  /** Current unread notification count */
  unreadCount: number;
  /** Mark a single notification as read */
  markAsRead: (id: string) => void;
  /** Mark all notifications as read */
  markAllAsRead: () => void;
  /** Delete a single notification */
  deleteNotification: (id: string) => void;
  /** Whether the latest poll succeeded (false on network/server error) */
  isConnected: boolean;
  /** Whether a mutation is in progress */
  isPending: boolean;
  /** Re-fetch latest notifications from server (manual trigger) */
  refetchNotifications: () => void;
}

// =============================================================================
// Config
// =============================================================================

const POLL_INTERVAL_MS = 30_000;

interface PollResponse {
  items: Notification[];
  unreadCount: number;
}

// =============================================================================
// Hook
// =============================================================================

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { enabled = true } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [isPending, startTransition] = useTransition();

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchPoll = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const res = await fetch('/api/notifications/poll', { cache: 'no-store' });
      if (!res.ok) {
        setIsConnected(false);
        return;
      }
      const data = (await res.json()) as PollResponse;
      // Normalize createdAt to string (matches the SSE shape consumers expect)
      const items = data.items.map((n) => ({
        ...n,
        createdAt:
          typeof n.createdAt === 'string' ? n.createdAt : new Date(n.createdAt).toISOString(),
      }));
      setNotifications(items);
      setUnreadCount(data.unreadCount);
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const refetchNotifications = useCallback(() => {
    fetchPoll();
  }, [fetchPoll]);

  // ── Polling lifecycle ──────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const start = () => {
      if (pollTimerRef.current) return;
      fetchPoll(); // immediate fetch on (re)start
      pollTimerRef.current = setInterval(fetchPoll, POLL_INTERVAL_MS);
    };

    const stop = () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, fetchPoll]);

  // ── Cross-component invalidation ───────────────────────────────────────
  // The /notifications page dispatches 'notifications:invalidate' after
  // mutations so the bell icon refetches immediately instead of waiting
  // for the next 30s poll tick.
  useEffect(() => {
    if (!enabled) return;
    const handleInvalidate = () => fetchPoll();
    window.addEventListener('notifications:invalidate', handleInvalidate);
    return () => window.removeEventListener('notifications:invalidate', handleInvalidate);
  }, [enabled, fetchPoll]);

  // ── Actions ────────────────────────────────────────────────────────────
  const markAsRead = useCallback((id: string) => {
    startTransition(async () => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await markAsReadAction({ id });
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    startTransition(async () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
      setUnreadCount(0);
      await markAllAsReadAction();
    });
  }, []);

  const deleteNotification = useCallback((id: string) => {
    startTransition(async () => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await deleteNotificationAction({ id });
    });
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isConnected,
    isPending,
    refetchNotifications,
  };
}
