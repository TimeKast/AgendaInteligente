'use client';

/**
 * NotificationCriticalBanner — Blocking-state banner shown above the matrix
 *
 * When the user's push setup is in a blocking state (browser permission denied,
 * or iOS Safari without PWA install while the user has push enabled in
 * preferences), this banner appears at the top of the notifications tab to
 * warn the user before they tweak the matrix and wonder why nothing arrives.
 *
 * The CTA scrolls smoothly to the devices block below, where the actual
 * resolution (recovery instructions, install hint, etc.) lives.
 *
 * Returns `null` when nothing is blocking — kept silent in the happy path.
 */

import { AlertTriangle, ArrowDown } from 'lucide-react';
import type { NotificationPermissionState } from '@/lib/hooks/usePushSubscription';

interface NotificationCriticalBannerProps {
  /** Browser-level Notification permission for this origin */
  permission: NotificationPermissionState;
  /** True when running on iOS Safari without PWA install (subscribe is blocked) */
  needsIosPwa: boolean;
  /** True when at least one category has push enabled — gates the iOS hint */
  prefsHavePushOn: boolean;
  /**
   * DOM `id` of the devices block to scroll to when the CTA is clicked.
   * Defaults to `push-devices`.
   */
  targetId?: string;
}

export function NotificationCriticalBanner({
  permission,
  needsIosPwa,
  prefsHavePushOn,
  targetId = 'push-devices',
}: NotificationCriticalBannerProps) {
  const handleScroll = () => {
    if (typeof document === 'undefined') return;
    const target = document.getElementById(targetId);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Permission denied — always show, regardless of user intent: it's a hard block
  if (permission === 'denied') {
    return (
      <div
        role="alert"
        className="bg-destructive/10 border-destructive/30 flex items-start gap-3 rounded-lg border p-3"
      >
        <AlertTriangle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-foreground text-sm leading-relaxed">
            Push bloqueado en este navegador. No vas a recibir notificaciones aquí hasta que
            reactives el permiso.
          </p>
          <button
            type="button"
            onClick={handleScroll}
            className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-sm font-medium underline-offset-2 hover:underline"
          >
            Ver cómo resolverlo
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari without PWA + user has shown intent (push:on in some category)
  if (needsIosPwa && prefsHavePushOn) {
    return (
      <div
        role="alert"
        className="bg-destructive/10 border-destructive/30 flex items-start gap-3 rounded-lg border p-3"
      >
        <AlertTriangle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-foreground text-sm leading-relaxed">
            Para recibir push en este iPhone necesitas instalar la app en pantalla de inicio. iOS no
            permite notificaciones push en Safari normal.
          </p>
          <button
            type="button"
            onClick={handleScroll}
            className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-sm font-medium underline-offset-2 hover:underline"
          >
            Ver instrucciones
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
