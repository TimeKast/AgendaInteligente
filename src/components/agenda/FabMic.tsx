'use client';

/**
 * FabMic — 56×56 floating action button (CMP-005).
 *
 * Mobile: fixed bottom-right, offset above bottom nav.
 * Desktop: fixed bottom-right without bottom-nav offset because the primary nav
 * moves to the left sidebar.
 */

import { useState } from 'react';
import { Mic } from 'lucide-react';
import { VoiceCaptureSheet } from './VoiceCaptureSheet';

const FAB_CSS = `
[data-theme='agenda'] .ag-fab-mic {
  position: fixed;
  right: 16px;
  bottom: calc(64px + 16px + env(safe-area-inset-bottom, 0px));
  width: 56px;
  height: 56px;
  border-radius: var(--ag-radius-pill);
  background-color: var(--ag-accent-primary);
  color: var(--ag-accent-on);
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(42, 40, 38, 0.12), 0 2px 6px rgba(42, 40, 38, 0.08);
  transition: background-color var(--ag-duration-base) var(--ag-ease), transform var(--ag-duration-base) var(--ag-ease);
  z-index: 40;
}

@media (min-width: 768px) {
  [data-theme='agenda'] .ag-fab-mic {
    bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  }
}
`;

export function FabMic() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{FAB_CSS}</style>
      <button
        type="button"
        aria-label="Capturar con voz"
        onClick={() => setOpen(true)}
        className="ag-fab-mic"
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

      <VoiceCaptureSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
