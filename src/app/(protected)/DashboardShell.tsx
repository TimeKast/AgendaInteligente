'use client';

import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { PwaInstallToast, IosA2hsHint, PullToRefreshShell } from '@/components/pwa';
import { ShellPTRProvider } from '@/lib/pwa/shellPullToRefresh';

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface DashboardShellProps {
  children: React.ReactNode;
  user: User;
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <ShellPTRProvider>
      <div className="bg-background min-h-screen overscroll-y-contain">
        <Header user={user} />

        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar userRole={user.role} />
        </div>

        {/* Main content area — pb-20 for BottomNav clearance on mobile */}
        <main className="min-w-0 pt-16 pb-20 lg:ml-60 lg:pb-0">
          <div className="max-w-full p-4 lg:p-6">{children}</div>
        </main>

        {/* Mobile BottomNav */}
        <BottomNav userRole={user.role} />

        {/* PWA Install prompts - only in protected pages */}
        <PwaInstallToast />
        <IosA2hsHint />

        {/* Shell-wide pull-to-refresh — capability-gated to mobile, opt-out via useDisableShellPTR() */}
        <PullToRefreshShell />
      </div>
    </ShellPTRProvider>
  );
}
