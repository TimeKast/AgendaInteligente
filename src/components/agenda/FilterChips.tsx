'use client';

/**
 * FilterChips — horizontal segmented control (e.g. All / Pending / Done).
 * Tone-on-tone: selected chip uses ink-primary background.
 */

interface FilterChipsProps<T extends string> {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label="Filtro"
      style={{
        display: 'inline-flex',
        gap: 'var(--ag-space-2)',
        flexWrap: 'wrap',
      }}
    >
      {options.map((o) => {
        const isSelected = o.id === value;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={isSelected}
            type="button"
            onClick={() => onChange(o.id)}
            style={{
              appearance: 'none',
              padding: '6px 12px',
              borderRadius: 'var(--ag-radius-pill)',
              border: `1px solid ${isSelected ? 'var(--ag-ink-primary)' : 'var(--ag-rule)'}`,
              backgroundColor: isSelected ? 'var(--ag-ink-primary)' : 'transparent',
              color: isSelected ? 'var(--ag-accent-on)' : 'var(--ag-ink-soft)',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              fontWeight: isSelected ? 500 : 400,
              cursor: 'pointer',
              transition:
                'background-color var(--ag-duration-base) var(--ag-ease), color var(--ag-duration-base) var(--ag-ease)',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
