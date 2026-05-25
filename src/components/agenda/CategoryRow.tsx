'use client';

/**
 * CategoryRow — sortable row representing a Category.
 *
 * Layout (left → right):
 *   [grip] [icon swatch] [name + project count] [⋯ menu]
 *
 * Variants:
 *   - Default: draggable, deletable
 *   - System (Inbox): no grip, no delete option in menu
 *
 * Inline menu opens on tap of the ⋯ button and offers Rename / Change color /
 * Delete actions. All actions are visual — wiring lives in the parent page.
 */

import { useState, useRef, useEffect } from 'react';
import { GripVertical, MoreHorizontal, Pencil, Palette, Plus, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CATEGORY_COLORS, type CategoryColorId } from './ColorPicker';
import { CATEGORY_ICONS, type CategoryIconId } from './IconPicker';

export interface CategoryItem {
  id: string;
  name: string;
  projectCount: number;
  color: CategoryColorId;
  icon: CategoryIconId;
  system?: boolean;
}

interface CategoryRowProps {
  category: CategoryItem;
  onDelete: (id: string) => void;
  /**
   * Optional handler invoked when the user taps the inline "+ Proyecto" affordance.
   * When omitted the button is hidden. Inbox (system) categories ignore taps —
   * the button is rendered disabled.
   */
  onAddProject?: (categoryId: string) => void;
}

export function CategoryRow({ category, onDelete, onAddProject }: CategoryRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
    disabled: category.system,
  });

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const colorMeta = CATEGORY_COLORS.find((c) => c.id === category.color) ?? CATEGORY_COLORS[0];
  const iconMeta = CATEGORY_ICONS.find((i) => i.id === category.icon) ?? CATEGORY_ICONS[0];
  const IconComponent = iconMeta.Icon;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? 'var(--ag-bg-elevated)' : 'transparent',
  };

  return (
    <li
      ref={setNodeRef}
      style={{
        ...style,
        listStyle: 'none',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto auto 1fr auto auto',
          alignItems: 'center',
          gap: 'var(--ag-space-3)',
          padding: 'var(--ag-space-3) 0',
          minHeight: 56,
          borderBottom: '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
          position: 'relative',
        }}
      >
        {/* Drag handle (hidden for system Inbox) */}
        {category.system ? (
          <span style={{ width: 20, display: 'inline-block' }} aria-hidden />
        ) : (
          <button
            type="button"
            aria-label={`Arrastrá para reordenar ${category.name}`}
            {...attributes}
            {...listeners}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--ag-ink-hint)',
              cursor: 'grab',
              touchAction: 'none',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <GripVertical size={18} strokeWidth={1.5} />
          </button>
        )}

        {/* Icon swatch */}
        <span
          aria-hidden
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--ag-radius-sm)',
            backgroundColor: colorMeta.hex,
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComponent size={15} strokeWidth={1.75} />
        </span>

        {/* Name + count */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 15,
              color: 'var(--ag-ink-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {category.name}
            {category.system ? (
              <span
                style={{
                  marginLeft: 6,
                  fontFamily: 'var(--ag-font-display)',
                  fontStyle: 'italic',
                  fontSize: 12,
                  color: 'var(--ag-ink-hint)',
                }}
              >
                (default)
              </span>
            ) : null}
          </span>
          <span
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              color: 'var(--ag-ink-hint)',
            }}
          >
            {category.projectCount}{' '}
            {category.projectCount === 1 ? 'proyecto' : 'proyectos'}
          </span>
        </div>

        {/* Inline "+ Proyecto" — quick affordance to create project in this cat */}
        {onAddProject ? (
          <button
            type="button"
            aria-label={
              category.system
                ? 'Inbox no admite proyectos manuales'
                : `Nuevo proyecto en ${category.name}`
            }
            title={
              category.system
                ? 'Inbox no admite proyectos manuales'
                : `Nuevo proyecto en ${category.name}`
            }
            disabled={category.system}
            onClick={() => {
              if (!category.system) onAddProject(category.id);
            }}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: '1px solid var(--ag-rule)',
              color: category.system ? 'var(--ag-ink-hint)' : 'var(--ag-ink-soft)',
              cursor: category.system ? 'not-allowed' : 'pointer',
              padding: '4px 8px',
              borderRadius: 'var(--ag-radius-pill)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              opacity: category.system ? 0.5 : 1,
            }}
          >
            <Plus size={14} strokeWidth={1.75} aria-hidden />
            <span>Proyecto</span>
          </button>
        ) : null}

        {/* Menu trigger */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            type="button"
            aria-label={`Acciones para ${category.name}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--ag-ink-soft)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 'var(--ag-radius-pill)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MoreHorizontal size={18} strokeWidth={1.5} />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 4px)',
                backgroundColor: 'var(--ag-bg)',
                border: '1px solid var(--ag-rule)',
                borderRadius: 'var(--ag-radius-base)',
                boxShadow: '0 4px 16px rgba(42, 40, 38, 0.12)',
                minWidth: 180,
                padding: 4,
                display: 'flex',
                flexDirection: 'column',
                zIndex: 20,
              }}
            >
              <MenuItem
                icon={<Pencil size={14} strokeWidth={1.75} />}
                label="Renombrar"
                onClick={() => setMenuOpen(false)}
              />
              <MenuItem
                icon={<Palette size={14} strokeWidth={1.75} />}
                label="Cambiar color"
                onClick={() => setMenuOpen(false)}
                disabled={category.system}
              />
              <MenuItem
                icon={<Trash2 size={14} strokeWidth={1.75} />}
                label="Borrar"
                destructive
                disabled={category.system}
                hint={category.system ? 'Inbox no se puede borrar.' : undefined}
                onClick={() => {
                  setMenuOpen(false);
                  if (!category.system) onDelete(category.id);
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive,
  disabled,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      title={hint}
      style={{
        appearance: 'none',
        background: 'transparent',
        border: 'none',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--ag-space-2)',
        padding: '8px 10px',
        borderRadius: 'var(--ag-radius-sm)',
        fontFamily: 'var(--ag-font-body)',
        fontSize: 14,
        color: disabled
          ? 'var(--ag-ink-hint)'
          : destructive
            ? 'var(--ag-danger)'
            : 'var(--ag-ink-primary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span aria-hidden style={{ display: 'inline-flex' }}>
        {icon}
      </span>
      {label}
    </button>
  );
}
