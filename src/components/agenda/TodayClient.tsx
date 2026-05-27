'use client';

/**
 * TodayClient — interactive shell for SCR-020 (Today).
 *
 * The Today page (server component) fetches initial data + identity
 * + date label, then hands them here. This client component owns:
 *   - View toggle state (fecha / matriz)
 *   - Close-day modal state + submission to `closeDay()` action
 *   - Toast feedback after a successful close
 *
 * Drag-and-drop + pool internals (TodayActivitiesBoard) remain
 * visual-only in this slice; Phase 2 wires them to updateActivity /
 * transitionActivity.
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
import { closeDay } from '@/lib/actions/close-day';

export interface TodayClientProps {
  /** YYYY-MM-DD for the user's local "today". Server-resolved. */
  todayDate: string;
  /** Localized header label, e.g. "Martes, 27 de mayo". */
  dateLabel: string;
  /** Avatar initial — first letter of name or email. */
  initials: string;
  /**
   * Activities surfaced in the close-day modal. The server pre-filters
   * to today's scheduled + today's unscheduled rows (the union the user
   * actually worked on); future scope drag-drop slice may widen this.
   */
  todayActivities: CloseDayActivityInput[];
}

export function TodayClient({ todayDate, dateLabel, initials, todayActivities }: TodayClientProps) {
  const [view, setView] = useState<TodayView>('fecha');
  const [closeOpen, setCloseOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

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
            justifyContent: 'flex-start',
            paddingBlock: 'var(--ag-space-3)',
            overflowX: 'auto',
          }}
        >
          <TodayViewToggle value={view} onChange={setView} />
        </div>

        <TodayActivitiesBoard view={view} morningSection={<DaySheetMorningSection />} />

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
