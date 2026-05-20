'use client';

/**
 * TodayActivitiesBoard — client-side reorderable board of the day's
 * activities, grouped by time block (Mañana / Tarde / Noche).
 *
 * Implements DD-026 within-section drag-to-reorder. Cross-section drag is
 * NOT enabled in this round (visual-only prototype).
 *
 * Uses @dnd-kit/sortable with one SortableContext per section so that drag
 * operations don't accidentally reorder across sections.
 */

import { useState } from 'react';
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
import { ActivitySection } from './ActivitySection';
import { SortableActivityRow } from './SortableActivityRow';
import type { ActivityStatus } from './ActivityRow';

interface TodayActivity {
  id: string;
  title: string;
  status: ActivityStatus;
  scheduledTime?: string;
  priority: number;
  projectLabel: string;
}

type Section = 'morning' | 'afternoon' | 'night';

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
};

export function TodayActivitiesBoard() {
  const [sections, setSections] = useState(INITIAL);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function makeHandler(section: Section) {
    return (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setSections((prev) => {
        const list = prev[section];
        const oldIndex = list.findIndex((a) => a.id === active.id);
        const newIndex = list.findIndex((a) => a.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return prev;
        return { ...prev, [section]: arrayMove(list, oldIndex, newIndex) };
      });
    };
  }

  return (
    <>
      <ActivitySection label="Mañana">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={makeHandler('morning')}
        >
          <SortableContext
            items={sections.morning.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections.morning.map((a) => (
              <SortableActivityRow
                key={a.id}
                id={a.id}
                href={`/activity/${a.id}`}
                title={a.title}
                status={a.status}
                scheduledTime={a.scheduledTime}
                priority={a.priority}
                projectLabel={a.projectLabel}
              />
            ))}
          </SortableContext>
        </DndContext>
        <p
          style={{
            margin: 0,
            paddingTop: 'var(--ag-space-2)',
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
          }}
        >
          Arrastrá para reordenar.
        </p>
      </ActivitySection>

      <ActivitySection label="Tarde">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={makeHandler('afternoon')}
        >
          <SortableContext
            items={sections.afternoon.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections.afternoon.map((a) => (
              <SortableActivityRow
                key={a.id}
                id={a.id}
                href={`/activity/${a.id}`}
                title={a.title}
                status={a.status}
                scheduledTime={a.scheduledTime}
                priority={a.priority}
                projectLabel={a.projectLabel}
              />
            ))}
          </SortableContext>
        </DndContext>
      </ActivitySection>

      <ActivitySection label="Noche">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={makeHandler('night')}
        >
          <SortableContext
            items={sections.night.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections.night.map((a) => (
              <SortableActivityRow
                key={a.id}
                id={a.id}
                href={`/activity/${a.id}`}
                title={a.title}
                status={a.status}
                scheduledTime={a.scheduledTime}
                priority={a.priority}
                projectLabel={a.projectLabel}
              />
            ))}
          </SortableContext>
        </DndContext>
      </ActivitySection>
    </>
  );
}
