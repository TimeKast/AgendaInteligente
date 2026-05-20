/**
 * SCR-024 — Settings hub (mobile portrait prototype)
 *
 * Visual-only. Rows link to functional sub-screens (intensity, notifications)
 * or to placeholder paths. The "Cerrar sesión" button is a ghost — no real
 * sign-out action wired in this prototype.
 */

import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { SettingsSection } from '@/components/agenda/SettingsSection';
import { SettingRow } from '@/components/agenda/SettingRow';

export default function SettingsPage() {
  return (
    <>
      <AgendaHeader dateLabel="Settings" initials="F" />

      <main
        style={{
          paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
          maxWidth: 480,
          marginInline: 'auto',
        }}
      >
        <SettingsSection label="Organización">
          <SettingRow
            label="Categorías"
            value="4 categorías"
            href="/categories"
            hint="Reordenar, renombrar o borrar."
          />
        </SettingsSection>

        <SettingsSection label="Cuenta">
          <SettingRow label="Email" value="fedelevi@hotmail.com" href="/settings/account" />
          <SettingRow label="Idioma" value="Español" href="/settings/language" />
          <SettingRow label="Zona horaria" value="America/Mexico_City" href="/settings/timezone" />
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
          <SettingRow label="Apariencia" value="Sistema" href="/settings/appearance" />
          <SettingRow label="Calendar sync" value="Conectar" href="/settings/calendar" />
          <SettingRow label="Ver onboarding demo" href="/onboarding/language" />
        </SettingsSection>

        <SettingsSection label="Plan">
          <SettingRow label="Plan actual" value="Free" href="/settings/plan" />
          <SettingRow label="Facturación" href="/settings/billing" />
        </SettingsSection>

        <SettingsSection label="Privacy & data">
          <SettingRow label="Exportar mis datos" href="/settings/export" />
          <SettingRow label="Borrar cuenta" href="/settings/delete" />
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
