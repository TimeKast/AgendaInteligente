'use client';

/**
 * AgendaShell — client wrapper that decides whether to render chrome (bottom
 * nav + FAB) based on the current route.
 *
 * Nav strategy (post-iteration): the nav is ALWAYS horizontal at the bottom of
 * the viewport, on every breakpoint. The legacy desktop side nav was removed —
 * AgendaBottomNav now handles both layouts internally (compact 7-cell on
 * <768px, generous 7-cell on ≥768px). See AgendaBottomNav for the responsive
 * sizing details.
 *
 * Per-route exclusions:
 *   - /onboarding/* → no chrome (owns its layout).
 *
 * All other routes show the chrome — UX feedback is consistent: nav siempre
 * accesible.
 */

import { usePathname } from 'next/navigation';
import { AgendaBottomNav } from './AgendaBottomNav';
import { FabMic } from './FabMic';

interface AgendaShellProps {
  children: React.ReactNode;
}

export function AgendaShell({ children }: AgendaShellProps) {
  const pathname = usePathname() ?? '/';

  const isOnboarding = pathname.startsWith('/onboarding');
  const showChrome = !isOnboarding;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        minHeight: '100dvh',
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>

      {showChrome ? <FabMic /> : null}
      {showChrome ? <AgendaBottomNav /> : null}
    </div>
  );
}
