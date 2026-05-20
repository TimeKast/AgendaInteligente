/**
 * DateDivider — caption-style horizontal rule with centered date.
 * "─── Lunes 19 de mayo ───"
 */

interface DateDividerProps {
  label: string;
}

export function DateDivider({ label }: DateDividerProps) {
  return (
    <div
      role="separator"
      aria-label={label}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 'var(--ag-space-3)',
        paddingBlock: 'var(--ag-space-4)',
      }}
    >
      <hr style={{ border: 'none', borderTop: '1px solid var(--ag-rule)', margin: 0 }} />
      <span
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ag-ink-hint)',
        }}
      >
        {label}
      </span>
      <hr style={{ border: 'none', borderTop: '1px solid var(--ag-rule)', margin: 0 }} />
    </div>
  );
}
