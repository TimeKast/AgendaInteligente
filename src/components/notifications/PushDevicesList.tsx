'use client';

/**
 * PushDevicesList — User's push subscriptions per device
 *
 * Renders all push subscriptions belonging to the current user (one per
 * browser × device). Lets the user activate push on the current device
 * (if not already subscribed) and remove any device from the list.
 *
 * Why this exists:
 * Push subscriptions are inherently per-device — endpoint + keys are unique
 * per browser. The previous UI only showed the user's GLOBAL channel
 * preference (BD), so a user activating push on desktop saw "ON" on mobile
 * without having a real subscription there. This component makes the
 * per-device state visible and editable.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Smartphone, Trash2, Plus, Loader2, Share, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { getPushDevices, removePushDevice, type PushDevice } from '@/lib/actions/notifications';
import { usePushSubscription } from '@/lib/hooks/usePushSubscription';
import { usePwaInstall } from '@/lib/pwa/usePwaInstall';
import { parseUserAgent } from '@/lib/notifications/parse-user-agent';
import { PushPermissionPrompt } from '@/components/notifications/PushPermissionPrompt';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

interface PushDevicesListProps {
  /**
   * Invoked after the user adds or removes a device. The parent uses this
   * to re-fetch its devices count or re-render contextual banners.
   */
  onChange?: () => void;
  /**
   * Reports the current number of subscribed devices to the parent on every
   * load (initial fetch + after subscribe/remove). The parent uses it to
   * compute desync banners without duplicating the fetch.
   */
  onDevicesCountChange?: (count: number) => void;
}

/**
 * Browser-specific recovery instructions for `permission === 'denied'`.
 * Returned as an array so each step renders as a numbered list item.
 */
function getDeniedInstructions(): string[] {
  if (typeof navigator === 'undefined') return [];
  const { browser, os } = parseUserAgent(navigator.userAgent);

  if (os === 'iPhone' || os === 'iPad') {
    return [
      'Abre Configuración del iPhone',
      'Busca esta app en la lista',
      'Toca Notificaciones y activa "Permitir notificaciones"',
    ];
  }
  if (browser === 'Safari') {
    return [
      'En la barra de menú: Safari → Ajustes → Sitios web',
      'Selecciona Notificaciones a la izquierda',
      'Cambia esta app a "Permitir"',
    ];
  }
  if (browser === 'Firefox') {
    return [
      'Haz clic en el candado a la izquierda de la URL',
      'Toca "Eliminar permiso" junto a Notificaciones',
      'Recarga la página y vuelve a intentarlo',
    ];
  }
  // Chrome / Edge / Brave / Opera / Vivaldi — same UI
  return [
    'Haz clic en el candado a la izquierda de la URL',
    'Busca "Notificaciones" en los permisos',
    'Cámbialo de "Bloquear" a "Permitir" y recarga la página',
  ];
}

export function PushDevicesList({ onChange, onDevicesCountChange }: PushDevicesListProps = {}) {
  const [devices, setDevices] = useState<PushDevice[]>([]);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushSubscription();

  const { isInstalled } = usePwaInstall();

  // iOS gates Web Push behind "installed as PWA" since 16.4 — in regular
  // Safari, Notification/PushManager APIs may exist but `subscribe()` is a
  // dead end. Detect this so we can show an install hint instead of a
  // useless "Activar aquí" button.
  const needsIosPwa = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return isIOS && !isInstalled;
  }, [isInstalled]);

  // ── Load devices + identify current ──────────────────────────────────────
  const loadDevices = useCallback(async () => {
    const result = await getPushDevices();
    if (result.error || !result.data) {
      toast.error('No se pudieron cargar los dispositivos');
      setLoading(false);
      return;
    }
    setDevices(result.data);
    onDevicesCountChange?.(result.data.length);
    setLoading(false);
  }, [onDevicesCountChange]);

  const detectCurrentEndpoint = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setCurrentEndpoint(subscription?.endpoint ?? null);
    } catch {
      setCurrentEndpoint(null);
    }
  }, []);

  useEffect(() => {
    // Fetch on mount — async data fetch is the canonical useEffect use case;
    // setState happens inside the async callback, not synchronously
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDevices();
    detectCurrentEndpoint();
  }, [loadDevices, detectCurrentEndpoint]);

  // Re-detect current endpoint when subscription state flips (subscribe/unsubscribe)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    detectCurrentEndpoint();
  }, [isSubscribed, detectCurrentEndpoint]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleEnableHere = () => {
    setShowPermissionPrompt(true);
  };

  const handleSubscribed = useCallback(async () => {
    await loadDevices();
    await detectCurrentEndpoint();
    onChange?.();
  }, [loadDevices, detectCurrentEndpoint, onChange]);

  const handleRemove = (id: string) => {
    setConfirmingId(id);
  };

  const confirmRemove = async () => {
    if (!confirmingId) return;
    const id = confirmingId;
    setConfirmingId(null);
    setRemovingId(id);

    const isCurrentDevice = devices.find((d) => d.id === id)?.endpoint === currentEndpoint;

    const result = await removePushDevice({ id });
    if (result.error) {
      toast.error('No se pudo quitar el dispositivo');
      setRemovingId(null);
      return;
    }

    // If the removed device is the current one, also unsubscribe locally
    if (isCurrentDevice) {
      try {
        await unsubscribe();
      } catch {
        // BD row already deleted; local cleanup best-effort
      }
    }

    await loadDevices();
    await detectCurrentEndpoint();
    setRemovingId(null);

    toast.success('Dispositivo eliminado');

    onChange?.();
  };

  // ── Render ───────────────────────────────────────────────────────────────
  // On iOS Safari without PWA install, we still want to render so the install
  // hint can guide the user — even if PushManager isn't exposed yet.
  if (!isSupported && !needsIosPwa) {
    return null;
  }

  if (loading) {
    return (
      <div className="neo-outset-sm animate-pulse rounded-xl p-4">
        <div className="bg-muted mb-3 h-5 w-40 rounded" />
        <div className="bg-muted h-12 rounded-lg" />
      </div>
    );
  }

  const currentDeviceListed =
    !!currentEndpoint && devices.some((d) => d.endpoint === currentEndpoint);
  const showEnableHere = !currentDeviceListed;
  const showDeniedRecovery = permission === 'denied' && !needsIosPwa;
  const deniedSteps = showDeniedRecovery ? getDeniedInstructions() : [];

  return (
    <>
      <div id="push-devices" className="neo-outset-sm scroll-mt-4 rounded-xl p-4">
        <div className="mb-3 flex items-center gap-2">
          <Smartphone className="text-muted-foreground h-4 w-4" />
          <h3 className="text-foreground text-sm font-semibold">Mis dispositivos</h3>
        </div>

        {showEnableHere && needsIosPwa && (
          <div className="bg-secondary/50 mb-3 flex items-start gap-3 rounded-lg p-3">
            <Share className="text-primary mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 space-y-1">
              <p className="text-foreground text-sm font-medium">Activar push en este iPhone</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                iOS solo permite notificaciones push si la app está instalada en la pantalla de
                inicio. Toca <Share className="inline h-3 w-3" /> Compartir → &quot;Añadir a
                pantalla de inicio&quot; y abre la app desde el icono.
              </p>
            </div>
          </div>
        )}

        {showEnableHere && showDeniedRecovery && (
          <div className="bg-destructive/10 border-destructive/30 mb-3 flex items-start gap-3 rounded-lg border p-3">
            <Lock className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 space-y-2">
              <div className="space-y-1">
                <p className="text-foreground text-sm font-medium">
                  Push bloqueado en este navegador
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  El permiso de notificaciones está denegado. Para reactivarlo:
                </p>
              </div>
              {deniedSteps.length > 0 && (
                <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-xs">
                  {deniedSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}

        {showEnableHere && !needsIosPwa && !showDeniedRecovery && (
          <div className="bg-secondary/50 mb-3 flex items-center justify-between gap-3 rounded-lg p-3">
            <div className="min-w-0">
              <p className="text-foreground text-sm font-medium">Este dispositivo</p>
              <p className="text-muted-foreground text-xs">
                No estás recibiendo push aquí. Actívalo si quieres notificaciones nativas.
              </p>
            </div>
            <Button size="sm" onClick={handleEnableHere} className="shrink-0">
              <Plus className="h-3.5 w-3.5" />
              Activar aquí
            </Button>
          </div>
        )}

        {devices.length === 0 ? (
          <p className="text-muted-foreground py-2 text-center text-sm">
            No tienes dispositivos registrados.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {devices.map((device) => {
              const ua = parseUserAgent(device.userAgent);
              const isCurrent = device.endpoint === currentEndpoint;
              const isRemoving = removingId === device.id;

              return (
                <li
                  key={device.id}
                  className="bg-secondary/30 flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground truncate text-sm font-medium">
                        {ua.label}
                      </span>
                      {isCurrent && (
                        <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                          Este dispositivo
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Suscrito el {DATE_FORMATTER.format(new Date(device.createdAt))}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(device.id)}
                    disabled={isRemoving}
                    aria-label="Quitar dispositivo"
                  >
                    {isRemoving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirmingId !== null}
        onClose={() => setConfirmingId(null)}
        onConfirm={confirmRemove}
        title="¿Quitar este dispositivo?"
        description="Dejará de recibir notificaciones push. Puedes volver a activarlo cuando quieras."
        confirmText="Quitar"
        variant="danger"
      />

      <PushPermissionPrompt
        open={showPermissionPrompt}
        onClose={() => setShowPermissionPrompt(false)}
        onSubscribed={handleSubscribed}
        subscribe={subscribe}
      />
    </>
  );
}
