/**
 * DaySheetMorningSection — the top "morning" block of the Day sheet.
 *
 * Visual signature:
 *  - Lateral 4px scope accent bar in `--ag-scope-day` (DD-pattern-3).
 *  - Italic serif placeholder for "Gratitud" (unfilled).
 *  - Hairline divider in `--ag-rule` (warm ecru, NOT gray).
 *
 * Design ref: 15_DESIGN.md §9 SCR-020 mobile wireframe.
 *
 * Note: The "Intención de hoy" field was retired from the morning sheet
 * (user feedback, 2026-05-20) — the day is shaped by activities + wins, not
 * by an additional one-liner. Energy indicators were also dropped from the
 * prototype (user feedback, 2026-05-20). Only Gratitud remains.
 */

import { SheetField } from './SheetField';

interface DaySheetMorningSectionProps {
  gratitude?: string;
}

export function DaySheetMorningSection({ gratitude }: DaySheetMorningSectionProps) {
  return (
    <section
      aria-labelledby="ag-morning-heading"
      className="ag-daysheet-morning"
      style={{
        position: 'relative',
        backgroundColor: 'var(--ag-bg-elevated)',
        borderRadius: 'var(--ag-radius-card)',
        padding: 'var(--ag-space-5) var(--ag-space-5) var(--ag-space-5) var(--ag-space-6)',
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

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-5)',
        }}
      >
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

        {/* Gratitud — empty state showcases italic serif placeholder */}
        <SheetField
          label="Gratitud"
          value={gratitude}
          placeholder="Algo por lo que estás agradecido"
          serif
        />
      </div>
    </section>
  );
}
