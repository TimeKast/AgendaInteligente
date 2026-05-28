/**
 * Onboarding 4/8 — Habilitar mic.
 *
 * Wired end-to-end: the client body (`MicStepBody`) triggers the
 * browser's mic permission prompt and writes the result into a
 * hidden `micEnabled` input. The layout's "Continuar" submits to
 * `setMicPref` which persists (no-op for now, see action JSDoc) and
 * advances to the context step.
 */

import { redirect } from 'next/navigation';
import { OnboardingLayout } from '@/components/agenda/OnboardingLayout';
import { MicStepBody } from '@/components/agenda/MicStepBody';
import { setMicPref } from '@/lib/actions/onboarding';

async function submit(formData: FormData) {
  'use server';
  const micEnabled = formData.get('micEnabled') === 'true';
  const result = await setMicPref({ micEnabled });
  if (result.error) {
    redirect(`/onboarding/mic?error=${encodeURIComponent(result.error)}`);
  }
  redirect('/onboarding/context');
}

export default function OnboardingMicPage() {
  return (
    <OnboardingLayout
      step={4}
      title="Capturar con voz"
      subtitle="Para registrar mientras caminas, manejas o cocinas."
      formAction={submit}
    >
      <MicStepBody />
    </OnboardingLayout>
  );
}
