/**
 * Platform / device capability helpers.
 *
 * Capability-based — uses media queries against input device features
 * (`pointer: coarse`, `hover: none`) rather than UA sniffing.
 */

/**
 * True when the current device exposes a coarse pointer and no hover capability —
 * the standard signal for a touch-first device (iOS, Android, touch tablets).
 *
 * SSR-safe: returns `false` when `window` or `matchMedia` are unavailable.
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(pointer: coarse) and (hover: none)').matches;
}
