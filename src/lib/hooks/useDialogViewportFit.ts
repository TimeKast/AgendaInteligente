'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Tracks `window.visualViewport.height` and writes it to the CSS var
 * `--dialog-vvh` (px) on the referenced element.
 *
 * Used by `common/Dialog` and `common/AlertDialog` to compute a max-height
 * that respects the mobile keyboard. Standard `dvh` is not enough because
 * Android Chrome (default `interactive-widget=resizes-visual`) does NOT
 * shrink the layout viewport when the IME rises, and iOS Safari shrinks it
 * but the centered-via-translate dialog still pushes the footer behind the
 * keyboard. The visualViewport API exposes the post-IME-shrink height; we
 * mirror it in a CSS var so layout can react in CSS.
 *
 * No-op in SSR and in browsers without `window.visualViewport` (CSS falls
 * back to `100dvh`).
 */
export function useDialogViewportFit<T extends HTMLElement = HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;
    const node = ref.current;
    if (!node) return;

    const sync = () => {
      node.style.setProperty('--dialog-vvh', `${vv.height}px`);
    };

    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);

    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
      node.style.removeProperty('--dialog-vvh');
    };
  }, []);

  return ref;
}
