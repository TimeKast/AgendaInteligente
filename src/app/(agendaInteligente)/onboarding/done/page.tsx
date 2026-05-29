/**
 * Onboarding 8/8 — Done.
 *
 * Server component shell. The "Empezar" button is a client component
 * (DoneButton) because finalize must be followed by a session.update()
 * to refresh the JWT — otherwise the middleware sees stale
 * onboardingCompletedAt and bounces the user back to step 1.
 */

import { OnboardingLayout } from '@/components/agenda/OnboardingLayout';
import { DoneButton } from '@/components/agenda/DoneButton';

export default function OnboardingDonePage() {
  return (
    <OnboardingLayout step={8} title="Listo." showSkip={false} customFooter={<DoneButton />}>
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
