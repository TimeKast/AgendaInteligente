/**
 * Onboarding 4/8 — Habilitar mic.
 */

import { OnboardingLayout } from '@/components/agenda/OnboardingLayout';

export default function OnboardingMicPage() {
  return (
    <OnboardingLayout
      step={4}
      title="Capturar con voz"
      subtitle="Para registrar mientras caminás, manejás o cocinás."
      continueHref="/onboarding/context"
    >
      <div
        style={{
          padding: 'var(--ag-space-4)',
          borderRadius: 'var(--ag-radius-card)',
          backgroundColor: 'var(--ag-bg-elevated)',
          boxShadow: 'inset 0 0 0 1px var(--ag-rule)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-3)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-body)',
            fontSize: 14,
            lineHeight: 1.55,
            color: 'var(--ag-ink-soft)',
          }}
        >
          Sin mic, sólo capturás escribiendo. Funciona igual.
        </p>
        <button
          type="button"
          style={{
            appearance: 'none',
            border: '1px solid var(--ag-ink-primary)',
            background: 'transparent',
            color: 'var(--ag-ink-primary)',
            padding: '10px 16px',
            borderRadius: 'var(--ag-radius-base)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 14,
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          Habilitar mic
        </button>
      </div>
    </OnboardingLayout>
  );
}
