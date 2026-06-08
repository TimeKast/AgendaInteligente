/**
 * ActivityRow — single line in the day's activity list (CMP-050).
 *
 * Composition (left → right):
 *   [checkbox] [title] [scheduled_time?] [priority dots] [project chip]
 *
 * States:
 *   - todo        → empty checkbox, normal weight
 *   - in_progress → half-filled checkbox + italic title
 *   - done        → filled checkbox + strikethrough + ink-hint color
 *
 * When `href` is provided the row wraps in a <Link> so the user can tap
 * through to the activity detail. The row is otherwise purely presentational
 * (no real state mutations — this is a visual prototype).
 */

import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  MinusCircle,
  Repeat,
  XCircle,
} from 'lucide-react';
import { DeadlineBadge } from './DeadlineBadge';
import { formatRecurrence } from './RecurrencePicker';

/**
 * PriorityArrow — directional arrow priority indicator.
 *
 * Replaces the legacy PriorityPip (single color dot). The arrow direction
 * encodes priority on a compass scale: ↑ (most) → ↗ → → → ↘ → ↓ (least).
 * Color also varies subtly for double-encoding (accessibility + scannability).
 *
 *   5 (más prioritario) → ArrowUp          ↑   wine
 *   4                   → ArrowUpRight     ↗   burnt orange
 *   3                   → ArrowRight       →   ink-soft (charcoal)
 *   2                   → ArrowDownRight   ↘   ink-hint
 *   1 (menos prio.)     → ArrowDown        ↓   rule
 */
function PriorityArrow({ priority }: { priority: number }) {
  const p = Math.max(1, Math.min(5, priority)) as 1 | 2 | 3 | 4 | 5;
  const icons: Record<1 | 2 | 3 | 4 | 5, ComponentType<{ size?: number; strokeWidth?: number }>> = {
    5: ArrowUp,
    4: ArrowUpRight,
    3: ArrowRight,
    2: ArrowDownRight,
    1: ArrowDown,
  };
  const colors: Record<1 | 2 | 3 | 4 | 5, string> = {
    5: 'var(--ag-scope-life)',
    4: 'var(--ag-scope-year)',
    3: 'var(--ag-ink-soft)',
    2: 'var(--ag-ink-hint)',
    1: 'var(--ag-rule)',
  };
  const labels: Record<1 | 2 | 3 | 4 | 5, string> = {
    5: 'Prioridad alta',
    4: 'Prioridad alta',
    3: 'Prioridad media',
    2: 'Prioridad baja',
    1: 'Prioridad mínima',
  };
  const Icon = icons[p];
  return (
    <span
      aria-label={`${labels[p]} (${p}/5)`}
      title={`${labels[p]} (${p}/5)`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 14,
        height: 14,
        color: colors[p],
        flexShrink: 0,
      }}
    >
      <Icon size={14} strokeWidth={2} />
    </span>
  );
}

/**
 * ProjectDot — circular 10px dot con color hashed del nombre del proyecto.
 * Reemplaza ProjectChip (texto largo, ej "Empresa Genomma") en rows compactos.
 * Title attr muestra el nombre en hover. Paleta warm-book.
 */
const PROJECT_PALETTE = [
  'var(--ag-scope-quarter)', // sage
  'var(--ag-scope-year)', // burnt orange
  'var(--ag-scope-5year)', // steel blue
  'var(--ag-scope-life)', // wine
  'var(--ag-ink-soft)', // warm charcoal
  '#A89072', // warm tan
  '#7C8B5C', // olive
  '#8B5C7C', // dusty mauve
];
function hashStringToIndex(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}
function ProjectDot({ label }: { label: string }) {
  if (!label) return null;
  const color = PROJECT_PALETTE[hashStringToIndex(label, PROJECT_PALETTE.length)];
  return (
    <span
      aria-label={`Proyecto: ${label}`}
      title={label}
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  );
}

export type ActivityStatus = 'todo' | 'in_progress' | 'done' | 'skipped' | 'blocked' | 'cancelled';

interface ActivityRowProps {
  title: string;
  status: ActivityStatus;
  /** "HH:mm" string or undefined if not scheduled. */
  scheduledTime?: string;
  /** 1-5 priority. */
  priority: number;
  projectLabel: string;
  /** Optional link target — if set, the row navigates on tap. */
  href?: string;
  /**
   * Optional leading drag handle element. When provided, rendered to the LEFT
   * of the checkbox and NOT wrapped by the row's <Link> so dragging doesn't
   * trigger navigation. Used by SortableActivityRow in Today.
   */
  dragHandle?: ReactNode;
  /**
   * Optional trailing slot rendered AFTER the row's link (e.g. a "⋯" menu
   * button). Like `dragHandle`, it lives outside the <Link> so taps don't
   * trigger navigation.
   */
  trailingSlot?: ReactNode;
  /** Optional ISO YYYY-MM-DD deadline. Surfaced as a DeadlineBadge. */
  deadline?: string;
  /**
   * Optional progress 0..100. When > 0 and status != 'done', a 2px progress
   * bar renders at the bottom edge of the row. Independent from status.
   */
  progressPercent?: number;
  /**
   * Optional recurrence rule (simplified DSL — see RecurrencePicker). When
   * non-null, a small Repeat icon renders inline after the title.
   */
  recurrenceRule?: string | null;
  /**
   * Optional description — surfaced as a native `title` tooltip so the user
   * can preview the detail on hover/long-press without leaving the row.
   */
  description?: string | null;
}

function Checkbox({ status }: { status: ActivityStatus }) {
  const base = {
    width: 18,
    height: 18,
    borderRadius: 'var(--ag-radius-xs)',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: `background-color var(--ag-duration-base) var(--ag-ease), box-shadow var(--ag-duration-base) var(--ag-ease)`,
  } as const;

  if (status === 'done') {
    return (
      <span
        aria-label="Hecha"
        style={{
          ...base,
          backgroundColor: 'var(--ag-ink-primary)',
          boxShadow: 'inset 0 0 0 1px var(--ag-ink-primary)',
          color: 'var(--ag-accent-on)',
        }}
      >
        <Check size={12} strokeWidth={2} />
      </span>
    );
  }

  if (status === 'in_progress') {
    return (
      <span
        aria-label="En progreso"
        style={{
          ...base,
          // Half-filled visual via diagonal gradient on warm tones — no blue.
          background: 'linear-gradient(135deg, var(--ag-ink-primary) 0 50%, transparent 50% 100%)',
          boxShadow: 'inset 0 0 0 1px var(--ag-ink-soft)',
        }}
      />
    );
  }

  if (status === 'skipped') {
    return (
      <span
        aria-label="Saltada"
        style={{
          ...base,
          color: 'var(--ag-ink-hint)',
        }}
      >
        <MinusCircle size={14} strokeWidth={1.5} />
      </span>
    );
  }

  if (status === 'blocked') {
    return (
      <span
        aria-label="Bloqueada"
        style={{
          ...base,
          color: 'var(--ag-warning)',
        }}
      >
        <AlertTriangle size={14} strokeWidth={1.75} />
      </span>
    );
  }

  if (status === 'cancelled') {
    return (
      <span
        aria-label="Cancelada"
        style={{
          ...base,
          color: 'var(--ag-ink-hint)',
        }}
      >
        <XCircle size={14} strokeWidth={1.5} />
      </span>
    );
  }

  return (
    <span
      aria-label="Por hacer"
      style={{
        ...base,
        backgroundColor: 'transparent',
        boxShadow: 'inset 0 0 0 1px var(--ag-rule)',
      }}
    />
  );
}

export function ActivityRow({
  title,
  status,
  scheduledTime,
  priority,
  projectLabel,
  href,
  dragHandle,
  trailingSlot,
  deadline,
  progressPercent,
  recurrenceRule,
  description,
}: ActivityRowProps) {
  const isDone = status === 'done';
  const isInProgress = status === 'in_progress';
  const isSkipped = status === 'skipped';
  const isCancelled = status === 'cancelled';
  // Terminal "closed" set: both done and cancelled get the dim/strike-through
  // look so they read as "out of play" at a glance.
  const isClosed = isDone || isCancelled;
  const showProgress = !isClosed && (progressPercent ?? 0) > 0;

  // Hide the checkbox for the default 'todo' status — title is what matters,
  // and the implicit "no marker = por hacer" reads cleanly. Non-default
  // states still render their indicator (✓, half-fill, –, ⚠).
  const showCheckbox = status !== 'todo';

  // Compose a hover tooltip with the bits that don't fit inline. Falls
  // back to just the title when there's no extra detail.
  const tooltip = [
    title,
    description?.trim() || null,
    deadline ? `Vence: ${deadline}` : null,
    scheduledTime ? `Programada: ${scheduledTime}` : null,
    projectLabel ? `Proyecto: ${projectLabel}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const rowInner = (
    <>
      {showCheckbox ? <Checkbox status={status} /> : null}

      {/* Title + time stacked, occupying flexible middle column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          gap: 2,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 16,
              lineHeight: 1.4,
              color: isClosed || isSkipped ? 'var(--ag-ink-hint)' : 'var(--ag-ink-primary)',
              fontStyle: isInProgress ? 'italic' : 'normal',
              textDecoration: isClosed ? 'line-through' : 'none',
              textDecorationColor: 'var(--ag-rule)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {title}
          </span>
          {recurrenceRule ? (
            <span
              role="img"
              aria-label={`Se repite: ${formatRecurrence(recurrenceRule)}`}
              title={`Se repite: ${formatRecurrence(recurrenceRule)}`}
              style={{
                display: 'inline-flex',
                color: 'var(--ag-ink-hint)',
                flexShrink: 0,
              }}
            >
              <Repeat size={12} strokeWidth={1.5} aria-hidden />
            </span>
          ) : null}
        </span>
        {scheduledTime ? (
          <span
            style={{
              fontFamily: 'var(--ag-font-mono)',
              fontSize: 12,
              color: 'var(--ag-slate)',
              letterSpacing: '0.02em',
            }}
          >
            {scheduledTime}
          </span>
        ) : null}
      </div>

      {/* Right cluster: compacto — dots de color para priority + project +
          deadline. Antes era texto largo (ProjectChip "Empresa Genomma" +
          5 PriorityDots) que comprimía el título. Ahora dots con tooltips
          dejan el título primary. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--ag-space-2)',
          flexShrink: 0,
        }}
      >
        <PriorityArrow priority={priority} />
        <ProjectDot label={projectLabel} />
        {deadline ? <DeadlineBadge deadline={deadline} /> : null}
      </div>
    </>
  );

  const progressBar = showProgress ? (
    <span
      aria-label={`Avance ${progressPercent}%`}
      style={{
        display: 'block',
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 2,
        backgroundColor: 'var(--ag-rule)',
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'block',
          width: `${Math.max(0, Math.min(100, progressPercent ?? 0))}%`,
          height: '100%',
          backgroundColor: 'var(--ag-ink-soft)',
        }}
      />
    </span>
  ) : null;

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    gap: 'var(--ag-space-3)',
    padding: 'var(--ag-space-3) 0',
    borderBottom: '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
    minHeight: 48, // touch target
    color: 'inherit',
    textDecoration: 'none',
  } as const;

  // When a drag handle or trailing slot is provided, render them OUTSIDE the
  // link so dragging / menu taps don't trigger navigation.
  if (dragHandle || trailingSlot) {
    const cols = `${dragHandle ? 'auto ' : ''}1fr${trailingSlot ? ' auto' : ''}`;
    return (
      <li
        className="ag-activity-row"
        style={{
          listStyle: 'none',
          display: 'grid',
          gridTemplateColumns: cols,
          alignItems: 'center',
          gap: 'var(--ag-space-2)',
          borderBottom: '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
          position: 'relative',
        }}
      >
        {dragHandle ?? null}
        {href ? (
          <Link
            href={href}
            title={tooltip}
            style={{
              ...rowStyle,
              borderBottom: 'none',
            }}
          >
            {rowInner}
          </Link>
        ) : (
          <div title={tooltip} style={{ ...rowStyle, borderBottom: 'none' }}>
            {rowInner}
          </div>
        )}
        {trailingSlot ?? null}
        {progressBar}
      </li>
    );
  }

  return (
    <li className="ag-activity-row" style={{ listStyle: 'none', position: 'relative' }}>
      {href ? (
        <Link href={href} title={tooltip} style={rowStyle}>
          {rowInner}
        </Link>
      ) : (
        <div title={tooltip} style={rowStyle}>
          {rowInner}
        </div>
      )}
      {progressBar}
    </li>
  );
}
