'use client';

/**
 * SCR-021 — Week (planning swimlane prototype)
 *
 * Visual-only. Hardcoded week data. Visit at /week.
 *
 * Round 4: shift from "read-only day cards" to a planeable swimlane.
 *  - "Pendientes sin día" pool at top (mobile) / left sidebar (desktop).
 *  - 7 day columns (stacked mobile / horizontal kanban desktop).
 *  - Drag activity row from pool → day column → updates scheduledDate.
 *  - Drag between days, or back to pool.
 *  - Inline "+ Tarea" per day for quick capture.
 *
 * The Week scope only assigns DATE, not time — schedule a time on /today.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { WeekSheetKickoffSection } from '@/components/agenda/WeekSheetKickoffSection';
import { WeekNavigation, sundayOf } from '@/components/agenda/WeekNavigation';
import { WeekSwimlane } from '@/components/agenda/WeekSwimlane';

const DAY_MS = 24 * 60 * 60 * 1000;

// Hardcoded seed data for the prototype. Mix of pool + per-day activities.
const SEED_ACTIVITIES = [
  // Pool — no scheduledDate yet
  { id: 'p1', title: 'Llamada con cliente Genomma', status: 'todo' as const, projectLabel: 'Genomma', scheduledDate: null },
  { id: 'p2', title: 'Revisar contrato proveedor', status: 'todo' as const, projectLabel: 'Operaciones', scheduledDate: null },
  { id: 'p3', title: 'Mandar reporte trimestral', status: 'todo' as const, projectLabel: 'Reportes', scheduledDate: null },
  { id: 'p4', title: 'Estudiar alemán 30min', status: 'todo' as const, projectLabel: 'Personal', scheduledDate: null },
  { id: 'p5', title: 'Limpiar inbox a cero', status: 'todo' as const, projectLabel: 'Inbox', scheduledDate: null },
  { id: 'p6', title: 'Comprar regalo cumpleaños', status: 'todo' as const, projectLabel: 'Personal', scheduledDate: null },
  // Day-anchored (week of 2026-05-17 to 2026-05-23 — Sunday start)
  { id: 'd1', title: 'Reunión equipo', status: 'done' as const, projectLabel: 'AgendaIA', scheduledDate: '2026-05-18' },
  { id: 'd2', title: 'Diseño Today', status: 'in_progress' as const, projectLabel: 'AgendaIA', scheduledDate: '2026-05-18' },
  { id: 'd3', title: 'Push deploy staging', status: 'todo' as const, projectLabel: 'AgendaIA', scheduledDate: '2026-05-19' },
  { id: 'd4', title: 'Gym', status: 'done' as const, projectLabel: 'Personal', scheduledDate: '2026-05-19' },
  { id: 'd5', title: 'Revisar PR del equipo', status: 'todo' as const, projectLabel: 'AgendaIA', scheduledDate: '2026-05-20' },
  { id: 'd6', title: 'Café con Lucas', status: 'todo' as const, projectLabel: 'Personal', scheduledDate: '2026-05-20' },
  { id: 'd7', title: 'Doc onboarding', status: 'todo' as const, projectLabel: 'AgendaIA', scheduledDate: '2026-05-21' },
  { id: 'd8', title: 'Llamada inversor', status: 'todo' as const, projectLabel: 'AgendaIA', scheduledDate: '2026-05-22' },
  { id: 'd9', title: 'Review semanal', status: 'todo' as const, projectLabel: 'Rituales', scheduledDate: '2026-05-23' },
];

export default function WeekPage() {
  // Frozen "today" for the prototype so the offset caption is deterministic
  // regardless of when the page is loaded. In v1 this becomes `new Date()`.
  const today = new Date(2026, 4, 20); // 2026-05-20

  const [currentWeekStarting, setCurrentWeekStarting] = useState<Date>(() =>
    sundayOf(today),
  );
  const [kickoffOpen, setKickoffOpen] = useState(false);

  function shiftWeek(deltaWeeks: number) {
    setCurrentWeekStarting((prev) => new Date(prev.getTime() + deltaWeeks * 7 * DAY_MS));
  }

  return (
    <>
      <AgendaHeader dateLabel="Semana" initials="F" />

      <main
        style={{
          paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
          maxWidth: 1280,
          marginInline: 'auto',
          width: '100%',
        }}
      >
        <WeekNavigation
          weekStarting={currentWeekStarting}
          today={today}
          onPrev={() => shiftWeek(-1)}
          onNext={() => shiftWeek(1)}
          onToday={() => setCurrentWeekStarting(sundayOf(today))}
        />

        {/* Collapsible kickoff */}
        <div style={{ paddingInline: 'var(--ag-space-4)' }}>
          <button
            type="button"
            onClick={() => setKickoffOpen((v) => !v)}
            aria-expanded={kickoffOpen}
            style={{
              appearance: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--ag-space-1)',
              background: 'transparent',
              border: 'none',
              padding: '6px 0',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--ag-slate)',
              cursor: 'pointer',
            }}
          >
            {kickoffOpen ? (
              <ChevronUp size={14} strokeWidth={1.5} />
            ) : (
              <ChevronDown size={14} strokeWidth={1.5} />
            )}
            Kickoff de la semana
          </button>
        </div>

        {kickoffOpen ? (
          <WeekSheetKickoffSection
            oneThing="Lanzar el MVP v0.5"
            wins={[
              { text: 'Terminar diseño Today', done: false },
              { text: 'Implementar auth', done: false },
              { text: 'Deploy a Vercel staging', done: false },
            ]}
          />
        ) : null}

        <hr
          style={{
            margin: 'var(--ag-space-3) var(--ag-space-4)',
            border: 'none',
            borderTop: '1px solid var(--ag-rule)',
          }}
        />

        <WeekSwimlane
          weekStarting={currentWeekStarting}
          today={today}
          seedActivities={SEED_ACTIVITIES}
        />

        <section
          aria-label="Review semanal"
          style={{
            marginTop: 'var(--ag-space-6)',
            paddingInline: 'var(--ag-space-4)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 15,
              color: 'var(--ag-ink-hint)',
              textAlign: 'center',
              opacity: 0.9,
            }}
          >
            El review llega sábado a las 20:00.
          </p>
        </section>
      </main>
    </>
  );
}
