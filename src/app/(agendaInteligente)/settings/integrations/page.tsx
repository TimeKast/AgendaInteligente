'use client';

/**
 * SCR-033 — Settings / Integraciones
 *
 * Visual-only. Google Calendar card simulates connect with 1.5s loading,
 * then shows connected state with sync + disconnect buttons. WhatsApp and
 * Outlook shown as disabled placeholders ("Próximamente v2").
 */

import type { CSSProperties } from 'react';
import { Calendar, MessageCircle, Mail } from 'lucide-react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { IntegrationCard } from '@/components/agenda/IntegrationCard';

export default function IntegrationsSettingsPage() {
  return (
    <>
      <AgendaHeader dateLabel="Integraciones" backHref="/settings" />

      <main style={mainStyle}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-3)',
            padding: 'var(--ag-space-4)',
          }}
        >
          <IntegrationCard
            icon={<Calendar size={20} strokeWidth={1.5} />}
            name="Google Calendar"
            description="Conectá para que Agenda vea tus eventos y sugiera bloques libres."
            initialState="disconnected"
          />

          <IntegrationCard
            icon={<MessageCircle size={20} strokeWidth={1.5} />}
            name="WhatsApp"
            description="Recibí check-ins en WhatsApp cuando no abrís la app."
            initialState="disabled"
            disabledBadge="Próximamente v2"
          />

          <IntegrationCard
            icon={<Mail size={20} strokeWidth={1.5} />}
            name="Outlook Calendar"
            description="Misma idea que Google Calendar, para cuentas Microsoft."
            initialState="disabled"
            disabledBadge="Próximamente v2"
          />
        </div>
      </main>
    </>
  );
}

const mainStyle: CSSProperties = {
  paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
  maxWidth: 480,
  marginInline: 'auto',
};
