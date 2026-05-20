/**
 * UsageMeter — SCR-036. Simple key/value rows showing current month usage of
 * metered resources (AI calls, voice minutes, Whisper seconds).
 *
 * Pure presentational. Counts are passed as strings to allow units / formatting
 * decisions (e.g. "2,341", "8.4 min").
 */

interface UsageRow {
  label: string;
  value: string;
}

interface UsageMeterProps {
  caption: string;
  rows: UsageRow[];
}

export function UsageMeter({ caption, rows }: UsageMeterProps) {
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'var(--ag-space-5)',
      }}
    >
      <h3
        style={{
          margin: 0,
          paddingInline: 'var(--ag-space-4)',
          paddingBottom: 'var(--ag-space-2)',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ag-slate)',
        }}
      >
        {caption}
      </h3>

      <div
        style={{
          backgroundColor: 'var(--ag-bg-elevated)',
          borderTop: '1px solid var(--ag-rule)',
          borderBottom: '1px solid var(--ag-rule)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--ag-space-3) var(--ag-space-4)',
              borderBottom: '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
              minHeight: 48,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--ag-font-body)',
                fontSize: 15,
                color: 'var(--ag-ink-primary)',
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontFamily: 'var(--ag-font-mono)',
                fontSize: 14,
                color: 'var(--ag-ink-soft)',
                letterSpacing: '0.02em',
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
