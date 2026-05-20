'use client';

/**
 * AgendaShell — client wrapper that decides which chrome (bottom nav, FAB)
 * to render based on the current route.
 *
 * Rules:
 *   - Onboarding (/onboarding/*) → no nav, no FAB (own layout).
 *   - Chat (/chat) → no nav (input bar takes the bottom), no FAB (chat has its own mic).
 *   - Activity detail (/activity/*) → keep nav off so the detail page is focused;
 *     FAB hidden so it doesn't overlap the action footer.
 *   - All other agenda routes → bottom nav + FAB visible.
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
  const isChat = pathname.startsWith('/chat');
  const isActivityDetail = pathname.startsWith('/activity/');
  const isCatalogDetail =
    pathname.startsWith('/categories') ||
    pathname.startsWith('/projects/') ||
    /^\/goals\/[^/]+/.test(pathname);

  const showBottomNav = !isOnboarding && !isChat && !isActivityDetail && !isCatalogDetail;
  const showFab = !isOnboarding && !isChat && !isActivityDetail && !isCatalogDetail;

  return (
    <>
      {children}
      {showFab ? <FabMic /> : null}
      {showBottomNav ? <AgendaBottomNav /> : null}
    </>
  );
}
