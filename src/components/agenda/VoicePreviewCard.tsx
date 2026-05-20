/**
 * VoicePreviewCard — captured activity preview (SCR-050 state 2).
 * Hardcoded fields shown read-only with the same visual treatment as
 * the activity detail sections. No editing — purely visual.
 */

import { PriorityDots } from './PriorityDots';

export function VoicePreviewCard() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-4)',
      }}
    >
      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-1)' }}>
        <label
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--ag-slate)',
          }}
        >
          Título
        </label>
        <input
          readOnly
          defaultValue="Llamar a Juan"
          style={{
            border: 'none',
            borderBottom: '1px solid var(--ag-rule)',
            background: 'transparent',
            padding: '6px 0',
            fontFamily: 'var(--ag-font-display)',
            fontSize: 20,
            color: 'var(--ag-ink-primary)',
            outline: 'none',
          }}
        />
      </div>

      {/* Two-column grid: Proyecto + Cuándo */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--ag-space-4)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-1)' }}>
          <label
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--ag-slate)',
            }}
          >
            Proyecto
          </label>
          <span
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 15,
              color: 'var(--ag-ink-primary)',
              paddingBlock: 6,
              borderBottom: '1px solid var(--ag-rule)',
            }}
          >
            Personal ▾
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-1)' }}>
          <label
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--ag-slate)',
            }}
          >
            Cuándo
          </label>
          <span
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 15,
              color: 'var(--ag-ink-primary)',
              paddingBlock: 6,
              borderBottom: '1px solid var(--ag-rule)',
            }}
          >
            Mañana 10:00
          </span>
        </div>
      </div>

      {/* Prioridad */}
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
          Prioridad
        </span>
        <PriorityDots priority={5} />
      </div>

      {/* Hint */}
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-display)',
          fontStyle: 'italic',
          fontSize: 14,
          color: 'var(--ag-ink-hint)',
        }}
      >
        Empresa Genomma también match.
      </p>
    </div>
  );
}
