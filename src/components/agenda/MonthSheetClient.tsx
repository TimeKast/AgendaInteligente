'use client';

/**
 * MonthSheetClient — kickoff (goals + themes) + close form.
 *
 * Light shape: goals (free text), themes (3-5 short tags via
 * comma-separated input), close summary. Mirrors updateMonthSheet
 * action.
 *
 * Header carries prev/next month navigation. Objetivos + Temas live
 * inside a collapsible (closed by default — planner is the focus).
 * Close summary only renders on past months or during the last week
 * of the current month.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { updateMonthSheet } from '@/lib/actions/month-sheet';
import { MonthWeeksPlanner } from './MonthWeeksPlanner';
import type { MonthActivitiesResult } from '@/lib/db/queries/month-activities';

export interface MonthSheetInitial {
  monthStarting: string; // YYYY-MM-01
  monthLabel: string; // "Mayo 2026"
  goals: string;
  themes: string[];
  closeSummary: string;
  closed: boolean;
}

interface MonthNav {
  prevHref: string;
  nextHref: string;
  isCurrentMonth: boolean;
  isPastMonth: boolean;
  todayYmd: string;
}

interface Props {
  initial: MonthSheetInitial;
  nav: MonthNav;
  monthActivities: MonthActivitiesResult;
  todayYmd: string;
}

/**
 * Show close summary on past months (anytime — already ended) or during
 * the last 7 days of the current month. Future months: hidden.
 */
function shouldShowClose(nav: MonthNav): boolean {
  if (nav.isPastMonth) return true;
  if (!nav.isCurrentMonth) return false;
  const day = Number(nav.todayYmd.slice(8, 10));
  // Compute days-in-month from todayYmd's year/month.
  const [y, m] = nav.todayYmd.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate(); // m is 1-12, 0th of next = last
  return day >= daysInMonth - 6;
}

export function MonthSheetClient({ initial, nav, monthActivities, todayYmd }: Props) {
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
      <NavHeader
        label={initial.monthLabel}
        closed={initial.closed}
        prevHref={nav.prevHref}
        nextHref={nav.nextHref}
        isCurrentMonth={nav.isCurrentMonth}
      />

      <CollapsibleSection
        title="Objetivos y temas del mes"
        subtitle="Goals + 3-5 focos. Se editan acá; el resto del tiempo viven plegados."
        defaultOpen={false}
      >
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
      </CollapsibleSection>

      <MonthWeeksPlanner data={monthActivities} todayYmd={todayYmd} />

      {shouldShowClose(nav) && (
        <CollapsibleSection
          title="Cierre del mes"
          subtitle={
            nav.isPastMonth
              ? 'Cierre pendiente de un mes pasado.'
              : 'Estás en la última semana — resumen de cierre.'
          }
          defaultOpen={nav.isPastMonth && !initial.closed}
        >
          <Label text="Resumen al cerrar">
            <textarea
              value={closeSummary}
              onChange={(e) => setCloseSummary(e.target.value)}
              rows={3}
              disabled={isPending}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Label>
        </CollapsibleSection>
      )}

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

function NavHeader({
  label,
  closed,
  prevHref,
  nextHref,
  isCurrentMonth,
}: {
  label: string;
  closed: boolean;
  prevHref: string;
  nextHref: string;
  isCurrentMonth: boolean;
}) {
  return (
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        gap: 'var(--ag-space-2)',
      }}
    >
      <NavArrow href={prevHref} direction="prev" />
      <div style={{ textAlign: 'center', minWidth: 0 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontSize: 20,
            fontWeight: 500,
            color: 'var(--ag-ink-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </h2>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            marginTop: 2,
            fontFamily: 'var(--ag-font-body)',
            fontSize: 11,
            color: 'var(--ag-ink-hint)',
          }}
        >
          {!isCurrentMonth && <span style={{ fontStyle: 'italic' }}>Otro mes</span>}
          {closed && <span>cerrado ✓</span>}
        </div>
      </div>
      <NavArrow href={nextHref} direction="next" />
    </header>
  );
}

function NavArrow({ href, direction }: { href: string; direction: 'prev' | 'next' }) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  const label = direction === 'prev' ? 'Mes anterior' : 'Mes siguiente';
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      style={{
        appearance: 'none',
        border: '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-base)',
        padding: 6,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ag-ink-soft)',
        backgroundColor: 'var(--ag-bg-elevated)',
        textDecoration: 'none',
      }}
    >
      <Icon size={18} strokeWidth={1.5} />
    </Link>
  );
}

function CollapsibleSection({
  title,
  subtitle,
  defaultOpen,
  children,
}: {
  title: string;
  subtitle: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section
      style={{
        border: '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-base)',
        backgroundColor: 'var(--ag-bg-elevated)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          appearance: 'none',
          background: 'transparent',
          border: 'none',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          gap: 'var(--ag-space-2)',
          padding: 'var(--ag-space-3) var(--ag-space-4)',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--ag-ink-primary)',
        }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: 'var(--ag-font-display)',
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 12,
              color: 'var(--ag-ink-soft)',
            }}
          >
            {subtitle}
          </span>
        </span>
        <ChevronDown
          size={18}
          strokeWidth={1.5}
          style={{
            color: 'var(--ag-ink-hint)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--ag-duration-base) var(--ag-ease)',
          }}
        />
      </button>
      {open && (
        <div
          style={{
            padding: 'var(--ag-space-3) var(--ag-space-4) var(--ag-space-4)',
            borderTop: '1px solid var(--ag-rule)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-3)',
          }}
        >
          {children}
        </div>
      )}
    </section>
  );
}

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
