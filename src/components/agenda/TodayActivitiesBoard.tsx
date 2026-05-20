'use client';

/**
 * TodayActivitiesBoard — client-side board of the day's activities, grouped
 * by time block (Mañana / Tarde / Noche / En cualquier momento).
 *
 * Responsibilities:
 *   - DD-026 within-section + cross-section drag-to-reorder via @dnd-kit.
 *     A single <DndContext> wraps every section so a row can be dragged from
 *     one time block to another. Each section is both a <SortableContext>
 *     (for within-section reorder) and a useDroppable target (for landing
 *     into an empty section or at the bottom).
 *   - DD-021 mobile swipe-to-status: each row is wrapped in <SwipeableRow>.
 *     Swipe LEFT = mark Done; swipe RIGHT = open reason modal (skipped) or
 *     mark Blocked via the secondary action. Disabled on desktop.
 *   - SCR-051 inline quick-add (ActivityQuickAdd) at the top — new items go
 *     to Mañana (visual-only convention).
 *   - SCR-052 per-row "⋯" → ActivityStatusModal to change status / log a
 *     reason for skipped|blocked. Remains the desktop primary path.
 *
 * All state is local (useState). No backend.
 */

import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ActivitySection } from './ActivitySection';
import { SortableActivityRow } from './SortableActivityRow';
import { ActivityRow, type ActivityStatus } from './ActivityRow';
import { ActivityQuickAdd, type QuickAddDraft } from './ActivityQuickAdd';
import { SwipeableRow } from './SwipeableRow';
import {
  ActivityStatusModal,
  type ExtendedActivityStatus,
  type StatusReason,
} from './ActivityStatusModal';

interface TodayActivity {
  id: string;
  title: string;
  status: ActivityStatus;
  scheduledTime?: string;
  priority: number;
  projectLabel: string;
}

type Section = 'morning' | 'afternoon' | 'night' | 'anytime';

const SECTION_LABEL: Record<Section, string> = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  night: 'Noche',
  anytime: 'En cualquier momento',
};

const SECTION_ORDER: Section[] = ['morning', 'afternoon', 'night', 'anytime'];

const INITIAL: Record<Section, TodayActivity[]> = {
  morning: [
    {
      id: '1',
      title: 'Reunión clientes',
      status: 'done',
      scheduledTime: '10:00',
      priority: 4,
      projectLabel: 'Empresa Genomma',
    },
    {
      id: '2',
      title: 'Revisar PR equipo',
      status: 'todo',
      priority: 5,
      projectLabel: 'Empresa Genomma',
    },
  ],
  afternoon: [
    {
      id: '3',
      title: 'Reporte trimestral',
      status: 'in_progress',
      priority: 5,
      projectLabel: 'Empresa Genomma',
    },
    {
      id: '4',
      title: 'Gym 1h',
      status: 'todo',
      priority: 2,
      projectLabel: 'Personal',
    },
  ],
  night: [
    {
      id: '5',
      title: 'Estudio alemán 45min',
      status: 'todo',
      priority: 3,
      projectLabel: 'Personal',
    },
    {
      id: '6',
      title: 'Llamar a Juan',
      status: 'todo',
      scheduledTime: '21:00',
      priority: 3,
      projectLabel: 'Personal',
    },
  ],
  anytime: [],
};

export function TodayActivitiesBoard() {
  const [sections, setSections] = useState(INITIAL);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<{
    id: string;
    section: Section;
    title: string;
    status: ExtendedActivityStatus;
  } | null>(null);

  const sensors = useSensors(
    // distance: 8 keeps quick taps and horizontal swipes from triggering a
    // drag — drag wins only after 8px of sustained motion.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Reverse lookup: id → owning section. Recomputed on every state change but
  // small (≤ a couple dozen items in the prototype).
  const itemSection = useMemo(() => {
    const map = new Map<string, Section>();
    for (const s of SECTION_ORDER) {
      for (const a of sections[s]) map.set(a.id, s);
    }
    return map;
  }, [sections]);

  const activeActivity = useMemo(() => {
    if (!activeId) return null;
    const s = itemSection.get(activeId);
    if (!s) return null;
    return sections[s].find((a) => a.id === activeId) ?? null;
  }, [activeId, itemSection, sections]);

  function findContainer(id: string): Section | null {
    // Could be either an item id or a section's droppable id.
    if (SECTION_ORDER.includes(id as Section)) return id as Section;
    return itemSection.get(id) ?? null;
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeContainer = findContainer(String(active.id));
    const overContainer = findContainer(String(over.id));
    if (!activeContainer || !overContainer) return;
    if (activeContainer === overContainer) return;

    // Move between sections live, so the placeholder visually previews where
    // the row will land. Index = the over item's index in destination, or end.
    setSections((prev) => {
      const sourceList = prev[activeContainer];
      const destList = prev[overContainer];
      const activeIdx = sourceList.findIndex((a) => a.id === active.id);
      if (activeIdx < 0) return prev;
      const moved = sourceList[activeIdx];

      const overIsSection = SECTION_ORDER.includes(String(over.id) as Section);
      const overIdx = overIsSection
        ? destList.length
        : destList.findIndex((a) => a.id === over.id);
      const insertAt = overIdx < 0 ? destList.length : overIdx;

      return {
        ...prev,
        [activeContainer]: sourceList.filter((a) => a.id !== active.id),
        [overContainer]: [
          ...destList.slice(0, insertAt),
          moved,
          ...destList.slice(insertAt),
        ],
      };
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const activeContainer = findContainer(String(active.id));
    const overContainer = findContainer(String(over.id));
    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
      // Within-section reorder.
      setSections((prev) => {
        const list = prev[activeContainer];
        const oldIndex = list.findIndex((a) => a.id === active.id);
        const newIndex = list.findIndex((a) => a.id === over.id);
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return prev;
        return { ...prev, [activeContainer]: arrayMove(list, oldIndex, newIndex) };
      });
    }
    // Cross-section moves were already applied in handleDragOver — nothing
    // more to do here. The state already reflects the final position.
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  function handleCreate(draft: QuickAddDraft) {
    const id = `new-${Date.now()}`;
    setSections((prev) => ({
      ...prev,
      morning: [
        ...prev.morning,
        {
          id,
          title: draft.title,
          status: 'todo',
          scheduledTime: draft.scheduledTime,
          priority: draft.priority,
          projectLabel: draft.projectLabel,
        },
      ],
    }));
  }

  function openStatus(section: Section, activity: TodayActivity) {
    setStatusModal({
      section,
      id: activity.id,
      title: activity.title,
      status: activity.status,
    });
  }

  function setActivityStatus(section: Section, id: string, next: ActivityStatus) {
    setSections((prev) => ({
      ...prev,
      [section]: prev[section].map((a) => (a.id === id ? { ...a, status: next } : a)),
    }));
  }

  function applyStatus(next: ExtendedActivityStatus, _reason?: StatusReason) {
    if (!statusModal) return;
    setActivityStatus(statusModal.section, statusModal.id, next);
    setStatusModal(null);
  }

  const isDragging = activeId !== null;

  return (
    <>
      <ActivityQuickAdd onCreate={handleCreate} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        // dnd-kit's autoScroll is enabled by default; keep it explicit so we
        // know vertical viewport-edge auto-scroll works on long lists.
        autoScroll
      >
        {SECTION_ORDER.map((section, idx) => (
          <DroppableSection
            key={section}
            section={section}
            label={SECTION_LABEL[section]}
            items={sections[section]}
            isDragging={isDragging}
            onOpenStatus={openStatus}
            onMarkDone={(id) => setActivityStatus(section, id, 'done')}
            onSwipeSkip={(activity) => openStatus(section, activity)}
            onSwipeBlock={(id) => setActivityStatus(section, id, 'blocked')}
            // The first section keeps the existing "Arrastrá para reordenar"
            // helper so users discover the gesture.
            showHelpHint={idx === 0 && !isDragging}
          />
        ))}

        <DragOverlay dropAnimation={{ duration: 160, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
          {activeActivity ? (
            <div
              style={{
                backgroundColor: 'var(--ag-bg-elevated)',
                borderRadius: 'var(--ag-radius-base)',
                boxShadow: '0 8px 24px rgba(42, 40, 38, 0.18)',
                paddingInline: 'var(--ag-space-2)',
                opacity: 0.96,
              }}
            >
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                <ActivityRow
                  title={activeActivity.title}
                  status={activeActivity.status}
                  scheduledTime={activeActivity.scheduledTime}
                  priority={activeActivity.priority}
                  projectLabel={activeActivity.projectLabel}
                />
              </ul>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ActivityStatusModal
        open={statusModal !== null}
        title={statusModal?.title ?? ''}
        currentStatus={statusModal?.status ?? 'todo'}
        onCancel={() => setStatusModal(null)}
        onApply={applyStatus}
      />
    </>
  );
}

/**
 * DroppableSection — a single time-block container.
 *
 * Combines:
 *   - ActivitySection (visual chrome — uppercase label + ul list).
 *   - useDroppable so a row dropped on empty space lands here.
 *   - SortableContext for within-section reorder.
 *   - SwipeableRow wrapping each item for mobile swipe-to-status.
 */
function DroppableSection({
  section,
  label,
  items,
  isDragging,
  showHelpHint,
  onOpenStatus,
  onMarkDone,
  onSwipeSkip,
  onSwipeBlock,
}: {
  section: Section;
  label: string;
  items: TodayActivity[];
  isDragging: boolean;
  showHelpHint: boolean;
  onOpenStatus: (section: Section, activity: TodayActivity) => void;
  onMarkDone: (id: string) => void;
  onSwipeSkip: (activity: TodayActivity) => void;
  onSwipeBlock: (id: string) => void;
}) {
  // Drop zone for the *section as a whole* — used when items.length === 0
  // (no SortableContext item to collide with) or when the user drags below
  // the last item.
  const { setNodeRef, isOver } = useDroppable({ id: section });

  return (
    <div
      ref={setNodeRef}
      style={{
        backgroundColor: isOver && isDragging
          ? 'color-mix(in oklab, var(--ag-bg-elevated), transparent 30%)'
          : 'transparent',
        borderRadius: 'var(--ag-radius-base)',
        transition: 'background-color 160ms ease-out',
      }}
    >
      <ActivitySection label={label} empty={items.length === 0 && !isDragging} emptyCopy="Sin actividades.">
        {/* Drop-zone hint shown while a drag is active. */}
        {isDragging ? (
          <li style={{ listStyle: 'none' }}>
            <p
              style={{
                margin: 0,
                paddingBlock: 'var(--ag-space-1)',
                fontFamily: 'var(--ag-font-display)',
                fontStyle: 'italic',
                fontSize: 13,
                color: 'var(--ag-ink-hint)',
                opacity: 0.85,
              }}
            >
              Soltá acá
            </p>
          </li>
        ) : null}

        <SortableContext
          items={items.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((a) => (
            <SwipeableRow
              key={a.id}
              disabled={isDragging}
              onDone={() => onMarkDone(a.id)}
              onSkip={() => onSwipeSkip(a)}
              onBlock={() => onSwipeBlock(a.id)}
            >
              <SortableActivityRow
                id={a.id}
                href={`/activity/${a.id}`}
                title={a.title}
                status={a.status}
                scheduledTime={a.scheduledTime}
                priority={a.priority}
                projectLabel={a.projectLabel}
                onOpenStatus={() => onOpenStatus(section, a)}
              />
            </SwipeableRow>
          ))}
        </SortableContext>
      </ActivitySection>

      {showHelpHint ? (
        <p
          style={{
            margin: 0,
            paddingInline: 'var(--ag-space-1)',
            paddingBottom: 'var(--ag-space-2)',
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
          }}
        >
          Arrastrá para reordenar o mover entre bloques.
        </p>
      ) : null}
    </div>
  );
}
