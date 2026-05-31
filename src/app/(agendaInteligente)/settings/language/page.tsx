/**
 * SCR-032 — Settings → Idioma + zona horaria (server-loaded).
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { loadLanguagePrefs } from '@/lib/db/queries/user-prefs';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { LanguageClient } from '@/components/agenda/LanguageClient';

export default async function LanguageSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/settings/language');
  }
  const prefs = await loadLanguagePrefs(session.user.id);
  return (
    <>
      <AgendaHeader dateLabel="Idioma & zona horaria" backHref="/settings" />
      <LanguageClient initialLanguage={prefs.preferredLanguage} initialTimezone={prefs.timezone} />
    </>
  );
}
