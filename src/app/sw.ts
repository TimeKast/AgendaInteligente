/// <reference lib="webworker" />

/**
 * Service Worker — Serwist + Push Notifications
 *
 * Combined service worker that handles:
 * - Precaching & runtime caching via Serwist (PWA offline support)
 * - Push notification display (native OS notifications)
 * - Notification click handling (deep links to app)
 *
 * IMPORTANT — Caching safety rules for Next.js App Router:
 * 1. NEVER cache navigations (HTML documents). Next.js uses streaming SSR
 *    and cached document responses break hydration / RSC state.
 * 2. NEVER cache RSC payloads (requests with `RSC: 1` header). Stale RSC
 *    payloads cause a fatal mismatch between server & client component trees.
 * 3. NEVER cache /api/* routes. These include the notifications poll
 *    endpoint, server actions, auth callbacks, etc. — all must hit network.
 * 4. NEVER cache Next.js server actions (POST with `Next-Action` header).
 * 5. Only cache truly immutable/static assets: fonts, images, _next/static/*.
 *
 * @see NOTIF-007 (push notifications)
 */

import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { CacheFirst, ExpirationPlugin, NetworkFirst, Serwist, StaleWhileRevalidate } from 'serwist';

// =============================================================================
// SKIP_WAITING Message Listener (Managed Updates)
// =============================================================================
// The PwaUpdateToast component sends this message when the user clicks
// "Recargar". This activates the waiting SW under user control.

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[sw] SKIP_WAITING received, activating new SW');
    self.skipWaiting();
  }
});

// =============================================================================
// Serwist Global Types
// =============================================================================

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Force SW update detection: bump this on each release.
// In production, replace with a CI/CD build ID or git commit hash.
const SW_VERSION = '1.0';
console.log('[sw] version:', SW_VERSION);

// =============================================================================
// Safe Runtime Caching — Static assets only
// =============================================================================
// Only cache things that are genuinely safe to cache. Everything else
// (navigations, RSC, API, server actions) MUST go to the network.

const safeRuntimeCaching = [
  // ── IMPORTANT: NO firewall / catch-all rules ──
  // We intentionally do NOT handle navigations, RSC, API, or POST requests.
  // If no runtimeCaching rule matches, Serwist passes the request through
  // to the browser natively (no respondWith() called).
  //
  // This is critical because NetworkOnly handlers REJECT when the server
  // is unreachable (e.g. during restart), causing "no-response" errors
  // that kill the page. By not matching, the browser handles this
  // gracefully with its own retry/error behavior.
  //
  // The caching rules below only match genuinely cacheable static assets.
  // Everything else (HTML, RSC, /api/*, POST) is never touched by the SW.

  // ── Google Fonts (webfont files — immutable once published) ──
  {
    matcher: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
    handler: new CacheFirst({
      cacheName: 'google-fonts-webfonts',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60,
          maxAgeFrom: 'last-used' as const,
        }),
      ],
    }),
  },
  // ── Google Fonts (stylesheets — can change) ──
  {
    matcher: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
    handler: new StaleWhileRevalidate({
      cacheName: 'google-fonts-stylesheets',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60,
          maxAgeFrom: 'last-used' as const,
        }),
      ],
    }),
  },
  // ── Local font files ──
  {
    matcher: /\.(?:eot|otf|ttc|ttf|woff|woff2|font\.css)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: 'static-font-assets',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60,
          maxAgeFrom: 'last-used' as const,
        }),
      ],
    }),
  },
  // ── Images (same-origin + external) ──
  {
    matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: 'static-image-assets',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60,
          maxAgeFrom: 'last-used' as const,
        }),
      ],
    }),
  },
  // ── Next.js static JS bundles — HANDLED BY PRECACHE ──
  // /_next/static/*.js is already in the precache manifest (content-hashed).
  // No runtime caching rule needed — avoids duplicate cache surface.
  // ── Next.js optimized images (NetworkFirst for safety) ──
  // Use NetworkFirst to avoid serving stale/broken auth-signed images.
  // Only fall back to cache if offline.
  {
    matcher: /\/_next\/image\?url=.+$/i,
    handler: new NetworkFirst({
      cacheName: 'next-image',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60,
          maxAgeFrom: 'last-used' as const,
        }),
      ],
    }),
  },
  // ── CSS ──
  {
    matcher: /\.(?:css|less)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: 'static-style-assets',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
          maxAgeFrom: 'last-used' as const,
        }),
      ],
    }),
  },
];

// =============================================================================
// Serwist Instance — Precaching & Safe Runtime Caching
// =============================================================================

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // MANAGED UPDATES: SW nuevo espera en "waiting" hasta que el usuario
  // presione "Recargar" en el toast → envía SKIP_WAITING → self.skipWaiting().
  // Esto PREVIENE el takeover inmediato que rompe tabs con mezcla de bundles.
  skipWaiting: false,
  clientsClaim: false,
  // navigationPreload DISABLED — incompatible with "don't cache navigations".
  navigationPreload: false,
  runtimeCaching: safeRuntimeCaching,
});

serwist.addEventListeners();

// =============================================================================
// Push Notification Defaults
// =============================================================================

/** Default notification icon (matches manifest icon-192) */
const DEFAULT_ICON = '/pwa/icon-192.png';

/** Default notification badge */
const DEFAULT_BADGE = '/pwa/icon-192.png';

/** Default URL when no deep link is provided */
const DEFAULT_URL = '/notifications';

// =============================================================================
// Push Payload Type
// =============================================================================

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
  icon?: string;
  badge?: string;
}

// =============================================================================
// Push Event — Show native notification
// =============================================================================

/**
 * Handle incoming push messages from the server.
 *
 * Extracts JSON payload and displays a native OS notification
 * using the Service Worker registration.
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload: PushPayload;

  try {
    payload = event.data.json() as PushPayload;
  } catch {
    // If payload is not JSON, use it as plain text body
    payload = {
      title: 'Nueva notificación',
      body: event.data.text(),
    };
  }

  const {
    title = 'Nueva notificación',
    body = '',
    url,
    icon = DEFAULT_ICON,
    badge = DEFAULT_BADGE,
  } = payload;

  // Use unique tag per notification so they stack instead of replacing each other.
  // Date.now() ensures each notification gets its own OS-level entry.
  const options: NotificationOptions = {
    body,
    icon,
    badge,
    data: { url: url || DEFAULT_URL },
    tag: `push-${Date.now()}`,
  };

  console.log('[sw] push received, showing notification:', title);
  event.waitUntil(self.registration.showNotification(title, options));
});

// =============================================================================
// Notification Click — Focus + PostMessage (safe navigation)
// =============================================================================

/**
 * Handle notification click events.
 *
 * Strategy: find an existing app tab, focus it, and send a postMessage
 * with the target URL. The client-side listener (sw-listener.ts) handles
 * the actual navigation via window.location — this keeps the SW completely
 * out of the navigation path, avoiding state corruption from mixed bundles.
 *
 * Fallback: if no client window exists, open a new one with openWindow().
 */
self.addEventListener('notificationclick', (event) => {
  // Close the notification
  event.notification.close();

  const targetUrl: string = (event.notification.data && event.notification.data.url) || DEFAULT_URL;
  // Build absolute URL for openWindow fallback
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  console.log('[sw] notification clicked, target:', absoluteUrl);

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(async (clientList: readonly WindowClient[]) => {
        console.log('[sw] found', clientList.length, 'open windows');

        // Try to reuse an existing tab — focus it and let the client navigate
        for (const client of clientList) {
          if ('focus' in client) {
            console.log('[sw] reusing existing window, posting SW_NAVIGATE');
            await client.focus();
            client.postMessage({ type: 'SW_NAVIGATE', url: targetUrl });
            return;
          }
        }

        // No existing window — open a fresh one
        console.log('[sw] no open windows, opening new window');
        return self.clients.openWindow(absoluteUrl);
      })
  );
});
