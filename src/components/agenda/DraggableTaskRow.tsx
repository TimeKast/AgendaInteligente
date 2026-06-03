'use client';

/**
 * DraggableTaskRow — wraps ActivityRow with @dnd-kit/core `useDraggable` so a
 * row can be picked up from the pool or an hour slot and dropped on a
 * different drop target (hour slot or pool).
 *
 * Replaces SortableActivityRow for the new Today UX where reorder-within-list
 * is no longer the primary gesture — instead, drag = schedule/unschedule by
 * hour. The drag handle is the left grip (kept outside the row's <Link> so
 * taps still navigate to detail).
 *
 * Resize (desktop only):
 *   When `durationMinutes` + `onResize` are provided, the row absolutely
 *   positions itself within its parent HourSlot and renders a bottom-edge
 *   resize handle. Resize uses native pointer events (NOT dnd-kit) with
 *   `setPointerCapture` for the duration of the gesture; on `pointerup` the
 *   duration snaps to the nearest 60min and is committed via `onResize`.
 *   The handle is hidden on touch-only devices via `@media (any-pointer: fine)`.
 *
 * Props mirror ActivityRow's contract plus an `id` for dnd-kit identity and an
 * optional `onOpenStatus` for the trailing "⋯" menu (status modal).
 */

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ActivityRow, type ActivityStatus } from './ActivityRow';
import { HOUR_HEIGHT_PX } from './CalendarGrid';

interface DraggableTaskRowProps {
  id: string;
  title: string;
  status: ActivityStatus;
  scheduledTime?: string;
  priority: number;
  projectLabel: string;
  href?: string;
  /** When provided, renders a "⋯" button at the trailing edge. */
  onOpenStatus?: () => void;
  /** Disable drag entirely (e.g. external/Google events). */
  draggable?: boolean;
  /** Optional ISO YYYY-MM-DD deadline (rendered inline by ActivityRow). */
  deadline?: string;
  /** Optional description — passed through to ActivityRow's hover tooltip. */
  description?: string | null;
  /** Optional progress 0..100 (renders bottom-edge bar via ActivityRow). */
  progressPercent?: number;
  /**
   * Duration in minutes. When set together with `onResize`, the row absolutely
   * positions itself inside its parent HourSlot with height proportional to
   * duration, and a desktop-only resize handle appears at the bottom edge.
   * Pool rows (no scheduledTime) ignore this prop.
   */
  durationMinutes?: number;
  /**
   * Called with the final snapped duration (in minutes) when a resize gesture
   * ends. The parent owns the duration state — this component is controlled.
   */
  onResize?: (nextDurationMinutes: number) => void;
  /**
   * Max duration allowed for this activity, in minutes. Computed by the parent
   * based on the activity's start hour and the calendar end (22:00). Default
   * 4h if not provided.
   */
  maxDurationMinutes?: number;
  /**
   * Called when the user drags the TOP handle. Drag arriba mueve el inicio
   * más temprano (con duration creciendo), drag abajo mueve el inicio más
   * tarde (duration achicando). El end se mantiene fijo.
   * Args: nuevo scheduledTime ("HH:00") + nueva durationMinutes.
   */
  onResizeStart?: (nextStartTime: string, nextDurationMinutes: number) => void;
  /**
   * Hora mínima de inicio (clamp para el top handle). Computado por el parent
   * basado en hora calendar start (06:00) + la próxima activity/event arriba.
   * Default 6 (06:00).
   */
  minStartHour?: number;
}

/** Minimum committed duration after snapping (one 30-min slot). */
const MIN_DURATION_MIN = 30;
/** Snap increment in minutes — 30-min granularity to match the calendar grid. */
const SNAP_INCREMENT_MIN = 30;
/** Below this preview duration the visual would be ugly. */
const MIN_PREVIEW_DURATION_MIN = 15;

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function DraggableTaskRow(props: DraggableTaskRowProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: props.id,
    disabled: props.draggable === false,
  });

  // ---- Resize state (local, live preview) ----
  // 2 modos:
  //   BOTTOM handle → solo cambia duration (end se mueve, start fijo)
  //   TOP handle    → cambia start + duration inversamente (end fijo).
  //                   Drag arriba → start más temprano, duration crece.
  //                   Drag abajo  → start más tarde, duration achica.
  // `liveStartMin` y `liveDuration` overriden los committed values durante drag.
  const [liveDuration, setLiveDuration] = useState<number | null>(null);
  const [liveStartMin, setLiveStartMin] = useState<number | null>(null);
  const resizeStateRef = useRef<{
    startY: number;
    startDuration: number;
    startHourMin: number; // minutos desde midnight (committed start hour)
    pointerId: number;
    mode: 'top' | 'bottom';
  } | null>(null);

  const isResizable = props.durationMinutes !== undefined && props.onResize !== undefined;
  const committedDuration = props.durationMinutes ?? 0;
  const displayDuration = liveDuration ?? committedDuration;
  const maxDuration = props.maxDurationMinutes ?? 240;
  const minStartHour = props.minStartHour ?? 6;
  const minStartMin = minStartHour * 60;

  // Parse scheduledTime ("HH:00") to minutes since midnight for top-handle math.
  function parseTimeToMin(t?: string): number {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }
  function formatMinToTime(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const committedStartMin = parseTimeToMin(props.scheduledTime);
  const displayStartMin = liveStartMin ?? committedStartMin;

  const handleBottomPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isResizable) return;
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      resizeStateRef.current = {
        startY: e.clientY,
        startDuration: committedDuration,
        startHourMin: committedStartMin,
        pointerId: e.pointerId,
        mode: 'bottom',
      };
      setLiveDuration(committedDuration);
    },
    [committedDuration, committedStartMin, isResizable]
  );

  const handleTopPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isResizable) return;
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      resizeStateRef.current = {
        startY: e.clientY,
        startDuration: committedDuration,
        startHourMin: committedStartMin,
        pointerId: e.pointerId,
        mode: 'top',
      };
      setLiveDuration(committedDuration);
      setLiveStartMin(committedStartMin);
    },
    [committedDuration, committedStartMin, isResizable]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const s = resizeStateRef.current;
      if (!s || e.pointerId !== s.pointerId) return;
      e.stopPropagation();
      const deltaY = e.clientY - s.startY;
      const deltaMin = (deltaY / HOUR_HEIGHT_PX) * 60;

      if (s.mode === 'bottom') {
        // Bottom: extiende/encoge duration directamente.
        const next = Math.min(
          maxDuration,
          Math.max(MIN_PREVIEW_DURATION_MIN, s.startDuration + deltaMin)
        );
        setLiveDuration(next);
      } else {
        // Top: mueve start, duration cambia inversamente (end fijo).
        // newStart = oldStart + deltaMin; newDuration = oldDuration - deltaMin
        // Clamp newStart >= minStartMin AND newDuration >= MIN_PREVIEW_DURATION_MIN
        const oldEndMin = s.startHourMin + s.startDuration;
        let nextStartMin = s.startHourMin + deltaMin;
        if (nextStartMin < minStartMin) nextStartMin = minStartMin;
        if (oldEndMin - nextStartMin < MIN_PREVIEW_DURATION_MIN) {
          nextStartMin = oldEndMin - MIN_PREVIEW_DURATION_MIN;
        }
        const nextDuration = oldEndMin - nextStartMin;
        setLiveStartMin(nextStartMin);
        setLiveDuration(nextDuration);
      }
    },
    [maxDuration, minStartMin]
  );

  const finishResize = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const s = resizeStateRef.current;
      if (!s || e.pointerId !== s.pointerId) return;
      e.stopPropagation();
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // pointer may already be released — ignore.
      }

      if (s.mode === 'bottom') {
        const preview = liveDuration ?? s.startDuration;
        const snapped = Math.min(
          maxDuration,
          Math.max(MIN_DURATION_MIN, Math.round(preview / SNAP_INCREMENT_MIN) * SNAP_INCREMENT_MIN)
        );
        resizeStateRef.current = null;
        setLiveDuration(null);
        if (snapped !== s.startDuration) {
          props.onResize?.(snapped);
        }
      } else {
        // Top: snap startMin a hora entera, recalcular duration manteniendo end.
        const oldEndMin = s.startHourMin + s.startDuration;
        const previewStart = liveStartMin ?? s.startHourMin;
        // Snap a hora entera más cercana
        let snappedStart = Math.round(previewStart / SNAP_INCREMENT_MIN) * SNAP_INCREMENT_MIN;
        if (snappedStart < minStartMin) snappedStart = minStartMin;
        let snappedDuration = oldEndMin - snappedStart;
        // Min duration check
        if (snappedDuration < MIN_DURATION_MIN) {
          snappedDuration = MIN_DURATION_MIN;
          snappedStart = oldEndMin - MIN_DURATION_MIN;
        }
        resizeStateRef.current = null;
        setLiveDuration(null);
        setLiveStartMin(null);
        if (snappedStart !== s.startHourMin) {
          props.onResizeStart?.(formatMinToTime(snappedStart), snappedDuration);
        }
      }
    },
    [liveDuration, liveStartMin, maxDuration, minStartMin, props]
  );

  // Safety: if the component unmounts mid-gesture, clear the ref.
  useEffect(() => {
    return () => {
      resizeStateRef.current = null;
    };
  }, []);

  // ---- Anchored (hour-slot) layout ----
  // When the row is anchored to an hour and has a duration, it absolutely
  // positions itself inside the parent HourSlot's right column so it can
  // overflow into the next slots below.
  // Anchored = layout absoluto con resize handles. Solo requiere durationMinutes
  // + onResize. scheduledTime es metadata para mostrar la hora; no se necesita
  // para el detection (era bug: TodayActivitiesBoard no pasaba scheduledTime
  // → anchored siempre false → handles nunca renderizaban).
  const anchored = isResizable;
  const heightPx = anchored ? (displayDuration / 60) * HOUR_HEIGHT_PX : undefined;
  // Top drag offset: cuando el start se mueve durante un top-resize, el card
  // se renderiza visualmente más arriba que su hour slot original. Usamos top
  // negativo basado en la diferencia minutos × pixels-por-minuto.
  const startOffsetPx = anchored
    ? ((displayStartMin - committedStartMin) / 60) * HOUR_HEIGHT_PX
    : 0;

  const style: CSSProperties = anchored
    ? {
        position: 'absolute',
        top: startOffsetPx,
        left: 0,
        right: 0,
        height: heightPx,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        backgroundColor: 'var(--ag-bg-elevated)',
        border: '1px solid color-mix(in oklab, var(--ag-rule), transparent 30%)',
        borderRadius: 'var(--ag-radius-base)',
        zIndex: liveDuration !== null ? 3 : 2,
        overflow: 'hidden',
        boxShadow: liveDuration !== null ? '0 4px 12px rgba(42, 40, 38, 0.12)' : undefined,
        transition:
          liveDuration !== null ? 'none' : 'height var(--ag-duration-base) var(--ag-ease)',
      }
    : {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        backgroundColor: isDragging ? 'var(--ag-bg-elevated)' : 'transparent',
        position: 'relative',
      };

  // The drag listeners now live on the outer wrapper (so the whole row
  // is a drag target). We don't pass a `dragHandle` to ActivityRow anymore.
  const dragProps =
    props.draggable === false ? {} : ({ ...attributes, ...listeners } as Record<string, unknown>);

  const {
    onOpenStatus,
    durationMinutes: _d,
    onResize: _r,
    maxDurationMinutes: _m,
    ...rowProps
  } = props;

  // Cuando anchored, el ActivityRow vive DENTRO de un wrapper interno que
  // reserva 10px arriba y 12px abajo para los resize handles. Esto IMPIDE
  // físicamente que el Link de ActivityRow se solape con los handles —
  // el wrapper hace overflow:hidden y los handles existen FUERA del wrapper,
  // así no hay forma de que el Link intercepte sus pointer events.
  const TOP_HANDLE_PX = 5;
  const BOTTOM_HANDLE_PX = 6;

  const activityRowEl = (
    <ActivityRow
      {...rowProps}
      trailingSlot={
        onOpenStatus ? (
          <button
            type="button"
            aria-label={`Cambiar status de ${props.title}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenStatus();
            }}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--ag-ink-hint)',
              cursor: 'pointer',
              padding: 4,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MoreHorizontal size={16} strokeWidth={1.5} aria-hidden />
          </button>
        ) : undefined
      }
    />
  );

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        cursor: props.draggable === false ? 'default' : isDragging ? 'grabbing' : 'grab',
      }}
      className={anchored ? 'ag-anchored-row' : undefined}
      {...dragProps}
    >
      {anchored ? (
        <>
          {/* Content wrapper — clipea el Link de ActivityRow para que NO llegue
              al área de los handles. Sin esto el Link cubría el bottom y
              robaba el cursor + los pointer events. */}
          <div
            style={{
              position: 'absolute',
              top: TOP_HANDLE_PX,
              left: 0,
              right: 0,
              bottom: BOTTOM_HANDLE_PX,
              overflow: 'hidden',
            }}
          >
            {activityRowEl}
          </div>

          {/* Top handle — mueve el START (inicio); end queda fijo */}
          <div
            role="separator"
            aria-label={`Cambiar inicio de ${props.title}`}
            title="Arrastrá para mover el inicio"
            onPointerDown={handleTopPointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishResize}
            onPointerCancel={finishResize}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: TOP_HANDLE_PX,
              cursor: 'ns-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'none',
              backgroundColor: 'var(--ag-ink-soft)',
              color: 'var(--ag-bg)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.1em',
              userSelect: 'none',
            }}
          >
            <span aria-hidden style={{ display: 'none' }} />
          </div>

          {/* Bottom handle — extiende el END (duración); start queda fijo */}
          <div
            role="separator"
            aria-label={`Extender ${props.title}`}
            title="Arrastrá para extender el tiempo"
            onPointerDown={handleBottomPointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishResize}
            onPointerCancel={finishResize}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: BOTTOM_HANDLE_PX,
              cursor: 'ns-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'none',
              backgroundColor: 'var(--ag-ink-soft)',
              color: 'var(--ag-bg)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              userSelect: 'none',
            }}
          >
            <span aria-hidden style={{ display: 'none' }} />
          </div>

          {liveDuration !== null ? (
            <span
              aria-hidden
              style={{
                position: 'absolute',
                top: TOP_HANDLE_PX + 4,
                right: 8,
                fontFamily: 'var(--ag-font-display)',
                fontStyle: 'italic',
                fontSize: 12,
                color: 'var(--ag-ink-soft)',
                backgroundColor: 'color-mix(in oklab, var(--ag-bg), transparent 20%)',
                paddingInline: 6,
                borderRadius: 'var(--ag-radius-xs)',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              {formatDuration(Math.round(displayDuration))}
            </span>
          ) : null}
        </>
      ) : (
        activityRowEl
      )}
    </div>
  );
}
