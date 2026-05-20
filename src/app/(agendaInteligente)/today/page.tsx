/**
 * SCR-020 — Today (mobile portrait prototype)
 *
 * Pure frontend visual prototype with hardcoded data. NO backend reads,
 * NO mutations. Demonstrates the warm-book editorial aesthetic per
 * 14_DESIGN_BRIEF.md + 15_DESIGN.md §9 wireframe.
 *
 * Round 2 additions:
 *   - SCR-055 PushPermissionBanner at top of main.
 *   - SCR-051 inline ActivityQuickAdd (inside TodayActivitiesBoard).
 *   - SCR-052 per-row ⋯ → ActivityStatusModal (inside TodayActivitiesBoard).
 *
 * Visit at: http://localhost:3002/today  (port from package.json#ports.dev)
 */

import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { DaySheetMorningSection } from '@/components/agenda/DaySheetMorningSection';
import { TodayActivitiesBoard } from '@/components/agenda/TodayActivitiesBoard';
import { PushPermissionBanner } from '@/components/agenda/PushPermissionBanner';

export default function TodayPage() {
  return (
    <>
      <AgendaHeader dateLabel="Martes, 20 de mayo" initials="F" />

      <main
        style={{
          // Reserve room for fixed bottom nav (64px) + safe-area.
          paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
          maxWidth: 480,
          marginInline: 'auto',
        }}
      >
        <PushPermissionBanner />

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

          <TodayActivitiesBoard />
        </div>
      </main>
    </>
  );
}
