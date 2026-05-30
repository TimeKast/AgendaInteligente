'use client';

/**
 * MonthSheetClient — kickoff (goals + themes) + close form.
 *
 * Light shape: goals (free text), themes (3-5 short tags via
 * comma-separated input), close summary. Mirrors updateMonthSheet
 * action.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateMonthSheet } from '@/lib/actions/month-sheet';

export interface MonthSheetInitial {
  monthStarting: string; // YYYY-MM-01
  monthLabel: string; // "Mayo 2026"
  goals: string;
  themes: string[];
  closeSummary: string;
  closed: boolean;
}

interface Props {
  initial: MonthSheetInitial;
}

export function MonthSheetClient({ initial }: Props) {
  const router = useRouter();
  const [goals, setGoals] = useState(initial.goals);
  const [themesRaw, setThemesRaw] = useState(initial.themes.join(', '));
  const [closeSummary, setCloseSummary] = useState(initial.closeSummary);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const themes = themesRaw
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .slice(0, 5);
      const result = await updateMonthSheet({
        monthStarting: initial.monthStarting,
        goals: goals.trim() || null,
        themes,
        closeSummary: closeSummary.trim() || null,
      });
      if (result.error) {
        toast.error(`No se pudo guardar: ${result.error}`);
        return;
      }
      toast.success('Mes guardado.');
      router.refresh();
    });
  }

  return (
    <main
      style={{
        paddingInline: 'var(--ag-space-4)',
        paddingTop: 'var(--ag-space-4)',
        paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-5)',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-display)',
          fontSize: 22,
          fontWeight: 500,
          color: 'var(--ag-ink-primary)',
        }}
      >
        {initial.monthLabel}
        {initial.closed && (
          <span
            style={{
              marginLeft: 8,
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              color: 'var(--ag-ink-hint)',
            }}
          >
            cerrado ✓
          </span>
        )}
      </h2>

      <Label text="Objetivos del mes">
        <textarea
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          placeholder="¿Qué buscas lograr este mes?"
          rows={4}
          disabled={isPending}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
        />
      </Label>

      <Label text="Temas / focos (3-5 separados por coma)">
        <input
          type="text"
          value={themesRaw}
          onChange={(e) => setThemesRaw(e.target.value)}
          placeholder="ej: salud, MVP, finanzas"
          disabled={isPending}
          style={inputStyle}
        />
      </Label>

      <Label text="Resumen al cerrar (opcional, fin de mes)">
        <textarea
          value={closeSummary}
          onChange={(e) => setCloseSummary(e.target.value)}
          rows={3}
          disabled={isPending}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </Label>

      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          paddingBlock: 'var(--ag-space-3)',
          paddingBottom: 'calc(var(--ag-space-3) + env(safe-area-inset-bottom, 0px))',
          backgroundColor: 'var(--ag-bg)',
          borderTop: '1px solid var(--ag-rule)',
          marginInline: 'calc(var(--ag-space-4) * -1)',
          paddingInline: 'var(--ag-space-4)',
        }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          style={{
            appearance: 'none',
            width: '100%',
            padding: '14px 20px',
            border: 'none',
            borderRadius: 'var(--ag-radius-base)',
            backgroundColor: 'var(--ag-accent-primary)',
            color: 'var(--ag-accent-on)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 15,
            fontWeight: 500,
            cursor: isPending ? 'wait' : 'pointer',
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? 'Guardando…' : 'Guardar mes'}
        </button>
      </footer>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--ag-radius-base)',
  border: '1px solid var(--ag-rule)',
  backgroundColor: 'var(--ag-bg-elevated)',
  color: 'var(--ag-ink-primary)',
  fontFamily: 'var(--ag-font-body)',
  fontSize: 15,
  outline: 'none',
};

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ag-slate)',
        }}
      >
        {text}
      </span>
      {children}
    </label>
  );
}
