'use client';

/**
 * Toggle — minimal switch component.
 *
 * No bouncy spring — calm fade + position transition (var(--ag-duration-base)).
 * Off: bg-sunken track, ink-hint thumb border. On: ink-primary track, cream thumb.
 */

import { useState } from 'react';

interface ToggleProps {
  label?: string;
  defaultChecked?: boolean;
}

export function Toggle({ label, defaultChecked = false }: ToggleProps) {
  const [on, setOn] = useState(defaultChecked);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label ?? 'toggle'}
      onClick={() => setOn((v) => !v)}
      style={{
        appearance: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        width: 36,
        height: 22,
        borderRadius: 'var(--ag-radius-pill)',
        backgroundColor: on ? 'var(--ag-ink-primary)' : 'var(--ag-bg-sunken)',
        boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--ag-rule)',
        position: 'relative',
        transition: `background-color var(--ag-duration-base) var(--ag-ease)`,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 16 : 2,
          width: 18,
          height: 18,
          borderRadius: 'var(--ag-radius-pill)',
          backgroundColor: on ? 'var(--ag-accent-on)' : 'var(--ag-bg)',
          boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--ag-rule)',
          transition: `left var(--ag-duration-base) var(--ag-ease), background-color var(--ag-duration-base) var(--ag-ease)`,
        }}
      />
    </button>
  );
}
