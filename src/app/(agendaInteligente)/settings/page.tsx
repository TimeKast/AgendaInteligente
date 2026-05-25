/**
 * SCR-024 — Settings hub (mobile portrait prototype)
 *
 * Visual-only. Rows link to functional sub-screens (account, language,
 * appearance, integrations, billing, privacy, notifications, intensity,
 * categories). The "Cerrar sesión" button is a ghost — no real sign-out
 * action wired in this prototype.
 */

import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { SettingsSection } from '@/components/agenda/SettingsSection';
import { SettingRow } from '@/components/agenda/SettingRow';

export default function SettingsPage() {
  return (
    <>
      <AgendaHeader dateLabel="Settings" initials="F" />

      <main
        className="ag-settings-content ag-settings-content--hub"
        style={{
          paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <SettingsSection label="Organización">
          <SettingRow
            label="Proyectos"
            value="5 activos"
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
          <SettingRow label="Mi cuenta" value="fedelevi@hotmail.com" href="/settings/account" />
        </SettingsSection>

        <SettingsSection label="Check-ins">
          <SettingRow
            label="Horarios y canales"
            value="3 activos"
            href="/settings/notifications"
          />
          <SettingRow
            label="Intensity mode"
            value="Standard"
            href="/settings/intensity"
            hint="Cómo el agente te interpela."
          />
        </SettingsSection>

        <SettingsSection label="Preferencias">
          <SettingRow
            label="Idioma & zona horaria"
            value="Español · MX"
            href="/settings/language"
          />
          <SettingRow label="Apariencia" value="Claro" href="/settings/appearance" />
          <SettingRow
            label="Integraciones"
            value="0 conectadas"
            href="/settings/integrations"
          />
          <SettingRow label="Ver onboarding demo" href="/onboarding/language" />
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
          <button
            type="button"
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--ag-ink-hint)',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              cursor: 'pointer',
              padding: '8px 16px',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </main>
    </>
  );
}
