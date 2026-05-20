'use client';

/**
 * IconPicker — Lucide icon subset for category personalization.
 * Used inside NewCategoryModal.
 */

import {
  Folder,
  Briefcase,
  User,
  Star,
  Heart,
  Book,
  Target,
  Home,
  Globe,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export const CATEGORY_ICONS: Array<{ id: string; Icon: LucideIcon; label: string }> = [
  { id: 'folder', Icon: Folder, label: 'Carpeta' },
  { id: 'briefcase', Icon: Briefcase, label: 'Trabajo' },
  { id: 'user', Icon: User, label: 'Personal' },
  { id: 'star', Icon: Star, label: 'Importante' },
  { id: 'heart', Icon: Heart, label: 'Salud' },
  { id: 'book', Icon: Book, label: 'Aprendizaje' },
  { id: 'target', Icon: Target, label: 'Meta' },
  { id: 'home', Icon: Home, label: 'Hogar' },
  { id: 'globe', Icon: Globe, label: 'Viaje' },
  { id: 'zap', Icon: Zap, label: 'Side project' },
];

export type CategoryIconId = (typeof CATEGORY_ICONS)[number]['id'];

interface IconPickerProps {
  value: CategoryIconId;
  onChange: (id: CategoryIconId) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Ícono de categoría"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--ag-space-2)',
      }}
    >
      {CATEGORY_ICONS.map(({ id, Icon, label }) => {
        const isSelected = id === value;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={label}
            onClick={() => onChange(id)}
            style={{
              appearance: 'none',
              width: 36,
              height: 36,
              borderRadius: 'var(--ag-radius-base)',
              backgroundColor: isSelected ? 'var(--ag-bg-sunken)' : 'transparent',
              border: `1px solid ${isSelected ? 'var(--ag-ink-primary)' : 'var(--ag-rule)'}`,
              color: isSelected ? 'var(--ag-ink-primary)' : 'var(--ag-ink-soft)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition:
                'background-color var(--ag-duration-base) var(--ag-ease), border-color var(--ag-duration-base) var(--ag-ease)',
            }}
          >
            <Icon size={18} strokeWidth={1.75} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
