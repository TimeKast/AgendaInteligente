'use client';

import { useEffect } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { registerSwListener } from '@/lib/pwa/sw-listener';
import { PwaUpdateToast } from '@/components/pwa';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { BreadcrumbProvider } from '@/lib/contexts/BreadcrumbContext';
import { UnsavedChangesProvider } from '@/lib/contexts/UnsavedChangesContext';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Root providers wrapper
 * Includes theme, global app contexts, and PWA/offline components
 *
 * Note: PwaInstallToast and IosA2hsHint moved to DashboardShell
 * to only show in protected pages (PWA-001)
 */
export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    registerSwListener();
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      themes={['light', 'midnight', 'dark']}
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <UnsavedChangesProvider>
        <BreadcrumbProvider>{children}</BreadcrumbProvider>
      </UnsavedChangesProvider>
      <PwaUpdateToast />
      <OfflineBanner />
    </NextThemesProvider>
  );
}
