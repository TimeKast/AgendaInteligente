'use client';

/**
 * EisenhowerMatrix — 2x2 grid by urgency × importance.
 *
 *   Q1 (urgente + importante)        → wine accent  (scope-life)
 *   Q2 (importante / no urgente)     → sage accent  (scope-quarter)
 *   Q3 (urgente / no importante)     → orange accent (scope-year)
 *   Q4 (ni urgente ni importante)    → ink-hint (low-prio)
 *
 * Each quadrant lists matching activities with a colored left border accent
 * and a small dot indicator next to the title for quick scanning.
 *
 * Hardcoded data via the `activities` prop — each item carries its quadrant.
 */

import Link from 'next/link';
import type { ActivityStatus } from './ActivityRow';
import { PriorityDots } from './PriorityDots';
import { ProjectChip } from './ProjectChip';

export type Quadrant = 1 | 2 | 3 | 4;

export interface MatrixActivity {
  id: string;
  title: string;
  status: ActivityStatus;
  priority: number;
  projectLabel: string;
  quadrant: Quadrant;
}

interface QuadrantSpec {
  id: Quadrant;
  caption: string;
  subtitle: string;
  /** CSS color expression (token reference). */
  accent: string;
  bgTint: string;
}

const QUADRANTS: QuadrantSpec[] = [
  {
    id: 1,
    caption: 'Urgente + importante',
    subtitle: 'Hacer ahora',
    accent: 'var(--ag-scope-life)',
    bgTint: 'color-mix(in oklab, var(--ag-scope-life), transparent 92%)',
  },
  {
    id: 2,
    caption: 'Importante no urgente',
    subtitle: 'Programar',
    accent: 'var(--ag-scope-quarter)',
    bgTint: 'color-mix(in oklab, var(--ag-scope-quarter), transparent 92%)',
  },
  {
    id: 3,
    caption: 'Urgente no importante',
    subtitle: 'Delegar / minimizar',
    accent: 'var(--ag-scope-year)',
    bgTint: 'color-mix(in oklab, var(--ag-scope-year), transparent 92%)',
  },
  {
    id: 4,
    caption: 'Ni urgente ni importante',
    subtitle: 'Considerar borrar',
    accent: 'var(--ag-ink-hint)',
    bgTint: 'color-mix(in oklab, var(--ag-ink-hint), transparent 94%)',
  },
];

interface EisenhowerMatrixProps {
  activities: MatrixActivity[];
}

export function EisenhowerMatrix({ activities }: EisenhowerMatrixProps) {
  return (
    <>
      <div className="ag-eisenhower-grid">
        {QUADRANTS.map((q) => {
          const items = activities.filter((a) => a.quadrant === q.id);
          return (
            <QuadrantCard key={q.id} spec={q} items={items} />
          );
        })}
      </div>
      <style>{`
        .ag-eisenhower-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--ag-space-3);
        }
        @media (min-width: 720px) {
          .ag-eisenhower-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </>
  );
}

function QuadrantCard({
  spec,
  items,
}: {
  spec: QuadrantSpec;
  items: MatrixActivity[];
}) {
  return (
    <section
      aria-label={spec.caption}
      style={{
        backgroundColor: spec.bgTint,
        border: `1px solid var(--ag-rule)`,
        borderLeft: `4px solid ${spec.accent}`,
        borderRadius: 'var(--ag-radius-base)',
        padding: 'var(--ag-space-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-2)',
        minHeight: 140,
      }}
    >
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: spec.accent,
          }}
        >
          Q{spec.id} · {spec.caption}
        </span>
        <span
          style={{
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 12,
            color: 'var(--ag-ink-hint)',
          }}
        >
          {spec.subtitle}
        </span>
      </header>

      {items.length === 0 ? (
        <p
          style={{
            margin: 0,
            paddingBlock: 'var(--ag-space-2)',
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
          }}
        >
          Sin actividades.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((it) => (
            <li key={it.id}>
              <Link
                href={`/activity/${it.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--ag-space-2)',
                  padding: '8px 10px',
                  borderRadius: 'var(--ag-radius-sm)',
                  backgroundColor: 'var(--ag-bg-elevated)',
                  border: '1px solid var(--ag-rule)',
                  textDecoration: 'none',
                  color: 'inherit',
                  borderLeft: `3px solid ${spec.accent}`,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: spec.accent,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontFamily: 'var(--ag-font-body)',
                    fontSize: 14,
                    color: 'var(--ag-ink-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textDecoration: it.status === 'done' ? 'line-through' : 'none',
                  }}
                >
                  {it.title}
                </span>
                <PriorityDots priority={it.priority} />
                <ProjectChip label={it.projectLabel} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
