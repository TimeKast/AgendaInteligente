'use client';

/**
 * SCR-033 — Settings / Integraciones
 *
 * Multi-account calendar provider sections (Google + Outlook placeholder) +
 * Discord card. Visual-only; no real OAuth.
 *
 * Google: 1 mocked email pre-connected. "+ Conectar otra cuenta" appends.
 * Outlook: disabled "Próximamente v2" but with the same multi-connection
 *          scaffolding visible.
 * Discord: single connection + multi-server picker.
 * WhatsApp: kept as legacy IntegrationCard placeholder.
 */

import type { CSSProperties } from 'react';
import { Calendar, MessageCircle, Mail } from 'lucide-react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { IntegrationCard } from '@/components/agenda/IntegrationCard';
import { CalendarConnectionsList } from '@/components/agenda/CalendarConnectionsList';
import { DiscordIntegrationCard } from '@/components/agenda/DiscordIntegrationCard';

export default function IntegrationsSettingsPage() {
  return (
    <>
      <AgendaHeader dateLabel="Integraciones" backHref="/settings" />

      <main className="ag-settings-content" style={mainStyle}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-3)',
            padding: 'var(--ag-space-4)',
          }}
        >
          <CalendarConnectionsList
            icon={<Calendar size={20} strokeWidth={1.5} />}
            providerName="Google Calendar"
            description="Conectá una o más cuentas — Agenda lee tus eventos y sugiere bloques libres."
            initialConnections={[
              {
                id: 'g-1',
                email: 'federico@gmail.com',
                lastSyncLabel: 'Última sync: hace 8 min · primary',
              },
            ]}
          />

          <CalendarConnectionsList
            icon={<Mail size={20} strokeWidth={1.5} />}
            providerName="Outlook Calendar"
            description="Misma idea que Google Calendar, para cuentas Microsoft."
            disabled
            disabledBadge="Próximamente v2"
          />

          <DiscordIntegrationCard />

          <IntegrationCard
            icon={<MessageCircle size={20} strokeWidth={1.5} />}
            name="WhatsApp"
            description="Recibí check-ins en WhatsApp cuando no abrís la app."
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
};
