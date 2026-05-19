'use client';

/**
 * usePushSubscription — Push notification subscription management
 *
 * Manages the browser's Push API subscription lifecycle:
 * - Check if push is supported (ServiceWorker + PushManager)
 * - Subscribe: PushManager.subscribe() + POST /api/push/subscribe
 * - Unsubscribe: PushSubscription.unsubscribe() + DELETE /api/push/subscribe
 *
 * @see NOTIF-008
 */

import { useState, useEffect, useCallback } from 'react';
import { useMounted } from '@/lib/hooks/useMounted';

// =============================================================================
// Types
// =============================================================================

/**
 * Browser-level Notification permission state. Mirrors `Notification.permission`,
 * with `'unsupported'` added for environments where the API isn't exposed
 * (jsdom, very old browsers).
 */
export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface UsePushSubscriptionReturn {
  /** Whether the user is currently subscribed to push notifications */
  isSubscribed: boolean;
  /** Whether the browser supports push notifications */
  isSupported: boolean;
  /** Browser-level Notification permission for this origin */
  permission: NotificationPermissionState;
  /** Subscribe to push notifications */
  subscribe: () => Promise<void>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<void>;
  /** Whether a subscribe/unsubscribe operation is in progress */
  isLoading: boolean;
  /** Current error, if any */
  error: Error | null;
}

function readPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  return Notification.permission;
}

// =============================================================================
// Helpers
// =============================================================================

const SW_TIMEOUT_MS = 5000;

/** Wait for the Serwist service worker with timeout to avoid hanging forever */
async function waitForServiceWorker(): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    (async () => {
      // Try to find the specific Serwist SW registration first
      const registrations = await navigator.serviceWorker.getRegistrations();
      const serwistReg = registrations.find((r) => r.active?.scriptURL?.includes('/serwist/sw.js'));
      if (serwistReg) return serwistReg;

      // Fallback to any ready registration
      return navigator.serviceWorker.ready;
    })(),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Service Worker no disponible. Intenta recargar la página.')),
        SW_TIMEOUT_MS
      )
    ),
  ]);
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Manage push notification subscriptions.
 *
 * @example
 * ```tsx
 * function PushToggle() {
 *   const { isSubscribed, isSupported, subscribe, unsubscribe } = usePushSubscription();
 *
 *   if (!isSupported) return <p>Push not supported</p>;
 *
 *   return (
 *     <button onClick={isSubscribed ? unsubscribe : subscribe}>
 *       {isSubscribed ? 'Disable Push' : 'Enable Push'}
 *     </button>
 *   );
 * }
 * ```
 */
export function usePushSubscription(): UsePushSubscriptionReturn {
  const mounted = useMounted();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermissionState>('unsupported');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ── Check support & existing subscription on mount ──────────────────────
  useEffect(() => {
    if (!mounted) return;

    setPermission(readPermission());

    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);

      if (!supported) return;

      try {
        const registration = await waitForServiceWorker();
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch {
        // SW not available — silently continue, push will show as unsupported
      }
    };

    checkSupport();
  }, [mounted]);

  // ── Subscribe ───────────────────────────────────────────────────────────
  const subscribe = useCallback(async () => {
    if (!isSupported) return;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await waitForServiceWorker();

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error('VAPID public key not configured');
      }

      // Request notification permission explicitly BEFORE PushManager.subscribe
      // PushManager.subscribe() may trigger the prompt in some browsers,
      // but Chrome requires explicit requestPermission() for showNotification to work
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        throw new Error('NotificationDenied');
      }

      // Subscribe via PushManager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      // Extract keys
      const keys = subscription.toJSON().keys;
      if (!keys?.p256dh || !keys?.auth) {
        throw new Error('Push subscription missing required keys');
      }

      // Register with server
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: keys.p256dh,
            auth: keys.auth,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Server registration failed: ${res.status}`);
      }

      setIsSubscribed(true);
    } catch (err) {
      const pushError = err instanceof Error ? err : new Error('Failed to subscribe');
      setError(pushError);
      throw pushError;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // ── Unsubscribe ─────────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await waitForServiceWorker();
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unregister from server first
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        // Then unsubscribe from browser
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (err) {
      const pushError = err instanceof Error ? err : new Error('Failed to unsubscribe');
      setError(pushError);
      throw pushError;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    isSubscribed,
    isSupported,
    permission,
    subscribe,
    unsubscribe,
    isLoading,
    error,
  };
}
