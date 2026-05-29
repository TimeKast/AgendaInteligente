/**
 * Onboarding 5/8 — Frustraciones iniciales + canales de contacto.
 *
 * Two things in one step (DRY-er than a separate channels step):
 *   1. Free-text frustration → users.onboarding_context
 *   2. Multi-select contact channels → users.contact_channels
 *      ('email' default-checked, 'discord' opt-in, 'whatsapp' disabled
 *      with "Próximamente" badge).
 */

import { redirect } from 'next/navigation';
import { OnboardingLayout } from '@/components/agenda/OnboardingLayout';
import { setOnboardingContext } from '@/lib/actions/onboarding';

async function submit(formData: FormData) {
  'use server';
  const context = formData.get('context');
  // Browsers submit multi-checkbox fields as repeated keys; getAll
  // collapses them into a string[].
  const contactChannels = formData
    .getAll('contactChannels')
    .filter((v) => typeof v === 'string') as string[];
  const result = await setOnboardingContext({ context, contactChannels });
  if (result.error) {
    redirect(`/onboarding/context?error=${encodeURIComponent(result.error)}`);
  }
  redirect('/onboarding/schedule');
}

export default function OnboardingContextPage() {
  return (
    <OnboardingLayout
      step={5}
      title="¿Qué te frustra hoy?"
      subtitle="Una o dos frases. Esto orienta al agente."
      formAction={submit}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-4)' }}>
        <textarea
          name="context"
          rows={5}
          placeholder="Olvidos, falta de planeación..."
          aria-label="Frustraciones actuales"
          required
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

        <fieldset
          style={{
            border: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-2)',
          }}
        >
          <legend
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--ag-ink-soft)',
              marginBottom: 'var(--ag-space-2)',
              padding: 0,
            }}
          >
            ¿Cómo quieres que te contacte el agente?
          </legend>

          <ChannelOption
            value="email"
            label="Email"
            description="Check-ins diarios + resumen semanal."
            defaultChecked
          />
          <ChannelOption
            value="discord"
            label="Discord"
            description="Notificación en tu servidor — configuras el webhook en Settings después."
          />
          <ChannelOption value="whatsapp" label="WhatsApp" description="Próximamente." disabled />
        </fieldset>
      </div>
    </OnboardingLayout>
  );
}

interface ChannelOptionProps {
  value: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}

function ChannelOption({
  value,
  label,
  description,
  defaultChecked,
  disabled,
}: ChannelOptionProps) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--ag-space-3)',
        padding: 'var(--ag-space-3)',
        borderRadius: 'var(--ag-radius-base)',
        border: '1px solid var(--ag-rule)',
        backgroundColor: 'var(--ag-bg-elevated)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <input
        type="checkbox"
        name="contactChannels"
        value={value}
        defaultChecked={defaultChecked}
        disabled={disabled}
        style={{
          marginTop: 2,
          width: 16,
          height: 16,
          accentColor: 'var(--ag-ink-primary)',
        }}
      />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 15,
            fontWeight: 500,
            color: 'var(--ag-ink-primary)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-soft)',
            lineHeight: 1.45,
          }}
        >
          {description}
        </span>
      </span>
    </label>
  );
}
