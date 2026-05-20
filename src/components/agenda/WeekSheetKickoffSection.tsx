/**
 * WeekSheetKickoffSection — top kickoff block of the week sheet (SCR-021).
 *
 * Visual signature:
 *  - Lateral 4px scope accent bar in `--ag-scope-week` (darker than Day).
 *  - Serif h2 reflective prompt.
 *  - SheetField filled value (serif).
 *  - "3 wins de la semana" list with checkbox-like markers.
 *
 * Pattern parallel: DaySheetMorningSection (Day scope). Same visual grammar,
 * different scope color + content semantics.
 */

import { SheetField } from './SheetField';

interface WeekWin {
  text: string;
  done: boolean;
}

interface WeekSheetKickoffSectionProps {
  /** Single-thing focus for the week (filled or empty). */
  oneThing?: string;
  /** Up to 3 wins. Empty array → italic empty state. */
  wins: WeekWin[];
}

export function WeekSheetKickoffSection({ oneThing, wins }: WeekSheetKickoffSectionProps) {
  return (
    <section
      aria-labelledby="ag-week-kickoff-heading"
      className="ag-weeksheet-kickoff"
      style={{
        position: 'relative',
        backgroundColor: 'var(--ag-bg-elevated)',
        borderRadius: 'var(--ag-radius-card)',
        padding: 'var(--ag-space-5) var(--ag-space-5) var(--ag-space-5) var(--ag-space-6)',
        marginInline: 'var(--ag-space-4)',
        marginBlock: 'var(--ag-space-4)',
        boxShadow: '0 1px 2px rgba(42, 40, 38, 0.04)',
        overflow: 'hidden',
      }}
    >
      {/* Scope accent bar — Week scope (darker ink) */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: 'var(--ag-scope-week)',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-5)',
        }}
      >
        <h2
          id="ag-week-kickoff-heading"
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontSize: 22,
            lineHeight: 1.25,
            fontWeight: 500,
            color: 'var(--ag-ink-primary)',
          }}
        >
          Kickoff de la semana
        </h2>

        <SheetField
          label="Foco"
          value={oneThing}
          placeholder="Si sólo una cosa pasa esta semana, ¿cuál?"
          serif
        />

        <hr
          style={{
            margin: 0,
            border: 'none',
            borderTop: '1px solid var(--ag-rule)',
          }}
        />

        {/* 3 wins list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
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
            3 wins de la semana
          </span>

          <ol
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ag-space-2)',
              counterReset: 'wins',
            }}
          >
            {wins.map((win, i) => (
              <li
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto auto 1fr',
                  alignItems: 'center',
                  gap: 'var(--ag-space-2)',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    fontFamily: 'var(--ag-font-mono)',
                    fontSize: 13,
                    color: 'var(--ag-ink-hint)',
                    width: 16,
                  }}
                >
                  {i + 1}.
                </span>
                <span
                  aria-label={win.done ? 'Hecho' : 'Pendiente'}
                  style={{
                    display: 'inline-block',
                    width: 16,
                    height: 16,
                    borderRadius: 'var(--ag-radius-xs)',
                    backgroundColor: win.done ? 'var(--ag-ink-primary)' : 'transparent',
                    boxShadow: win.done
                      ? 'inset 0 0 0 1px var(--ag-ink-primary)'
                      : 'inset 0 0 0 1px var(--ag-rule)',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--ag-font-body)',
                    fontSize: 15,
                    color: win.done ? 'var(--ag-ink-hint)' : 'var(--ag-ink-primary)',
                    textDecoration: win.done ? 'line-through' : 'none',
                  }}
                >
                  {win.text}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
