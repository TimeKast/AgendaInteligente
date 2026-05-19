'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

/**
 * PwaUpdateToast — Shows a toast when a new SW version is waiting to activate.
 *
 * With managed updates (skipWaiting:false), the new SW stays in "waiting"
 * state until the user explicitly activates it. This component:
 *
 * 1. Detects `registration.waiting` (SW update ready)
 * 2. Shows "Nueva versión disponible" toast with "Recargar" button
 * 3. On click: sends SKIP_WAITING to the waiting SW → reloads on controllerchange
 *
 * This prevents the classic "tab dies on takeover" problem because the
 * user controls when the new SW activates.
 *
 * SW update detection runs on 4 triggers (long-running mobile PWAs need
 * aggressive checks; the browser's default ~24h interval misses fixes
 * for sessions that never close):
 *
 *   1. Mount               — first render after the component lands.
 *   2. Pathname change     — every client-side route change.
 *   3. Visibility visible  — when the tab returns to foreground.
 *   4. Window focus        — when the window regains focus.
 *
 * Each trigger only calls `registration.update()`, which is idempotent and
 * rate-limited by the browser (~24h cache unless the SW response says
 * `Cache-Control: max-age=0`). Calling it more often is a noop when nothing
 * has changed.
 */
export function PwaUpdateToast() {
  // Skip in dev: Turbopack regenerates the SW on every chunk reload, which
  // makes the "Nueva versión disponible" toast appear constantly during
  // local dev and during Playwright E2E (where it intercepts pointer
  // events on real buttons and causes flaky test failures). Production
  // builds (Vercel deploys) keep the toast wired as designed.
  if (process.env.NODE_ENV === 'development') return null;
  return <PwaUpdateToastInner />;
}

function PwaUpdateToastInner() {
  const toastShown = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const showUpdateToast = (waitingSW: ServiceWorker) => {
      if (toastShown.current) return;
      toastShown.current = true;

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      toast.info('Nueva versión disponible', {
        description: 'Recarga para ver los últimos cambios.',
        action: {
          label: 'Recargar',
          onClick: () => {
            waitingSW.postMessage({ type: 'SKIP_WAITING' });
          },
        },
        duration: Infinity,
      });
    };

    const setupListeners = async () => {
      try {
        if (!navigator.serviceWorker.controller) return;

        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

        if (registration.waiting) {
          showUpdateToast(registration.waiting);
          return;
        }

        if (registration.installing) {
          registration.installing.addEventListener('statechange', (e) => {
            const sw = e.target as ServiceWorker;
            if (sw.state === 'installed' && registration.waiting) {
              showUpdateToast(registration.waiting);
            }
          });
        }

        registration.addEventListener('updatefound', () => {
          const newSW = registration.installing;
          if (!newSW) return;

          newSW.addEventListener('statechange', (e) => {
            const sw = e.target as ServiceWorker;
            if (sw.state === 'installed' && registration.waiting) {
              showUpdateToast(registration.waiting);
            }
          });
        });
      } catch (err) {
        console.error('[PwaUpdateToast] Error setting up SW listeners:', err);
      }
    };

    setupListeners();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (!navigator.serviceWorker.controller) return;

    navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        reg?.update().catch((err) => {
          console.error('[PwaUpdateToast] update() failed on pathname change:', err);
        });
      })
      .catch((err) => {
        console.error('[PwaUpdateToast] getRegistration() failed:', err);
      });
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const triggerUpdate = async () => {
      if (!navigator.serviceWorker.controller) return;
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        await reg?.update();
      } catch (err) {
        console.error('[PwaUpdateToast] update() failed on lifecycle event:', err);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') triggerUpdate();
    };
    const onFocus = () => triggerUpdate();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return null;
}
