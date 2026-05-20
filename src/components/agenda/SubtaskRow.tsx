'use client';

/**
 * SubtaskRow — checkbox + text row for activity subtasks.
 * Local-only state toggling; nothing persisted.
 */

import { useState } from 'react';
import { Check } from 'lucide-react';

interface SubtaskRowProps {
  text: string;
  defaultDone?: boolean;
}

export function SubtaskRow({ text, defaultDone = false }: SubtaskRowProps) {
  const [done, setDone] = useState(defaultDone);

  return (
    <button
      type="button"
      onClick={() => setDone((d) => !d)}
      aria-pressed={done}
      style={{
        appearance: 'none',
        background: 'transparent',
        border: 'none',
        padding: 'var(--ag-space-2) 0',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        alignItems: 'center',
        gap: 'var(--ag-space-3)',
        cursor: 'pointer',
        textAlign: 'left',
        borderBottom: '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 18,
          height: 18,
          borderRadius: 'var(--ag-radius-xs)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? 'var(--ag-ink-primary)' : 'transparent',
          color: 'var(--ag-accent-on)',
          boxShadow: done
            ? 'inset 0 0 0 1px var(--ag-ink-primary)'
            : 'inset 0 0 0 1px var(--ag-rule)',
          flexShrink: 0,
        }}
      >
        {done ? <Check size={12} strokeWidth={2} /> : null}
      </span>
      <span
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 15,
          color: done ? 'var(--ag-ink-hint)' : 'var(--ag-ink-primary)',
          textDecoration: done ? 'line-through' : 'none',
          textDecorationColor: 'var(--ag-rule)',
        }}
      >
        {text}
      </span>
    </button>
  );
}
