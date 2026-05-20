/**
 * GoalCard — tappable card summarizing a goal.
 *
 * Layout:
 *   - Lateral 4px scope accent bar (color by `scopeKind`).
 *   - Serif h3 title.
 *   - Meta line: scope chip + deadline + remaining text.
 *   - Progress bar (subtle, warm ecru track, ink-soft fill).
 *   - Footer: activities/projects counts, or warning copy.
 */

import Link from 'next/link';
import { ScopeChip, type ScopeKind } from './ScopeChip';

interface GoalCardProps {
  href: string;
  title: string;
  scopeKind: ScopeKind;
  scopeLabel: string;
  /** "8 semanas restantes", "⚠ Review pendiente", etc. */
  meta: string;
  /** 0-100 progress, or null for indeterminate / not started visually. */
  progress: number | null;
  /** Footer line, e.g. "4 activities · 2 projects". */
  footer?: string;
  /** When true, the meta line takes the warning tone (warm amber). */
  metaWarning?: boolean;
}

const SCOPE_VAR: Record<ScopeKind, string> = {
  quarter: 'var(--ag-scope-quarter)',
  year: 'var(--ag-scope-year)',
  '5year': 'var(--ag-scope-5year)',
  life: 'var(--ag-scope-life)',
};

export function GoalCard({
  href,
  title,
  scopeKind,
  scopeLabel,
  meta,
  progress,
  footer,
  metaWarning,
}: GoalCardProps) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
      }}
    >
      <article
        style={{
          position: 'relative',
          backgroundColor: 'var(--ag-bg-elevated)',
          borderRadius: 'var(--ag-radius-card)',
          padding: 'var(--ag-space-4) var(--ag-space-5) var(--ag-space-4) var(--ag-space-6)',
          marginInline: 'var(--ag-space-4)',
          marginBlock: 'var(--ag-space-3)',
          boxShadow: '0 1px 2px rgba(42, 40, 38, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-3)',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            backgroundColor: SCOPE_VAR[scopeKind],
          }}
        />

        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontSize: 19,
            fontWeight: 500,
            lineHeight: 1.3,
            color: 'var(--ag-ink-primary)',
          }}
        >
          {title}
        </h3>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--ag-space-2)',
            flexWrap: 'wrap',
          }}
        >
          <ScopeChip kind={scopeKind} label={scopeLabel} />
          <span
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              color: metaWarning ? 'var(--ag-warning)' : 'var(--ag-ink-soft)',
            }}
          >
            {meta}
          </span>
        </div>

        {progress !== null ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              aria-label={`Progreso ${progress}%`}
              style={{
                height: 4,
                borderRadius: 'var(--ag-radius-pill)',
                backgroundColor: 'var(--ag-bg-sunken)',
                overflow: 'hidden',
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'block',
                  height: '100%',
                  width: `${Math.max(0, Math.min(100, progress))}%`,
                  backgroundColor: 'var(--ag-ink-soft)',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: 'var(--ag-font-mono)',
                fontSize: 11,
                color: 'var(--ag-ink-hint)',
                alignSelf: 'flex-end',
              }}
            >
              {progress}%
            </span>
          </div>
        ) : null}

        {footer ? (
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              color: 'var(--ag-ink-hint)',
            }}
          >
            {footer}
          </p>
        ) : null}
      </article>
    </Link>
  );
}
