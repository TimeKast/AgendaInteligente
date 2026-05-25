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
import type { ReactNode } from 'react';
import { Check, AlertTriangle, MinusCircle, Repeat } from 'lucide-react';
import { DeadlineBadge } from './DeadlineBadge';
import { formatRecurrence } from './RecurrencePicker';

/**
 * PriorityPip — compact 1-dot priority indicator.
 * Reemplaza PriorityDots (5 dots) que ocupaba mucho ancho horizontal.
 * Color scale: 5=wine, 4=burnt orange, 3=sage, 2=ink-hint, 1=rule.
 */
function PriorityPip({ priority }: { priority: number }) {
  const p = Math.max(1, Math.min(5, priority));
  const colors: Record<number, string> = {
    5: 'var(--ag-scope-life)',
    4: 'var(--ag-scope-year)',
    3: 'var(--ag-scope-quarter)',
    2: 'var(--ag-ink-hint)',
    1: 'var(--ag-rule)',
  };
  const labels: Record<number, string> = {
    5: 'Prioridad alta',
    4: 'Prioridad alta',
    3: 'Prioridad media',
    2: 'Prioridad baja',
    1: 'Prioridad mínima',
  };
  return (
    <span
      aria-label={`${labels[p]} (${p})`}
      title={`${labels[p]} (${p}/5)`}
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: colors[p],
        flexShrink: 0,
      }}
    />
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

export type ActivityStatus = 'todo' | 'in_progress' | 'done' | 'skipped' | 'blocked';

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
        aria-label="Hecho"
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
        aria-label="Saltado"
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
        aria-label="Bloqueado"
        style={{
          ...base,
          color: 'var(--ag-warning)',
        }}
      >
        <AlertTriangle size={14} strokeWidth={1.75} />
      </span>
    );
  }

  return (
    <span
      aria-label="Pendiente"
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
}: ActivityRowProps) {
  const isDone = status === 'done';
  const isInProgress = status === 'in_progress';
  const isSkipped = status === 'skipped';
  const showProgress = !isDone && (progressPercent ?? 0) > 0;

  const rowInner = (
    <>
      <Checkbox status={status} />

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
              color: isDone || isSkipped ? 'var(--ag-ink-hint)' : 'var(--ag-ink-primary)',
              fontStyle: isInProgress ? 'italic' : 'normal',
              textDecoration: isDone ? 'line-through' : 'none',
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
        <PriorityPip priority={priority} />
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
          borderBottom:
            '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
          position: 'relative',
        }}
      >
        {dragHandle ?? null}
        {href ? (
          <Link
            href={href}
            style={{
              ...rowStyle,
              borderBottom: 'none',
            }}
          >
            {rowInner}
          </Link>
        ) : (
          <div style={{ ...rowStyle, borderBottom: 'none' }}>{rowInner}</div>
        )}
        {trailingSlot ?? null}
        {progressBar}
      </li>
    );
  }

  return (
    <li className="ag-activity-row" style={{ listStyle: 'none', position: 'relative' }}>
      {href ? (
        <Link href={href} style={rowStyle}>
          {rowInner}
        </Link>
      ) : (
        <div style={rowStyle}>{rowInner}</div>
      )}
      {progressBar}
    </li>
  );
}
