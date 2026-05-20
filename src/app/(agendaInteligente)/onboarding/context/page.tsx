/**
 * Onboarding 5/8 — Contexto inicial. Free-form text.
 */

import { OnboardingLayout } from '@/components/agenda/OnboardingLayout';

export default function OnboardingContextPage() {
  return (
    <OnboardingLayout
      step={5}
      title="¿Qué te frustra hoy?"
      subtitle="Una o dos frases. Esto orienta al agente."
      continueHref="/onboarding/schedule"
    >
      <textarea
        rows={5}
        placeholder="Olvidos, falta de planeación..."
        aria-label="Frustraciones actuales"
        style={{
          width: '100%',
          resize: 'vertical',
          padding: 'var(--ag-space-3) var(--ag-space-3)',
          borderRadius: 'var(--ag-radius-base)',
          border: '1px solid var(--ag-rule)',
          backgroundColor: 'var(--ag-bg-elevated)',
          color: 'var(--ag-ink-primary)',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 15,
          lineHeight: 1.5,
          outline: 'none',
          minHeight: 120,
        }}
      />
    </OnboardingLayout>
  );
}
