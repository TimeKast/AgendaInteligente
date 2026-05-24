'use client';

/**
 * SCR-030 — Settings → Check-ins (mobile portrait prototype)
 *
 * Time pickers (visual only via type="time") + per-channel toggles.
 * Includes a "Silenciar agente" row using MutePickerModal.
 *
 * "Días sin actividad" section lets the user mark weekends + arbitrary
 * dates/ranges as off-days so the cron doesn't ping them. Visual only
 * (no real persistence or cron integration — chips live in local state).
 */

import { useState } from 'react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { SettingsSection } from '@/components/agenda/SettingsSection';
import { SettingRow } from '@/components/agenda/SettingRow';
import { Toggle } from '@/components/agenda/Toggle';
import { MutePickerModal } from '@/components/agenda/MutePickerModal';
import { DayOffChip, type DayOff } from '@/components/agenda/DayOffChip';
import { DaysOffPicker } from '@/components/agenda/DaysOffPicker';

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

/** Seed: a couple of holidays + a vacation range to show the chip pattern. */
const INITIAL_DAYS_OFF: DayOff[] = [
  { id: 'd-001', from: '2026-12-25', to: '2026-12-25', label: 'Navidad' },
  { id: 'd-002', from: '2027-01-01', to: '2027-01-01', label: 'Año nuevo' },
  { id: 'd-003', from: '2026-08-15', to: '2026-08-22', label: 'Vacaciones' },
];

export default function NotificationsSettingsPage() {
  const [daysOff, setDaysOff] = useState<DayOff[]>(INITIAL_DAYS_OFF);
  const [pickerOpen, setPickerOpen] = useState(false);

  function addDayOff(input: Omit<DayOff, 'id'>) {
    setDaysOff((prev) => [
      ...prev,
      { ...input, id: `d-${Date.now()}` },
    ]);
    setPickerOpen(false);
  }

  function removeDayOff(id: string) {
    setDaysOff((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <>
      <AgendaHeader dateLabel="Check-ins" backHref="/settings" />

      <main
        className="ag-settings-content"
        style={{
          paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
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

        <SettingsSection label="Días sin actividad">
          <SettingRow
            label="Trabajo fines de semana"
            hint="Si lo dejás apagado, no te molesto sábado ni domingo."
            rightSlot={<Toggle defaultChecked={false} />}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ag-space-3)',
              padding: 'var(--ag-space-3) var(--ag-space-4)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--ag-font-display)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--ag-ink-soft)',
                lineHeight: 1.5,
              }}
            >
              Vacaciones, feriados, días personales. No te voy a buscar en estos días.
            </p>

            {daysOff.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--ag-space-2)',
                }}
              >
                {daysOff.map((d) => (
                  <DayOffChip key={d.id} dayOff={d} onRemove={removeDayOff} />
                ))}
              </div>
            ) : (
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--ag-font-display)',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: 'var(--ag-ink-hint)',
                }}
              >
                Sin días marcados todavía.
              </p>
            )}

            <div>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                style={{
                  appearance: 'none',
                  background: 'transparent',
                  border: '1px solid var(--ag-rule)',
                  borderRadius: 'var(--ag-radius-base)',
                  padding: '8px 14px',
                  fontFamily: 'var(--ag-font-body)',
                  fontSize: 14,
                  color: 'var(--ag-ink-soft)',
                  cursor: 'pointer',
                }}
              >
                + Agregar día
              </button>
            </div>
          </div>
        </SettingsSection>
      </main>

      <DaysOffPicker
        open={pickerOpen}
        onCancel={() => setPickerOpen(false)}
        onSave={addDayOff}
      />
    </>
  );
}
