/**
 * StatsView — server-rendered dashboard from loadStats.
 *
 * Plain server component (no client interactivity needed for v1).
 * Renders:
 *   - Header tiles: this-week %, streak
 *   - Last 4 weeks: simple bar chart per week (done/total + energy)
 *   - Top 5 reasons skipped (last 30d)
 *   - Project breakdown for the current month
 */

import type { StatsData, WeekTrendPoint } from '@/lib/db/queries/stats';

const REASON_LABELS: Record<string, string> = {
  no_time: 'No tuve tiempo',
  not_priority: 'No es prioridad',
  blocked_external: 'Bloqueado externo',
  no_energy: 'Sin energía',
  forgot: 'Lo olvidé',
  changed_mind: 'Cambié de opinión',
  other: 'Otro',
};

const MONTH_ABBR = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

function pct(done: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

function weekLabel(weekStartingISO: string): string {
  const [, m, d] = weekStartingISO.split('-').map(Number);
  return `${d} ${MONTH_ABBR[m - 1]}`;
}

interface Props {
  data: StatsData;
  monthLabel: string;
}

export function StatsView({ data, monthLabel }: Props) {
  const thisWeekPct = pct(data.thisWeek.done, data.thisWeek.total);

  return (
    <main
      style={{
        paddingInline: 'var(--ag-space-4)',
        paddingTop: 'var(--ag-space-4)',
        paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-5)',
      }}
    >
      {/* Top tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ag-space-3)' }}>
        <Tile
          label="Esta semana"
          value={`${thisWeekPct}%`}
          caption={`${data.thisWeek.done} / ${data.thisWeek.total} hechas`}
        />
        <Tile
          label="Racha"
          value={`${data.streakDays}`}
          caption={data.streakDays === 1 ? '1 día cerrado' : `${data.streakDays} días cerrados`}
        />
      </div>

      {/* Week trend */}
      <Section title="Últimas 4 semanas">
        {data.weekTrend.every((w) => w.totalCount === 0 && w.energy === null) ? (
          <Empty>Sin datos todavía. Cierra una semana primero.</Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
            {data.weekTrend.map((w) => (
              <WeekRow key={w.weekStarting} w={w} />
            ))}
          </div>
        )}
      </Section>

      {/* Top reasons */}
      <Section title="Razones más comunes para saltar (30 días)">
        {data.topReasons.length === 0 ? (
          <Empty>No has saltado nada con razón categorizada. (Bueno o sospechoso.)</Empty>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {data.topReasons.map((r) => (
              <li
                key={r.reasonCategory}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--ag-space-2) var(--ag-space-3)',
                  borderBottom: '1px solid var(--ag-rule)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--ag-font-body)',
                    fontSize: 14,
                    color: 'var(--ag-ink-primary)',
                  }}
                >
                  {REASON_LABELS[r.reasonCategory] ?? r.reasonCategory}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--ag-font-mono)',
                    fontSize: 13,
                    color: 'var(--ag-ink-hint)',
                  }}
                >
                  {r.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Project breakdown */}
      <Section title={`Por proyecto · ${monthLabel}`}>
        {data.projectBreakdown.length === 0 ? (
          <Empty>Sin actividades este mes todavía.</Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
            {data.projectBreakdown.map((p) => (
              <ProjectRow key={p.projectId} row={p} />
            ))}
          </div>
        )}
      </Section>
    </main>
  );
}

function Tile({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div
      style={{
        padding: 'var(--ag-space-4)',
        borderRadius: 'var(--ag-radius-card)',
        backgroundColor: 'var(--ag-bg-elevated)',
        border: '1px solid var(--ag-rule)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ag-slate)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--ag-font-display)',
          fontSize: 28,
          fontWeight: 500,
          color: 'var(--ag-ink-primary)',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 12,
          color: 'var(--ag-ink-soft)',
        }}
      >
        {caption}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-body)',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ag-slate)',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        paddingBlock: 'var(--ag-space-3)',
        fontFamily: 'var(--ag-font-display)',
        fontStyle: 'italic',
        fontSize: 13,
        color: 'var(--ag-ink-hint)',
      }}
    >
      {children}
    </p>
  );
}

function WeekRow({ w }: { w: WeekTrendPoint }) {
  const completion = pct(w.doneCount, w.totalCount);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--ag-space-3)',
        padding: 'var(--ag-space-2) var(--ag-space-3)',
        borderRadius: 'var(--ag-radius-base)',
        backgroundColor: 'var(--ag-bg-elevated)',
        border: '1px solid var(--ag-rule)',
      }}
    >
      <span
        style={{
          width: 60,
          fontFamily: 'var(--ag-font-mono)',
          fontSize: 12,
          color: 'var(--ag-ink-soft)',
        }}
      >
        {weekLabel(w.weekStarting)}
      </span>
      <div
        style={{
          flex: 1,
          position: 'relative',
          height: 6,
          backgroundColor: 'var(--ag-bg-sunken)',
          borderRadius: 3,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${completion}%`,
            backgroundColor: 'var(--ag-ink-primary)',
            borderRadius: 3,
          }}
        />
      </div>
      <span
        style={{
          width: 60,
          textAlign: 'right',
          fontFamily: 'var(--ag-font-mono)',
          fontSize: 12,
          color: 'var(--ag-ink-soft)',
        }}
      >
        {w.doneCount}/{w.totalCount}
      </span>
      {w.energy !== null ? (
        <span
          style={{
            fontFamily: 'var(--ag-font-mono)',
            fontSize: 11,
            color: 'var(--ag-ink-hint)',
            padding: '2px 6px',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-pill)',
          }}
          title="Energía de la review"
        >
          ⚡ {w.energy}
        </span>
      ) : (
        <span
          style={{
            fontFamily: 'var(--ag-font-mono)',
            fontSize: 11,
            color: 'var(--ag-ink-hint)',
            opacity: 0.4,
          }}
        >
          —
        </span>
      )}
    </div>
  );
}

function ProjectRow({ row }: { row: { projectName: string; done: number; total: number } }) {
  const p = pct(row.done, row.total);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--ag-space-2)',
        padding: 'var(--ag-space-2) var(--ag-space-3)',
        borderRadius: 'var(--ag-radius-base)',
        backgroundColor: 'var(--ag-bg-elevated)',
        border: '1px solid var(--ag-rule)',
      }}
    >
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 14,
          color: 'var(--ag-ink-primary)',
        }}
      >
        {row.projectName}
      </span>
      <span
        style={{
          fontFamily: 'var(--ag-font-mono)',
          fontSize: 12,
          color: 'var(--ag-ink-hint)',
        }}
      >
        {row.done}/{row.total} · {p}%
      </span>
    </div>
  );
}
