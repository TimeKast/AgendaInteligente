'use client';

/**
 * SCR-042 — Category list / management.
 *
 * Visual-only prototype. Categories live in `useState` so drag-to-reorder
 * (DD-026) reorders the visible list. "Inbox" is a system row pinned to the
 * bottom and not draggable / not deletable.
 *
 * Interactions:
 *   - GripVertical handle → reorder via @dnd-kit/sortable (PointerSensor +
 *     KeyboardSensor for accessibility).
 *   - ⋯ menu → Rename / Change color / Delete (Delete on a non-system row
 *     opens ConfirmDeleteModal with cascade copy).
 *   - "+ Nuevo" → NewCategoryModal, on submit appends to state.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { CategoryRow, type CategoryItem } from '@/components/agenda/CategoryRow';
import {
  NewCategoryModal,
} from '@/components/agenda/NewCategoryModal';
import { ConfirmDeleteModal } from '@/components/agenda/ConfirmDeleteModal';

const INITIAL: CategoryItem[] = [
  { id: 'cat-1', name: 'Personal', projectCount: 5, color: 'sage', icon: 'user' },
  {
    id: 'cat-2',
    name: 'Empresa Genomma',
    projectCount: 2,
    color: 'steel-blue',
    icon: 'briefcase',
  },
  {
    id: 'cat-3',
    name: 'Side project Web3',
    projectCount: 1,
    color: 'terracotta',
    icon: 'zap',
  },
];

const INBOX: CategoryItem = {
  id: 'cat-inbox',
  name: 'Inbox',
  projectCount: 0,
  color: 'taupe',
  icon: 'folder',
  system: true,
};

export default function CategoryListPage() {
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL);
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CategoryItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setCategories((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    setCategories((items) => items.filter((c) => c.id !== pendingDelete.id));
    setPendingDelete(null);
  }

  return (
    <>
      <AgendaHeader
        backHref="/settings"
        dateLabel="Categorías"
        rightSlot={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              color: 'var(--ag-ink-soft)',
              cursor: 'pointer',
              padding: 'var(--ag-space-2)',
            }}
          >
            + Nuevo
          </button>
        }
      />

      <main
        style={{
          maxWidth: 480,
          marginInline: 'auto',
          paddingInline: 'var(--ag-space-4)',
          paddingBottom: 'calc(var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <p
          style={{
            margin: '0 0 var(--ag-space-3) 0',
            paddingTop: 'var(--ag-space-3)',
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--ag-ink-hint)',
          }}
        >
          Arrastrá para reordenar.
        </p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {categories.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  category={cat}
                  onDelete={(id) => {
                    const c = categories.find((x) => x.id === id);
                    if (c) setPendingDelete(c);
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        {/* Inbox — system row, always at the bottom, never draggable */}
        <div
          style={{
            marginTop: 'var(--ag-space-2)',
            paddingTop: 'var(--ag-space-2)',
            borderTop: '1px solid var(--ag-rule)',
          }}
        >
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            <CategoryRow category={INBOX} onDelete={() => undefined} />
          </ul>
        </div>

        <div style={{ paddingTop: 'var(--ag-space-5)' }}>
          <Link
            href="/settings"
            style={{
              display: 'inline-block',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 13,
              color: 'var(--ag-ink-hint)',
              textDecoration: 'none',
            }}
          >
            ← Volver a Settings
          </Link>
        </div>
      </main>

      <NewCategoryModal
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onCreate={(data) => {
          setCategories((items) => [
            ...items,
            {
              id: `cat-${Date.now()}`,
              name: data.name,
              projectCount: 0,
              color: data.color,
              icon: data.icon,
            },
          ]);
          setCreateOpen(false);
        }}
      />

      <ConfirmDeleteModal
        open={!!pendingDelete}
        title="Borrar categoría"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" tiene ${pendingDelete.projectCount} ${pendingDelete.projectCount === 1 ? 'proyecto' : 'proyectos'}. Al borrar la categoría se borran también.`
            : ''
        }
        caption="Podés cancelar dentro de 30 días."
        destructiveLabel="Borrar todo"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
