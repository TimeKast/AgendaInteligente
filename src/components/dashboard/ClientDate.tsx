'use client';

import { useMemo } from 'react';

/**
 * Renders the current date in the user's locale (client-side).
 * Uses long format: "Miércoles, 12 de febrero de 2026"
 */
export function ClientDate() {
  const dateStr = useMemo(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, []);

  return <p className="text-muted-foreground mt-1 text-xs tracking-wide">{dateStr}</p>;
}
