'use client';

/**
 * TodayClient — interactive shell for SCR-020 (Today).
 *
 * The Today page (server component) fetches initial data + identity
 * + date label, then hands them here. This client component owns:
 *   - View toggle state (fecha / matriz)
 *   - Close-day modal state + submission to `closeDay()` action
 *   - Quick-add + status-transition persistence callbacks routed to
 *     `createActivity` / `transitionActivity` (Phase 2 wiring).
 *
 * Drag-and-drop on the calendar grid + pool moves stay client-only
 * in this slice — the data-shape mapping (ScheduledActivity ↔
 * scheduled_dates + scheduled_time) lands in the next Phase 2 sub-slice.
 */

import { useEffect, useState, useTransition } from 'react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { DaySheetMorningSection } from '@/components/agenda/DaySheetMorningSection';
import { TodayActivitiesBoard } from '@/components/agenda/TodayActivitiesBoard';
import { PushPermissionBanner } from '@/components/agenda/PushPermissionBanner';
import {
  CloseDayModal,
  type CloseDayPayload,
  type CloseDayActivityInput,
} from '@/components/agenda/CloseDayModal';
import { TodayViewToggle, type TodayView } from '@/components/agenda/TodayViewToggle';
import { DayViewToggle } from '@/components/agenda/DayViewToggle';
import type {
  QuickAddDraft,
  QuickAddProject,
  QuickAddCategory,
} from '@/components/agenda/ActivityQuickAdd';
import { closeDay } from '@/lib/actions/close-day';
import { createActivity, transitionActivity, updateActivity } from '@/lib/actions/activity';

// Re-declared locally to avoid coupling the board's prototype types
// to the server schema. The board accepts these shapes via initial*.
interface ScheduledActivityInput {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done' | 'skipped' | 'blocked';
  scheduledTime: string; // HH:00
  priority: number;
  projectLabel: string;
  durationMinutes: number;
  deadline?: string;
  progressPercent?: number;
  quadrant: 1 | 2 | 3 | 4;
  description?: string | null;
}
interface PoolActivityInput {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done' | 'skipped' | 'blocked';
  scope: 'today' | 'week' | 'backlog';
  quadrant: 1 | 2 | 3 | 4;
  priority: number;
  projectLabel: string;
  deadline?: string;
  progressPercent?: number;
  description?: string | null;
}
interface ExternalEventInput {
  id: string;
  hour: string;
  title: string;
  timeRange: string;
  source: string;
  spanSlots: number;
  coveredSlots: string[];
}

export interface TodayClientProps {
  /** YYYY-MM-DD for the user's local "today". Server-resolved. */
  todayDate: string;
  /** Localized header label, e.g. "Martes, 27 de mayo". */
  dateLabel: string;
  /** Avatar initial — first letter of name or email. */
  initials: string;
  /**
   * Activities surfaced in the close-day modal. The server pre-filters
   * to today's scheduled + today's unscheduled rows.
   */
  todayActivities: CloseDayActivityInput[];
  /** Real activities scheduled at an hour today. */
  initialScheduled: ScheduledActivityInput[];
  /** Real activities pooled (today-unscheduled, week, backlog). */
  initialPool: PoolActivityInput[];
  /** External calendar busy slots overlapping today (Google sync). */
  externalEvents: ExternalEventInput[];
  /** Real project list for the inline quick-add picker. Inbox-first. */
  projects: QuickAddProject[];
  /** Full category catalog. */
  categories: QuickAddCategory[];
  /**
   * When true, the page is rendering tomorrow's view (driven by
   * `?date=<tomorrow>`). Hides close-day (cerrar mañana no tiene sentido)
   * and flips the Hoy/Mañana toggle.
   */
  viewingTomorrow: boolean;
}

export function TodayClient({
  todayDate,
  dateLabel,
  initials,
  todayActivities,
  initialScheduled,
  initialPool,
  externalEvents,
  projects,
  categories,
  viewingTomorrow,
}: TodayClientProps) {
  const [view, setView] = useState<TodayView>('fecha');
  const [closeOpen, setCloseOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function handleCreatePersist(draft: QuickAddDraft) {
    // Fire-and-forget — the board already inserted the optimistic
    // row. Failures surface as a toast; the row will reconcile on the
    // next page revalidation (createActivity calls revalidatePath).
    startTransition(async () => {
      const result = await createActivity({
        title: draft.title,
        projectId: draft.projectId,
        priority: draft.priority,
        description: draft.description,
        scheduledTime: draft.scheduledTime ? `${draft.scheduledTime}:00` : null,
        scheduledDates: draft.dateISO ? [draft.dateISO] : [],
        // RecurrenceRule is already a string in the DSL the schema accepts.
        recurrenceRule: draft.recurrenceRule ?? null,
        deadline: draft.deadline
          ? new Date(
              draft.deadline.includes('T') ? `${draft.deadline}:00` : `${draft.deadline}T23:59:59`
            ).toISOString()
          : null,
      });
      if (result.error) {
        setToast(`No se pudo guardar: ${result.error}`);
      }
    });
  }

  /**
   * Drag/move persistence. Optimistic rows (id starts with "new-")
   * are ignored — Zod uuid() would reject them. They'll reconcile on
   * the next page revalidation.
   */
  function handleMovePersist(
    id: string,
    move:
      | { kind: 'schedule_hour'; hour: string }
      | { kind: 'pool_today' }
      | { kind: 'pool_week' }
      | { kind: 'pool_backlog' }
      | { kind: 'quadrant'; q: 1 | 2 | 3 | 4 }
      | { kind: 'resize'; durationMinutes: number }
  ) {
    if (id.startsWith('new-') || id.startsWith('optimistic:')) return;
    // Map the tagged action to the updateActivity patch shape.
    let patch: Record<string, unknown>;
    switch (move.kind) {
      case 'schedule_hour':
        patch = {
          scheduledDates: [todayDate],
          // Hour comes in as "HH:00" — DB column is `time` so pad to HH:MM:SS.
          scheduledTime: `${move.hour}:00`,
        };
        break;
      case 'pool_today':
        patch = { scheduledDates: [todayDate], scheduledTime: null };
        break;
      case 'pool_backlog':
        patch = { scheduledDates: [], scheduledTime: null };
        break;
      case 'pool_week': {
        // Heuristic: schedule for tomorrow so it shows up in "week" bucket
        // (anything in today..today+6 without time = week scope).
        const tomorrow = new Date(`${todayDate}T00:00:00.000Z`);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        patch = {
          scheduledDates: [tomorrow.toISOString().slice(0, 10)],
          scheduledTime: null,
        };
        break;
      }
      case 'quadrant':
        patch = { quadrant: move.q };
        break;
      case 'resize':
        patch = { durationMinutes: move.durationMinutes };
        break;
    }
    startTransition(async () => {
      const result = await updateActivity({ id, ...patch });
      if (result.error) {
        setToast(`No se pudo mover: ${result.error}`);
      }
    });
  }

  function handleTransitionPersist(
    id: string,
    toStatus: 'done' | 'skipped' | 'blocked' | 'pending'
  ) {
    startTransition(async () => {
      const result = await transitionActivity({ id, toStatus });
      if (result.error) {
        setToast(`No se pudo actualizar: ${result.error}`);
      }
    });
  }

  function handleClose(payload: CloseDayPayload) {
    startTransition(async () => {
      const result = await closeDay({
        date: todayDate,
        activities: payload.activities.map((a) => ({
          id: a.id,
          outcome: a.outcome,
          partialPct: a.partialPct,
          closed: a.closed,
        })),
        oneLine: payload.oneLine,
      });

      setCloseOpen(false);
      if (result.error) {
        setToast(`No se pudo cerrar el día: ${result.error}`);
        return;
      }
      const errCount = result.data?.partialErrors.length ?? 0;
      setToast(
        errCount === 0
          ? 'Día cerrado.'
          : `Día cerrado con ${errCount} cambio${errCount === 1 ? '' : 's'} pendiente${errCount === 1 ? '' : 's'}.`
      );
    });
  }

  return (
    <>
      <AgendaHeader dateLabel={dateLabel} initials={initials} />

      <main
        style={{
          paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
          marginInline: 'auto',
          width: '100%',
          paddingInline: 'var(--ag-space-4)',
          paddingTop: 'var(--ag-space-2)',
        }}
      >
        <PushPermissionBanner />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--ag-space-3)',
            paddingBlock: 'var(--ag-space-3)',
            flexWrap: 'wrap',
          }}
        >
          <DayViewToggle viewingTomorrow={viewingTomorrow} />
          <div style={{ overflowX: 'auto' }}>
            <TodayViewToggle value={view} onChange={setView} />
          </div>
        </div>

        <TodayActivitiesBoard
          view={view}
          morningSection={<DaySheetMorningSection />}
          initialScheduled={initialScheduled}
          initialPool={initialPool}
          initialExternalEvents={externalEvents}
          onCreatePersist={handleCreatePersist}
          onTransitionPersist={handleTransitionPersist}
          onMovePersist={handleMovePersist}
          projects={projects}
          categories={categories}
          todayDate={todayDate}
        />

        {viewingTomorrow ? null : (
          <button
            type="button"
            onClick={() => setCloseOpen(true)}
            disabled={isPending}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: '1px solid var(--ag-rule)',
              borderRadius: 'var(--ag-radius-base)',
              padding: '12px 16px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 15,
              color: 'var(--ag-ink-soft)',
              cursor: isPending ? 'not-allowed' : 'pointer',
              width: '100%',
              marginTop: 'var(--ag-space-5)',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? 'Cerrando…' : 'Cerrar día'}
          </button>
        )}
      </main>

      <CloseDayModal
        open={closeOpen}
        activities={todayActivities}
        onCancel={() => setCloseOpen(false)}
        onSubmit={handleClose}
      />

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 'calc(64px + 24px + env(safe-area-inset-bottom, 0px))',
            zIndex: 80,
            backgroundColor: 'var(--ag-ink-primary)',
            color: 'var(--ag-accent-on)',
            padding: '10px 16px',
            borderRadius: 'var(--ag-radius-pill)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 14,
            boxShadow: '0 1px 2px rgba(42, 40, 38, 0.12), 0 2px 6px rgba(42, 40, 38, 0.08)',
          }}
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
