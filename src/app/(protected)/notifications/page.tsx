/**
 * Notifications Page — Server Component
 *
 * Protected route `/notifications` that lists all user notifications.
 * Server-side data fetch for initial page, delegates interactivity
 * to the client component.
 *
 * @see NOTIF-012
 */

import type { Metadata } from 'next';
import { BreadcrumbSetter } from '@/components/common/BreadcrumbSetter';
import { NotificationsClient } from './notifications-client';

export const metadata: Metadata = {
  title: 'Notificaciones',
  description: 'Todas tus notificaciones',
};

export default function NotificationsPage() {
  return (
    <>
      <BreadcrumbSetter segment="notifications" label="Notificaciones" />
      <div className="container mx-auto space-y-4 py-6">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Notificaciones</h1>
          <p className="text-muted-foreground text-sm">Todas tus notificaciones</p>
        </div>
        <NotificationsClient />
      </div>
    </>
  );
}
