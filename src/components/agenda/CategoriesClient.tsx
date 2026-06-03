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
import { Archive, ArchiveRestore, Plus, Inbox } from 'lucide-react';
import { archiveCategory, createCategory, unarchiveCategory } from '@/lib/actions/category';
import type { CategoryListRow } from '@/lib/db/queries/catalog';

interface Props {
  initial: CategoryListRow[];
  showArchived: boolean;
}

export function CategoriesClient({ initial, showArchived }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleArchive(id: string, archived: boolean) {
    // Optimistic flip.
    const prevRows = rows;
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, archivedAt: archived ? new Date() : null } : r))
    );
    startTransition(async () => {
      const result = archived ? await archiveCategory({ id }) : await unarchiveCategory({ id });
      if (result.error) {
        toast.error(`No se pudo ${archived ? 'archivar' : 'restaurar'}: ${result.error}`);
        setRows(prevRows);
        return;
      }
      toast.success(archived ? 'Categoría archivada.' : 'Categoría restaurada.');
      router.refresh();
    });
  }

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
            archivedAt: null,
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
            alignSelf: 'flex-start',
          }}
        >
          <Plus size={14} strokeWidth={1.5} />
          Nueva categoría
        </button>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Link
          href={showArchived ? '/categories' : '/categories?archived=1'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 12,
            color: 'var(--ag-ink-soft)',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-pill)',
            textDecoration: 'none',
          }}
        >
          {showArchived ? 'Ocultar archivadas' : 'Ver archivadas'}
        </Link>
      </div>

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
        {rows.map((c) => {
          const archived = c.archivedAt !== null;
          return (
            <li
              key={c.id}
              style={{
                position: 'relative',
                border: '1px solid var(--ag-rule)',
                borderRadius: 'var(--ag-radius-base)',
                backgroundColor: 'var(--ag-bg-elevated)',
                opacity: archived ? 0.55 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--ag-space-3)',
                padding: 'var(--ag-space-3)',
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
              <Link
                href={`/categories/${c.id}`}
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--ag-font-body)',
                  fontSize: 15,
                  color: 'var(--ag-ink-primary)',
                  textDecoration: archived ? 'line-through' : 'none',
                }}
              >
                {c.name}
              </Link>
              <span
                style={{
                  fontFamily: 'var(--ag-font-mono)',
                  fontSize: 12,
                  color: 'var(--ag-ink-hint)',
                }}
              >
                {c.projectCount}
              </span>
              {!c.isInbox ? (
                <button
                  type="button"
                  onClick={() => handleArchive(c.id, !archived)}
                  disabled={isPending}
                  aria-label={archived ? 'Restaurar categoría' : 'Archivar categoría'}
                  title={archived ? 'Restaurar' : 'Archivar'}
                  style={{
                    appearance: 'none',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--ag-ink-hint)',
                    cursor: isPending ? 'wait' : 'pointer',
                    padding: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {archived ? (
                    <ArchiveRestore size={16} strokeWidth={1.5} />
                  ) : (
                    <Archive size={16} strokeWidth={1.5} />
                  )}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
