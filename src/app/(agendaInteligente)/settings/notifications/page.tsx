/**
 * SCR-030 — Settings → Check-ins (mobile portrait prototype)
 *
 * Time pickers (visual only via type="time") + per-channel toggles.
 * Includes a "Silenciar agente" row using MutePickerModal.
 */

import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { SettingsSection } from '@/components/agenda/SettingsSection';
import { SettingRow } from '@/components/agenda/SettingRow';
import { Toggle } from '@/components/agenda/Toggle';
import { MutePickerModal } from '@/components/agenda/MutePickerModal';

function TimeField({ defaultValue }: { defaultValue: string }) {
  return (
    <input
      type="time"
      defaultValue={defaultValue}
      aria-label={`Hora ${defaultValue}`}
      style={{
        appearance: 'none',
        border: '1px solid var(--ag-rule)',
        background: 'var(--ag-bg)',
        color: 'var(--ag-ink-primary)',
        padding: '6px 10px',
        borderRadius: 'var(--ag-radius-base)',
        fontFamily: 'var(--ag-font-mono)',
        fontSize: 13,
      }}
    />
  );
}

export default function NotificationsSettingsPage() {
  return (
    <>
      <AgendaHeader dateLabel="Check-ins" backHref="/settings" />

      <main
        style={{
          paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
          maxWidth: 480,
          marginInline: 'auto',
        }}
      >
        <SettingsSection label="Horarios diarios">
          <SettingRow
            label="Mañana"
            hint="Intención + energía."
            rightSlot={<TimeField defaultValue="08:00" />}
          />
          <SettingRow
            label="Mediodía"
            hint="Check breve."
            rightSlot={<TimeField defaultValue="13:00" />}
          />
          <SettingRow
            label="Noche"
            hint="Cierre del día."
            rightSlot={<TimeField defaultValue="21:00" />}
          />
        </SettingsSection>

        <SettingsSection label="Semana">
          <SettingRow
            label="Kickoff lunes"
            rightSlot={<TimeField defaultValue="08:30" />}
          />
          <SettingRow
            label="Review sábado"
            rightSlot={<TimeField defaultValue="20:00" />}
          />
        </SettingsSection>

        <SettingsSection label="Canales">
          <SettingRow label="Push" rightSlot={<Toggle defaultChecked />} />
          <SettingRow label="Email" rightSlot={<Toggle defaultChecked={false} />} />
          <SettingRow label="WhatsApp" hint="Próximamente." rightSlot={<Toggle />} />
          <SettingRow label="Silenciar agente" rightSlot={<MutePickerModal />} />
        </SettingsSection>
      </main>
    </>
  );
}
