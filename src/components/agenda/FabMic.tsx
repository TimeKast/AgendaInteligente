'use client';

/**
 * FabMic — 56×56 floating action button (CMP-005).
 *
 * Position: fixed bottom-right, offset above the bottom nav (64px) by 16px.
 * Background: warm charcoal `--ag-accent-primary`. Icon cream.
 * Stroke 1.75 per design rules.
 *
 * NOTE: The real voice capture flow (EPIC-VOICE) is out of scope for this
 * prototype. This button only logs to the console.
 */

import { Mic } from 'lucide-react';

export function FabMic() {
  return (
    <button
      type="button"
      aria-label="Capturar con voz"
      onClick={() => {
        console.log('mic tapped');
      }}
      style={{
        position: 'fixed',
        right: 16,
        bottom: 'calc(64px + 16px + env(safe-area-inset-bottom, 0px))',
        width: 56,
        height: 56,
        borderRadius: 'var(--ag-radius-pill)',
        backgroundColor: 'var(--ag-accent-primary)',
        color: 'var(--ag-accent-on)',
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        // Calm, soft shadow — no neumo, no glass.
        boxShadow: '0 1px 2px rgba(42, 40, 38, 0.12), 0 2px 6px rgba(42, 40, 38, 0.08)',
        transition: `background-color var(--ag-duration-base) var(--ag-ease), transform var(--ag-duration-base) var(--ag-ease)`,
        zIndex: 40,
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.97)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <Mic size={24} strokeWidth={1.75} />
    </button>
  );
}
