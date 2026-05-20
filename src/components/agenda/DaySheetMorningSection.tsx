/**
 * DaySheetMorningSection — the top "morning" block of the Day sheet.
 *
 * Visual signature:
 *  - Lateral 4px scope accent bar in `--ag-scope-day` (DD-pattern-3).
 *  - Serif h2 "Intención de hoy".
 *  - Inline intention field (filled or italic placeholder).
 *  - Hairline divider in `--ag-rule` (warm ecru, NOT gray).
 *  - Energy indicators block.
 *  - Italic serif placeholder for "Gratitud" (unfilled).
 *
 * Design ref: 15_DESIGN.md §9 SCR-020 mobile wireframe.
 */

import { EnergyIndicators } from './EnergyIndicators';
import { SheetField } from './SheetField';

interface DaySheetMorningSectionProps {
  intention?: string;
  gratitude?: string;
  energyPhysical: 0 | 1 | 2 | 3 | 4 | 5;
  energyMental: 0 | 1 | 2 | 3 | 4 | 5;
  energyEmotional: 0 | 1 | 2 | 3 | 4 | 5;
}

export function DaySheetMorningSection({
  intention,
  gratitude,
  energyPhysical,
  energyMental,
  energyEmotional,
}: DaySheetMorningSectionProps) {
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
        {/* Heading */}
        <h2
          id="ag-morning-heading"
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontSize: 22,
            lineHeight: 1.25,
            fontWeight: 500,
            color: 'var(--ag-ink-primary)',
          }}
        >
          Intención de hoy
        </h2>

        {/* Intention text — serif body, ink primary when filled */}
        <SheetField value={intention} placeholder="Una intención, en una frase" serif />

        {/* Hairline divider — warm ecru */}
        <hr
          style={{
            margin: 0,
            border: 'none',
            borderTop: '1px solid var(--ag-rule)',
          }}
        />

        {/* Energy indicators */}
        <EnergyIndicators
          rows={[
            { label: 'Físico', value: energyPhysical },
            { label: 'Mental', value: energyMental },
            { label: 'Emocional', value: energyEmotional },
          ]}
        />

        {/* Hairline divider before gratitude */}
        <hr
          style={{
            margin: 0,
            border: 'none',
            borderTop: '1px solid var(--ag-rule)',
          }}
        />

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
