/**
 * LinkedActivitiesList — bare list of linked activities for SCR-043 goal
 * detail. Reuses ProjectActivityRow's checkbox + title style but with no
 * priority dots (focus is on linkage, not triage).
 */

import Link from 'next/link';
import { Check } from 'lucide-react';
import type { ActivityStatus } from './ActivityRow';

export interface LinkedActivity {
  id: string;
  title: string;
  status: ActivityStatus;
}

function MiniCheckbox({ status }: { status: ActivityStatus }) {
  if (status === 'done') {
    return (
      <span
        aria-hidden
        style={{
          width: 16,
          height: 16,
          borderRadius: 'var(--ag-radius-xs)',
          backgroundColor: 'var(--ag-ink-primary)',
          color: 'var(--ag-accent-on)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Check size={11} strokeWidth={2} />
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span
        aria-hidden
        style={{
          width: 16,
          height: 16,
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
      aria-hidden
      style={{
        width: 16,
        height: 16,
        borderRadius: 'var(--ag-radius-xs)',
        boxShadow: 'inset 0 0 0 1px var(--ag-rule)',
        backgroundColor: 'transparent',
        flexShrink: 0,
      }}
    />
  );
}

interface LinkedActivitiesListProps {
  activities: LinkedActivity[];
}

export function LinkedActivitiesList({ activities }: LinkedActivitiesListProps) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {activities.map((a) => {
        const isDone = a.status === 'done';
        return (
          <li key={a.id} style={{ listStyle: 'none' }}>
            <Link
              href={`/activity/${a.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--ag-space-3)',
                padding: 'var(--ag-space-2) 0',
                color: 'inherit',
                textDecoration: 'none',
                minHeight: 36,
              }}
            >
              <MiniCheckbox status={a.status} />
              <span
                style={{
                  fontFamily: 'var(--ag-font-body)',
                  fontSize: 14,
                  color: isDone ? 'var(--ag-ink-hint)' : 'var(--ag-ink-primary)',
                  textDecoration: isDone ? 'line-through' : 'none',
                  textDecorationColor: 'var(--ag-rule)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {a.title}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
