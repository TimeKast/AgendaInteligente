'use client';

/**
 * ProjectsClient — minimal wired list + create form.
 *
 * Lists projects grouped by category. "+ Nuevo" form pre-selects a
 * category (defaults to Inbox). Persistence via createProject.
 * Detail / status transitions / archive live in /projects/[id]
 * (next slice).
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, Briefcase } from 'lucide-react';
import { createProject } from '@/lib/actions/project';
import type { ProjectListRow, CategoryListRow } from '@/lib/db/queries/catalog';

interface Props {
  initial: ProjectListRow[];
  categories: CategoryListRow[];
}

export function ProjectsClient({ initial, categories }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState(
    categories.find((c) => c.isInbox)?.id ?? categories[0]?.id ?? ''
  );
  const [isPending, startTransition] = useTransition();

  // Group by category for the list.
  const grouped = (() => {
    const map = new Map<string, ProjectListRow[]>();
    for (const p of rows) {
      const arr = map.get(p.categoryName) ?? [];
      arr.push(p);
      map.set(p.categoryName, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'es'));
  })();

  function handleCreate() {
    const name = newName.trim();
    if (!name || !newCategoryId) return;
    startTransition(async () => {
      const result = await createProject({ categoryId: newCategoryId, name });
      if (result.error) {
        toast.error(`No se pudo crear: ${result.error}`);
        return;
      }
      if (result.data) {
        const cat = categories.find((c) => c.id === newCategoryId);
        setRows((prev) => [
          ...prev,
          {
            id: result.data!.id,
            name,
            status: 'active',
            categoryId: newCategoryId,
            categoryName: cat?.name ?? '',
            isInbox: false,
          },
        ]);
      }
      setNewName('');
      setCreating(false);
      toast.success('Proyecto creado.');
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
        gap: 'var(--ag-space-5)',
        // Cap width on huge screens — readability over edge-to-edge.
        maxWidth: 1200,
        marginInline: 'auto',
        width: '100%',
      }}
    >
      {grouped.map(([categoryName, items]) => (
        <section key={categoryName}>
          <h2
            style={{
              margin: 0,
              paddingBlock: 'var(--ag-space-2)',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--ag-slate)',
            }}
          >
            {categoryName || 'Sin categoría'}{' '}
            <span
              style={{
                fontFamily: 'var(--ag-font-display)',
                fontStyle: 'italic',
                fontWeight: 400,
                letterSpacing: '0.02em',
                textTransform: 'none',
                color: 'var(--ag-ink-hint)',
                marginLeft: 4,
              }}
            >
              · {items.length}
            </span>
          </h2>
          {/* Auto-fill grid: 1 col on phones, 2-4 on wider viewports.
              minmax(220px, 1fr) keeps cards from collapsing too narrow. */}
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
            {items.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: 'var(--ag-space-3)',
                    border: '1px solid var(--ag-rule)',
                    borderRadius: 'var(--ag-radius-base)',
                    backgroundColor: 'var(--ag-bg-elevated)',
                    textDecoration: 'none',
                    color: 'var(--ag-ink-primary)',
                    minHeight: 64,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Briefcase size={14} strokeWidth={1.5} color="var(--ag-ink-soft)" />
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: 'var(--ag-font-body)',
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                    >
                      {p.name}
                    </span>
                  </div>
                  {p.status !== 'active' && (
                    <span
                      style={{
                        alignSelf: 'flex-start',
                        fontFamily: 'var(--ag-font-mono)',
                        fontSize: 10,
                        color: 'var(--ag-ink-hint)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        padding: '2px 6px',
                        border: '1px solid var(--ag-rule)',
                        borderRadius: 'var(--ag-radius-pill)',
                      }}
                    >
                      {p.status}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {creating ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 'var(--ag-space-3)',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-base)',
            backgroundColor: 'var(--ag-bg-elevated)',
          }}
        >
          <select
            value={newCategoryId}
            onChange={(e) => setNewCategoryId(e.target.value)}
            disabled={isPending}
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--ag-radius-base)',
              border: '1px solid var(--ag-rule)',
              backgroundColor: 'var(--ag-bg)',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre del proyecto"
            disabled={isPending}
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--ag-radius-base)',
              border: '1px solid var(--ag-rule)',
              backgroundColor: 'var(--ag-bg)',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              disabled={isPending || !newName.trim()}
              style={{
                flex: 1,
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
          </div>
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
          Nuevo proyecto
        </button>
      )}
    </main>
  );
}
