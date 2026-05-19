'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  enabled?: boolean;
  threshold?: number;
  maxPull?: number;
  resistance?: number;
  scrollTargetRef?: RefObject<HTMLElement | null>;
}

interface UsePullToRefreshReturn {
  pullDistance: number;
  isPulling: boolean;
  isRefreshing: boolean;
}

const DEFAULT_THRESHOLD = 80;
const DEFAULT_MAX_PULL = 120;
const DEFAULT_RESISTANCE = 2.5;
const HORIZONTAL_LOCK_PX = 10;
const SCROLL_TOP_TOLERANCE = 1;

/**
 * usePullToRefresh — Touch-gesture hook that drives a pull-to-refresh interaction.
 *
 * Listens to `touch{start,move,end}` on the configured target (defaults to
 * `window`, since the kit shell scrolls on the document). Computes a damped
 * pull distance with a linear resistance curve and invokes `onRefresh()` once
 * the user releases past `threshold`.
 *
 * Activation rules:
 * - Only fires when the scroll target is at the top (`scrollTop <= 1`).
 * - Only fires for single-finger gestures (multi-touch cancels).
 * - Vertical lock: if horizontal movement exceeds vertical, the gesture is
 *   abandoned so the page can scroll horizontally normally.
 *
 * Browser-bounce mitigation: `touchmove` is registered with
 * `{ passive: false }` so `preventDefault()` actually blocks the native
 * rubber-band effect during the pull. This is the primary defence — a
 * sibling `overscroll-behavior: contain` in the wrapper acts as a
 * secondary belt where browsers respect it.
 */
export function usePullToRefresh({
  onRefresh,
  enabled = true,
  threshold = DEFAULT_THRESHOLD,
  maxPull = DEFAULT_MAX_PULL,
  resistance = DEFAULT_RESISTANCE,
  scrollTargetRef,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefreshRef = useRef(onRefresh);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    let startX = 0;
    let startY = 0;
    let armed = false;
    let directionLocked: 'vertical' | 'horizontal' | null = null;
    let currentPull = 0;

    const getScrollTop = (): number => {
      const el = scrollTargetRef?.current;
      if (el) return el.scrollTop;
      return window.scrollY;
    };

    const reset = () => {
      armed = false;
      directionLocked = null;
      currentPull = 0;
      setPullDistance(0);
      setIsPulling(false);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (isRefreshingRef.current) return;
      if (e.touches.length !== 1) {
        reset();
        return;
      }
      if (getScrollTop() > SCROLL_TOP_TOLERANCE) return;

      armed = true;
      directionLocked = null;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!armed) return;
      if (e.touches.length !== 1) {
        reset();
        return;
      }

      const touch = e.touches[0];
      const deltaY = touch.clientY - startY;
      const deltaX = touch.clientX - startX;

      if (directionLocked === null) {
        if (Math.abs(deltaX) > HORIZONTAL_LOCK_PX || deltaY > HORIZONTAL_LOCK_PX) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            directionLocked = 'horizontal';
            armed = false;
            return;
          }
          directionLocked = 'vertical';
        }
      }

      if (directionLocked !== 'vertical') return;
      if (deltaY <= 0) {
        currentPull = 0;
        setPullDistance(0);
        setIsPulling(false);
        return;
      }

      e.preventDefault();
      currentPull = Math.min(maxPull, deltaY / resistance);
      setPullDistance(currentPull);
      setIsPulling(true);
    };

    const onTouchEnd = () => {
      if (!armed) {
        reset();
        return;
      }
      const shouldRefresh = currentPull >= threshold;
      armed = false;
      directionLocked = null;
      setIsPulling(false);

      if (shouldRefresh) {
        setIsRefreshing(true);
        Promise.resolve()
          .then(() => onRefreshRef.current())
          .catch((err) => {
            console.error('[usePullToRefresh] onRefresh failed:', err);
          })
          .finally(() => {
            setIsRefreshing(false);
            currentPull = 0;
            setPullDistance(0);
          });
      } else {
        currentPull = 0;
        setPullDistance(0);
      }
    };

    const onTouchCancel = () => {
      reset();
    };

    const target: EventTarget = window;

    target.addEventListener('touchstart', onTouchStart as EventListener, { passive: true });
    target.addEventListener('touchmove', onTouchMove as EventListener, { passive: false });
    target.addEventListener('touchend', onTouchEnd as EventListener, { passive: true });
    target.addEventListener('touchcancel', onTouchCancel as EventListener, { passive: true });

    return () => {
      target.removeEventListener('touchstart', onTouchStart as EventListener);
      target.removeEventListener('touchmove', onTouchMove as EventListener);
      target.removeEventListener('touchend', onTouchEnd as EventListener);
      target.removeEventListener('touchcancel', onTouchCancel as EventListener);
      reset();
    };
  }, [enabled, threshold, maxPull, resistance, scrollTargetRef]);

  return { pullDistance, isPulling, isRefreshing };
}
