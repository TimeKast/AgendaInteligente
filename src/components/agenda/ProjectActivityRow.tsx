/**
 * ProjectActivityRow — slim activity row used inside SCR-041 (project detail)
 * and inside SCR-043 (goal detail linked activities).
 *
 * Drops the ProjectChip (redundant in this context) and surfaces the deadline
 * date instead. Tap navigates to /activity/[id].
 */

import Link from 'next/link';
import { Check } from 'lucide-react';
import { PriorityDots } from './PriorityDots';
import type { ActivityStatus } from './ActivityRow';

interface ProjectActivityRowProps {
  href: string;
  title: string;
  status: ActivityStatus;
  /** "30 jun" or "Mañana" — short context date label */
  dateLabel?: string;
  priority: number;
}

function Checkbox({ status }: { status: ActivityStatus }) {
  if (status === 'done') {
    return (
      <span
        aria-label="Hecho"
        style={{
          width: 18,
          height: 18,
          borderRadius: 'var(--ag-radius-xs)',
          backgroundColor: 'var(--ag-ink-primary)',
          color: 'var(--ag-accent-on)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Check size={12} strokeWidth={2} />
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span
        aria-label="En progreso"
        style={{
          width: 18,
          height: 18,
          borderRadius: 'var(--ag-radius-xs)',
          background:
            'linear-gradient(135deg, var(--ag-ink-primary) 0 50%, transparent 50% 100%)',
          boxShadow: 'inset 0 0 0 1px var(--ag-ink-soft)',
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <span
      aria-label="Pendiente"
      style={{
        width: 18,
        height: 18,
        borderRadius: 'var(--ag-radius-xs)',
        boxShadow: 'inset 0 0 0 1px var(--ag-rule)',
        backgroundColor: 'transparent',
        flexShrink: 0,
      }}
    />
  );
}

export function ProjectActivityRow({
  href,
  title,
  status,
  dateLabel,
  priority,
}: ProjectActivityRowProps) {
  const isDone = status === 'done';
  return (
    <li style={{ listStyle: 'none' }}>
      <Link
        href={href}
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          gap: 'var(--ag-space-3)',
          padding: 'var(--ag-space-3) 0',
          borderBottom: '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
          minHeight: 48,
          color: 'inherit',
          textDecoration: 'none',
        }}
      >
        <Checkbox status={status} />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 2 }}>
          <span
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 15,
              lineHeight: 1.4,
              color: isDone ? 'var(--ag-ink-hint)' : 'var(--ag-ink-primary)',
              textDecoration: isDone ? 'line-through' : 'none',
              textDecorationColor: 'var(--ag-rule)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
          {dateLabel ? (
            <span
              style={{
                fontFamily: 'var(--ag-font-mono)',
                fontSize: 11,
                color: 'var(--ag-slate)',
                letterSpacing: '0.02em',
              }}
            >
              {dateLabel}
            </span>
          ) : null}
        </div>
        <PriorityDots priority={priority} />
      </Link>
    </li>
  );
}
