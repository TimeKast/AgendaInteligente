'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect when component has mounted on the client.
 *
 * Used to prevent hydration mismatch for theme-aware components.
 * This is a standard Next.js pattern documented at:
 * @see https://nextjs.org/docs/messages/react-hydration-error
 *
 * @example
 * ```tsx
 * function ThemeAwareComponent() {
 *   const mounted = useMounted();
 *   const { theme } = useTheme();
 *
 *   // Use SSR-safe default until mounted
 *   const actualTheme = mounted ? theme : 'light';
 *
 *   return <div data-theme={actualTheme}>...</div>;
 * }
 * ```
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Intentional: This is a standard Next.js pattern for hydration mismatch prevention.
    // The React Compiler lint warning is a false positive - this one-time mount detection
    // runs only once and does not cause cascading renders.
    // @see https://nextjs.org/docs/messages/react-hydration-error
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  return mounted;
}
