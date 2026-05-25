'use client';

/**
 * DebugPointerBadge — floating panel bottom-left showing browser pointer/touch
 * detection. ONLY for prototype diagnostics — remove or gate by env var
 * before any real release.
 *
 * Helps diagnose why pointer-related features (like the activity resize
 * handle) appear to fail on some devices. Reports:
 *   - Viewport width
 *   - matchMedia('(any-pointer: fine)') — true if ANY input is fine (mouse/trackpad/stylus)
 *   - matchMedia('(pointer: fine)') — true if PRIMARY input is fine
 *   - matchMedia('(any-pointer: coarse)') — true if ANY input is coarse (touch)
 *   - matchMedia('(pointer: coarse)') — true if PRIMARY input is coarse
 *   - 'ontouchstart' in window
 *   - navigator.maxTouchPoints
 *   - Computed verdict: "Desktop" if any-pointer:fine, "Touch" otherwise
 */

import { useEffect, useState } from 'react';

interface PointerState {
  vw: number;
  anyFine: boolean;
  primaryFine: boolean;
  anyCoarse: boolean;
  primaryCoarse: boolean;
  hasTouch: boolean;
  maxTouch: number;
}

function readState(): PointerState {
  if (typeof window === 'undefined') {
    return {
      vw: 0,
      anyFine: false,
      primaryFine: false,
      anyCoarse: false,
      primaryCoarse: false,
      hasTouch: false,
      maxTouch: 0,
    };
  }
  return {
    vw: window.innerWidth,
    anyFine: window.matchMedia('(any-pointer: fine)').matches,
    primaryFine: window.matchMedia('(pointer: fine)').matches,
    anyCoarse: window.matchMedia('(any-pointer: coarse)').matches,
    primaryCoarse: window.matchMedia('(pointer: coarse)').matches,
    hasTouch: 'ontouchstart' in window,
    maxTouch: navigator.maxTouchPoints ?? 0,
  };
}

export function DebugPointerBadge() {
  const [state, setState] = useState<PointerState | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(readState());
    const onResize = () => setState(readState());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!state) return null;

  const verdict =
    state.anyFine ? 'DESKTOP (any-pointer:fine ✓)' : 'TOUCH ONLY (no fine pointer)';
  const verdictColor = state.anyFine ? '#5C7B5C' : '#A85530';

  return (
    <div
      role="status"
      aria-label="Debug pointer detection"
      style={{
        position: 'fixed',
        bottom: 80,
        left: 12,
        zIndex: 9999,
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: 11,
        lineHeight: 1.4,
        backgroundColor: 'rgba(42, 40, 38, 0.92)',
        color: '#FBF7EF',
        padding: collapsed ? '6px 10px' : '10px 12px',
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        maxWidth: 260,
        pointerEvents: 'auto',
      }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        style={{
          appearance: 'none',
          background: 'transparent',
          border: 'none',
          color: verdictColor,
          fontWeight: 700,
          fontFamily: 'inherit',
          fontSize: 11,
          padding: 0,
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
        }}
      >
        🛠 {verdict} {collapsed ? '▸' : '▾'}
      </button>
      {!collapsed ? (
        <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0 }}>
          <li>vw: {state.vw}px</li>
          <li>any-pointer:fine: {state.anyFine ? '✓' : '✗'}</li>
          <li>pointer:fine: {state.primaryFine ? '✓' : '✗'}</li>
          <li>any-pointer:coarse: {state.anyCoarse ? '✓' : '✗'}</li>
          <li>pointer:coarse: {state.primaryCoarse ? '✓' : '✗'}</li>
          <li>ontouchstart: {state.hasTouch ? '✓' : '✗'}</li>
          <li>maxTouchPoints: {state.maxTouch}</li>
        </ul>
      ) : null}
    </div>
  );
}
