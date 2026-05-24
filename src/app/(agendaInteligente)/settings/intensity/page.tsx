/**
 * SCR-031 — Settings → Intensity mode (mobile portrait prototype)
 *
 * Four radio cards. Selecting "Listening" triggers a confirmation modal.
 * Visual only. No persistence.
 */

import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { IntensityCard } from '@/components/agenda/IntensityCard';

export default function IntensitySettingsPage() {
  return (
    <>
      <AgendaHeader dateLabel="Intensity mode" backHref="/settings" />

      <main
        className="ag-settings-content"
        style={{
          paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <p
          style={{
            margin: 'var(--ag-space-4) var(--ag-space-4) var(--ag-space-5)',
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 16,
            lineHeight: 1.55,
            color: 'var(--ag-ink-soft)',
          }}
        >
          Cómo el agente te interpela. Podés cambiar en cualquier momento.
        </p>

        <IntensityCard
          name="intensity"
          value="sharp"
          title="Sharp"
          description="Directo, sin rodeos. Cuestiona lenguaje vago."
        />
        <IntensityCard
          name="intensity"
          value="standard"
          title="Standard"
          description="Equilibrado. Refleja antes de cuestionar."
          tag="Default"
          defaultChecked
        />
        <IntensityCard
          name="intensity"
          value="gentle"
          title="Gentle"
          description="Cálido. Espera más antes de presionar."
        />
        <IntensityCard
          name="intensity"
          value="listening"
          title="Listening"
          description="Sólo escucha. No interpela. Se auto-revierte en 48h."
          showWarning
        />
      </main>
    </>
  );
}
