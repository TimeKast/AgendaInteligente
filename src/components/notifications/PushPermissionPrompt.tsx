'use client';

/**
 * PushPermissionPrompt — Modal to request push notification permission.
 *
 * Shows benefits of push notifications and two actions:
 * - "Activar Push" → invokes PushManager.subscribe() via usePushSubscription
 * - "Ahora no" → closes the dialog
 *
 * If the browser denies permission, shows inline instructions
 * for enabling it manually.
 *
 * @see NOTIF-014
 * @see docs/planning/15_DESIGN.md §CMP-N05
 */

import { useState } from 'react';
import { Bell, Zap, Shield, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/common/Dialog';
import { Button } from '@/components/ui/button';

// =============================================================================
// Types
// =============================================================================

interface PushPermissionPromptProps {
  open: boolean;
  onClose: () => void;
  /** Called after a successful subscription */
  onSubscribed?: () => void;
  /** Subscribe function from the parent's usePushSubscription hook */
  subscribe: () => Promise<void>;
}

// =============================================================================
// Benefits list
// =============================================================================

const BENEFITS = [
  {
    icon: Zap,
    text: 'Recibe alertas al instante sin abrir la app',
  },
  {
    icon: Shield,
    text: 'No te pierdas notificaciones importantes',
  },
  {
    icon: Clock,
    text: 'Controla exactamente qué recibes desde ajustes',
  },
] as const;

// =============================================================================
// Component
// =============================================================================

export function PushPermissionPrompt({
  open,
  onClose,
  onSubscribed,
  subscribe,
}: PushPermissionPromptProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [denied, setDenied] = useState(false);

  // ── Handle subscribe ─────────────────────────────────────────────────
  async function handleActivate() {
    setDenied(false);
    setIsLoading(true);

    try {
      await subscribe();
      toast.success('Push activado', {
        description: 'Recibirás notificaciones push en este dispositivo.',
      });
      onSubscribed?.();
      onClose();
    } catch (err) {
      // Check if the browser denied permission
      if (
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.message.includes('denied'))
      ) {
        setDenied(true);
      } else if (err instanceof Error && err.message.toLowerCase().includes('denied')) {
        setDenied(true);
      } else {
        toast.error('Error al activar push', {
          description: err instanceof Error ? err.message : 'Intenta de nuevo.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  // ── Handle close ─────────────────────────────────────────────────────
  function handleClose() {
    setDenied(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          {/* Bell icon */}
          <div className="bg-secondary neo-outset-sm mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full">
            <Bell className="text-primary h-7 w-7" />
          </div>
          <DialogTitle className="text-lg">Activar Notificaciones Push</DialogTitle>
          <DialogDescription>
            Recibe notificaciones directamente en tu dispositivo, incluso cuando no estás usando la
            app.
          </DialogDescription>
        </DialogHeader>

        {/* Benefits */}
        <div className="my-4 space-y-3">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="bg-secondary neo-outset-sm flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                <Icon className="text-primary h-4.5 w-4.5" />
              </div>
              <p className="text-foreground text-sm">{text}</p>
            </div>
          ))}
        </div>

        {/* Denied instructions */}
        {denied && (
          <div className="bg-destructive/10 text-destructive mb-4 rounded-xl p-4 text-sm">
            <p className="mb-1 font-medium">Permiso denegado</p>
            <p className="text-destructive/80">
              Tu navegador bloqueó las notificaciones. Para habilitarlas manualmente:
            </p>
            <ol className="text-destructive/80 mt-2 list-inside list-decimal space-y-1 text-xs">
              <li>Haz clic en el ícono de candado en la barra de dirección</li>
              <li>Busca &quot;Notificaciones&quot; en los permisos</li>
              <li>Cambia de &quot;Bloquear&quot; a &quot;Permitir&quot;</li>
              <li>Recarga la página e intenta de nuevo</li>
            </ol>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={handleActivate}
            disabled={isLoading}
            className="neo-outset-sm w-full"
            size="lg"
          >
            {isLoading ? 'Activando...' : 'Activar Push'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            Ahora no
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
