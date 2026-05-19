'use client';

/**
 * TestNotificationCard — Dashboard "Probar notificación" button
 *
 * Triggers `sendTestNotification` server action (lib/actions/notifications)
 * which routes through the standard `notify()` dispatcher → applies user
 * preferences → in_app row + push (if subscribed) + email (if enabled).
 *
 * Visual style matches the surrounding quickLinks cards in dashboard/page.tsx.
 */

import { useTransition } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sendTestNotification } from '@/lib/actions/notifications';

export function TestNotificationCard() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await sendTestNotification();
      if (result.error) {
        toast.error('No se pudo enviar la notificación');
        return;
      }
      toast.success('Notificación enviada — llegará en menos de 30 segundos');
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="neo-outset-sm bg-background group rounded-xl p-4 text-left transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="flex items-center gap-3">
        <div className="bg-secondary group-hover:bg-primary/10 rounded-lg p-2 transition-colors">
          {isPending ? (
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          ) : (
            <Bell className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
          )}
        </div>
        <div>
          <p className="text-foreground text-sm font-medium">Probar notificación</p>
          <p className="text-muted-foreground text-xs">Envía una notif a tu cuenta</p>
        </div>
      </div>
    </button>
  );
}
