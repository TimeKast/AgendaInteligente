/**
 * DaySheetMorningSection — the top "morning" block of the Day sheet.
 *
 * Visual signature:
 *  - Lateral 4px scope accent bar in `--ag-scope-day` (DD-pattern-3).
 *  - Hairline divider in `--ag-rule` (warm ecru, NOT gray).
 *
 * Design ref: 15_DESIGN.md §9 SCR-020 mobile wireframe.
 *
 * Note: The "Intención de hoy" field was retired from the morning sheet
 * (user feedback, 2026-05-20) — the day is shaped by activities + wins, not
 * by an additional one-liner. Energy indicators were also dropped from the
 * prototype (user feedback, 2026-05-20). Gratitud was removed in a later
 * iteration (user feedback, 2026-05-25) — the morning block now collapses to
 * just the scope accent bar + a quiet placeholder for future fields.
 */

interface DaySheetMorningSectionProps {
  /** Reserved for future morning fields. Currently no fields are rendered. */
  placeholder?: string;
}

export function DaySheetMorningSection({ placeholder }: DaySheetMorningSectionProps) {
  return (
    <section
      aria-labelledby="ag-morning-heading"
      className="ag-daysheet-morning"
      style={{
        position: 'relative',
        backgroundColor: 'var(--ag-bg-elevated)',
        borderRadius: 'var(--ag-radius-card)',
        padding: 'var(--ag-space-4) var(--ag-space-5) var(--ag-space-4) var(--ag-space-6)',
        marginInline: 'var(--ag-space-4)',
        marginBlock: 'var(--ag-space-4)',
        // Soft, warm hairline — NOT a neumo double-shadow.
        boxShadow: '0 1px 2px rgba(42, 40, 38, 0.04)',
        overflow: 'hidden',
      }}
    >
      {/* Scope accent bar — left side, Day scope */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: 'var(--ag-scope-day)',
        }}
      />

      {/* Visually hidden heading kept for a11y landmark. */}
      <h2
        id="ag-morning-heading"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        Mañana
      </h2>

      <p
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-display)',
          fontStyle: 'italic',
          fontSize: 14,
          color: 'var(--ag-ink-hint)',
          lineHeight: 1.4,
        }}
      >
        {placeholder ?? 'Buenos días.'}
      </p>
    </section>
  );
}
