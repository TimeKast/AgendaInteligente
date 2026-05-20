'use client';

/**
 * ColorPicker — 10 predefined warm-coherent swatches.
 * Used inside NewCategoryModal. NEVER bright blue / violet / saturated.
 */

import { Check } from 'lucide-react';

export const CATEGORY_COLORS = [
  { id: 'warm-charcoal', hex: '#2A2826', label: 'Carbón' },
  { id: 'sage', hex: '#5C7B5C', label: 'Salvia' },
  { id: 'burnt-orange', hex: '#A85530', label: 'Naranja quemado' },
  { id: 'steel-blue', hex: '#3F5E78', label: 'Acero' },
  { id: 'wine', hex: '#7B3F4A', label: 'Vino' },
  { id: 'taupe', hex: '#7A6E64', label: 'Taupe' },
  { id: 'sage-muted', hex: '#8FA68F', label: 'Salvia claro' },
  { id: 'terracotta', hex: '#B8825C', label: 'Terracota' },
  { id: 'forest', hex: '#3D5A40', label: 'Bosque' },
  { id: 'dusk', hex: '#4A4555', label: 'Dusk' },
] as const;

export type CategoryColorId = (typeof CATEGORY_COLORS)[number]['id'];

interface ColorPickerProps {
  value: CategoryColorId;
  onChange: (id: CategoryColorId) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Color de categoría"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--ag-space-2)',
      }}
    >
      {CATEGORY_COLORS.map((c) => {
        const isSelected = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={c.label}
            onClick={() => onChange(c.id)}
            style={{
              appearance: 'none',
              width: 32,
              height: 32,
              borderRadius: 'var(--ag-radius-pill)',
              backgroundColor: c.hex,
              border: 'none',
              boxShadow: isSelected
                ? `0 0 0 2px var(--ag-bg), 0 0 0 4px var(--ag-ink-primary)`
                : `inset 0 0 0 1px color-mix(in oklab, ${c.hex}, black 12%)`,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              transition: 'box-shadow var(--ag-duration-base) var(--ag-ease)',
            }}
          >
            {isSelected ? <Check size={16} strokeWidth={2.25} aria-hidden /> : null}
          </button>
        );
      })}
    </div>
  );
}
