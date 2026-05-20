/**
 * SCR-020 — Today (mobile portrait prototype)
 *
 * Pure frontend visual prototype with hardcoded data. NO backend reads,
 * NO mutations. Demonstrates the warm-book editorial aesthetic per
 * 14_DESIGN_BRIEF.md + 15_DESIGN.md §9 wireframe.
 *
 * Visit at: http://localhost:3002/today  (port from package.json#ports.dev)
 */

import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { DaySheetMorningSection } from '@/components/agenda/DaySheetMorningSection';
import { ActivitySection } from '@/components/agenda/ActivitySection';
import { ActivityRow } from '@/components/agenda/ActivityRow';
import { FabMic } from '@/components/agenda/FabMic';
import { AgendaBottomNav } from '@/components/agenda/AgendaBottomNav';

export default function TodayPage() {
  return (
    <>
      <AgendaHeader dateLabel="Lunes, 19 de mayo" initials="F" />

      <main
        style={{
          // Reserve room for fixed bottom nav (64px) + safe-area.
          paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
          maxWidth: 480,
          marginInline: 'auto',
        }}
      >
        <DaySheetMorningSection
          intention="Terminar el reporte trimestral antes de las 13"
          energyPhysical={4}
          energyMental={5}
          energyEmotional={3}
        />

        <div
          style={{
            paddingInline: 'var(--ag-space-4)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Divider before activity list */}
          <hr
            style={{
              margin: 'var(--ag-space-2) 0',
              border: 'none',
              borderTop: '1px solid var(--ag-rule)',
            }}
          />

          <ActivitySection label="Mañana">
            <ActivityRow
              title="Reunión clientes"
              status="done"
              scheduledTime="10:00"
              priority={4}
              projectLabel="Empresa Genomma"
            />
            <ActivityRow
              title="Revisar PR equipo"
              status="todo"
              priority={5}
              projectLabel="Empresa Genomma"
            />
          </ActivitySection>

          <ActivitySection label="Tarde">
            <ActivityRow
              title="Reporte trimestral"
              status="in_progress"
              priority={5}
              projectLabel="Empresa Genomma"
            />
            <ActivityRow title="Gym 1h" status="todo" priority={2} projectLabel="Personal" />
          </ActivitySection>

          <ActivitySection label="Noche">
            <ActivityRow
              title="Estudio alemán 45min"
              status="todo"
              priority={3}
              projectLabel="Personal"
            />
            <ActivityRow
              title="Llamar a Juan"
              status="todo"
              scheduledTime="21:00"
              priority={3}
              projectLabel="Personal"
            />
          </ActivitySection>
        </div>
      </main>

      <FabMic />
      <AgendaBottomNav activeKey="today" />
    </>
  );
}
