/**
 * LinkedProjectsList — tiny list of linked projects for SCR-043 goal detail.
 * Each row links to /projects/[id].
 */

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface LinkedProject {
  id: string;
  name: string;
}

interface LinkedProjectsListProps {
  projects: LinkedProject[];
}

export function LinkedProjectsList({ projects }: LinkedProjectsListProps) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {projects.map((p) => (
        <li key={p.id} style={{ listStyle: 'none' }}>
          <Link
            href={`/projects/${p.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--ag-space-3)',
              padding: 'var(--ag-space-2) 0',
              borderBottom:
                '1px solid color-mix(in oklab, var(--ag-rule), transparent 70%)',
              color: 'inherit',
              textDecoration: 'none',
              minHeight: 36,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--ag-font-body)',
                fontSize: 14,
                color: 'var(--ag-ink-primary)',
              }}
            >
              · {p.name}
            </span>
            <ChevronRight
              size={14}
              strokeWidth={1.5}
              aria-hidden
              color="var(--ag-ink-hint)"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
