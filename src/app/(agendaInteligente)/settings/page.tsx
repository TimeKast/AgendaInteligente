/**
 * SCR-024 — Settings hub (server-loaded).
 *
 * Loads session + counts (active projects, integrations connected,
 * notification schedule) to replace the prototype's hardcoded
 * "5 activos" / "0 conectadas" / etc. captions with real data.
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth/auth';
import { loadSettingsHub } from '@/lib/db/queries/settings';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { SettingsSection } from '@/components/agenda/SettingsSection';
import { SettingRow } from '@/components/agenda/SettingRow';
import { userInitial } from '@/lib/domain/day-calc';

const INTENSITY_LABEL: Record<string, string> = {
  sharp: 'Sharp',
  standard: 'Standard',
  gentle: 'Gentle',
  listening: 'Listening',
};
const LANGUAGE_LABEL: Record<string, string> = {
  es: 'Español',
  en: 'English',
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/settings');
  }
  const data = await loadSettingsHub(session.user.id);
  const initials = userInitial(data?.name ?? data?.email);

  return (
    <>
      <AgendaHeader dateLabel="Settings" initials={initials} />

      <main
        className="ag-settings-content ag-settings-content--hub"
        style={{
          paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <SettingsSection label="Organización">
          <SettingRow
            label="Proyectos"
            value={`${data?.projectsActive ?? 0} ${data?.projectsActive === 1 ? 'activo' : 'activos'}`}
            href="/projects"
            hint="Crear, archivar o cerrar."
          />
          <SettingRow
            label="Stats"
            value="Esta semana"
            href="/stats"
            hint="Patrones, rachas y métricas."
          />
        </SettingsSection>

        <SettingsSection label="Cuenta">
          <SettingRow label="Mi cuenta" value={data?.email ?? ''} href="/settings/account" />
        </SettingsSection>

        <SettingsSection label="Check-ins">
          <SettingRow
            label="Horarios y canales"
            value="3 horarios"
            href="/settings/notifications"
          />
          <SettingRow
            label="Intensity mode"
            value={INTENSITY_LABEL[data?.intensityMode ?? 'gentle'] ?? 'Gentle'}
            href="/settings/intensity"
            hint="Cómo el agente te interpela."
          />
        </SettingsSection>

        <SettingsSection label="Preferencias">
          <SettingRow
            label="Idioma & zona horaria"
            value={`${LANGUAGE_LABEL[data?.preferredLanguage ?? 'es'] ?? 'Español'} · ${data?.timezone ?? 'UTC'}`}
            href="/settings/language"
          />
          <SettingRow label="Apariencia" value="Claro" href="/settings/appearance" />
          <SettingRow
            label="Integraciones"
            value={`${data?.integrationsConnected ?? 0} ${data?.integrationsConnected === 1 ? 'conectada' : 'conectadas'}`}
            href="/settings/integrations"
          />
        </SettingsSection>

        <SettingsSection label="Plan">
          <SettingRow label="Billing" value="Free" href="/settings/billing" />
        </SettingsSection>

        <SettingsSection label="Privacy & data">
          <SettingRow label="Privacy & data" href="/settings/privacy" />
        </SettingsSection>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingBlock: 'var(--ag-space-6)',
          }}
        >
          <Link
            href="/api/auth/signout"
            prefetch={false}
            style={{
              color: 'var(--ag-ink-hint)',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              padding: '8px 16px',
              textDecoration: 'none',
            }}
          >
            Cerrar sesión
          </Link>
        </div>
      </main>
    </>
  );
}
