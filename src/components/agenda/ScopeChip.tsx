/**
 * ScopeChip — small caption-style chip naming a goal's scope (Q2 2026, Year, etc.).
 *
 * Color signal:
 *   - quarter → --ag-scope-quarter (warm green)
 *   - year    → --ag-scope-year    (amber-ish)
 *   - 5year   → --ag-scope-5year   (slate-indigo)
 *   - life    → --ag-scope-life    (warm crimson)
 *
 * NEVER blue/purple/saturated. Treated as a tinted ink, NOT a filled pill.
 */

export type ScopeKind = 'quarter' | 'year' | '5year' | 'life';

interface ScopeChipProps {
  kind: ScopeKind;
  label: string;
}

const SCOPE_VAR: Record<ScopeKind, string> = {
  quarter: 'var(--ag-scope-quarter)',
  year: 'var(--ag-scope-year)',
  '5year': 'var(--ag-scope-5year)',
  life: 'var(--ag-scope-life)',
};

export function ScopeChip({ kind, label }: ScopeChipProps) {
  const color = SCOPE_VAR[kind];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px',
        borderRadius: 'var(--ag-radius-pill)',
        backgroundColor: 'transparent',
        boxShadow: `inset 0 0 0 1px ${color}`,
        color,
        fontFamily: 'var(--ag-font-body)',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
