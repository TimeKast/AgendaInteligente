'use client';

/**
 * ExternalEventRow — decorative read-only Google Calendar event rendered in
 * an hour slot. Visually distinct from tasks (no checkbox, striped warm-ecru
 * background, italic serif title, small `Calendar` icon).
 *
 * Not draggable. Not droppable (blocks the slot). Hover/tap shows a tooltip
 * via native `title` attribute: "Tenés un evento Google a esa hora".
 */

import { Calendar } from 'lucide-react';

import { SLOT_HEIGHT_PX } from './CalendarGrid';

interface ExternalEventRowProps {
  title: string;
  /** "HH:mm – HH:mm" formatted range. */
  timeRange: string;
  /** Calendar source label (account label or calendar id). */
  source?: string;
  /**
   * Number of 30-min slots the event covers. When ≥ 2, the row is
   * absolutely positioned and grows down to span the right number of
   * slots — so a 9:30-10:30 meeting renders as ONE block, not two.
   */
  spanSlots?: number;
}

export function ExternalEventRow({
  title,
  timeRange,
  source,
  spanSlots = 1,
}: ExternalEventRowProps) {
  // Google freeBusy doesn't return event_title — the sync may store NULL.
  // Fall back to the source so the row is still useful instead of just
  // saying "Bloqueado" with no provenance.
  const isPlaceholder = title === 'Bloqueado';
  const displayTitle = isPlaceholder && source ? source : title;
  const sourceSuffix = source && !isPlaceholder ? source : 'Google';
  // When the event covers multiple 30-min slots, anchor the block at the top
  // of its host slot and grow down — one visual block per event.
  const spans = Math.max(1, spanSlots);
  const isMulti = spans > 1;
  return (
    <div
      title={source ? `Evento de ${source}` : 'Tenés un evento Google a esa hora'}
      role="note"
      aria-label={`Evento de Google Calendar: ${displayTitle}, ${timeRange}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--ag-space-2)',
        paddingBlock: 8,
        paddingInline: 10,
        borderRadius: 'var(--ag-radius-base)',
        // Subtle warm-ecru diagonal-striped fill — "this slot is taken".
        backgroundImage:
          'repeating-linear-gradient(135deg, color-mix(in oklab, var(--ag-bg-elevated), transparent 30%) 0 6px, transparent 6px 12px)',
        backgroundColor: 'color-mix(in oklab, var(--ag-bg-elevated), transparent 60%)',
        border: '1px solid color-mix(in oklab, var(--ag-rule), transparent 30%)',
        cursor: 'help',
        ...(isMulti
          ? {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              // Height = span × SLOT_HEIGHT − a small inset so adjacent rows
              // don't visually fuse together.
              height: spans * SLOT_HEIGHT_PX - 4,
              zIndex: 1,
              overflow: 'hidden',
            }
          : {}),
      }}
    >
      <Calendar
        size={14}
        strokeWidth={1.5}
        style={{ color: 'var(--ag-ink-hint)', flexShrink: 0 }}
        aria-hidden
      />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <span
          style={{
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--ag-ink-soft)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayTitle}
        </span>
        <span
          style={{
            fontFamily: 'var(--ag-font-mono)',
            fontSize: 11,
            color: 'var(--ag-ink-hint)',
            letterSpacing: '0.02em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {timeRange} · {sourceSuffix}
        </span>
      </div>
    </div>
  );
}
