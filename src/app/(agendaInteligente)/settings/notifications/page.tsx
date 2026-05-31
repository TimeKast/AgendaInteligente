/**
 * SCR-034 — Settings → Horarios y canales (server-loaded).
 *
 * Loads notification_prefs + users.contact_channels and hands them
 * to NotificationsClient, which persists via updateNotificationPrefs.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { loadNotificationsPrefs } from '@/lib/db/queries/user-prefs';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { NotificationsClient } from '@/components/agenda/NotificationsClient';

export default async function NotificationsSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/settings/notifications');
  }
  const prefs = await loadNotificationsPrefs(session.user.id);
  return (
    <>
      <AgendaHeader dateLabel="Horarios y canales" backHref="/settings" />
      <NotificationsClient initial={prefs} />
    </>
  );
}
