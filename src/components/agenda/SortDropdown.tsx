'use client';

/**
 * SortDropdown — minimal native select dressed in warm-book tones.
 * Used for "Sort: Date / Priority" on project detail.
 */

import { ChevronDown } from 'lucide-react';

interface SortDropdownProps<T extends string> {
  label: string;
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
}

export function SortDropdown<T extends string>({
  label,
  options,
  value,
  onChange,
}: SortDropdownProps<T>) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 8px 6px 12px',
        borderRadius: 'var(--ag-radius-pill)',
        border: '1px solid var(--ag-rule)',
        backgroundColor: 'transparent',
        fontFamily: 'var(--ag-font-body)',
        fontSize: 13,
        color: 'var(--ag-ink-soft)',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <span aria-hidden style={{ color: 'var(--ag-ink-hint)' }}>
        {label}:
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        style={{
          appearance: 'none',
          background: 'transparent',
          border: 'none',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          color: 'var(--ag-ink-primary)',
          padding: '0 18px 0 0',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={1.5}
        aria-hidden
        style={{
          position: 'absolute',
          right: 8,
          pointerEvents: 'none',
          color: 'var(--ag-ink-hint)',
        }}
      />
    </label>
  );
}
