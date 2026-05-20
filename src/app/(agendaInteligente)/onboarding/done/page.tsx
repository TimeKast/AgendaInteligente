/**
 * Onboarding 8/8 — Done. Editorial close with a quiet line.
 */

import { OnboardingLayout } from '@/components/agenda/OnboardingLayout';

export default function OnboardingDonePage() {
  return (
    <OnboardingLayout
      step={8}
      title="Listo."
      continueHref="/today"
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
