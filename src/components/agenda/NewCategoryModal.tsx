'use client';

/**
 * NewCategoryModal — visual-only modal to add a category to local state.
 *
 * Fields:
 *   - Name (text input)
 *   - Color (ColorPicker)
 *   - Icon (IconPicker)
 *
 * On submit, invokes `onCreate` with the picked values. The parent owns the
 * categories state — this component is dumb / controlled.
 */

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ColorPicker, CATEGORY_COLORS, type CategoryColorId } from './ColorPicker';
import { IconPicker, CATEGORY_ICONS, type CategoryIconId } from './IconPicker';

interface NewCategoryModalProps {
  open: boolean;
  onCancel: () => void;
  onCreate: (data: { name: string; color: CategoryColorId; icon: CategoryIconId }) => void;
}

export function NewCategoryModal({ open, onCancel, onCreate }: NewCategoryModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<CategoryColorId>(CATEGORY_COLORS[1].id);
  const [icon, setIcon] = useState<CategoryIconId>(CATEGORY_ICONS[0].id);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName('');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setColor(CATEGORY_COLORS[1].id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIcon(CATEGORY_ICONS[0].id);
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  const canSubmit = name.trim().length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-cat-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 'var(--ag-space-4)',
        backgroundColor: 'color-mix(in oklab, var(--ag-ink-primary), transparent 60%)',
      }}
      onClick={onCancel}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          onCreate({ name: name.trim(), color, icon });
        }}
        style={{
          maxWidth: 480,
          width: '100%',
          backgroundColor: 'var(--ag-bg)',
          borderRadius: 'var(--ag-radius-card)',
          padding: 'var(--ag-space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-4)',
          boxShadow: '0 4px 24px rgba(42, 40, 38, 0.18)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            id="new-cat-title"
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontSize: 19,
              fontWeight: 500,
              color: 'var(--ag-ink-primary)',
            }}
          >
            Nueva categoría
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar"
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--ag-ink-soft)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
          <span
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--ag-slate)',
            }}
          >
            Nombre
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Side project"
            autoFocus
            style={{
              appearance: 'none',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--ag-rule)',
              padding: '8px 0',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 16,
              color: 'var(--ag-ink-primary)',
              outline: 'none',
            }}
          />
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
          <span
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--ag-slate)',
            }}
          >
            Color
          </span>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
          <span
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--ag-slate)',
            }}
          >
            Ícono
          </span>
          <IconPicker value={icon} onChange={setIcon} />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--ag-space-2)',
            marginTop: 'var(--ag-space-2)',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: '1px solid var(--ag-rule)',
              borderRadius: 'var(--ag-radius-base)',
              padding: '10px 16px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              color: 'var(--ag-ink-soft)',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              appearance: 'none',
              background: canSubmit ? 'var(--ag-ink-primary)' : 'var(--ag-bg-sunken)',
              border: 'none',
              borderRadius: 'var(--ag-radius-base)',
              padding: '10px 16px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              fontWeight: 500,
              color: canSubmit ? 'var(--ag-accent-on)' : 'var(--ag-ink-hint)',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            Crear
          </button>
        </div>
      </form>
    </div>
  );
}
