/**
 * AgendaHeader — 56px sticky top bar for AgendaInteligente.
 * NOT to be confused with TimeKast's neumo `Header.tsx`.
 *
 * Design ref: 15_DESIGN.md §9 wireframe SCR-020 mobile portrait.
 */

interface AgendaHeaderProps {
  /** Localized human date string, e.g. "Lunes, 19 de mayo". */
  dateLabel: string;
  /** 1-2 char user initials for the avatar circle. */
  initials: string;
}

export function AgendaHeader({ dateLabel, initials }: AgendaHeaderProps) {
  return (
    <header
      className="ag-header sticky top-0 z-30 flex items-center justify-between"
      style={{
        height: 56,
        paddingInline: 'var(--ag-space-4)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        backgroundColor: 'var(--ag-bg)',
        borderBottom: '1px solid color-mix(in oklab, var(--ag-rule), transparent 60%)',
      }}
    >
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
    </header>
  );
}
