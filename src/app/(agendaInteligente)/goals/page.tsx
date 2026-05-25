/**
 * SCR-022 — Goals (mobile portrait prototype)
 *
 * Visual-only. Hardcoded data. Tab state via `?scope=quarter|year|5year|life`.
 * Default scope: quarter.
 */

import Link from 'next/link';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { GoalsTabs } from '@/components/agenda/GoalsTabs';
import { GoalCard } from '@/components/agenda/GoalCard';

interface GoalsPageProps {
  searchParams: Promise<{ scope?: string }>;
}

type ValidScope = 'quarter' | 'year';

function normalize(raw?: string): ValidScope {
  if (raw === 'year') return 'year';
  return 'quarter';
}

export default async function GoalsPage({ searchParams }: GoalsPageProps) {
  const { scope: rawScope } = await searchParams;
  const scope = normalize(rawScope);

  return (
    <>
      <AgendaHeader
        dateLabel="Goals"
        rightSlot={
          <Link
            href="/goals/new"
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              color: 'var(--ag-ink-soft)',
              textDecoration: 'none',
              paddingInline: 'var(--ag-space-2)',
            }}
          >
            + Nuevo
          </Link>
        }
      />

      <GoalsTabs active={scope} />

      <main
        className="ag-page-wide"
        style={{
          paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
          paddingTop: 'var(--ag-space-3)',
          paddingInline: 'var(--ag-space-4)',
        }}
      >
        {scope === 'quarter' ? (
          <>
            <GoalCard
              href="/goals/1"
              title="Lanzar AgendaInteligente v0.5"
              scopeKind="quarter"
              scopeLabel="Q2 2026"
              meta="8 semanas restantes"
              progress={60}
              footer="4 activities · 2 projects"
            />
            <GoalCard
              href="/goals/2"
              title="Aprender alemán B1"
              scopeKind="quarter"
              scopeLabel="Q3 2026"
              meta="⚠ Review pendiente"
              metaWarning
              progress={0}
            />
          </>
        ) : null}

        {scope === 'year' ? (
          <GoalCard
            href="/goals/3"
            title="Tener producto vendible Q4 2026"
            scopeKind="year"
            scopeLabel="2026"
            meta="32 semanas restantes"
            progress={20}
            footer="3 quarter goals vinculadas"
          />
        ) : null}
      </main>
    </>
  );
}
