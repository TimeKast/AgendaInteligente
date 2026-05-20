/**
 * AgendaHeader — 56px sticky top bar for AgendaInteligente.
 * NOT to be confused with TimeKast's neumo `Header.tsx`.
 *
 * Design ref: 15_DESIGN.md §9 wireframe SCR-020 mobile portrait.
 *
 * Variants:
 *  - Default: title (serif) + avatar circle on the right.
 *  - Back: chevron-left button on the left navigating to `backHref`,
 *    title centered-leading, right slot is `rightSlot` (e.g. ⋯ menu).
 */

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

interface AgendaHeaderProps {
  /** Localized human title, e.g. "Lunes, 19 de mayo" or "Settings". */
  dateLabel: string;
  /** 1-2 char user initials for the avatar circle (right-side default). */
  initials?: string;
  /** When set, replaces the avatar with a back arrow linking to this href. */
  backHref?: string;
  /** Optional right-side slot (e.g. "+ Nuevo", ⋯ menu). Replaces avatar. */
  rightSlot?: ReactNode;
}

export function AgendaHeader({ dateLabel, initials, backHref, rightSlot }: AgendaHeaderProps) {
  return (
    <header
      className="ag-header sticky top-0 z-30 flex items-center justify-between"
      style={{
        height: 56,
        paddingInline: 'var(--ag-space-4)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        backgroundColor: 'var(--ag-bg)',
        borderBottom: '1px solid color-mix(in oklab, var(--ag-rule), transparent 60%)',
        gap: 'var(--ag-space-3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ag-space-2)', minWidth: 0 }}>
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Volver"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              marginLeft: -8,
              borderRadius: 'var(--ag-radius-pill)',
              color: 'var(--ag-ink-soft)',
              textDecoration: 'none',
            }}
          >
            <ChevronLeft size={22} strokeWidth={1.5} />
          </Link>
        ) : null}

        <h1
          className="ag-header-title m-0 truncate"
          style={{
            fontFamily: 'var(--ag-font-display)',
            fontSize: 22,
            fontWeight: 500,
            lineHeight: 1.25,
            color: 'var(--ag-ink-primary)',
            letterSpacing: '-0.005em',
          }}
        >
          {dateLabel}
        </h1>
      </div>

      {rightSlot !== undefined ? (
        rightSlot
      ) : initials ? (
        <div
          aria-label="User avatar"
          className="ag-avatar flex items-center justify-center select-none"
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--ag-radius-pill)',
            backgroundColor: 'var(--ag-bg-sunken)',
            color: 'var(--ag-ink-soft)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {initials}
        </div>
      ) : null}
    </header>
  );
}
