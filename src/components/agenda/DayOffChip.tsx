'use client';

/**
 * DayOffChip — single chip representing a date or date range marked as "off"
 * (no cron pings). Renders the formatted date/range + optional label, with an
 * "×" remove button.
 *
 * Visual-only prototype: state ownership lives in the parent (notifications
 * page) — this component is dumb / controlled.
 */

import { X } from 'lucide-react';

export interface DayOff {
  id: string;
  /** ISO yyyy-mm-dd start date. */
  from: string;
  /** ISO yyyy-mm-dd end date. Equal to `from` for single-day. */
  to: string;
  /** Optional label ("Vacaciones", "Feriado"). */
  label?: string;
}

interface DayOffChipProps {
  dayOff: DayOff;
  onRemove: (id: string) => void;
}

const MONTHS_ES_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/** Format ISO yyyy-mm-dd as "DD mmm YYYY" (es). */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_ES_SHORT[m - 1]} ${y}`;
}

/** Single date OR range pretty-print. */
function formatRange(from: string, to: string): string {
  if (from === to) return formatDate(from);
  return `${formatDate(from)} – ${formatDate(to)}`;
}

export function DayOffChip({ dayOff, onRemove }: DayOffChipProps) {
  const range = formatRange(dayOff.from, dayOff.to);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'var(--ag-bg)',
        border: '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-pill)',
        padding: '4px 4px 4px 12px',
        fontFamily: 'var(--ag-font-body)',
        fontSize: 13,
        color: 'var(--ag-ink-primary)',
        maxWidth: '100%',
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {range}
        {dayOff.label ? (
          <span
            style={{
              marginLeft: 6,
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              color: 'var(--ag-ink-hint)',
            }}
          >
            · {dayOff.label}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        onClick={() => onRemove(dayOff.id)}
        aria-label={`Quitar ${range}`}
        style={{
          appearance: 'none',
          background: 'transparent',
          border: 'none',
          color: 'var(--ag-ink-hint)',
          cursor: 'pointer',
          padding: 2,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={14} strokeWidth={1.5} />
      </button>
    </span>
  );
}
