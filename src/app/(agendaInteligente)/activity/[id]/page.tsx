/**
 * SCR-040 — Activity detail (mobile portrait prototype)
 *
 * Hardcoded regardless of `id` (visual-only). AgendaShell hides bottom nav
 * + FAB on this route so the action footer ("Marcar como hecha" / "Borrar")
 * is the dominant interaction.
 */

import { MoreHorizontal } from 'lucide-react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { PriorityDots } from '@/components/agenda/PriorityDots';
import { TagChip } from '@/components/agenda/TagChip';
import { SubtaskRow } from '@/components/agenda/SubtaskRow';

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
          <span style={{ color: 'var(--ag-ink-hint)', fontStyle: 'italic' }}>
            No definido
          </span>
        </FieldRow>

        <FieldRow label="Tiempo estimado">15 min</FieldRow>

        <FieldRow label="Tags">
          <span style={{ display: 'inline-flex', gap: 'var(--ag-space-2)', flexWrap: 'wrap' }}>
            <TagChip label="urgente" />
            <TagChip label="follow-up" />
          </span>
        </FieldRow>

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
