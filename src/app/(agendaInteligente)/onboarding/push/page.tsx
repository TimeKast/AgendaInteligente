/**
 * Onboarding 3/8 — Habilitar push.
 */

import { OnboardingLayout } from '@/components/agenda/OnboardingLayout';

export default function OnboardingPushPage() {
  return (
    <OnboardingLayout
      step={3}
      title="Habilitar notificaciones"
      subtitle="Te avisamos a las 8, 13 y 21. Nada más."
      continueHref="/onboarding/mic"
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
          Sin push, sólo abrís cuando te acordás. La mayoría se olvida.
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
          Habilitar push
        </button>
      </div>
    </OnboardingLayout>
  );
}
