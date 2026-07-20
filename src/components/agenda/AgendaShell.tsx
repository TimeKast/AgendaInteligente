'use client';

/**
 * AgendaShell — client wrapper that decides whether to render chrome based on
 * the current route.
 *
 * Nav strategy:
 *   - Mobile: bottom nav + FAB offset above it.
 *   - Desktop: fixed left icon sidebar/rail + content offset so the nav never
 *     overlaps the app.
 *
 * Per-route exclusions:
 *   - /onboarding/* → no chrome (owns its layout).
 */

import { usePathname } from 'next/navigation';
import { AgendaBottomNav } from './AgendaBottomNav';
import { FabMic } from './FabMic';

interface AgendaShellProps {
  children: React.ReactNode;
}

const SHELL_CSS = `
@media (min-width: 768px) {
  [data-theme='agenda'] .ag-shell-content[data-has-chrome='true'] {
    padding-left: 84px;
  }
}
`;

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
      <style>{SHELL_CSS}</style>
      <div
        className="ag-shell-content"
        data-has-chrome={showChrome ? 'true' : 'false'}
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
