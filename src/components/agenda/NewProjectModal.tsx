'use client';

/**
 * NewProjectModal — visual-only modal to add a project to local state.
 *
 * Fields:
 *   - Nombre (text, required, autofocus)
 *   - Categoría (select, required — hardcoded list)
 *   - Descripción (textarea, optional)
 *   - Outcome esperado (textarea, optional)
 *   - Deadline (native date input, optional)
 *   - Estado (radio cards: Active / Paused / Completed / Killed)
 *
 * On submit, invokes `onCreate` with the payload. The parent owns the
 * projects state — this component is dumb / controlled.
 *
 * Reset strategy: parent uses key-driven remount to clear state between
 * open/close cycles (avoids setState-in-effect).
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import type { ProjectStatus } from './StatusBadge';

export interface NewProjectPayload {
  name: string;
  categoryName: string;
  description: string;
  outcome: string;
  deadline: string; // ISO yyyy-mm-dd or ''
  status: ProjectStatus;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface NewProjectModalProps {
  open: boolean;
  categories: CategoryOption[];
  /**
   * Optional category name to pre-select (and lock) when the modal opens.
   * Used when launching the modal from a specific CategoryRow so the user
   * doesn't need to pick the category again.
   */
  defaultCategoryName?: string;
  /** When true and `defaultCategoryName` is provided, the select becomes read-only. */
  lockCategory?: boolean;
  onCancel: () => void;
  onCreate: (data: NewProjectPayload) => void;
}

const STATUS_OPTIONS: Array<{ id: ProjectStatus; label: string; hint: string }> = [
  { id: 'active', label: 'Active', hint: 'En marcha.' },
  { id: 'paused', label: 'Paused', hint: 'En pausa, lo retomás.' },
  { id: 'completed', label: 'Completed', hint: 'Cerrado, cumplido.' },
  { id: 'killed', label: 'Killed', hint: 'Archivado sin cumplir.' },
];

export function NewProjectModal({
  open,
  categories,
  defaultCategoryName,
  lockCategory = false,
  onCancel,
  onCreate,
}: NewProjectModalProps) {
  // Default category: explicit prop wins, else first non-inbox, fallback to first.
  const initialCategoryName =
    defaultCategoryName ??
    categories.find((c) => c.name.toLowerCase() !== 'inbox')?.name ??
    categories[0]?.name ??
    '';

  const [name, setName] = useState('');
  const [categoryName, setCategoryName] = useState(initialCategoryName);
  const [description, setDescription] = useState('');
  const [outcome, setOutcome] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');

  if (!open) return null;

  const canSubmit = name.trim().length > 0 && categoryName.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-project-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
      }}
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
          onCreate({
            name: name.trim(),
            categoryName,
            description: description.trim(),
            outcome: outcome.trim(),
            deadline,
            status,
          });
        }}
        style={{
          maxWidth: 480,
          width: '100%',
          maxHeight: 'calc(100vh - var(--ag-space-6))',
          overflowY: 'auto',
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
            id="new-project-title"
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontSize: 19,
              fontWeight: 500,
              color: 'var(--ag-ink-primary)',
            }}
          >
            Nuevo proyecto
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

        {/* Nombre */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
          <FieldLabel>Nombre</FieldLabel>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Llamalo como te resuene"
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
          <style>{`
            input::placeholder, textarea::placeholder {
              font-family: var(--ag-font-display);
              font-style: italic;
              color: var(--ag-ink-hint);
            }
          `}</style>
        </label>

        {/* Categoría */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
          <FieldLabel>Categoría</FieldLabel>
          <select
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            disabled={lockCategory}
            aria-readonly={lockCategory || undefined}
            style={{
              appearance: 'none',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--ag-rule)',
              padding: '8px 0',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 16,
              color: lockCategory ? 'var(--ag-ink-soft)' : 'var(--ag-ink-primary)',
              outline: 'none',
              cursor: lockCategory ? 'not-allowed' : 'pointer',
              opacity: lockCategory ? 0.8 : 1,
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          {lockCategory ? (
            <span
              style={{
                fontFamily: 'var(--ag-font-display)',
                fontStyle: 'italic',
                fontSize: 12,
                color: 'var(--ag-ink-hint)',
              }}
            >
              Pre-seleccionada desde la categoría.
            </span>
          ) : null}
        </label>

        {/* Descripción */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
          <FieldLabel>Descripción</FieldLabel>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Para qué lo armás"
            rows={2}
            style={{
              appearance: 'none',
              backgroundColor: 'transparent',
              border: '1px solid var(--ag-rule)',
              borderRadius: 'var(--ag-radius-sm)',
              padding: '8px 10px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              color: 'var(--ag-ink-primary)',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </label>

        {/* Outcome */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
          <FieldLabel>Outcome esperado</FieldLabel>
          <textarea
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="Cómo se ve cuando se cumple"
            rows={2}
            style={{
              appearance: 'none',
              backgroundColor: 'transparent',
              border: '1px solid var(--ag-rule)',
              borderRadius: 'var(--ag-radius-sm)',
              padding: '8px 10px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              color: 'var(--ag-ink-primary)',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </label>

        {/* Deadline */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
          <FieldLabel>Deadline</FieldLabel>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            style={{
              appearance: 'none',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--ag-rule)',
              padding: '8px 0',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 16,
              color: deadline ? 'var(--ag-ink-primary)' : 'var(--ag-ink-hint)',
              outline: 'none',
            }}
          />
          {!deadline ? (
            <span
              style={{
                fontFamily: 'var(--ag-font-display)',
                fontStyle: 'italic',
                fontSize: 12,
                color: 'var(--ag-ink-hint)',
              }}
            >
              Sin deadline.
            </span>
          ) : null}
        </label>

        {/* Estado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
          <FieldLabel>Estado</FieldLabel>
          <div
            role="radiogroup"
            aria-label="Estado del proyecto"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--ag-space-2)',
            }}
          >
            {STATUS_OPTIONS.map((opt) => {
              const selected = status === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setStatus(opt.id)}
                  style={{
                    appearance: 'none',
                    background: selected ? 'var(--ag-bg-sunken)' : 'transparent',
                    border: `1px solid ${selected ? 'var(--ag-ink-primary)' : 'var(--ag-rule)'}`,
                    borderRadius: 'var(--ag-radius-sm)',
                    padding: '10px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--ag-font-body)',
                      fontSize: 14,
                      fontWeight: 500,
                      color:
                        opt.id === 'killed'
                          ? 'var(--ag-danger)'
                          : 'var(--ag-ink-primary)',
                    }}
                  >
                    {opt.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--ag-font-display)',
                      fontStyle: 'italic',
                      fontSize: 12,
                      color: 'var(--ag-ink-hint)',
                    }}
                  >
                    {opt.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
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
            Crear proyecto →
          </button>
        </div>
      </form>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </span>
  );
}
