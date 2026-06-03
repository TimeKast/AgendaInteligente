/**
 * /resumen — landing dashboard.
 *
 * Three sections at a glance:
 *   · Tareas que vencen pronto (7-day window)
 *   · Metas más cercanas (active goals, nearest deadlines)
 *   · Cómo va la cosa (last 4 weeks done/open + reviewed)
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlarmClock, Target, Activity } from 'lucide-react';
import { auth } from '@/lib/auth/auth';
import { loadTodayUserProfile } from '@/lib/db/queries/today';
import { loadDashboard } from '@/lib/db/queries/dashboard';
import { todayInTimezone, labelEsForYmd } from '@/lib/domain/day-calc';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';

const SCOPE_LABEL: Record<string, string> = {
  quarter: 'Q',
  year: 'Año',
  '5year': '5 años',
  life: 'Vida',
};

export default async function ResumenPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/resumen');
  }
  const userId = session.user.id;
  const profile = (await loadTodayUserProfile(userId)) ?? {
    timezone: 'UTC',
    name: null,
    email: null,
  };
  const todayYmd = todayInTimezone(new Date(), profile.timezone);
  const data = await loadDashboard(userId, todayYmd);

  return (
    <>
      <AgendaHeader dateLabel="Resumen" />
      <main
        style={{
          paddingInline: 'var(--ag-space-4)',
          paddingTop: 'var(--ag-space-4)',
          paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-5)',
          maxWidth: 1200,
          marginInline: 'auto',
          width: '100%',
        }}
      >
        <Section
          title="Vencen pronto"
          subtitle="Tareas con deadline en los próximos 7 días."
          icon={<AlarmClock size={16} strokeWidth={1.5} aria-hidden />}
        >
          {data.dueSoon.length === 0 ? (
            <Empty text="Nada con deadline esta semana." />
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {data.dueSoon.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/activity/${a.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--ag-space-3)',
                      padding: 'var(--ag-space-3)',
                      borderBottom: '1px solid var(--ag-rule)',
                      textDecoration: 'none',
                      color: 'var(--ag-ink-primary)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--ag-font-mono)',
                        fontSize: 11,
                        color: 'var(--ag-scope-life)',
                        minWidth: 60,
                      }}
                    >
                      {labelEsForYmd(a.deadline).slice(0, 7)}
                    </span>
                    <span style={{ flex: 1, fontFamily: 'var(--ag-font-body)', fontSize: 15 }}>
                      {a.title}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--ag-font-mono)',
                        fontSize: 11,
                        color: 'var(--ag-ink-hint)',
                      }}
                    >
                      {a.projectName}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="Metas más cercanas"
          subtitle="Top 5 activas por deadline."
          icon={<Target size={16} strokeWidth={1.5} aria-hidden />}
        >
          {data.upcomingGoals.length === 0 ? (
            <Empty text="No hay metas activas. Crea una en /goals." />
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {data.upcomingGoals.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/goals/${g.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--ag-space-3)',
                      padding: 'var(--ag-space-3)',
                      borderBottom: '1px solid var(--ag-rule)',
                      textDecoration: 'none',
                      color: 'var(--ag-ink-primary)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--ag-font-mono)',
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--ag-ink-hint)',
                        minWidth: 50,
                      }}
                    >
                      {SCOPE_LABEL[g.scope] ?? g.scope}
                    </span>
                    <span style={{ flex: 1, fontFamily: 'var(--ag-font-body)', fontSize: 15 }}>
                      {g.title}
                    </span>
                    {g.deadline ? (
                      <span
                        style={{
                          fontFamily: 'var(--ag-font-mono)',
                          fontSize: 11,
                          color: 'var(--ag-ink-hint)',
                        }}
                      >
                        {g.deadline}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="Cómo va la cosa"
          subtitle="Las últimas 4 semanas: hechas vs abiertas."
          icon={<Activity size={16} strokeWidth={1.5} aria-hidden />}
        >
          {data.recentWeeks.length === 0 ? (
            <Empty text="Sin semanas registradas todavía." />
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {data.recentWeeks.map((w) => {
                const total = w.doneCount + w.openCount;
                const pct = total === 0 ? 0 : Math.round((w.doneCount / total) * 100);
                return (
                  <li
                    key={w.weekStarting}
                    style={{
                      padding: 'var(--ag-space-3)',
                      borderBottom: '1px solid var(--ag-rule)',
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      gap: 'var(--ag-space-3)',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--ag-font-body)', fontSize: 13 }}>
                      Sem {w.weekStarting.slice(5)}
                    </span>
                    <span
                      aria-label={`Avance ${pct}%`}
                      style={{
                        position: 'relative',
                        display: 'block',
                        height: 6,
                        backgroundColor: 'var(--ag-rule)',
                        borderRadius: 999,
                        overflow: 'hidden',
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          display: 'block',
                          width: `${pct}%`,
                          height: '100%',
                          backgroundColor:
                            pct >= 70
                              ? 'var(--ag-scope-quarter)'
                              : pct >= 40
                                ? 'var(--ag-scope-year)'
                                : 'var(--ag-scope-life)',
                        }}
                      />
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--ag-font-mono)',
                        fontSize: 12,
                        color: 'var(--ag-ink-hint)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {w.doneCount} ✓ · {w.openCount} pend.
                      {w.reviewed ? ' · review ✓' : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </main>
    </>
  );
}

function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        border: '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-base)',
        backgroundColor: 'var(--ag-bg-elevated)',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: 'var(--ag-space-3)',
          borderBottom: '1px solid var(--ag-rule)',
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--ag-space-2)',
        }}
      >
        <span style={{ color: 'var(--ag-ink-soft)', display: 'inline-flex' }}>{icon}</span>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontSize: 16,
            fontWeight: 500,
            color: 'var(--ag-ink-primary)',
          }}
        >
          {title}
        </h2>
        <span
          style={{
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 12,
            color: 'var(--ag-ink-hint)',
          }}
        >
          {subtitle}
        </span>
      </header>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p
      style={{
        margin: 0,
        padding: 'var(--ag-space-4)',
        fontFamily: 'var(--ag-font-display)',
        fontStyle: 'italic',
        fontSize: 13,
        color: 'var(--ag-ink-hint)',
        textAlign: 'center',
      }}
    >
      {text}
    </p>
  );
}
