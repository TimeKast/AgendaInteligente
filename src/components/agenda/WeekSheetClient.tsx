'use client';

/**
 * WeekSheetClient — kickoff + review form bound to updateWeekSheet.
 *
 * v1 wire: text fields only (one_thing, three_wins, learn_one,
 * avoid_one, review_one_sentence, review_energy). JSONB editors
 * (calendar blocks, people, self-care) defer to a follow-up.
 *
 * Header includes prev/next week navigation (Link-based, server-rendered).
 * Kickoff is collapsed by default so the planner is the focal point.
 * Review only renders for past weeks or current week from Friday onward.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { updateWeekSheet } from '@/lib/actions/week-sheet';
import { WeekDaysPlanner } from './WeekDaysPlanner';
import type { WeekActivitiesResult } from '@/lib/db/queries/week-activities';
import type { QuickAddProject, QuickAddCategory } from './ActivityQuickAdd';

export interface WeekSheetInitial {
  weekStarting: string; // YYYY-MM-DD
  weekLabel: string; // "Sem del 25 de mayo"
  oneThing: string;
  threeWins: string[];
  learnOne: string;
  avoidOne: string;
  reviewOneSentence: string;
  reviewEnergy: number | null;
  kickoffCompleted: boolean;
  reviewed: boolean;
}

interface WeekNav {
  prevHref: string;
  nextHref: string;
  isCurrentWeek: boolean;
  isPastWeek: boolean;
  /** YYYY-MM-DD of today in the user's TZ — used to gate review by weekday. */
  todayYmd: string;
}

interface Props {
  initial: WeekSheetInitial;
  nav: WeekNav;
  weekActivities: WeekActivitiesResult;
  todayYmd: string;
  projects: QuickAddProject[];
  categories: QuickAddCategory[];
}

/**
 * `true` when the review form should be visible:
 *   - viewing a past week (already over → close it any time), OR
 *   - viewing the current week AND today is Friday or Saturday (last two
 *     days of the Sun..Sat cycle, the natural "fin de semana" close
 *     window). Sunday on the current week is the START of the week,
 *     not the end; navigate one week back to close.
 */
function shouldShowReview(nav: WeekNav): boolean {
  if (nav.isPastWeek) return true;
  if (!nav.isCurrentWeek) return false; // future week — nothing to close
  const [y, m, d] = nav.todayYmd.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun … 5=Fri 6=Sat
  return dow === 5 || dow === 6;
}

export function WeekSheetClient({
  initial,
  nav,
  weekActivities,
  todayYmd,
  projects,
  categories,
}: Props) {
  const router = useRouter();
  const [oneThing, setOneThing] = useState(initial.oneThing);
  const [wins, setWins] = useState<string[]>([
    initial.threeWins[0] ?? '',
    initial.threeWins[1] ?? '',
    initial.threeWins[2] ?? '',
  ]);
  const [learnOne, setLearnOne] = useState(initial.learnOne);
  const [avoidOne, setAvoidOne] = useState(initial.avoidOne);
  const [reviewOneSentence, setReviewOneSentence] = useState(initial.reviewOneSentence);
  const [reviewEnergy, setReviewEnergy] = useState<number>(initial.reviewEnergy ?? 5);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const cleanWins = wins.map((w) => w.trim()).filter((w) => w.length > 0);
      const result = await updateWeekSheet({
        weekStarting: initial.weekStarting,
        oneThing: oneThing.trim() || null,
        threeWins: cleanWins,
        learnOne: learnOne.trim() || null,
        avoidOne: avoidOne.trim() || null,
        reviewOneSentence: reviewOneSentence.trim() || null,
        reviewEnergy: reviewEnergy ?? null,
      });
      if (result.error) {
        toast.error(`No se pudo guardar: ${result.error}`);
        return;
      }
      toast.success('Semana guardada.');
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
        label={initial.weekLabel}
        kickoffDone={initial.kickoffCompleted}
        reviewDone={initial.reviewed}
        prevHref={nav.prevHref}
        nextHref={nav.nextHref}
        isCurrentWeek={nav.isCurrentWeek}
      />

      <CollapsibleSection
        title="Objetivos de la semana"
        subtitle="Kickoff: una sola cosa, tres wins, aprender, evitar."
        defaultOpen={false}
      >
        <Label text="Si solo una cosa pasa, ¿cuál?">
          <textarea
            value={oneThing}
            onChange={(e) => setOneThing(e.target.value)}
            placeholder="Una frase."
            rows={2}
            disabled={isPending}
            style={inputStyle}
          />
        </Label>

        <Label text="Tres wins de la semana">
          {wins.map((w, i) => (
            <input
              key={i}
              type="text"
              value={w}
              onChange={(e) =>
                setWins((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
              }
              placeholder={`Win ${i + 1}`}
              disabled={isPending}
              style={{ ...inputStyle, marginBottom: 6 }}
            />
          ))}
        </Label>

        <Label text="Algo que quieres aprender">
          <input
            type="text"
            value={learnOne}
            onChange={(e) => setLearnOne(e.target.value)}
            disabled={isPending}
            style={inputStyle}
          />
        </Label>

        <Label text="Algo que quieres evitar">
          <input
            type="text"
            value={avoidOne}
            onChange={(e) => setAvoidOne(e.target.value)}
            disabled={isPending}
            style={inputStyle}
          />
        </Label>
      </CollapsibleSection>

      <WeekDaysPlanner
        days={weekActivities.days}
        todayYmd={todayYmd}
        byDay={weekActivities.byDay}
        noDay={weekActivities.noDay}
        projects={projects}
        categories={categories}
      />

      {shouldShowReview(nav) && (
        <CollapsibleSection
          title="Cierre de la semana"
          subtitle={
            nav.isPastWeek
              ? 'Review pendiente de una semana pasada.'
              : 'Llegó el fin de semana — resumen + energía.'
          }
          defaultOpen={nav.isPastWeek && !initial.reviewed}
        >
          <Label text="Resumen en una frase">
            <textarea
              value={reviewOneSentence}
              onChange={(e) => setReviewOneSentence(e.target.value)}
              rows={2}
              disabled={isPending}
              style={inputStyle}
            />
          </Label>

          <Label text={`Energía esta semana: ${reviewEnergy}/10`}>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={reviewEnergy}
              onChange={(e) => setReviewEnergy(Number(e.target.value))}
              disabled={isPending}
              style={{ width: '100%' }}
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
          {isPending ? 'Guardando…' : 'Guardar semana'}
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
  kickoffDone,
  reviewDone,
  prevHref,
  nextHref,
  isCurrentWeek,
}: {
  label: string;
  kickoffDone: boolean;
  reviewDone: boolean;
  prevHref: string;
  nextHref: string;
  isCurrentWeek: boolean;
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
          {!isCurrentWeek && <span style={{ fontStyle: 'italic' }}>Otra semana</span>}
          {kickoffDone && <span>kickoff ✓</span>}
          {reviewDone && <span>review ✓</span>}
        </div>
      </div>
      <NavArrow href={nextHref} direction="next" />
    </header>
  );
}

function NavArrow({ href, direction }: { href: string; direction: 'prev' | 'next' }) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  const label = direction === 'prev' ? 'Semana anterior' : 'Semana siguiente';
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
