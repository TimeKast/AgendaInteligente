/**
 * Onboarding 2/8 — Timezone (auto-detected display).
 */

import { OnboardingLayout } from '@/components/agenda/OnboardingLayout';

export default function OnboardingTimezonePage() {
  return (
    <OnboardingLayout
      step={2}
      title="Tu zona horaria"
      subtitle="La detectamos automáticamente. Si está mal, elegí otra."
      continueHref="/onboarding/push"
    >
      <label
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-2)',
          marginBlock: 'var(--ag-space-3)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--ag-slate)',
          }}
        >
          Zona horaria
        </span>
        <select
          defaultValue="America/Mexico_City"
          style={{
            appearance: 'none',
            padding: '12px 14px',
            borderRadius: 'var(--ag-radius-base)',
            border: '1px solid var(--ag-rule)',
            backgroundColor: 'var(--ag-bg-elevated)',
            color: 'var(--ag-ink-primary)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 15,
          }}
        >
          <option value="America/Mexico_City">America/Mexico_City (auto)</option>
          <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires</option>
          <option value="America/Bogota">America/Bogota</option>
          <option value="America/Santiago">America/Santiago</option>
          <option value="Europe/Madrid">Europe/Madrid</option>
        </select>
      </label>
    </OnboardingLayout>
  );
}
