'use client';

/**
 * CategoriesClient — minimal wired list + create form.
 *
 * Trade-off: drops the drag-reorder + per-row ⋯ menu of the prototype
 * for now. Keeps the visual style (color dot + name + count). Tap row
 * → /categories/[id] (detail edit lives there). "+ Nueva" appends a
 * form row that submits to createCategory.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, Inbox } from 'lucide-react';
import { createCategory } from '@/lib/actions/category';
import type { CategoryListRow } from '@/lib/db/queries/catalog';

interface Props {
  initial: CategoryListRow[];
}

export function CategoriesClient({ initial }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await createCategory({ name });
      if (result.error) {
        toast.error(`No se pudo crear: ${result.error}`);
        return;
      }
      // Optimistic append; the real row arrives on router.refresh().
      if (result.data) {
        setRows((prev) => [
          ...prev,
          {
            id: result.data!.id,
            name,
            color: '#5C5C5C',
            icon: null,
            isInbox: false,
            projectCount: 0,
          },
        ]);
      }
      setNewName('');
      setCreating(false);
      toast.success('Categoría creada.');
      router.refresh();
    });
  }

  return (
    <main
      style={{
        paddingInline: 'var(--ag-space-4)',
        paddingTop: 'var(--ag-space-4)',
        paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-3)',
        maxWidth: 1200,
        marginInline: 'auto',
        width: '100%',
      }}
    >
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 'var(--ag-space-2)',
        }}
      >
        {rows.map((c) => (
          <li key={c.id}>
            <Link
              href={`/categories/${c.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--ag-space-3)',
                padding: 'var(--ag-space-3)',
                border: '1px solid var(--ag-rule)',
                borderRadius: 'var(--ag-radius-base)',
                backgroundColor: 'var(--ag-bg-elevated)',
                textDecoration: 'none',
                color: 'var(--ag-ink-primary)',
                minHeight: 56,
              }}
            >
              {c.isInbox ? (
                <Inbox size={18} strokeWidth={1.5} color="var(--ag-ink-soft)" />
              ) : (
                <span
                  aria-hidden
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 4,
                    backgroundColor: c.color || 'var(--ag-ink-hint)',
                    flexShrink: 0,
                  }}
                />
              )}
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--ag-font-body)',
                  fontSize: 15,
                }}
              >
                {c.name}
              </span>
              <span
                style={{
                  fontFamily: 'var(--ag-font-mono)',
                  fontSize: 12,
                  color: 'var(--ag-ink-hint)',
                }}
              >
                {c.projectCount}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {creating ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
          style={{
            display: 'flex',
            gap: 'var(--ag-space-2)',
            padding: 'var(--ag-space-2)',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-base)',
            backgroundColor: 'var(--ag-bg-elevated)',
            marginTop: 'var(--ag-space-3)',
          }}
        >
          <input
            type="text"
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre de la categoría"
            disabled={isPending}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 'var(--ag-radius-base)',
              border: '1px solid var(--ag-rule)',
              backgroundColor: 'var(--ag-bg)',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={isPending || !newName.trim()}
            style={{
              padding: '8px 14px',
              border: 'none',
              borderRadius: 'var(--ag-radius-base)',
              backgroundColor: 'var(--ag-ink-primary)',
              color: 'var(--ag-accent-on)',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              cursor: !newName.trim() ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            Crear
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(false);
              setNewName('');
            }}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: 'transparent',
              color: 'var(--ag-ink-hint)',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          style={{
            appearance: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 14px',
            border: '1px dashed var(--ag-rule)',
            borderRadius: 'var(--ag-radius-base)',
            background: 'transparent',
            color: 'var(--ag-ink-soft)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 14,
            cursor: 'pointer',
            marginTop: 'var(--ag-space-3)',
            alignSelf: 'flex-start',
          }}
        >
          <Plus size={14} strokeWidth={1.5} />
          Nueva categoría
        </button>
      )}
    </main>
  );
}
