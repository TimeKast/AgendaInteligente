'use client';

/**
 * SCR-043 — Goal detail.
 *
 * Visual-only. Hardcoded data with a couple of variations based on [id]:
 *   - "1" (default) → Lanzar AgendaInteligente v0.5 (active, 60% progress)
 *   - "2"           → Aprender alemán B1 (REVIEW pendiente — shows "Review goal" CTA)
 *   - anything else → falls back to "1"
 *
 * Interactions:
 *   - "Review goal" CTA opens GoalReviewModal (SCR-053).
 *   - "Cambiar status" dropdown reveals achieved/partial/abandoned options.
 */

import { use, useMemo, useState } from 'react';
import { MoreHorizontal, ChevronDown } from 'lucide-react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { ScopeChip, type ScopeKind } from '@/components/agenda/ScopeChip';
import { ProgressBar } from '@/components/agenda/ProgressBar';
import {
  LinkedActivitiesList,
  type LinkedActivity,
} from '@/components/agenda/LinkedActivitiesList';
import {
  LinkedProjectsList,
  type LinkedProject,
} from '@/components/agenda/LinkedProjectsList';
import {
  GoalReviewModal,
  type ReviewStatus,
} from '@/components/agenda/GoalReviewModal';

type GoalStatus = 'active' | ReviewStatus;

interface GoalFixture {
  title: string;
  scopeKind: ScopeKind;
  scopeLabel: string;
  subtitle: string;
  progress: number;
  outcome: string;
  activities: LinkedActivity[];
  projects: LinkedProject[];
  reviewable: boolean;
}

const GOALS: Record<string, GoalFixture> = {
  '1': {
    title: 'Lanzar AgendaInteligente v0.5',
    scopeKind: 'quarter',
    scopeLabel: 'Quarter',
    subtitle: 'Q2 2026 · 8 semanas restantes',
    progress: 60,
    outcome: 'MVP en producción con primeros 20 users beta.',
    activities: [
      { id: '102', title: 'Discovery brief', status: 'done' },
      { id: '103', title: 'Docs phase', status: 'done' },
      { id: '105', title: 'Design phase', status: 'in_progress' },
      { id: '106', title: 'Implementation sprint 1', status: 'todo' },
    ],
    projects: [
      { id: 'p1', name: 'Lanzar AgendaInteligente' },
      { id: 'p2', name: 'Marketing beta' },
    ],
    reviewable: false,
  },
  '2': {
    title: 'Aprender alemán B1',
    scopeKind: 'quarter',
    scopeLabel: 'Quarter',
    subtitle: 'Q1 2026 · deadline vencido',
    progress: 40,
    outcome: 'Aprobar un mock test B1 (Goethe) antes del cierre del trimestre.',
    activities: [
      { id: '201', title: 'Clase semanal Marta', status: 'done' },
      { id: '202', title: 'Vocab diario 15min', status: 'in_progress' },
      { id: '203', title: 'Examen mock B1', status: 'todo' },
    ],
    projects: [{ id: 'p3', name: 'Estudio alemán' }],
    reviewable: true,
  },
};

interface GoalDetailPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABEL: Record<GoalStatus, string> = {
  active: 'Active',
  achieved: 'Achieved',
  partial: 'Partial',
  abandoned: 'Abandoned',
};

export default function GoalDetailPage({ params }: GoalDetailPageProps) {
  const { id } = use(params);
  const goal = useMemo<GoalFixture>(() => GOALS[id] ?? GOALS['1'], [id]);

  const [status, setStatus] = useState<GoalStatus>(goal.reviewable ? 'active' : 'active');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    <>
      <AgendaHeader
        backHref="/goals"
        dateLabel={goal.title}
        rightSlot={
          <button
            type="button"
            aria-label="Más acciones"
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--ag-ink-soft)',
              cursor: 'pointer',
              padding: 6,
            }}
          >
            <MoreHorizontal size={20} strokeWidth={1.5} />
          </button>
        }
      />

      <main
        style={{
          maxWidth: 480,
          marginInline: 'auto',
          paddingInline: 'var(--ag-space-4)',
          paddingBottom: 'calc(var(--ag-space-8) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Hero */}
        <section
          style={{
            paddingTop: 'var(--ag-space-4)',
            paddingBottom: 'var(--ag-space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-3)',
          }}
        >
          <ScopeChip kind={goal.scopeKind} label={goal.scopeLabel} />
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontSize: 24,
              fontWeight: 500,
              lineHeight: 1.25,
              color: 'var(--ag-ink-primary)',
              letterSpacing: '-0.005em',
            }}
          >
            {goal.title}
          </h1>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              color: goal.reviewable ? 'var(--ag-warning)' : 'var(--ag-ink-soft)',
            }}
          >
            {goal.subtitle}
          </p>
          <ProgressBar value={goal.progress} thickness={4} />

          {goal.reviewable ? (
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              style={{
                appearance: 'none',
                marginTop: 'var(--ag-space-2)',
                alignSelf: 'flex-start',
                background: 'color-mix(in oklab, var(--ag-warning), transparent 88%)',
                border: '1px solid color-mix(in oklab, var(--ag-warning), transparent 60%)',
                borderRadius: 'var(--ag-radius-base)',
                padding: '10px 16px',
                fontFamily: 'var(--ag-font-body)',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--ag-warning)',
                cursor: 'pointer',
              }}
            >
              Review goal
            </button>
          ) : null}
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--ag-rule)', margin: 0 }} />

        {/* Outcome */}
        <section
          style={{
            paddingBlock: 'var(--ag-space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-2)',
          }}
        >
          <h2
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
            Outcome
          </h2>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 16,
              lineHeight: 1.5,
              color: 'var(--ag-ink-soft)',
            }}
          >
            “{goal.outcome}”
          </p>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--ag-rule)', margin: 0 }} />

        {/* Activities */}
        <section
          style={{
            paddingBlock: 'var(--ag-space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-2)',
          }}
        >
          <h2
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
            Activities vinculadas ({goal.activities.length})
          </h2>
          <LinkedActivitiesList activities={goal.activities} />
          <button
            type="button"
            style={{
              appearance: 'none',
              alignSelf: 'flex-start',
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              color: 'var(--ag-ink-soft)',
              textDecoration: 'underline',
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            + Vincular más
          </button>
        </section>

        {/* Projects */}
        <section
          style={{
            paddingBlock: 'var(--ag-space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-2)',
          }}
        >
          <h2
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
            Projects vinculados ({goal.projects.length})
          </h2>
          <LinkedProjectsList projects={goal.projects} />
          <button
            type="button"
            style={{
              appearance: 'none',
              alignSelf: 'flex-start',
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              color: 'var(--ag-ink-soft)',
              textDecoration: 'underline',
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            + Vincular más
          </button>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--ag-rule)', margin: 0 }} />

        {/* Footer actions */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'var(--ag-bg)',
            paddingBlock: 'var(--ag-space-4)',
            paddingBottom: 'calc(var(--ag-space-4) + env(safe-area-inset-bottom, 0px))',
            display: 'flex',
            gap: 'var(--ag-space-2)',
            borderTop: '1px solid var(--ag-rule)',
            marginInline: 'calc(var(--ag-space-4) * -1)',
            paddingInline: 'var(--ag-space-4)',
          }}
        >
          <button
            type="button"
            style={{
              flex: 1,
              appearance: 'none',
              background: 'var(--ag-ink-primary)',
              color: 'var(--ag-accent-on)',
              border: 'none',
              borderRadius: 'var(--ag-radius-base)',
              padding: '12px 16px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Editar goal
          </button>

          <div style={{ position: 'relative', flex: 1 }}>
            <button
              type="button"
              onClick={() => setStatusMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={statusMenuOpen}
              style={{
                width: '100%',
                appearance: 'none',
                background: 'transparent',
                border: '1px solid var(--ag-rule)',
                color: 'var(--ag-ink-primary)',
                borderRadius: 'var(--ag-radius-base)',
                padding: '12px 14px',
                fontFamily: 'var(--ag-font-body)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {STATUS_LABEL[status]}
              <ChevronDown size={14} strokeWidth={1.75} aria-hidden />
            </button>
            {statusMenuOpen ? (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 'calc(100% + 6px)',
                  minWidth: 180,
                  backgroundColor: 'var(--ag-bg)',
                  border: '1px solid var(--ag-rule)',
                  borderRadius: 'var(--ag-radius-base)',
                  boxShadow: '0 4px 16px rgba(42, 40, 38, 0.12)',
                  padding: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 20,
                }}
              >
                {(['active', 'achieved', 'partial', 'abandoned'] as GoalStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setStatus(s);
                      setStatusMenuOpen(false);
                    }}
                    style={{
                      appearance: 'none',
                      background: status === s ? 'var(--ag-bg-sunken)' : 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: 'var(--ag-radius-sm)',
                      fontFamily: 'var(--ag-font-body)',
                      fontSize: 14,
                      color:
                        s === 'abandoned'
                          ? 'var(--ag-danger)'
                          : 'var(--ag-ink-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <GoalReviewModal
        open={reviewOpen}
        goalTitle={goal.title}
        onCancel={() => setReviewOpen(false)}
        onSave={(data) => {
          setStatus(data.status);
          setReviewOpen(false);
        }}
      />
    </>
  );
}
