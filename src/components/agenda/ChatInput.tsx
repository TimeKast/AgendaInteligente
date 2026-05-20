'use client';

/**
 * ChatInput — sticky bottom bar (mobile-first) with textarea, mic and send.
 *
 * Visual-only. No real submission. Send is disabled-visual to communicate
 * that the user must type first; mic logs to console.
 */

import { useState } from 'react';
import { Mic, ArrowRight } from 'lucide-react';

export function ChatInput() {
  const [value, setValue] = useState('');
  const canSend = value.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // Visual-only — never submits.
      }}
      style={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--ag-bg)',
        borderTop: '1px solid var(--ag-rule)',
        paddingInline: 'var(--ag-space-3)',
        paddingBlock: 'var(--ag-space-3)',
        paddingBottom: 'calc(var(--ag-space-3) + env(safe-area-inset-bottom, 0px))',
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        gap: 'var(--ag-space-2)',
        alignItems: 'end',
      }}
    >
      <textarea
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Escribí algo..."
        aria-label="Mensaje"
        style={{
          resize: 'none',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 15,
          lineHeight: 1.5,
          color: 'var(--ag-ink-primary)',
          padding: '10px 12px',
          borderRadius: 'var(--ag-radius-base)',
          border: '1px solid var(--ag-rule)',
          backgroundColor: 'var(--ag-bg-elevated)',
          outline: 'none',
          minHeight: 40,
          maxHeight: 120,
        }}
      />

      <button
        type="button"
        onClick={() => {
          console.log('mic tapped');
        }}
        aria-label="Capturar con voz"
        style={iconBtnStyle}
      >
        <Mic size={20} strokeWidth={1.5} />
      </button>

      <button
        type="submit"
        disabled={!canSend}
        aria-label="Enviar"
        aria-disabled={!canSend}
        style={{
          ...iconBtnStyle,
          backgroundColor: canSend ? 'var(--ag-accent-primary)' : 'var(--ag-bg-sunken)',
          color: canSend ? 'var(--ag-accent-on)' : 'var(--ag-ink-hint)',
          border: 'none',
          cursor: canSend ? 'pointer' : 'not-allowed',
        }}
      >
        <ArrowRight size={20} strokeWidth={1.5} />
      </button>
    </form>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 'var(--ag-radius-pill)',
  border: '1px solid var(--ag-rule)',
  backgroundColor: 'transparent',
  color: 'var(--ag-ink-soft)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};
