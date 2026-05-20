/**
 * SettingRow — single row inside a SettingsSection.
 *
 * Variants:
 *   - link (default): label + value/preview + chevron, wraps in <Link>.
 *   - static: label + value, no chevron, no link.
 *   - slot: label + right slot (Toggle, picker, etc.).
 */

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface SettingRowProps {
  label: string;
  /** Optional value/preview (e.g. "fedelevi@hotmail.com"). */
  value?: string;
  /** Make the row a link. */
  href?: string;
  /** Right-side custom slot (Toggle, etc.). When set, no chevron is shown. */
  rightSlot?: ReactNode;
  /** Subtle italic serif hint below the label (e.g. "Auto-revierte en 48h"). */
  hint?: string;
}

export function SettingRow({ label, value, href, rightSlot, hint }: SettingRowProps) {
  const rowInner = (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 15,
            color: 'var(--ag-ink-primary)',
          }}
        >
          {label}
        </span>
        {hint ? (
          <span
            style={{
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--ag-ink-hint)',
            }}
          >
            {hint}
          </span>
        ) : null}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--ag-space-2)',
          color: 'var(--ag-ink-hint)',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 14,
        }}
      >
        {value ? (
          <span
            style={{
              maxWidth: 180,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {value}
          </span>
        ) : null}
        {rightSlot ?? null}
        {href ? <ChevronRight size={18} strokeWidth={1.5} /> : null}
      </div>
    </>
  );

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    alignItems: 'center',
    gap: 'var(--ag-space-3)',
    padding: 'var(--ag-space-3) var(--ag-space-4)',
    borderBottom: '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
    minHeight: 52,
    color: 'inherit',
    textDecoration: 'none',
  };

  if (href) {
    return (
      <Link href={href} style={rowStyle}>
        {rowInner}
      </Link>
    );
  }

  return <div style={rowStyle}>{rowInner}</div>;
}
