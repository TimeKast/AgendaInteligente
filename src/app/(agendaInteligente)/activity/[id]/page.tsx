'use client';

/**
 * SCR-040 — Activity detail (mobile portrait prototype)
 *
 * Hardcoded regardless of `id` (visual-only). AgendaShell hides bottom nav
 * + FAB on this route so the action footer ("Marcar como hecha" / "Borrar")
 * is the dominant interaction.
 *
 * Local state (prototype only):
 *   - `deadline` — ISO YYYY-MM-DD, editable via native date picker. Tapping
 *     the DEADLINE row reveals the input and a DeadlineBadge with semantic
 *     ink (hint > 7d, warning ≤3d, danger past).
 *   - `progressPercent` — 0..100 slider under a new AVANCE section. Setting
 *     to 100% does NOT auto-mark done (status is decoupled).
 */

import { useState } from 'react';
import { MoreHorizontal, ChevronDown } from 'lucide-react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { PriorityDots } from '@/components/agenda/PriorityDots';
import { TagChip } from '@/components/agenda/TagChip';
import { SubtaskRow } from '@/components/agenda/SubtaskRow';
import { DeadlineBadge } from '@/components/agenda/DeadlineBadge';
import {
  RecurrencePicker,
  formatRecurrence,
  type RecurrenceRule,
} from '@/components/agenda/RecurrencePicker';

/** Frozen "today" matching the rest of the prototype (2026-05-22). */
const PROTO_TODAY = '2026-05-22';

function FieldRow({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-1)',
        paddingBlock: 'var(--ag-space-3)',
        borderBottom: '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--ag-slate)',
        }}
      >
        {label}
      </span>
      <div
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 15,
          color: 'var(--ag-ink-primary)',
        }}
      >
        {children}
      </div>
      {hint ? (
        <span
          style={{
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
          }}
        >
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export default function ActivityDetailPage() {
  const [deadline, setDeadline] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(35);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>('weekly:MO,WE,FR');
  const [recurrenceOpen, setRecurrenceOpen] = useState<boolean>(false);

  return (
    <>
      <AgendaHeader
        dateLabel="Detalle"
        backHref="/today"
        rightSlot={
          <button
            type="button"
            aria-label="Más opciones"
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--ag-ink-soft)',
              padding: 6,
              cursor: 'pointer',
              display: 'inline-flex',
            }}
          >
            <MoreHorizontal size={20} strokeWidth={1.5} />
          </button>
        }
      />

      <main
        style={{
          paddingBottom: 'calc(var(--ag-space-6) + 96px + env(safe-area-inset-bottom, 0px))',
          maxWidth: 480,
          marginInline: 'auto',
          paddingInline: 'var(--ag-space-4)',
        }}
      >
        {/* Title + big checkbox */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            alignItems: 'center',
            gap: 'var(--ag-space-3)',
            paddingBlock: 'var(--ag-space-5)',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 24,
              height: 24,
              borderRadius: 'var(--ag-radius-xs)',
              boxShadow: 'inset 0 0 0 1.5px var(--ag-ink-soft)',
              flexShrink: 0,
            }}
          />
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontSize: 26,
              fontWeight: 500,
              lineHeight: 1.2,
              color: 'var(--ag-ink-primary)',
            }}
          >
            Llamar a Juan
          </h1>
        </div>

        <FieldRow label="Proyecto">Empresa Genomma</FieldRow>

        <FieldRow label="Descripción">Quick call about Q2 strategy.</FieldRow>

        <FieldRow
          label="Programada"
          hint="Tenés un evento Google a las 10am."
        >
          Lunes 19 mayo · 09:00
        </FieldRow>

        <FieldRow label="Prioridad">
          <PriorityDots priority={4} />
        </FieldRow>

        <FieldRow label="Deadline">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ag-space-2)', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              aria-label="Elegí un deadline"
              style={{
                appearance: 'none',
                backgroundColor: 'transparent',
                border: '1px solid var(--ag-rule)',
                borderRadius: 'var(--ag-radius-base)',
                padding: '6px 10px',
                fontFamily: 'var(--ag-font-mono)',
                fontSize: 14,
                color: deadline ? 'var(--ag-ink-primary)' : 'var(--ag-ink-hint)',
                fontStyle: deadline ? 'normal' : 'italic',
                outline: 'none',
              }}
            />
            {deadline ? (
              <DeadlineBadge deadline={deadline} today={PROTO_TODAY} />
            ) : (
              <span style={{ color: 'var(--ag-ink-hint)', fontStyle: 'italic' }}>
                No definido
              </span>
            )}
          </div>
        </FieldRow>

        {/* RECURRENCIA — tap to expand picker */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-1)',
            paddingBlock: 'var(--ag-space-3)',
            borderBottom: '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
          }}
        >
          <button
            type="button"
            onClick={() => setRecurrenceOpen((v) => !v)}
            aria-expanded={recurrenceOpen}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              padding: 0,
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ag-space-1)',
              width: '100%',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'var(--ag-font-body)',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ag-slate)',
              }}
            >
              Recurrencia
              <ChevronDown
                size={12}
                strokeWidth={1.5}
                aria-hidden
                style={{
                  transform: recurrenceOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform var(--ag-duration-base) var(--ag-ease)',
                }}
              />
            </span>
            <span
              style={{
                fontFamily: 'var(--ag-font-display)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--ag-ink-soft)',
              }}
            >
              {formatRecurrence(recurrenceRule)}
            </span>
          </button>
          {recurrenceOpen ? (
            <div style={{ paddingTop: 'var(--ag-space-2)' }}>
              <RecurrencePicker
                value={recurrenceRule}
                onChange={setRecurrenceRule}
                referenceDate={PROTO_TODAY}
              />
            </div>
          ) : null}
        </div>

        <FieldRow label="Tiempo estimado">15 min</FieldRow>

        <FieldRow label="Tags">
          <span style={{ display: 'inline-flex', gap: 'var(--ag-space-2)', flexWrap: 'wrap' }}>
            <TagChip label="urgente" />
            <TagChip label="follow-up" />
          </span>
        </FieldRow>

        {/* AVANCE — progress percent slider */}
        <section
          aria-labelledby="ag-progress-heading"
          style={{
            paddingBlock: 'var(--ag-space-4)',
            borderBottom: '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 'var(--ag-space-2)',
            }}
          >
            <h2
              id="ag-progress-heading"
              style={{
                margin: 0,
                fontFamily: 'var(--ag-font-body)',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ag-slate)',
              }}
            >
              Avance
            </h2>
            <span
              aria-live="polite"
              style={{
                fontFamily: 'var(--ag-font-mono)',
                fontSize: 13,
                color: 'var(--ag-ink-soft)',
              }}
            >
              {progressPercent}%
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={1}
            list="ag-progress-marks"
            value={progressPercent}
            onChange={(e) => setProgressPercent(Number(e.target.value))}
            aria-label="Porcentaje de avance"
            style={{
              width: '100%',
              accentColor: 'var(--ag-ink-soft)',
              marginTop: 'var(--ag-space-2)',
            }}
          />
          <datalist id="ag-progress-marks">
            <option value="0" />
            <option value="25" />
            <option value="50" />
            <option value="75" />
            <option value="100" />
          </datalist>

          <p
            style={{
              margin: 'var(--ag-space-1) 0 0 0',
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--ag-ink-hint)',
            }}
          >
            Cuánto llevás avanzado. Independiente de si terminaste hoy.
          </p>
        </section>

        {/* Subtasks */}
        <section style={{ paddingTop: 'var(--ag-space-5)' }}>
          <h2
            style={{
              margin: 0,
              paddingBottom: 'var(--ag-space-2)',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--ag-slate)',
            }}
          >
            Subtasks
          </h2>
          <SubtaskRow text="Preparar talking points" />
          <SubtaskRow text="Enviar calendar invite" />
          <button
            type="button"
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              padding: 'var(--ag-space-3) 0',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              color: 'var(--ag-ink-soft)',
              cursor: 'pointer',
            }}
          >
            + Subtask
          </button>
        </section>

        {/* Goals vinculados */}
        <section style={{ paddingTop: 'var(--ag-space-4)' }}>
          <h2
            style={{
              margin: 0,
              paddingBottom: 'var(--ag-space-2)',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--ag-slate)',
            }}
          >
            Goals vinculados
          </h2>
          <div
            style={{
              display: 'flex',
              gap: 'var(--ag-space-2)',
              flexWrap: 'wrap',
              alignItems: 'center',
              paddingBlock: 'var(--ag-space-2)',
            }}
          >
            <TagChip label="Lanzar AI v0.5" />
            <button
              type="button"
              style={{
                appearance: 'none',
                background: 'transparent',
                border: '1px dashed var(--ag-rule)',
                color: 'var(--ag-ink-hint)',
                padding: '2px 10px',
                borderRadius: 'var(--ag-radius-pill)',
                fontFamily: 'var(--ag-font-body)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              + Vincular
            </button>
          </div>
        </section>
      </main>

      {/* Fixed footer actions */}
      <footer
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 30,
          backgroundColor: 'var(--ag-bg)',
          borderTop: '1px solid var(--ag-rule)',
          paddingInline: 'var(--ag-space-4)',
          paddingBlock: 'var(--ag-space-3)',
          paddingBottom: 'calc(var(--ag-space-3) + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          gap: 'var(--ag-space-2)',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          style={{
            appearance: 'none',
            background: 'transparent',
            border: 'none',
            color: 'var(--ag-danger)',
            padding: '10px 12px',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Borrar
        </button>
        <button
          type="button"
          style={{
            appearance: 'none',
            background: 'var(--ag-accent-primary)',
            color: 'var(--ag-accent-on)',
            border: 'none',
            padding: '12px 20px',
            borderRadius: 'var(--ag-radius-base)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 15,
            fontWeight: 500,
            cursor: 'pointer',
            flex: 1,
            maxWidth: 280,
          }}
        >
          Marcar como hecha
        </button>
      </footer>
    </>
  );
}
