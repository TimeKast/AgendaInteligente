'use client';

import { RefreshCw } from 'lucide-react';
import { useState, type ReactNode, type RefObject } from 'react';

import { usePullToRefresh } from '@/lib/pwa/usePullToRefresh';
import { isMobile } from '@/lib/utils/platform';
import { cn } from '@/lib/utils/cn';

interface PullToRefreshProps {
  onRefresh: () => void | Promise<void>;
  children: ReactNode;
  enabled?: boolean;
  threshold?: number;
  maxPull?: number;
  resistance?: number;
  scrollTargetRef?: RefObject<HTMLElement | null>;
  className?: string;
}

const DEFAULT_THRESHOLD = 80;
const DEFAULT_MAX_PULL = 120;
const DEFAULT_RESISTANCE = 2.5;

/**
 * PullToRefresh — Per-screen pull-to-refresh wrapper.
 *
 * Use when a screen owns a custom scroll container that the shell-wide
 * `<PullToRefreshShell>` cannot serve (modal with `overflow-y-auto`,
 * sticky header above an internal scrolling table, page that fetches
 * client-side state and needs an explicit refresh callback).
 *
 * Default gate: `isMobile()` (capability-based — `(pointer: coarse)`).
 * Apps that need PWA-only behaviour pass `enabled={isInstalled}`. An
 * explicit `enabled={true}` overrides the default mobile gate (useful
 * in tests).
 *
 * Accessibility: PTR is a gesture-only affordance. Always pair with a
 * visible "Actualizar" button or equivalent for keyboard / motor-impaired
 * users — never rely on the gesture alone.
 */
export function PullToRefresh({
  onRefresh,
  children,
  enabled,
  threshold = DEFAULT_THRESHOLD,
  maxPull = DEFAULT_MAX_PULL,
  resistance = DEFAULT_RESISTANCE,
  scrollTargetRef,
  className,
}: PullToRefreshProps) {
  // SSR-safe lazy init — reads `isMobile()` once on the client (window guarded).
  const [mobile] = useState(() => isMobile());
  const isEnabled = enabled ?? mobile;

  const { pullDistance, isPulling, isRefreshing } = usePullToRefresh({
    onRefresh,
    enabled: isEnabled,
    threshold,
    maxPull,
    resistance,
    scrollTargetRef,
  });

  const progress = pullDistance / maxPull;
  const showIndicator = isPulling || isRefreshing;
  const indicatorOpacity = isRefreshing ? 1 : Math.min(1, pullDistance / threshold);
  const rotation = isRefreshing ? 0 : progress * 360;

  return (
    <div className={cn('relative overscroll-y-contain', className)}>
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
            className={cn('h-5 w-5', isRefreshing && 'motion-safe:animate-spin')}
            style={{
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
              transition: isPulling ? 'none' : 'transform 200ms ease-out',
            }}
          />
        </div>
      </div>
      {children}
    </div>
  );
}
