'use client';

/**
 * SCR-021 — Week (mobile portrait prototype)
 *
 * Visual-only. Hardcoded week data. Visit at /week.
 * Source: project/planning/15_DESIGN.md §9 wireframe SCR-021.
 *
 * Round 3: WeekNavigation block lets the user prev/next/today between weeks.
 * The week data (DayCard, kickoff wins) stays HARDCODED — only the date
 * range in the navigator re-renders.
 */

import { useState } from 'react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { WeekSheetKickoffSection } from '@/components/agenda/WeekSheetKickoffSection';
import { WeekDayDots } from '@/components/agenda/WeekDayDots';
import { DayCard } from '@/components/agenda/DayCard';
import { WeekNavigation, sundayOf } from '@/components/agenda/WeekNavigation';

const DAY_MS = 24 * 60 * 60 * 1000;

export default function WeekPage() {
  // Frozen "today" for the prototype so the offset caption is deterministic
  // regardless of when the page is loaded. In v1 this becomes `new Date()`.
  const today = new Date(2026, 4, 20); // 2026-05-20

  const [currentWeekStarting, setCurrentWeekStarting] = useState<Date>(() =>
    sundayOf(today),
  );

  function shiftWeek(deltaWeeks: number) {
    setCurrentWeekStarting((prev) => new Date(prev.getTime() + deltaWeeks * 7 * DAY_MS));
  }

  return (
    <>
      <AgendaHeader dateLabel="Semana" initials="F" />

      <main
        style={{
          paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
          maxWidth: 480,
          marginInline: 'auto',
        }}
      >
        <WeekNavigation
          weekStarting={currentWeekStarting}
          today={today}
          onPrev={() => shiftWeek(-1)}
          onNext={() => shiftWeek(1)}
          onToday={() => setCurrentWeekStarting(sundayOf(today))}
        />

        <WeekSheetKickoffSection
          oneThing="Lanzar el MVP v0.5"
          wins={[
            { text: 'Terminar diseño Today', done: false },
            { text: 'Implementar auth', done: false },
            { text: 'Deploy a Vercel staging', done: false },
          ]}
        />

        <hr
          style={{
            margin: 'var(--ag-space-2) var(--ag-space-4)',
            border: 'none',
            borderTop: '1px solid var(--ag-rule)',
          }}
        />

        <WeekDayDots activeIndex={0} />

        <DayCard
          dayLabel="LUN 19"
          winsStat="3/5 wins done"
          morningDone
          eveningDone={false}
          activities={[
            { title: 'Reunión clientes', status: 'done', scheduledTime: '10:00' },
            { title: 'Revisar PR equipo', status: 'todo' },
            { title: 'Reporte trimestral', status: 'in_progress' },
          ]}
          href="/today"
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
              fontSize: 16,
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
