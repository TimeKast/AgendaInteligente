/**
 * SCR-031 — Settings → Intensity mode (server-loaded).
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { loadIntensityPrefs } from '@/lib/db/queries/user-prefs';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { IntensityClient } from '@/components/agenda/IntensityClient';

export default async function IntensitySettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/settings/intensity');
  }
  const prefs = await loadIntensityPrefs(session.user.id);
  return (
    <>
      <AgendaHeader dateLabel="Intensity mode" backHref="/settings" />
      <IntensityClient
        initialMode={prefs.mode}
        expiresAt={prefs.expiresAt ? prefs.expiresAt.toISOString() : null}
      />
    </>
  );
}
