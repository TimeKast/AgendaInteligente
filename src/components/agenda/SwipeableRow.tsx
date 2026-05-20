'use client';

/**
 * SwipeableRow — mobile-only swipe-to-status gesture (DD-021).
 *
 * Wraps a row and exposes action buttons revealed by horizontal swipe:
 *   - Swipe LEFT  → reveals "Hecho" (success). 120px → auto-fires onDone().
 *   - Swipe RIGHT → reveals "Saltada" + "Bloqueada". 120px → auto-fires onSkip().
 *
 * Mechanics:
 *   - Only active on coarse pointers (touch devices). On desktop the wrapper
 *     is a passthrough — the `⋯` button on the row remains the way to change
 *     status. Detection via `window.matchMedia('(pointer: coarse)')`.
 *   - Pure CSS translateX, ease-out, max 200ms (calm motion per design brief).
 *   - Reveal threshold: 60px. Auto-fire threshold: 120px.
 *   - Vertical motion (|dy| > |dx|) cancels the swipe so the dnd-kit drag
 *     handle keeps working for reordering.
 *
 * No external dependencies — minimal native touch event handlers.
 */

import { useCallback, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Check, MinusCircle, AlertTriangle } from 'lucide-react';

const REVEAL_PX = 60;
const AUTO_FIRE_PX = 120;
const MAX_TRAVEL_PX = 160;
const TRANSITION = 'transform 180ms cubic-bezier(0.2, 0, 0, 1)';

type Direction = 'left' | 'right' | null;

interface SwipeableRowProps {
  children: ReactNode;
  /** Called when the user completes a left-swipe (mark Done). */
  onDone: () => void;
  /** Called when the user completes a right-swipe — opens reason capture. */
  onSkip: () => void;
  /** Called when the user taps the small "Bloqueada" sub-action. */
  onBlock: () => void;
  /** Disable gesture entirely (e.g. while a status modal is open). */
  disabled?: boolean;
}

function subscribeCoarse(callback: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mql = window.matchMedia('(pointer: coarse)');
  mql.addEventListener?.('change', callback);
  return () => mql.removeEventListener?.('change', callback);
}

function getCoarseSnapshot() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

function getCoarseServerSnapshot() {
  return false;
}

function useIsCoarsePointer() {
  // useSyncExternalStore avoids the setState-in-effect anti-pattern and stays
  // hydration-safe (server snapshot = false).
  return useSyncExternalStore(subscribeCoarse, getCoarseSnapshot, getCoarseServerSnapshot);
}

export function SwipeableRow({
  children,
  onDone,
  onSkip,
  onBlock,
  disabled = false,
}: SwipeableRowProps) {
  const isCoarse = useIsCoarsePointer();
  const enabled = isCoarse && !disabled;

  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const lockedAxisRef = useRef<'x' | 'y' | null>(null);

  const reset = useCallback((animated = true) => {
    setOffset(0);
    setIsDragging(false);
    startRef.current = null;
    lockedAxisRef.current = null;
    if (!animated) {
      // no-op — we always animate the spring back via CSS transition.
    }
  }, []);

  function onTouchStart(e: React.TouchEvent) {
    if (!enabled) return;
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
    lockedAxisRef.current = null;
    setIsDragging(true);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!enabled || !startRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - startRef.current.x;
    const dy = t.clientY - startRef.current.y;

    // Decide axis on first meaningful motion (>8px).
    if (lockedAxisRef.current === null) {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (absX < 8 && absY < 8) return;
      lockedAxisRef.current = absX > absY ? 'x' : 'y';
    }

    // Vertical motion → cancel the swipe so dnd-kit drag (or page scroll)
    // can take over cleanly.
    if (lockedAxisRef.current === 'y') {
      reset();
      return;
    }

    // Clamp travel so the row can't be flung off the screen.
    const clamped = Math.max(-MAX_TRAVEL_PX, Math.min(MAX_TRAVEL_PX, dx));
    setOffset(clamped);
  }

  function onTouchEnd() {
    if (!enabled || !startRef.current) {
      reset();
      return;
    }
    const dx = offset;
    if (dx <= -AUTO_FIRE_PX) {
      // Auto-fire Done: slide row out then reset.
      setOffset(-MAX_TRAVEL_PX);
      window.setTimeout(() => {
        onDone();
        reset();
      }, 150);
      return;
    }
    if (dx >= AUTO_FIRE_PX) {
      setOffset(MAX_TRAVEL_PX);
      window.setTimeout(() => {
        onSkip();
        reset();
      }, 150);
      return;
    }
    // Below reveal threshold → snap back. At/above → snap to revealed state.
    if (dx <= -REVEAL_PX) {
      setOffset(-REVEAL_PX);
      setIsDragging(false);
      return;
    }
    if (dx >= REVEAL_PX) {
      setOffset(REVEAL_PX * 2); // wider to fit two actions
      setIsDragging(false);
      return;
    }
    reset();
  }

  function onTouchCancel() {
    reset();
  }

  const direction: Direction = offset < 0 ? 'left' : offset > 0 ? 'right' : null;

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      {/* Action panel — LEFT swipe reveals on the RIGHT side: "Hecho" */}
      {direction === 'left' ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'stretch',
            paddingInline: 'var(--ag-space-2)',
            backgroundColor: 'color-mix(in oklab, var(--ag-success, #4a7a4a), transparent 80%)',
            color: 'var(--ag-success, #4a7a4a)',
          }}
          aria-hidden
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDone();
              reset();
            }}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--ag-space-1)',
              paddingInline: 'var(--ag-space-3)',
            }}
          >
            <Check size={16} strokeWidth={1.75} aria-hidden />
            Hecho
          </button>
        </div>
      ) : null}

      {/* Action panel — RIGHT swipe reveals on the LEFT side: "Saltada" + "Bloqueada" */}
      {direction === 'right' ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
            paddingInline: 'var(--ag-space-2)',
            gap: 'var(--ag-space-2)',
            backgroundColor: 'color-mix(in oklab, var(--ag-warning, #b8895a), transparent 84%)',
          }}
          aria-hidden
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSkip();
              reset();
            }}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--ag-ink-soft)',
              cursor: 'pointer',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--ag-space-1)',
              paddingInline: 'var(--ag-space-3)',
            }}
          >
            <MinusCircle size={16} strokeWidth={1.5} aria-hidden />
            Saltada
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBlock();
              reset();
            }}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--ag-warning, #b8895a)',
              cursor: 'pointer',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--ag-space-1)',
              paddingInline: 'var(--ag-space-3)',
            }}
          >
            <AlertTriangle size={16} strokeWidth={1.75} aria-hidden />
            Bloqueada
          </button>
        </div>
      ) : null}

      {/* The actual row, translated horizontally. */}
      <div
        style={{
          transform: `translate3d(${offset}px, 0, 0)`,
          transition: isDragging ? 'none' : TRANSITION,
          backgroundColor: 'var(--ag-bg)',
          position: 'relative',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}
