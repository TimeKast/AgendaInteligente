/**
 * Onboarding 6/8 — Horarios de check-in.
 */

import { OnboardingLayout } from '@/components/agenda/OnboardingLayout';

function TimePicker({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-1)',
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
        {label}
      </span>
      <input
        type="time"
        defaultValue={defaultValue}
        style={{
          appearance: 'none',
          padding: '10px 12px',
          borderRadius: 'var(--ag-radius-base)',
          border: '1px solid var(--ag-rule)',
          backgroundColor: 'var(--ag-bg-elevated)',
          color: 'var(--ag-ink-primary)',
          fontFamily: 'var(--ag-font-mono)',
          fontSize: 14,
        }}
      />
    </label>
  );
}

export default function OnboardingSchedulePage() {
  return (
    <OnboardingLayout
      step={6}
      title="Cuándo quieres que te escriba"
      subtitle="Tres momentos del día. Puedes cambiarlos cuando quieras."
      continueHref="/onboarding/calendar"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-3)',
        }}
      >
        <TimePicker label="Mañana" defaultValue="08:00" />
        <TimePicker label="Mediodía" defaultValue="13:00" />
        <TimePicker label="Noche" defaultValue="21:00" />
      </div>
    </OnboardingLayout>
  );
}
