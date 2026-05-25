'use client';

/**
 * SCR-020 — Today (pool + calendar grid prototype)
 *
 * Pure frontend visual prototype con hardcoded data. NO backend reads,
 * NO mutations.
 *
 * Iteración 8: view toggle ahora controla SOLO la organización del pool
 * sidebar (mismo calendar grid en ambos modos):
 *   - 'fecha'  (default) → HOY SIN HORARIO / ESTA SEMANA / PENDIENTES.
 *   - 'matriz'           → Q1 / Q2 / Q3 / Q4.
 *
 * El calendar grid (06:00-22:00) y el drag-and-drop son idénticos en las
 * dos vistas. La vista "Lista" desapareció — el pool ya incluye backlog en
 * la vista por defecto.
 *
 * Visit: http://localhost:3002/today
 */

import { useEffect, useState } from 'react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { DaySheetMorningSection } from '@/components/agenda/DaySheetMorningSection';
import { TodayActivitiesBoard } from '@/components/agenda/TodayActivitiesBoard';
import { PushPermissionBanner } from '@/components/agenda/PushPermissionBanner';
import { CloseDayModal, type CloseDayPayload } from '@/components/agenda/CloseDayModal';
import {
  TodayViewToggle,
  type TodayView,
} from '@/components/agenda/TodayViewToggle';

// All of today's activities — surfaced en CloseDayModal para marcar avance.
const TODAY_ACTIVITIES = [
  {
    id: 'a1',
    title: 'Reunión Genomma — kickoff',
    projectLabel: 'Empresa Genomma',
    progressPercent: 100,
  },
  {
    id: 'a2',
    title: 'Reporte trimestral',
    projectLabel: 'Empresa Genomma',
    progressPercent: 60,
  },
  {
    id: 'a3',
    title: 'Revisar PR equipo',
    projectLabel: 'Empresa Genomma',
    progressPercent: 25,
  },
  {
    id: 'a4',
    title: 'Gym 1h',
    projectLabel: 'Personal',
    progressPercent: 0,
  },
  {
    id: 'a5',
    title: 'Llamar a mamá',
    projectLabel: 'Personal',
    progressPercent: 0,
  },
  {
    id: 'a6',
    title: 'Estudio alemán — capítulo 3',
    projectLabel: 'Personal',
    progressPercent: 40,
  },
];

export default function TodayPage() {
  const [view, setView] = useState<TodayView>('fecha');
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
          paddingBottom:
            'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
          marginInline: 'auto',
          width: '100%',
          paddingInline: 'var(--ag-space-4)',
          paddingTop: 'var(--ag-space-2)',
        }}
      >
        <PushPermissionBanner />

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            paddingBlock: 'var(--ag-space-3)',
            overflowX: 'auto',
          }}
        >
          <TodayViewToggle value={view} onChange={setView} />
        </div>

        <TodayActivitiesBoard
          view={view}
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
        activities={TODAY_ACTIVITIES}
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
