/**
 * SCR-stats — Tu progreso (visual-only prototype).
 *
 * Hardcoded mock data. Sections:
 *   1. Hero header + italic caption.
 *   2. 2x2 stat card grid (mobile) / 4x1 row (desktop).
 *   3. Últimas 8 semanas — CSS bar chart.
 *   4. Patrones — italic intro + bulleted list.
 *   5. Top 5 proyectos.
 *   6. Footer caption "Datos en desarrollo."
 *
 * Visit: /stats.
 */

import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { StatCard } from '@/components/agenda/StatCard';
import { BarChart, type BarRow } from '@/components/agenda/BarChart';
import { PatternsList } from '@/components/agenda/PatternsList';
import { ProjectsRanking, type ProjectRow } from '@/components/agenda/ProjectsRanking';

const WEEKS_BARS: BarRow[] = [
  { label: 'S22', pct: 78 },
  { label: 'S23', pct: 75 },
  { label: 'S24', pct: 50 },
  { label: 'S25', pct: 92 },
  { label: 'S26', pct: 68, current: true },
];

const PATTERNS = [
  '2 wins postergadas con "no tuve tiempo" en las últimas 3 semanas.',
  'Proyecto "Aprender alemán" sin movimiento hace 14 días.',
  'Lunes y martes son tus mejores días (89% promedio).',
  'Viernes baja al 45% — ¿reuniones largas?',
];

const PROJECTS: ProjectRow[] = [
  { name: 'Lanzar AgendaInteligente', ratio: '4/5', dots: 4 },
  { name: 'Empresa Genomma', ratio: '6/8', dots: 4 },
  { name: 'Side project Web3', ratio: '1/3', dots: 2 },
  { name: 'Personal', ratio: '3/4', dots: 4 },
  { name: 'Inbox', ratio: '2/2', dots: 5 },
];

export default function StatsPage() {
  return (
    <>
      <AgendaHeader dateLabel="Progreso" initials="F" />

      <main
        style={{
          paddingBottom:
            'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
          maxWidth: 720,
          marginInline: 'auto',
          width: '100%',
          paddingInline: 'var(--ag-space-4)',
          paddingTop: 'var(--ag-space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-6)',
        }}
      >
        {/* Hero */}
        <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-1)' }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontSize: 28,
              fontWeight: 500,
              color: 'var(--ag-ink-primary)',
              lineHeight: 1.2,
            }}
          >
            Tu progreso
          </h1>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 15,
              color: 'var(--ag-ink-hint)',
            }}
          >
            Últimos 30 días.
          </p>
        </header>

        {/* Stat grid */}
        <section
          aria-label="Indicadores principales"
          className="ag-stats-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--ag-space-3)',
          }}
        >
          <StatCard caption="Cumplimiento" value="68%" dots={7} />
          <StatCard caption="Tendencia" value="↑ +12%" sub="vs hace 30d" />
          <StatCard caption="Wins parciales" value="3 de 12" />
          <StatCard caption="Tareas x semana" value="18" sub="promedio últimas 4" />
        </section>

        {/* Bar chart — últimas 8 semanas */}
        <section
          aria-labelledby="ag-weeks-heading"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-3)',
          }}
        >
          <h2
            id="ag-weeks-heading"
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--ag-slate)',
            }}
          >
            Últimas 8 semanas
          </h2>
          <BarChart rows={WEEKS_BARS} ariaLabel="Cumplimiento por semana" />
        </section>

        {/* Patterns */}
        <section
          aria-labelledby="ag-patterns-heading"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-3)' }}
        >
          <h2
            id="ag-patterns-heading"
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--ag-slate)',
            }}
          >
            Patrones
          </h2>
          <PatternsList intro="Lo que se está acumulando." items={PATTERNS} />
        </section>

        {/* Top projects */}
        <section
          aria-labelledby="ag-projects-heading"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-3)' }}
        >
          <h2
            id="ag-projects-heading"
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--ag-slate)',
            }}
          >
            Top 5 proyectos esta semana
          </h2>
          <ProjectsRanking rows={PROJECTS} />
        </section>

        {/* Footer caption */}
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
            textAlign: 'center',
            paddingBlock: 'var(--ag-space-3)',
          }}
        >
          Datos en desarrollo. Pronto vas a poder filtrar por período y proyecto.
        </p>
      </main>
    </>
  );
}
