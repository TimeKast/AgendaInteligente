'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import { usePullToRefresh } from '@/lib/pwa/usePullToRefresh';
import { useShellPTR } from '@/lib/pwa/shellPullToRefresh';
import { isMobile } from '@/lib/utils/platform';
import { cn } from '@/lib/utils/cn';

const DEFAULT_THRESHOLD = 80;
const DEFAULT_MAX_PULL = 120;
const REFRESH_TIMEOUT_MS = 2000;

/**
 * PullToRefreshShell — Shell-wide pull-to-refresh primitive.
 *
 * Mounted once at the protected shell level (`DashboardShell`). All
 * routes under the shell inherit the gesture without per-screen wiring.
 *
 * Gate: capability/media-query based (`(pointer: coarse) and (hover: none)`),
 * not UA sniffing. Desktop = noop (no listeners attached).
 *
 * Refresh: hardcoded `router.refresh()` wrapped in `useTransition`. The
 * promise returned to the touch handler resolves when `isPending` settles
 * — never immediately — so the indicator stays visible until the RSC
 * re-render lands. A defensive timeout fires the resolve after
 * `REFRESH_TIMEOUT_MS` if the transition is not observable (e.g. routes
 * that don't suspend).
 *
 * Opt-out: a screen can call `useDisableShellPTR()` (counter-based) to
 * silence the shell while it manages its own refresh callback. Used by
 * `/notifications`, whose data lives in client state and would not be
 * touched by `router.refresh()`.
 */
export function PullToRefreshShell() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // SSR-safe lazy init — reads `isMobile()` once on the client (window guarded).
  const [mobile] = useState(() => isMobile());
  const { disabled } = useShellPTR();
  const pendingResolveRef = useRef<(() => void) | null>(null);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const settle = useCallback(() => {
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
    if (pendingResolveRef.current) {
      pendingResolveRef.current();
      pendingResolveRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isPending && pendingResolveRef.current) settle();
  }, [isPending, settle]);

  useEffect(() => {
    return () => {
      if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
    };
  }, []);

  const onRefresh = useCallback(
    () =>
      new Promise<void>((resolve) => {
        pendingResolveRef.current = resolve;
        startTransition(() => {
          router.refresh();
        });
        pendingTimeoutRef.current = setTimeout(settle, REFRESH_TIMEOUT_MS);
      }),
    [router, settle]
  );

  const enabled = mobile && !disabled;

  const { pullDistance, isPulling, isRefreshing } = usePullToRefresh({
    onRefresh,
    enabled,
    threshold: DEFAULT_THRESHOLD,
    maxPull: DEFAULT_MAX_PULL,
  });

  const progress = pullDistance / DEFAULT_MAX_PULL;
  const showIndicator = isPulling || isRefreshing || isPending;
  const indicatorOpacity =
    isRefreshing || isPending ? 1 : Math.min(1, pullDistance / DEFAULT_THRESHOLD);
  const rotation = isRefreshing || isPending ? 0 : progress * 360;
  const spinning = isRefreshing || isPending;

  return (
    <div
      aria-hidden={!showIndicator}
      className={cn(
        'pointer-events-none fixed inset-x-0 z-50 flex justify-center',
        'transition-opacity duration-150',
        showIndicator ? 'opacity-100' : 'opacity-0'
      )}
      style={{
        top: 'env(safe-area-inset-top, 0px)',
        transform: `translateY(${pullDistance}px)`,
      }}
    >
      <div
        className={cn(
          'mt-2 flex h-10 w-10 items-center justify-center rounded-full',
          'bg-background/90 shadow-md backdrop-blur',
          'text-muted-foreground'
        )}
        style={{ opacity: indicatorOpacity }}
      >
        <RefreshCw
          className={cn('h-5 w-5', spinning && 'motion-safe:animate-spin')}
          style={{
            transform: spinning ? undefined : `rotate(${rotation}deg)`,
            transition: isPulling ? 'none' : 'transform 200ms ease-out',
          }}
        />
      </div>
    </div>
  );
}
