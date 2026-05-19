'use client';

import { useEffect, useState } from 'react';

/**
 * Debounce a value — returns `value` only after `delayMs` have passed without
 * further updates. Useful for search inputs, autosave triggers, or any effect
 * that should not fire on every keystroke.
 *
 * @param value - The value to debounce.
 * @param delayMs - Delay in milliseconds before the debounced value updates.
 * @returns The debounced value (latest `value` after `delayMs` of stillness).
 *
 * @example
 * ```tsx
 * function Search() {
 *   const [query, setQuery] = useState('');
 *   const debouncedQuery = useDebounce(query, 300);
 *
 *   useEffect(() => {
 *     if (!debouncedQuery) return;
 *     fetch(`/api/search?q=${debouncedQuery}`);
 *   }, [debouncedQuery]);
 *
 *   return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
 * }
 * ```
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
