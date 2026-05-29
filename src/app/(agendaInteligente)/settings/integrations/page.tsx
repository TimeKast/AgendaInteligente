/**
 * SCR-033 — Settings / Integraciones (server-loaded).
 *
 * Real data:
 *   - Google Calendar connections from `calendar_connections` (multi-account).
 *     "+ Conectar otra cuenta" → /api/calendar/google/connect.
 *     "Desconectar" → /api/calendar/connections/[id]/disconnect.
 *   - Discord webhook URL from `notification_prefs.discord_webhook_url`.
 *     Inline form (no OAuth — Discord webhooks just take a pasted URL).
 *
 * Placeholders (no v1 backend yet):
 *   - Outlook Calendar — disabled card.
 *   - WhatsApp — disabled card.
 */

import type { CSSProperties } from 'react';
import { redirect } from 'next/navigation';
import { Calendar, MessageCircle, Mail, MessageSquare } from 'lucide-react';
import { auth } from '@/lib/auth/auth';
import { loadIntegrationsSettings } from '@/lib/db/queries/integrations';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { IntegrationCard } from '@/components/agenda/IntegrationCard';
import { CalendarConnectionsListLive } from '@/components/settings/CalendarConnectionsListLive';
import { DiscordWebhookForm } from '@/components/settings/DiscordWebhookForm';

export default async function IntegrationsSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/settings/integrations');
  }
  const data = await loadIntegrationsSettings(session.user.id);

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
          <CalendarConnectionsListLive
            icon={<Calendar size={20} strokeWidth={1.5} />}
            providerName="Google Calendar"
            description="Conecta una o más cuentas — Agenda lee tus eventos y sugiere bloques libres."
            connections={data.googleConnections}
            connectHref="/api/calendar/google/connect"
          />

          <CalendarConnectionsListLive
            icon={<Mail size={20} strokeWidth={1.5} />}
            providerName="Outlook Calendar"
            description="Misma idea que Google Calendar, para cuentas Microsoft."
            connections={[]}
            connectHref={null}
            disabledBadge="Próximamente v2"
          />

          <section
            style={{
              padding: 'var(--ag-space-4)',
              borderRadius: 'var(--ag-radius-card)',
              border: '1px solid var(--ag-rule)',
              backgroundColor: 'var(--ag-bg-elevated)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ag-space-3)',
            }}
          >
            <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--ag-space-2)' }}>
              <MessageSquare size={20} strokeWidth={1.5} style={{ color: 'var(--ag-ink-soft)' }} />
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--ag-font-display)',
                  fontSize: 16,
                  fontWeight: 500,
                  color: 'var(--ag-ink-primary)',
                }}
              >
                Discord
              </h3>
            </header>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--ag-font-body)',
                fontSize: 13,
                color: 'var(--ag-ink-soft)',
                lineHeight: 1.45,
              }}
            >
              Pega un webhook de tu servidor (Server Settings → Integrations → Webhooks → New
              Webhook → Copy Webhook URL). El agente envía check-ins ahí.
            </p>
            <DiscordWebhookForm initialUrl={data.discordWebhookUrl} />
          </section>

          <IntegrationCard
            icon={<MessageCircle size={20} strokeWidth={1.5} />}
            name="WhatsApp"
            description="Recibe check-ins en WhatsApp cuando no abres la app."
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
