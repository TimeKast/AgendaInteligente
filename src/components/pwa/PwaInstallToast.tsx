'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { usePwaInstall } from '@/lib/pwa/usePwaInstall';

const COOLDOWN_KEY = 'pwa-install-dismissed';
const COOLDOWN_DAYS = 7;
// Only show PWA install prompt on protected routes (authenticated users)
const PROTECTED_ROUTES = ['/dashboard', '/settings', '/profile'];

export function PwaInstallToast() {
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
  const [shown, setShown] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (shown || isInstalled || !canInstall) return;

    // Only show on protected routes (when user is logged in)
    if (!PROTECTED_ROUTES.some((route) => pathname?.startsWith(route))) return;

    // Check cooldown
    const dismissed = localStorage.getItem(COOLDOWN_KEY);
    if (dismissed) {
      const dismissedAt = new Date(dismissed);
      const cooldownEnd = new Date(dismissedAt.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
      if (new Date() < cooldownEnd) return;
    }

    // Show toast after short delay
    const timer = setTimeout(() => {
      toast('Instalar aplicación', {
        description: 'Agrega la app a tu dispositivo para acceso rápido.',
        duration: 10000,
        action: {
          label: 'Instalar',
          onClick: () => promptInstall(),
        },
        cancel: {
          label: 'Más tarde',
          onClick: () => localStorage.setItem(COOLDOWN_KEY, new Date().toISOString()),
        },
      });
      setShown(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [canInstall, isInstalled, promptInstall, shown, pathname]);

  return null;
}
