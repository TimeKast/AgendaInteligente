'use client';

/**
 * SCR-MONTH — Monthly planning view (prototype).
 *
 * Visual-only. Hardcoded month data. Visit at /month.
 *
 * Layout:
 *  - AgendaHeader "Mes"
 *  - WeekMonthTabs (Semana | Mes) — shared toggle, sits under header.
 *  - MonthNavigation (prev/next/Este mes).
 *  - MonthPlanner: pool + calendar grid (mobile stacks, desktop side-by-side).
 *
 * The month grid renders the full visible weeks (padded with prev/next month
 * overflow cells). Drag from the pool onto a day cell to assign that date;
 * drag back to the pool to unassign; drag day → day to move.
 *
 * Goal deadlines that fall inside the visible weeks are marked on their cell
 * with a small Target icon colored by the goal's scope.
 */

import { useState } from 'react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { WeekMonthTabs } from '@/components/agenda/WeekMonthTabs';
import {
  MonthNavigation,
  firstOfMonth,
  addMonths,
} from '@/components/agenda/MonthNavigation';
import {
  MonthPlanner,
  type MonthPlannerActivity,
  type MonthPlannerGoal,
} from '@/components/agenda/MonthPlanner';

// Hardcoded month seed: ~28 activities spread across May 2026 + pool.
// 70% scheduled, 30% in the pool.
const SEED_ACTIVITIES: MonthPlannerActivity[] = [
  // --- POOL (no scheduledDates) ---
  { id: 'mp1', title: 'Llamar a contador', status: 'todo', projectLabel: 'Operaciones', scheduledDates: [] },
  { id: 'mp2', title: 'Comprar regalo cumpleaños', status: 'todo', projectLabel: 'Personal', scheduledDates: [], deadline: '2026-06-15' },
  { id: 'mp3', title: 'Renovar seguro auto', status: 'todo', projectLabel: 'Personal', scheduledDates: [] },
  { id: 'mp4', title: 'Backup laptop', status: 'todo', projectLabel: 'Personal', scheduledDates: [] },
  { id: 'mp5', title: 'Investigar SaaS competidores', status: 'todo', projectLabel: 'AgendaIA', scheduledDates: [] },
  { id: 'mp6', title: 'Reunión médico anual', status: 'todo', projectLabel: 'Salud', scheduledDates: [] },
  { id: 'mp7', title: 'Cita dentista', status: 'todo', projectLabel: 'Salud', scheduledDates: [], deadline: '2026-06-10' },
  { id: 'mp8', title: 'Limpiar inbox a cero', status: 'todo', projectLabel: 'Inbox', scheduledDates: [] },

  // --- SCHEDULED — May 2026 (week 1: 4-9) ---
  { id: 'md1', title: 'Kickoff trimestre', status: 'done', projectLabel: 'AgendaIA', scheduledDates: ['2026-05-04'] },
  { id: 'md2', title: 'Estructura DB inicial', status: 'done', projectLabel: 'AgendaIA', scheduledDates: ['2026-05-05'] },
  { id: 'md3', title: 'Diseño tokens', status: 'done', projectLabel: 'AgendaIA', scheduledDates: ['2026-05-06'] },
  { id: 'md4', title: 'Sesión de yoga', status: 'done', projectLabel: 'Salud', scheduledDates: ['2026-05-07'] },
  { id: 'md5', title: 'Llamada con cliente Genomma', status: 'done', projectLabel: 'Genomma', scheduledDates: ['2026-05-08'] },

  // --- week 2: 11-16 ---
  { id: 'md6', title: 'Implementar auth', status: 'done', projectLabel: 'AgendaIA', scheduledDates: ['2026-05-11'] },
  { id: 'md7', title: 'Revisar PRs equipo', status: 'done', projectLabel: 'AgendaIA', scheduledDates: ['2026-05-12'] },
  { id: 'md8', title: 'Cena familia', status: 'done', projectLabel: 'Personal', scheduledDates: ['2026-05-13'] },
  { id: 'md9', title: 'Demo a inversor', status: 'in_progress', projectLabel: 'AgendaIA', scheduledDates: ['2026-05-14'] },
  { id: 'md10', title: 'Diseño Today', status: 'in_progress', projectLabel: 'AgendaIA', scheduledDates: ['2026-05-15'] },

  // --- week 3: 18-23 (current week — today = 22) ---
  { id: 'md11', title: 'Reunión equipo', status: 'done', projectLabel: 'AgendaIA', scheduledDates: ['2026-05-18'] },
  { id: 'md12', title: 'Push deploy staging', status: 'todo', projectLabel: 'AgendaIA', scheduledDates: ['2026-05-19'] },
  { id: 'md13', title: 'Gym', status: 'done', projectLabel: 'Personal', scheduledDates: ['2026-05-20'] },
  { id: 'md14', title: 'Doc onboarding', status: 'todo', projectLabel: 'AgendaIA', scheduledDates: ['2026-05-21'] },
  { id: 'md15', title: 'Llamada inversor', status: 'todo', projectLabel: 'AgendaIA', scheduledDates: ['2026-05-22'] },
  { id: 'md16', title: 'Review semanal', status: 'todo', projectLabel: 'Rituales', scheduledDates: ['2026-05-23'] },

  // --- week 4: 25-30 ---
  { id: 'md17', title: 'Onboarding beta users', status: 'todo', projectLabel: 'AgendaIA', scheduledDates: ['2026-05-26'] },
  { id: 'md18', title: 'Análisis métricas', status: 'todo', projectLabel: 'AgendaIA', scheduledDates: ['2026-05-27'] },
  { id: 'md19', title: 'Café con Lucas', status: 'todo', projectLabel: 'Personal', scheduledDates: ['2026-05-28'] },
  { id: 'md20', title: 'Cierre de mes', status: 'todo', projectLabel: 'Operaciones', scheduledDates: ['2026-05-29'] },
];

// Hardcoded goals with deadlines.
// - Q2 2026 goal "Lanzar v0.5" lands on 2026-06-30 (visible if user navigates
//   one month forward).
// - Year 2026 goal "Producto vendible" lands on 2026-12-31 (visible in dec).
// - One Q2 2026 sub-goal lands inside May 2026 to demonstrate the marker
//   without needing to navigate.
const SEED_GOALS: MonthPlannerGoal[] = [
  { id: 'g1', title: 'Lanzar AgendaInteligente v0.5', scopeKind: 'quarter', deadline: '2026-06-30' },
  { id: 'g2', title: 'Tener producto vendible', scopeKind: 'year', deadline: '2026-12-31' },
  { id: 'g3', title: 'Demo beta a 10 usuarios', scopeKind: 'quarter', deadline: '2026-05-29' },
  { id: 'g4', title: 'Aprender alemán B1', scopeKind: 'quarter', deadline: '2026-09-30' },
];

export default function MonthPage() {
  // Frozen "today" for the prototype (deterministic offset captions).
  const today = new Date(2026, 4, 22); // 2026-05-22

  const [currentMonthStart, setCurrentMonthStart] = useState<Date>(() =>
    firstOfMonth(today),
  );

  function shiftMonth(delta: number) {
    setCurrentMonthStart((prev) => addMonths(prev, delta));
  }

  return (
    <>
      <AgendaHeader dateLabel="Mes" initials="F" />

      <main
        style={{
          paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
          maxWidth: 1280,
          marginInline: 'auto',
          width: '100%',
        }}
      >
        <WeekMonthTabs active="month" />

        <MonthNavigation
          monthStart={currentMonthStart}
          today={today}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
          onToday={() => setCurrentMonthStart(firstOfMonth(today))}
        />

        <hr
          style={{
            margin: 'var(--ag-space-2) var(--ag-space-4) var(--ag-space-3)',
            border: 'none',
            borderTop: '1px solid var(--ag-rule)',
          }}
        />

        <MonthPlanner
          monthStart={currentMonthStart}
          today={today}
          seedActivities={SEED_ACTIVITIES}
          seedGoals={SEED_GOALS}
        />
      </main>
    </>
  );
}
