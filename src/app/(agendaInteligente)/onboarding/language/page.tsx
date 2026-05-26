/**
 * Onboarding 1/8 — Language pick. NOT skippable (per spec).
 *
 * Wired end-to-end: form submits to `setLanguage` which updates
 * users.preferred_language and revalidates the timezone step. The
 * middleware (auth.config §authorized) ensures the user is on
 * /onboarding/* until onboarding_completed_at is set.
 */

import { redirect } from 'next/navigation';
import { OnboardingLayout } from '@/components/agenda/OnboardingLayout';
import { OnboardingRadioCard } from '@/components/agenda/OnboardingRadioCard';
import { setLanguage } from '@/lib/actions/onboarding';

async function submit(formData: FormData) {
  'use server';
  const language = formData.get('language');
  const result = await setLanguage({ language });
  if (result.error) {
    // The layout doesn't have an inline error slot yet; surface via redirect
    // hash so the page can show it (UI affordance arrives with /onboarding
    // UI polish issue). For now we just stay on the step.
    redirect(`/onboarding/language?error=${encodeURIComponent(result.error)}`);
  }
  redirect('/onboarding/timezone');
}

export default function OnboardingLanguagePage() {
  return (
    <OnboardingLayout
      step={1}
      title="Elige tu idioma"
      subtitle="Puedes cambiarlo después en Settings."
      formAction={submit}
      showSkip={false}
    >
      <OnboardingRadioCard
        name="language"
        value="es"
        title="Español"
        description="Voz neutra LatAm."
        defaultChecked
      />
      <OnboardingRadioCard
        name="language"
        value="en"
        title="English"
        description="Neutral English."
      />
    </OnboardingLayout>
  );
}
