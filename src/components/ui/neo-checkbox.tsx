'use client';

/**
 * NeoCheckbox — Neumorphic Checkbox Component
 *
 * Custom checkbox styled with neumorphic inset/outset shadows
 * to match the design system. Replaces native checkboxes that
 * break the visual language.
 *
 * @example
 * ```tsx
 * <NeoCheckbox
 *   checked={isSelected}
 *   onChange={(checked) => setSelected(checked)}
 * />
 * ```
 *
 * @see UXUI-007 — transversal component
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface NeoCheckboxProps {
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Callback when checkbox is toggled */
  onChange: (checked: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Optional label text */
  label?: string;
  /** Optional className for the wrapper */
  className?: string;
}

/**
 * Neumorphic checkbox with inset (unchecked) and outset (checked) shadows.
 */
export function NeoCheckbox({
  checked,
  onChange,
  disabled = false,
  label,
  className,
}: NeoCheckboxProps) {
  return (
    <div
      className={cn(
        'inline-flex cursor-pointer items-center gap-2 select-none',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all duration-150',
          checked
            ? 'bg-primary text-primary-foreground shadow-(--neo-outset-sm)'
            : 'bg-background shadow-(--neo-inset)'
        )}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>
      {label && <span className="text-foreground text-sm">{label}</span>}
    </div>
  );
}
