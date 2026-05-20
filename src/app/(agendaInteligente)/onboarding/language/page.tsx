/**
 * Onboarding 1/8 — Language pick. NOT skippable (per spec).
 */

import { OnboardingLayout } from '@/components/agenda/OnboardingLayout';
import { OnboardingRadioCard } from '@/components/agenda/OnboardingRadioCard';

export default function OnboardingLanguagePage() {
  return (
    <OnboardingLayout
      step={1}
      title="Elegí tu idioma"
      subtitle="Podés cambiarlo después en Settings."
      continueHref="/onboarding/timezone"
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
