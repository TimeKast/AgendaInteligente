'use client';

/**
 * AppearanceController — global theme-mode applier for the AgendaInteligente
 * prototype.
 *
 * Reads the persisted preference from localStorage ('ag-appearance' →
 * 'light' | 'dark' | 'system') and toggles `data-mode="dark"` on the closest
 * `[data-theme="agenda"]` element so the dark-mode CSS vars in
 * `agenda-tokens.css` activate.
 *
 * Mounted once from the layout so the preference persists across navigation.
 */

import { useEffect } from 'react';

export type AppearanceMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'ag-appearance';

export function readAppearance(): AppearanceMode {
  if (typeof window === 'undefined') return 'light';
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'light';
}

export function writeAppearance(mode: AppearanceMode) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, mode);
  applyAppearance(mode);
}

export function applyAppearance(mode: AppearanceMode) {
  if (typeof document === 'undefined') return;
  const root = document.querySelector('[data-theme="agenda"]') as HTMLElement | null;
  if (!root) return;

  const resolved =
    mode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : mode;

  if (resolved === 'dark') {
    root.setAttribute('data-mode', 'dark');
  } else {
    root.removeAttribute('data-mode');
  }
}

export function AppearanceController() {
  useEffect(() => {
    const mode = readAppearance();
    applyAppearance(mode);

    // If user picked "system", react to OS changes live.
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (readAppearance() === 'system') applyAppearance('system');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return null;
}
