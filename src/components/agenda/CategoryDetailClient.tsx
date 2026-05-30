'use client';

/**
 * CategoryDetailClient — minimal wired edit view.
 *
 * Editable: name, color, icon. Inbox categories disable rename
 * (CHECK constraint at DB forces name='Inbox'). Delete blocked on
 * Inbox + when projectCount > 0 (cascade not allowed in v1).
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { updateCategory, deleteCategory } from '@/lib/actions/category';

export interface CategoryDetailInput {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  isInbox: boolean;
  projectCount: number;
}

interface Props {
  initial: CategoryDetailInput;
}

const COLOR_PRESETS = ['#5C5C5C', '#A6A395', '#7E8C7B', '#5B7785', '#A9755A', '#8E4F5E'];

export function CategoryDetailClient({ initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [color, setColor] = useState(initial.color);
  const [isPending, startTransition] = useTransition();

  const dirty = (!initial.isInbox && name !== initial.name) || color !== initial.color;

  function handleSave() {
    startTransition(async () => {
      const result = await updateCategory({
        id: initial.id,
        name: initial.isInbox ? undefined : name.trim(),
        color,
      });
      if (result.error) {
        toast.error(`No se pudo guardar: ${result.error}`);
        return;
      }
      toast.success('Categoría guardada.');
      router.refresh();
    });
  }

  function handleDelete() {
    if (initial.isInbox) {
      toast.error('La categoría Inbox no se puede borrar.');
      return;
    }
    if (initial.projectCount > 0) {
      toast.error(
        `Esta categoría tiene ${initial.projectCount} proyecto${initial.projectCount === 1 ? '' : 's'}. Mueve o borra los proyectos antes.`
      );
      return;
    }
    if (!confirm('¿Borrar esta categoría?')) return;
    startTransition(async () => {
      const result = await deleteCategory({ id: initial.id });
      if (result.error) {
        toast.error(`No se pudo borrar: ${result.error}`);
        return;
      }
      toast.success('Categoría borrada.');
      router.push('/categories');
    });
  }

  return (
    <>
      <AgendaHeader
        dateLabel="Categoría"
        backHref="/categories"
        rightSlot={
          !initial.isInbox ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              aria-label="Borrar categoría"
              style={{
                appearance: 'none',
                background: 'transparent',
                border: 'none',
                color: 'var(--ag-ink-hint)',
                cursor: 'pointer',
                padding: 6,
              }}
            >
              <Trash2 size={18} strokeWidth={1.5} />
            </button>
          ) : undefined
        }
      />

      <main
        style={{
          paddingInline: 'var(--ag-space-4)',
          paddingTop: 'var(--ag-space-4)',
          paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-4)',
        }}
      >
        <Label text="Nombre">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending || initial.isInbox}
            style={{ ...inputStyle, opacity: initial.isInbox ? 0.6 : 1 }}
          />
          {initial.isInbox && (
            <span style={{ fontSize: 12, color: 'var(--ag-ink-hint)', fontStyle: 'italic' }}>
              Inbox es categoría del sistema — no editable.
            </span>
          )}
        </Label>

        <Label text="Color">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                disabled={isPending}
                aria-label={`Color ${c}`}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border:
                    color === c ? '2px solid var(--ag-ink-primary)' : '1px solid var(--ag-rule)',
                  backgroundColor: c,
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </Label>

        <Label text="Proyectos en esta categoría">
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ag-ink-soft)' }}>
            {initial.projectCount} {initial.projectCount === 1 ? 'proyecto' : 'proyectos'}
          </p>
        </Label>
      </main>

      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          padding: 'var(--ag-space-3) var(--ag-space-4)',
          paddingBottom: 'calc(var(--ag-space-3) + env(safe-area-inset-bottom, 0px))',
          backgroundColor: 'var(--ag-bg)',
          borderTop: '1px solid var(--ag-rule)',
        }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || isPending}
          style={{
            appearance: 'none',
            width: '100%',
            padding: '14px 20px',
            border: 'none',
            borderRadius: 'var(--ag-radius-base)',
            backgroundColor: dirty ? 'var(--ag-accent-primary)' : 'var(--ag-bg-sunken)',
            color: dirty ? 'var(--ag-accent-on)' : 'var(--ag-ink-hint)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 15,
            fontWeight: 500,
            cursor: dirty && !isPending ? 'pointer' : 'not-allowed',
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? 'Guardando…' : dirty ? 'Guardar' : 'Sin cambios'}
        </button>
      </footer>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--ag-radius-base)',
  border: '1px solid var(--ag-rule)',
  backgroundColor: 'var(--ag-bg-elevated)',
  color: 'var(--ag-ink-primary)',
  fontFamily: 'var(--ag-font-body)',
  fontSize: 15,
  outline: 'none',
};

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ag-slate)',
        }}
      >
        {text}
      </span>
      {children}
    </label>
  );
}
