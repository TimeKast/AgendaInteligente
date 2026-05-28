/**
 * Onboarding 7/8 — Conectar calendario.
 *
 * Wired: if the user picks "now", the form submits to setCalendarOptIn
 * which returns a redirect URL into the Google OAuth flow
 * (/api/calendar/google/connect). Picking "later" goes straight to
 * the done step.
 */

import { redirect } from 'next/navigation';
import { OnboardingLayout } from '@/components/agenda/OnboardingLayout';
import { OnboardingRadioCard } from '@/components/agenda/OnboardingRadioCard';
import { setCalendarOptIn } from '@/lib/actions/onboarding';

async function submit(formData: FormData) {
  'use server';
  const choice = formData.get('calendar');
  const result = await setCalendarOptIn({ choice });
  if (result.error) {
    redirect(`/onboarding/calendar?error=${encodeURIComponent(result.error)}`);
  }
  // 'now' → OAuth dance (route signs CSRF state + bounces to Google).
  // 'later' → straight to done.
  redirect(result.data?.redirectTo ?? '/onboarding/done');
}

export default function OnboardingCalendarPage() {
  return (
    <OnboardingLayout
      step={7}
      title="¿Conectar calendario?"
      subtitle="Para detectar choques (ej: 'tienes una llamada a las 10')."
      formAction={submit}
    >
      <OnboardingRadioCard
        name="calendar"
        value="now"
        title="Conectar ahora"
        description="Google Calendar. Te llevamos al consent."
        defaultChecked
      />
      <OnboardingRadioCard
        name="calendar"
        value="later"
        title="Después"
        description="Lo haces desde Settings → Calendar sync."
      />
    </OnboardingLayout>
  );
}
