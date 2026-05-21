'use client';

/**
 * SCR-020 — Today (pool + calendar grid prototype)
 *
 * Pure frontend visual prototype with hardcoded data. NO backend reads,
 * NO mutations. Demonstrates the warm-book editorial aesthetic per
 * 14_DESIGN_BRIEF.md + 15_DESIGN.md §9 wireframe.
 *
 * Layout (responsive, handled in CSS via .ag-today-split):
 *   - Mobile <1024px: stacked → header → push banner → DaySheet morning →
 *     HOY SIN HORARIO (pool) → AGENDA (06:00-22:00 hour grid) → Cerrar día.
 *   - Desktop ≥1024px: header → 2-column → [DaySheet + pool + week sidebar
 *     (280px)] + [calendar canvas (rest)] → Cerrar día below.
 *
 * The pool ↔ hour-slot drag is owned by TodayActivitiesBoard (DndContext).
 *
 * Visit at: http://localhost:3002/today
 */

import { useEffect, useState } from 'react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { DaySheetMorningSection } from '@/components/agenda/DaySheetMorningSection';
import { TodayActivitiesBoard } from '@/components/agenda/TodayActivitiesBoard';
import { PushPermissionBanner } from '@/components/agenda/PushPermissionBanner';
import { CloseDayModal, type CloseDayPayload } from '@/components/agenda/CloseDayModal';

// Hardcoded "today's wins" used to populate the CloseDayModal.
const TODAY_WINS = [
  { id: 'w1', title: 'Reunión Genomma — kickoff' },
  { id: 'w2', title: 'Reporte trimestral' },
  { id: 'w3', title: 'Gym 1h' },
];

export default function TodayPage() {
  const [closeOpen, setCloseOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  function handleClose(_payload: CloseDayPayload) {
    setCloseOpen(false);
    setToast('Día cerrado.');
  }

  return (
    <>
      <AgendaHeader dateLabel="Martes, 20 de mayo" initials="F" />

      <main
        style={{
          // Reserve room for fixed bottom nav (64px, mobile only) + safe-area.
          paddingBottom:
            'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
          marginInline: 'auto',
          width: '100%',
          paddingInline: 'var(--ag-space-4)',
          paddingTop: 'var(--ag-space-2)',
        }}
      >
        <PushPermissionBanner />

        <TodayActivitiesBoard
          morningSection={<DaySheetMorningSection />}
        />

        <button
          type="button"
          onClick={() => setCloseOpen(true)}
          style={{
            appearance: 'none',
            background: 'transparent',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-base)',
            padding: '12px 16px',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 15,
            color: 'var(--ag-ink-soft)',
            cursor: 'pointer',
            width: '100%',
            marginTop: 'var(--ag-space-5)',
          }}
        >
          Cerrar día
        </button>
      </main>

      <CloseDayModal
        open={closeOpen}
        wins={TODAY_WINS}
        onCancel={() => setCloseOpen(false)}
        onSubmit={handleClose}
      />

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 'calc(64px + 24px + env(safe-area-inset-bottom, 0px))',
            zIndex: 80,
            backgroundColor: 'var(--ag-ink-primary)',
            color: 'var(--ag-accent-on)',
            padding: '10px 16px',
            borderRadius: 'var(--ag-radius-pill)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 14,
            boxShadow:
              '0 1px 2px rgba(42, 40, 38, 0.12), 0 2px 6px rgba(42, 40, 38, 0.08)',
          }}
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
