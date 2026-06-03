'use client';

/**
 * WeekSheetClient — kickoff + review form bound to updateWeekSheet.
 *
 * v1 wire: text fields only (one_thing, three_wins, learn_one,
 * avoid_one, review_one_sentence, review_energy). JSONB editors
 * (calendar blocks, people, self-care) defer to a follow-up.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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

interface Props {
  initial: WeekSheetInitial;
  weekActivities: WeekActivitiesResult;
  todayYmd: string;
  projects: QuickAddProject[];
  categories: QuickAddCategory[];
}

export function WeekSheetClient({
  initial,
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
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-display)',
          fontSize: 22,
          fontWeight: 500,
          color: 'var(--ag-ink-primary)',
        }}
      >
        {initial.weekLabel}
        {initial.kickoffCompleted && (
          <span
            style={{
              marginLeft: 8,
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              color: 'var(--ag-ink-hint)',
            }}
          >
            kickoff ✓
          </span>
        )}
        {initial.reviewed && (
          <span
            style={{
              marginLeft: 8,
              fontFamily: 'var(--ag-font-body)',
              fontSize: 12,
              color: 'var(--ag-ink-hint)',
            }}
          >
            review ✓
          </span>
        )}
      </h2>

      <Section title="Kickoff" subtitle="Lo que arrancas el domingo.">
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
      </Section>

      <WeekDaysPlanner
        days={weekActivities.days}
        todayYmd={todayYmd}
        byDay={weekActivities.byDay}
        noDay={weekActivities.noDay}
        projects={projects}
        categories={categories}
      />

      {initial.kickoffCompleted ? (
        <Section title="Review" subtitle="Cierre del sábado.">
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
        </Section>
      ) : (
        <p
          style={{
            margin: 0,
            padding: 'var(--ag-space-3) var(--ag-space-4)',
            border: '1px dashed var(--ag-rule)',
            borderRadius: 'var(--ag-radius-base)',
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
            textAlign: 'center',
          }}
        >
          El review (resumen + energía) aparece cuando completás el kickoff.
        </p>
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

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-3)' }}>
      <header>
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontSize: 16,
            fontWeight: 500,
            color: 'var(--ag-ink-primary)',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ag-ink-soft)',
          }}
        >
          {subtitle}
        </p>
      </header>
      {children}
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
