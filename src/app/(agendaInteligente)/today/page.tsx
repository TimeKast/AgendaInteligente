'use client';

/**
 * SCR-020 — Today (pool + calendar grid prototype)
 *
 * Pure frontend visual prototype with hardcoded data. NO backend reads,
 * NO mutations. Demonstrates the warm-book editorial aesthetic per
 * 14_DESIGN_BRIEF.md + 15_DESIGN.md §9 wireframe.
 *
 * Iteration 6: 3 view modes via TodayViewToggle.
 *   - 'calendar' (default) → existing pool + hour grid (TodayActivitiesBoard).
 *   - 'matrix'             → Eisenhower 2x2 (EisenhowerMatrix).
 *   - 'list'               → 4 vertical sections (TodayListView).
 *
 * Visit at: http://localhost:3002/today
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
import {
  EisenhowerMatrix,
  type MatrixActivity,
} from '@/components/agenda/EisenhowerMatrix';
import {
  TodayListView,
  type ListActivity,
} from '@/components/agenda/TodayListView';

// Hardcoded "today's wins" used to populate the CloseDayModal.
const TODAY_WINS = [
  { id: 'w1', title: 'Reunión Genomma — kickoff' },
  { id: 'w2', title: 'Reporte trimestral' },
  { id: 'w3', title: 'Gym 1h' },
];

// All of today's activities — surfaced in the new "Actividades de hoy" section
// of CloseDayModal so the user can mark a % avance per row.
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

const PROTO_TODAY = '2026-05-20';
const PROTO_WEEK_START = '2026-05-17'; // domingo
const PROTO_WEEK_END = '2026-05-23'; // sábado

// Hardcoded matrix data (visual demo of Eisenhower quadrants).
const MATRIX_ACTIVITIES: MatrixActivity[] = [
  {
    id: 'm1',
    title: 'Reporte trimestral (deadline mañana)',
    status: 'in_progress',
    priority: 5,
    projectLabel: 'Empresa Genomma',
    quadrant: 1,
  },
  {
    id: 'm2',
    title: 'Llamar a Juan — cliente molesto',
    status: 'todo',
    priority: 4,
    projectLabel: 'Empresa Genomma',
    quadrant: 1,
  },
  {
    id: 'm3',
    title: 'Estudio alemán — capítulo 3',
    status: 'in_progress',
    priority: 4,
    projectLabel: 'Personal',
    quadrant: 2,
  },
  {
    id: 'm4',
    title: 'Diseñar landing v0.5',
    status: 'in_progress',
    priority: 4,
    projectLabel: 'Empresa Genomma',
    quadrant: 2,
  },
  {
    id: 'm5',
    title: 'Gym 1h',
    status: 'todo',
    priority: 3,
    projectLabel: 'Personal',
    quadrant: 2,
  },
  {
    id: 'm6',
    title: 'Revisar emails',
    status: 'todo',
    priority: 2,
    projectLabel: 'Inbox',
    quadrant: 3,
  },
  {
    id: 'm7',
    title: 'Reunión semanal de equipo',
    status: 'todo',
    priority: 2,
    projectLabel: 'Empresa Genomma',
    quadrant: 3,
  },
  {
    id: 'm8',
    title: 'Leer feed de noticias',
    status: 'todo',
    priority: 1,
    projectLabel: 'Personal',
    quadrant: 4,
  },
  {
    id: 'm9',
    title: 'Organizar bookmarks',
    status: 'todo',
    priority: 1,
    projectLabel: 'Personal',
    quadrant: 4,
  },
];

// Hardcoded list-view data (mix of today / this week / pending / scheduled).
const LIST_ACTIVITIES: ListActivity[] = [
  {
    id: 'l1',
    title: 'Reunión Genomma — kickoff',
    status: 'todo',
    priority: 4,
    projectLabel: 'Empresa Genomma',
    scheduledTime: '08:00',
    scheduledDate: PROTO_TODAY,
    quadrant: 1,
  },
  {
    id: 'l2',
    title: 'Reporte trimestral',
    status: 'in_progress',
    priority: 5,
    projectLabel: 'Empresa Genomma',
    scheduledTime: '11:00',
    scheduledDate: PROTO_TODAY,
    deadline: '2026-05-21',
    progressPercent: 60,
    quadrant: 1,
  },
  {
    id: 'l3',
    title: 'Revisar PR equipo',
    status: 'todo',
    priority: 3,
    projectLabel: 'Empresa Genomma',
    scheduledDate: PROTO_TODAY,
    progressPercent: 25,
    quadrant: 2,
  },
  {
    id: 'l4',
    title: 'Gym 1h',
    status: 'todo',
    priority: 2,
    projectLabel: 'Personal',
    scheduledDate: PROTO_TODAY,
    quadrant: 2,
  },
  {
    id: 'l5',
    title: 'Llamar a mamá',
    status: 'todo',
    priority: 3,
    projectLabel: 'Personal',
    scheduledTime: '19:00',
    scheduledDate: PROTO_TODAY,
    quadrant: 3,
  },
  {
    id: 'l6',
    title: 'Borrador propuesta cliente',
    status: 'todo',
    priority: 4,
    projectLabel: 'Empresa Genomma',
    scheduledDate: '2026-05-22',
    quadrant: 2,
  },
  {
    id: 'l7',
    title: 'Estudio alemán — capítulo 3',
    status: 'todo',
    priority: 3,
    projectLabel: 'Personal',
    scheduledDate: '2026-05-22',
    quadrant: 2,
  },
  {
    id: 'l8',
    title: 'Pagar tarjeta',
    status: 'todo',
    priority: 2,
    projectLabel: 'Personal',
    scheduledDate: '2026-05-23',
    quadrant: 3,
  },
  {
    id: 'l9',
    title: 'Investigar competencia',
    status: 'todo',
    priority: 3,
    projectLabel: 'Empresa Genomma',
    deadline: '2026-07-15',
    quadrant: 4,
  },
  {
    id: 'l10',
    title: 'Refactor schema usuarios',
    status: 'todo',
    priority: 3,
    projectLabel: 'Side project Web3',
    deadline: '2026-06-10',
    quadrant: 4,
  },
  {
    id: 'l11',
    title: 'Leer libro de la semana',
    status: 'todo',
    priority: 1,
    projectLabel: 'Personal',
    quadrant: 4,
  },
];

export default function TodayPage() {
  const [view, setView] = useState<TodayView>('calendar');
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

        {view === 'calendar' ? (
          <TodayActivitiesBoard
            morningSection={<DaySheetMorningSection />}
          />
        ) : null}

        {view === 'matrix' ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ag-space-4)',
            }}
          >
            <DaySheetMorningSection />
            <EisenhowerMatrix activities={MATRIX_ACTIVITIES} />
          </div>
        ) : null}

        {view === 'list' ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ag-space-4)',
            }}
          >
            <DaySheetMorningSection />
            <TodayListView
              todayISO={PROTO_TODAY}
              weekStartISO={PROTO_WEEK_START}
              weekEndISO={PROTO_WEEK_END}
              activities={LIST_ACTIVITIES}
            />
          </div>
        ) : null}

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
