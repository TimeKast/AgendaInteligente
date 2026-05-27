'use client';

/**
 * ChatInput — sticky bottom bar (mobile-first) with textarea, mic and send.
 *
 * Two modes:
 *   - No `onSubmit` prop → visual-only (prototype pages keep working).
 *   - With `onSubmit` → wire to a real handler (LiveChat). On submit the
 *     text gets passed up and the local state cleared. `disabled` lets
 *     the parent block input while a stream is in flight.
 */

import { useState } from 'react';
import { Mic, ArrowRight } from 'lucide-react';

export interface ChatInputProps {
  /** Called with the trimmed message when the user submits. */
  onSubmit?: (text: string) => void;
  /** Block input + send button while a stream is in flight. */
  disabled?: boolean;
}

export function ChatInput({ onSubmit, disabled }: ChatInputProps = {}) {
  const [value, setValue] = useState('');
  const canSend = value.trim().length > 0 && !disabled;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend || !onSubmit) return;
    const text = value.trim();
    onSubmit(text);
    setValue('');
  }

  return (
    <form
      onSubmit={handleSubmit}
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
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        placeholder="Escribe algo..."
        aria-label="Mensaje"
        disabled={disabled}
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
