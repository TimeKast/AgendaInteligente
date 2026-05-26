/**
 * Onboarding 7/8 — Conectar calendario.
 */

import { OnboardingLayout } from '@/components/agenda/OnboardingLayout';
import { OnboardingRadioCard } from '@/components/agenda/OnboardingRadioCard';

export default function OnboardingCalendarPage() {
  return (
    <OnboardingLayout
      step={7}
      title="¿Conectar calendario?"
      subtitle="Para detectar choques (ej: 'tienes una llamada a las 10')."
      continueHref="/onboarding/done"
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
