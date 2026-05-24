'use client';

/**
 * QuickAddDayPopover — direct task creation for a specific day, used from
 * /month (MonthDayCell "+") and /week (DayRow header "+").
 *
 * Lightweight alternative to ActivityQuickAdd: single title input, pre-filled
 * date context, defaults applied (priority 3, project "Inbox"). The caller
 * resolves the actual scheduledDates assignment via `onCreate(title)`.
 *
 * Layout:
 *   - Mobile (<1024px): bottom sheet anchored to bottom of viewport with a
 *     backdrop. Simple modal — no `vaul` dependency.
 *   - Desktop (≥1024px): floating popover positioned next to the anchor
 *     element via getBoundingClientRect(). 280px wide, with a small caret
 *     pointing toward the anchor.
 *
 * Width: 280px max on both layouts.
 * Escape, outside click, or the Cancelar button close the popover.
 *
 * NOTE: callers should pass a `key` (e.g. the iso date) that changes per
 * open invocation so the component remounts and state (title, position) is
 * fresh — keeps the implementation free of setState-in-effect patterns.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface QuickAddDayPopoverProps {
  /** Controlled open state. */
  open: boolean;
  /** Anchor element on desktop. Ignored on mobile (uses bottom sheet). */
  anchorEl: HTMLElement | null;
  /** Human-readable day label, e.g. "lunes 26". */
  dayLabel: string;
  /** Called with the trimmed title on submit. Caller adds the activity. */
  onCreate: (title: string) => void;
  /** Called when user cancels, presses Escape, or clicks outside. */
  onClose: () => void;
}

interface DesktopPosition {
  top: number;
  left: number;
}

const POPOVER_WIDTH = 280;
const DESKTOP_QUERY = '(min-width: 1024px)';

function computeDesktopPosition(anchor: HTMLElement): DesktopPosition {
  const rect = anchor.getBoundingClientRect();
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;
  const viewportWidth = window.innerWidth;
  const top = rect.bottom + scrollY + 6;
  let left = rect.right + scrollX - POPOVER_WIDTH;
  if (left < scrollX + 8) left = scrollX + 8;
  if (left + POPOVER_WIDTH > scrollX + viewportWidth - 8) {
    left = scrollX + viewportWidth - POPOVER_WIDTH - 8;
  }
  return { top, left };
}

function detectDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(DESKTOP_QUERY).matches;
}

export function QuickAddDayPopover({
  open,
  anchorEl,
  dayLabel,
  onCreate,
  onClose,
}: QuickAddDayPopoverProps) {
  // Lazy initializers — run once per mount. Callers remount via `key` per
  // open invocation, so these stay accurate without setState-in-effect.
  const [title, setTitle] = useState('');
  const [isDesktop, setIsDesktop] = useState<boolean>(() => detectDesktop());
  const [desktopPos, setDesktopPos] = useState<DesktopPosition | null>(() =>
    open && anchorEl && detectDesktop() ? computeDesktopPosition(anchorEl) : null,
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Track viewport breakpoint changes via media query listener (setState in
  // callback is fine — only sync setState in effect body is the linted case).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(mql.matches);
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  // Recompute desktop position on scroll / resize while open. Listener
  // callbacks are exempt from the set-state-in-effect lint rule.
  useEffect(() => {
    if (!open || !isDesktop || !anchorEl) return;
    const recompute = () => setDesktopPos(computeDesktopPosition(anchorEl));
    recompute();
    window.addEventListener('scroll', recompute, true);
    window.addEventListener('resize', recompute);
    return () => {
      window.removeEventListener('scroll', recompute, true);
      window.removeEventListener('resize', recompute);
    };
  }, [open, isDesktop, anchorEl]);

  // Focus input on open.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Outside click closes (desktop only — mobile uses backdrop).
  useEffect(() => {
    if (!open || !isDesktop) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (anchorEl?.contains(target)) return;
      onClose();
    }
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [open, isDesktop, anchorEl, onClose]);

  if (typeof document === 'undefined' || !open) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    onClose();
  }

  const headerLabel = `Nueva tarea — ${dayLabel}`;
  const placeholder = `Tarea para ${dayLabel}`;

  const panel = (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={headerLabel}
      style={{
        width: POPOVER_WIDTH,
        maxWidth: '92vw',
        backgroundColor: 'var(--ag-bg)',
        border: '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-card)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        padding: 'var(--ag-space-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-3)',
      }}
    >
      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-display)',
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--ag-ink-primary)',
        }}
      >
        {headerLabel}
      </h3>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-3)' }}>
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={placeholder}
          style={{
            appearance: 'none',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--ag-rule)',
            padding: '6px 0',
            fontFamily: 'var(--ag-font-display)',
            fontStyle: title ? 'normal' : 'italic',
            fontSize: 16,
            color: 'var(--ag-ink-primary)',
            outline: 'none',
            width: '100%',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--ag-space-2)' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: '1px solid var(--ag-rule)',
              borderRadius: 'var(--ag-radius-base)',
              padding: '8px 14px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              color: 'var(--ag-ink-soft)',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            style={{
              appearance: 'none',
              backgroundColor: title.trim() ? 'var(--ag-ink-primary)' : 'var(--ag-bg-sunken)',
              border: 'none',
              borderRadius: 'var(--ag-radius-base)',
              padding: '8px 14px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              fontWeight: 500,
              color: title.trim() ? 'var(--ag-accent-on)' : 'var(--ag-ink-hint)',
              cursor: title.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Crear →
          </button>
        </div>
      </form>
    </div>
  );

  if (isDesktop) {
    if (!desktopPos) return null;
    return createPortal(
      <div
        style={{
          position: 'absolute',
          top: desktopPos.top,
          left: desktopPos.left,
          zIndex: 100,
        }}
      >
        {/* Caret pointing up toward the anchor */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: -6,
            right: 12,
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: '6px solid var(--ag-rule)',
          }}
        />
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: -5,
            right: 13,
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderBottom: '5px solid var(--ag-bg)',
          }}
        />
        {panel}
      </div>,
      document.body,
    );
  }

  // Mobile: bottom sheet with backdrop.
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.32)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: 'var(--ag-space-3)',
          paddingBottom: 'calc(var(--ag-space-3) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {panel}
      </div>
    </div>,
    document.body,
  );
}
