'use client';

/**
 * AgendaShell — client wrapper that decides which chrome (bottom nav, side
 * nav, FAB) to render based on the current route + viewport.
 *
 * Mobile (<1024px):
 *   - Single-column flow (children render full-width).
 *   - AgendaBottomNav fixed at the bottom + FAB.
 *
 * Desktop (≥1024px):
 *   - Two-column layout: DesktopSideNav (240px sticky) + main content.
 *   - Bottom nav hidden (replaced by side nav).
 *   - FAB still rendered bottom-right.
 *
 * Per-route exclusions stay the same:
 *   - /onboarding/* → no nav, no FAB (owns its layout).
 *   - /chat → no nav (input bar takes bottom), no FAB.
 *   - /activity/* → no nav (focused detail page), no FAB.
 *   - /categories, /projects/*, /goals/[id] → no nav (catalog detail focus).
 *
 * The desktop side nav follows the SAME exclusion list as the bottom nav so
 * the chrome rules stay consistent across breakpoints.
 */

import { usePathname } from 'next/navigation';
import { AgendaBottomNav } from './AgendaBottomNav';
import { DesktopSideNav } from './DesktopSideNav';
import { FabMic } from './FabMic';
import { DebugPointerBadge } from './DebugPointerBadge';

interface AgendaShellProps {
  children: React.ReactNode;
}

export function AgendaShell({ children }: AgendaShellProps) {
  const pathname = usePathname() ?? '/';

  const isOnboarding = pathname.startsWith('/onboarding');
  // Chrome persiste en todo excepto onboarding (que tiene su propio layout
  // con progress dots). Chat, Detail screens, etc TODOS muestran el menú
  // — UX feedback consistente: nav siempre accesible.
  const showChrome = !isOnboarding;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        minHeight: '100dvh',
      }}
    >
      {showChrome ? (
        // Desktop side nav — hidden on <1024px via inline @media query
        // is not possible without a class. We use a wrapper className that the
        // global stylesheet treats as `display: none` below 1024px.
        <div className="ag-desktop-only">
          <DesktopSideNav />
        </div>
      ) : null}

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
      {showChrome ? (
        // Mobile bottom nav — hidden on ≥1024px via the same utility class.
        <div className="ag-mobile-only">
          <AgendaBottomNav />
        </div>
      ) : null}
      {/* Debug badge — diagnóstico de pointer detection. Remover pre-release. */}
      <DebugPointerBadge />
    </div>
  );
}
