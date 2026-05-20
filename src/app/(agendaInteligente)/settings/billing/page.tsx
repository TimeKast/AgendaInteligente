/**
 * SCR-036 — Settings / Plan (billing placeholder)
 *
 * Read-only: shows current plan (Free), usage meter for the current month,
 * and an italic-serif disclaimer. No upgrade / subscribe CTA — Stripe is
 * deferred to v2 per Discovery decision #7.
 */

import type { CSSProperties } from 'react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { PlanCard } from '@/components/agenda/PlanCard';
import { UsageMeter } from '@/components/agenda/UsageMeter';

export default function BillingSettingsPage() {
  return (
    <>
      <AgendaHeader dateLabel="Plan" backHref="/settings" />

      <main style={mainStyle}>
        <div style={{ padding: 'var(--ag-space-4)' }}>
          <PlanCard
            planName="Free"
            description="Acceso completo durante beta. Pricing por definir."
            memberSince="19 de mayo, 2026"
          />
        </div>

        <UsageMeter
          caption="Este mes"
          rows={[
            { label: 'AI calls', value: '2,341' },
            { label: 'Voice minutes', value: '8.4' },
            { label: 'Whisper seconds', value: '234' },
          ]}
        />

        <p
          style={{
            margin: 0,
            paddingInline: 'var(--ag-space-4)',
            paddingTop: 'var(--ag-space-5)',
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
            lineHeight: 1.5,
          }}
        >
          Pricing en desarrollo. Cuando salga, te avisamos por email.
        </p>
      </main>
    </>
  );
}

const mainStyle: CSSProperties = {
  paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
  maxWidth: 480,
  marginInline: 'auto',
};
