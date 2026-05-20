/**
 * SheetField — display variant for a single inline field within a DaySheet.
 * Empty fields show an italic serif evocative placeholder in `--ag-ink-hint`
 * at opacity ~0.6, per DESIGN.md §3 italic usage rules.
 *
 * NOTE: This is the read-only display variant. The edit variant (CMP-062)
 * will be added in a future round — out of scope for this prototype.
 */

interface SheetFieldProps {
  /** Optional uppercase caption label above the field (e.g. "INTENCIÓN"). */
  label?: string;
  /** Current value. When empty, `placeholder` is shown italic-serif. */
  value?: string;
  /** Italic serif placeholder (evocative, terse). */
  placeholder: string;
  /** Use display serif font for the content (e.g. intention, gratitude). */
  serif?: boolean;
}

export function SheetField({ label, value, placeholder, serif = false }: SheetFieldProps) {
  const isEmpty = !value || value.trim().length === 0;

  return (
    <div
      className="ag-sheet-field"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-2)',
      }}
    >
      {label ? (
        <span
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--ag-slate)',
          }}
        >
          {label}
        </span>
      ) : null}

      <p
        style={{
          margin: 0,
          fontFamily: serif ? 'var(--ag-font-display)' : 'var(--ag-font-body)',
          fontSize: serif ? 17 : 16,
          lineHeight: 1.5,
          fontWeight: 400,
          fontStyle: isEmpty ? 'italic' : 'normal',
          color: isEmpty ? 'var(--ag-ink-hint)' : 'var(--ag-ink-primary)',
          opacity: isEmpty ? 0.85 : 1,
        }}
      >
        {isEmpty ? placeholder : value}
      </p>
    </div>
  );
}
