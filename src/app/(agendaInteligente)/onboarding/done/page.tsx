/**
 * Onboarding 8/8 — Done. Triggers the atomic finalize transaction on
 * "Empezar" click.
 *
 * After finalize succeeds the redirect to /today is handled by the
 * middleware (onboarding_completed_at is now set on the next request).
 * The action emits the Inngest `user.signed_up` event stub.
 */

import { redirect } from 'next/navigation';
import { OnboardingLayout } from '@/components/agenda/OnboardingLayout';
import { finalizeOnboarding } from '@/lib/actions/onboarding';

async function submit() {
  'use server';
  const result = await finalizeOnboarding({});
  if (result.error) {
    redirect(`/onboarding/done?error=${encodeURIComponent(result.error)}`);
  }
  redirect('/today');
}

export default function OnboardingDonePage() {
  return (
    <OnboardingLayout
      step={8}
      title="Listo."
      formAction={submit}
      continueLabel="Empezar"
      showSkip={false}
    >
      <p
        style={{
          margin: 0,
          paddingBlock: 'var(--ag-space-4)',
          fontFamily: 'var(--ag-font-display)',
          fontStyle: 'italic',
          fontSize: 18,
          lineHeight: 1.55,
          color: 'var(--ag-ink-soft)',
        }}
      >
        Mañana a las 8 abro tu primer día. Hasta entonces.
      </p>
    </OnboardingLayout>
  );
}
