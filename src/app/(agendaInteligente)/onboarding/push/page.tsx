/**
 * Onboarding 3/8 — Habilitar push.
 *
 * Wired end-to-end: the client body (`PushStepBody`) triggers the
 * browser's notification permission prompt + subscribes via the
 * existing `usePushSubscription` hook, then writes the result into
 * a hidden `pushEnabled` input. The layout's "Continuar" submits to
 * `setPushPref` which upserts notification_prefs.push_enabled and
 * advances to the mic step.
 */

import { redirect } from 'next/navigation';
import { OnboardingLayout } from '@/components/agenda/OnboardingLayout';
import { PushStepBody } from '@/components/agenda/PushStepBody';
import { setPushPref } from '@/lib/actions/onboarding';

async function submit(formData: FormData) {
  'use server';
  const pushEnabled = formData.get('pushEnabled') === 'true';
  const result = await setPushPref({ pushEnabled });
  if (result.error) {
    redirect(`/onboarding/push?error=${encodeURIComponent(result.error)}`);
  }
  redirect('/onboarding/mic');
}

export default function OnboardingPushPage() {
  return (
    <OnboardingLayout
      step={3}
      title="Habilitar notificaciones"
      subtitle="Te avisamos a las 8, 13 y 21. Nada más."
      formAction={submit}
    >
      <PushStepBody />
    </OnboardingLayout>
  );
}
