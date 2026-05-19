'use client';

/**
 * NotificationStatusBanner — Contextual desync hint between preferences and devices
 *
 * Renders a non-blocking informational banner when the user's stored preferences
 * (D — `notificationPreferences` rows with channel='push' enabled) and the
 * actual subscribed devices (C — `pushSubscriptions` rows for this user) are
 * out of sync. Bridges the visual gap between the preferences matrix above
 * and the devices list below.
 *
 * Returns `null` when both layers agree (or when neither side has any state),
 * so the banner only appears when explanation is actually useful.
 */

import { ArrowDown, ArrowUp, Info } from 'lucide-react';

interface NotificationStatusBannerProps {
  /** Whether the user has at least one row in `pushSubscriptions` */
  hasDevices: boolean;
  /** Whether at least one category has `push` enabled in `notificationPreferences` */
  prefsHavePushOn: boolean;
}

export function NotificationStatusBanner({
  hasDevices,
  prefsHavePushOn,
}: NotificationStatusBannerProps) {
  // Preference says push:on but no device subscribed → push won't deliver
  if (prefsHavePushOn && !hasDevices) {
    return (
      <div role="status" className="bg-secondary/50 flex items-start gap-3 rounded-lg p-3">
        <Info className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-foreground text-sm leading-relaxed">
          Tienes push habilitado en tus preferencias, pero no hay ningún dispositivo configurado.
          Activa uno abajo{' '}
          <ArrowDown className="text-muted-foreground inline h-3.5 w-3.5" aria-hidden="true" /> para
          empezar a recibir notificaciones.
        </p>
      </div>
    );
  }

  // Devices subscribed but no category has push enabled → no notification will use them
  if (hasDevices && !prefsHavePushOn) {
    return (
      <div role="status" className="bg-secondary/50 flex items-start gap-3 rounded-lg p-3">
        <Info className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-foreground text-sm leading-relaxed">
          Tienes dispositivos configurados, pero ninguna categoría tiene push activo. Activa al
          menos una arriba{' '}
          <ArrowUp className="text-muted-foreground inline h-3.5 w-3.5" aria-hidden="true" /> para
          que las notificaciones lleguen.
        </p>
      </div>
    );
  }

  return null;
}
