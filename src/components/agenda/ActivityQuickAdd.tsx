'use client';

/**
 * ActivityQuickAdd — SCR-051. Inline quick-add form for a new activity from
 * the Today / Tasks screens.
 *
 * Pattern F-1 from DESIGN §5: collapsed CTA → tap → expanded inline form
 * with title autofocus, compact row (project/date/priority), and an optional
 * "+ más detalles" disclosure.
 *
 * Project list + default date are server-loaded (real DB) — no hardcoded
 * labels. The draft emits both a real `projectId` (UUID for persist) and a
 * `projectLabel` (for snappy optimistic rendering by the caller).
 */

import { useMemo, useRef, useState } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { PriorityDots } from './PriorityDots';
import { RecurrencePicker, type RecurrenceRule } from './RecurrencePicker';

export interface QuickAddProject {
  id: string;
  name: string;
  isInbox: boolean;
  /** Owning category — drives the cascade category → project picker. */
  categoryId: string;
  categoryName: string;
}

export interface QuickAddCategory {
  id: string;
  name: string;
  isInbox: boolean;
}

export interface QuickAddDraft {
  title: string;
  /** Real UUID — for createActivity. */
  projectId: string;
  /** Display label — for optimistic UI before revalidation. */
  projectLabel: string;
  /** YYYY-MM-DD scheduled date, or null = sin día (pool / backlog). */
  dateISO: string | null;
  priority: number;
  description?: string;
  scheduledTime?: string;
  /** Optional ISO YYYY-MM-DD deadline. */
  deadline?: string;
  /** Optional recurrence rule (simplified DSL — see RecurrencePicker). */
  recurrenceRule?: RecurrenceRule;
}

interface ActivityQuickAddProps {
  onCreate: (draft: QuickAddDraft) => void;
  /**
   * Project picker source — must include at least the user's Inbox.
   * Caller (server page) loads via `listProjects`.
   */
  projects: QuickAddProject[];
  /**
   * Full category catalog — Inbox first. Shown even when a category has
   * no projects yet (the project sub-picker just shows "Sin proyectos"
   * in that case).
   */
  categories: QuickAddCategory[];
  /**
   * YYYY-MM-DD pre-selected when the form opens. Typically the user's
   * local "today" — caller resolves the timezone.
   */
  defaultDateISO: string;
  /**
   * Force the form to start expanded — for inline mounts (e.g. /tasks
   * header button) so the user doesn't have to tap "+ Nueva" twice.
   */
  defaultOpen?: boolean;
  /**
   * When set, the form starts expanded with these fields pre-filled and
   * the collapsed "+ Nueva" CTA is suppressed. Used by modal flows like
   * voice capture where the caller controls open/close.
   */
  initialDraft?: {
    title?: string;
    projectId?: string;
    /** YYYY-MM-DD or null = sin día. */
    dateISO?: string | null;
    priority?: number;
    description?: string;
    /** HH:mm. */
    scheduledTime?: string;
    /** YYYY-MM-DD. */
    deadline?: string;
    recurrenceRule?: RecurrenceRule;
  };
  /**
   * Override the Cancel button — typically the modal parent uses this to
   * close the sheet. Defaults to internal close (collapse the form).
   */
  onCancel?: () => void;
  /**
   * Label for the submit button. Defaults to "Crear →".
   */
  submitLabel?: string;
}

type DateChoice = 'today' | 'tomorrow' | 'custom' | 'none';

/** YYYY-MM-DD = today + days (UTC arithmetic — caller already TZ-resolved). */
function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function ActivityQuickAdd({
  onCreate,
  projects,
  categories: catalogCategories,
  defaultDateISO,
  defaultOpen,
  initialDraft,
  onCancel,
  submitLabel,
}: ActivityQuickAddProps) {
  // Project source — Inbox first, then by name. The caller's `listProjects`
  // already returns Inbox-first, but we re-stabilize defensively.
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      if (a.isInbox && !b.isInbox) return -1;
      if (!a.isInbox && b.isInbox) return 1;
      return a.name.localeCompare(b.name, 'es');
    });
  }, [projects]);

  const defaultProjectId = useMemo(() => {
    return sortedProjects.find((p) => p.isInbox)?.id ?? sortedProjects[0]?.id ?? '';
  }, [sortedProjects]);

  /** Full catalog sorted Inbox-first, then alpha. Driven by `categories` prop. */
  const categories = useMemo(() => {
    return [...catalogCategories].sort((a, b) => {
      if (a.isInbox && !b.isInbox) return -1;
      if (!a.isInbox && b.isInbox) return 1;
      return a.name.localeCompare(b.name, 'es');
    });
  }, [catalogCategories]);

  // Map an initialDraft's dateISO to (choice, customDate). Anything that
  // isn't exactly today or tomorrow becomes a custom date so the picker
  // shows the actual value.
  const initialDateState = useMemo<{ choice: DateChoice; custom: string }>(() => {
    if (!initialDraft || initialDraft.dateISO === undefined) {
      return { choice: 'today', custom: defaultDateISO };
    }
    if (initialDraft.dateISO === null) return { choice: 'none', custom: defaultDateISO };
    if (initialDraft.dateISO === defaultDateISO) return { choice: 'today', custom: defaultDateISO };
    if (initialDraft.dateISO === addDaysISO(defaultDateISO, 1)) {
      return { choice: 'tomorrow', custom: defaultDateISO };
    }
    return { choice: 'custom', custom: initialDraft.dateISO };
  }, [initialDraft, defaultDateISO]);

  // Split an incoming deadline (YYYY-MM-DD or YYYY-MM-DDTHH:mm) into the
  // two inputs the form exposes.
  const initialDeadlineState = useMemo<{ date: string; time: string }>(() => {
    const raw = initialDraft?.deadline ?? '';
    if (!raw) return { date: '', time: '' };
    if (raw.includes('T')) {
      const [d, t] = raw.split('T');
      return { date: d ?? '', time: (t ?? '').slice(0, 5) };
    }
    return { date: raw, time: '' };
  }, [initialDraft?.deadline]);

  const modal = initialDraft !== undefined;
  const [open, setOpen] = useState(modal || !!defaultOpen);
  const [title, setTitle] = useState(initialDraft?.title ?? '');
  // Stored user intent — actual displayed projectId/categoryId are derived
  // via useMemo below so they stay valid when the projects list mutates
  // (e.g. fetched after modal mount).
  const [pickedProjectId, setPickedProjectId] = useState<string | null>(
    initialDraft?.projectId ?? null
  );
  const [pickedCategoryId, setPickedCategoryId] = useState<string | null>(null);
  const [projectQuery, setProjectQuery] = useState('');
  const [projectFocus, setProjectFocus] = useState(false);
  const [dateChoice, setDateChoice] = useState<DateChoice>(initialDateState.choice);
  const [customDate, setCustomDate] = useState(initialDateState.custom);
  const [priority, setPriority] = useState(initialDraft?.priority ?? 3);
  const [moreOpen, setMoreOpen] = useState(
    !!(
      initialDraft &&
      (initialDraft.description ||
        initialDraft.scheduledTime ||
        initialDraft.deadline ||
        initialDraft.recurrenceRule)
    )
  );
  const [description, setDescription] = useState(initialDraft?.description ?? '');
  const [scheduledTime, setScheduledTime] = useState(initialDraft?.scheduledTime ?? '');
  const [deadline, setDeadline] = useState(initialDeadlineState.date);
  const [deadlineTime, setDeadlineTime] = useState(initialDeadlineState.time);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>(
    initialDraft?.recurrenceRule ?? null
  );
  const titleRef = useRef<HTMLInputElement>(null);

  // Resolved projectId — the picked one if still valid, else fall back to
  // Inbox (or first available). Re-derives whenever projects load late.
  const projectId = useMemo(() => {
    if (pickedProjectId && sortedProjects.some((p) => p.id === pickedProjectId)) {
      return pickedProjectId;
    }
    return defaultProjectId;
  }, [pickedProjectId, sortedProjects, defaultProjectId]);

  // Resolved categoryId — explicit pick if still valid, else derived from
  // the resolved projectId's owning category.
  const categoryId = useMemo(() => {
    if (pickedCategoryId && sortedProjects.some((p) => p.categoryId === pickedCategoryId)) {
      return pickedCategoryId;
    }
    return sortedProjects.find((p) => p.id === projectId)?.categoryId ?? '';
  }, [pickedCategoryId, projectId, sortedProjects]);

  function reset() {
    setTitle('');
    setPickedProjectId(null);
    setPickedCategoryId(null);
    setProjectQuery('');
    setProjectFocus(false);
    setDateChoice('today');
    setCustomDate(defaultDateISO);
    setPriority(3);
    setMoreOpen(false);
    setDescription('');
    setScheduledTime('');
    setDeadline('');
    setDeadlineTime('');
    setRecurrenceRule(null);
  }

  function close() {
    if (onCancel) {
      onCancel();
      return;
    }
    reset();
    setOpen(false);
  }

  function resolveDateISO(): string | null {
    switch (dateChoice) {
      case 'today':
        return defaultDateISO;
      case 'tomorrow':
        return addDaysISO(defaultDateISO, 1);
      case 'custom':
        return customDate || null;
      case 'none':
        return null;
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    if (!projectId) {
      toast.error('No hay proyectos disponibles. Crea uno primero.');
      return;
    }
    const projectLabel = sortedProjects.find((p) => p.id === projectId)?.name ?? '';
    // Compose the deadline: date alone, or date + time when both are set.
    const deadlineDate = deadline.trim();
    const deadlineHm = deadlineTime.trim();
    const deadlineOut = deadlineDate
      ? deadlineHm
        ? `${deadlineDate}T${deadlineHm}`
        : deadlineDate
      : undefined;
    onCreate({
      title: trimmed,
      projectId,
      projectLabel,
      dateISO: resolveDateISO(),
      priority,
      description: description.trim() || undefined,
      scheduledTime: scheduledTime.trim() || undefined,
      deadline: deadlineOut,
      recurrenceRule: recurrenceRule,
    });
    if (modal) {
      // Parent owns close + unmount — don't reset/toast/refocus locally.
      return;
    }
    toast('Guardado.');
    reset();
    // Focus stays on title for rapid sequential adds.
    titleRef.current?.focus();
  }

  if (!open) {
    return (
      <div style={{ padding: 'var(--ag-space-3) 0' }}>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            // Defer focus until input mounts.
            window.setTimeout(() => titleRef.current?.focus(), 0);
          }}
          style={{
            appearance: 'none',
            background: 'transparent',
            border: '1px dashed var(--ag-rule)',
            borderRadius: 'var(--ag-radius-base)',
            padding: '10px 14px',
            width: '100%',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--ag-space-2)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 14,
            color: 'var(--ag-ink-soft)',
            cursor: 'pointer',
          }}
        >
          <Plus size={16} strokeWidth={1.5} />
          Nueva
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-3)',
        padding: 'var(--ag-space-3)',
        margin: 'var(--ag-space-3) 0',
        backgroundColor: 'var(--ag-bg-elevated)',
        border: '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ag-space-2)' }}>
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Una tarea rápida…"
          style={{
            appearance: 'none',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--ag-rule)',
            padding: '6px 0',
            fontFamily: 'var(--ag-font-display)',
            fontStyle: title ? 'normal' : 'italic',
            fontSize: 16,
            color: 'var(--ag-ink-primary)',
            outline: 'none',
            flex: 1,
            minWidth: 0,
          }}
        />
        <button
          type="button"
          onClick={close}
          aria-label="Cancelar"
          style={{
            appearance: 'none',
            background: 'transparent',
            border: 'none',
            color: 'var(--ag-ink-hint)',
            cursor: 'pointer',
            padding: 4,
            display: 'inline-flex',
          }}
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 'var(--ag-space-2)',
        }}
      >
        <CategoryProjectPicker
          projects={sortedProjects}
          categories={categories}
          categoryId={categoryId}
          projectId={projectId}
          query={projectQuery}
          focused={projectFocus}
          onCategoryChange={(nextCat) => {
            setPickedCategoryId(nextCat);
            // Auto-pick the first (or inbox) project of the new category.
            const inCat = sortedProjects.filter((p) => p.categoryId === nextCat);
            const next = inCat.find((p) => p.isInbox)?.id ?? inCat[0]?.id ?? '';
            if (next) setPickedProjectId(next);
            setProjectQuery('');
          }}
          onProjectChange={(nextProj) => {
            setPickedProjectId(nextProj);
            setProjectQuery('');
            setProjectFocus(false);
          }}
          onQueryChange={setProjectQuery}
          onFocusChange={setProjectFocus}
        />
        <DateSelect
          choice={dateChoice}
          customDate={customDate}
          onChoiceChange={setDateChoice}
          onCustomDateChange={setCustomDate}
        />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <PriorityStepper value={priority} onChange={setPriority} />
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          style={{
            appearance: 'none',
            background: 'transparent',
            border: 'none',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
            cursor: 'pointer',
          }}
          aria-expanded={moreOpen}
        >
          <ChevronDown
            size={14}
            strokeWidth={1.5}
            style={{
              transform: moreOpen ? 'rotate(180deg)' : 'none',
              transition: `transform var(--ag-duration-base) var(--ag-ease)`,
            }}
          />
          {moreOpen ? 'Menos detalles' : '+ más detalles'}
        </button>
      </div>

      {moreOpen ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-3)' }}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción opcional…"
            rows={2}
            style={{
              appearance: 'none',
              backgroundColor: 'transparent',
              border: '1px solid var(--ag-rule)',
              borderRadius: 'var(--ag-radius-base)',
              padding: '8px 10px',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              color: 'var(--ag-ink-primary)',
              outline: 'none',
              resize: 'vertical',
            }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--ag-space-2)' }}>
            <span
              style={{
                fontFamily: 'var(--ag-font-body)',
                fontSize: 13,
                color: 'var(--ag-ink-hint)',
                minWidth: 80,
              }}
            >
              Hora
            </span>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              style={{
                appearance: 'none',
                backgroundColor: 'transparent',
                border: '1px solid var(--ag-rule)',
                borderRadius: 'var(--ag-radius-base)',
                padding: '6px 10px',
                fontFamily: 'var(--ag-font-mono)',
                fontSize: 14,
                color: 'var(--ag-ink-primary)',
                outline: 'none',
              }}
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ag-space-2)' }}>
            <span
              style={{
                fontFamily: 'var(--ag-font-body)',
                fontSize: 13,
                color: 'var(--ag-ink-hint)',
                minWidth: 80,
              }}
            >
              Deadline
            </span>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              aria-label="Fecha del deadline"
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
                minWidth: 0,
              }}
            />
            <input
              type="time"
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
              disabled={!deadline}
              aria-label="Hora del deadline"
              style={{
                appearance: 'none',
                backgroundColor: 'transparent',
                border: '1px solid var(--ag-rule)',
                borderRadius: 'var(--ag-radius-base)',
                padding: '6px 10px',
                fontFamily: 'var(--ag-font-mono)',
                fontSize: 14,
                color: deadlineTime ? 'var(--ag-ink-primary)' : 'var(--ag-ink-hint)',
                outline: 'none',
                opacity: deadline ? 1 : 0.5,
                minWidth: 0,
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
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
              Recurrencia
            </span>
            <RecurrencePicker value={recurrenceRule} onChange={setRecurrenceRule} />
          </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--ag-space-2)' }}>
        <button
          type="button"
          onClick={close}
          style={{
            appearance: 'none',
            background: 'transparent',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-base)',
            padding: '8px 14px',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-soft)',
            cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!title.trim() || !projectId}
          style={{
            appearance: 'none',
            backgroundColor:
              title.trim() && projectId ? 'var(--ag-ink-primary)' : 'var(--ag-bg-sunken)',
            border: 'none',
            borderRadius: 'var(--ag-radius-base)',
            padding: '8px 14px',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            fontWeight: 500,
            color: title.trim() && projectId ? 'var(--ag-accent-on)' : 'var(--ag-ink-hint)',
            cursor: title.trim() && projectId ? 'pointer' : 'not-allowed',
          }}
        >
          {submitLabel ?? 'Crear →'}
        </button>
      </div>
    </form>
  );
}

/**
 * Simple fuzzy score — substring/prefix/equal/sequence — sufficient for
 * Inbox-class project lists (10–500 items). No external dep.
 */
function fuzzyScore(text: string, query: string): number {
  if (!query) return 1;
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 50;
  if (t.includes(q)) return 25;
  // Sequence match — every char of q appears in t in order.
  let i = 0;
  let j = 0;
  while (i < t.length && j < q.length) {
    if (t[i] === q[j]) j++;
    i++;
  }
  return j === q.length ? 5 : 0;
}

function CategoryProjectPicker({
  projects,
  categories,
  categoryId,
  projectId,
  query,
  focused,
  onCategoryChange,
  onProjectChange,
  onQueryChange,
  onFocusChange,
}: {
  projects: QuickAddProject[];
  categories: QuickAddCategory[];
  categoryId: string;
  projectId: string;
  query: string;
  focused: boolean;
  onCategoryChange: (id: string) => void;
  onProjectChange: (id: string) => void;
  onQueryChange: (q: string) => void;
  onFocusChange: (b: boolean) => void;
}) {
  const projectsInCategory = useMemo(
    () => projects.filter((p) => p.categoryId === categoryId),
    [projects, categoryId]
  );

  const filtered = useMemo(() => {
    const scored = projectsInCategory
      .map((p) => ({ p, s: fuzzyScore(p.name, query.trim()) }))
      .filter((x) => x.s > 0);
    scored.sort((a, b) => b.s - a.s || a.p.name.localeCompare(b.p.name, 'es'));
    return scored.slice(0, 8).map((x) => x.p);
  }, [projectsInCategory, query]);

  const selected = projects.find((p) => p.id === projectId);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        flexWrap: 'wrap',
        position: 'relative',
      }}
    >
      <select
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        aria-label="Categoría"
        style={pillSelectStyle}
      >
        {categories.length === 0 ? (
          <option value="" disabled>
            Sin categorías
          </option>
        ) : null}
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <span style={{ position: 'relative' }}>
        <input
          type="text"
          value={focused ? query : (selected?.name ?? '')}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => {
            onFocusChange(true);
            onQueryChange('');
          }}
          onBlur={() => {
            // Delay so click on a dropdown item registers before blur closes it.
            window.setTimeout(() => onFocusChange(false), 150);
          }}
          placeholder={projectsInCategory.length === 0 ? 'Sin proyectos' : 'Proyecto…'}
          disabled={projectsInCategory.length === 0}
          aria-label="Proyecto"
          style={{
            ...pillSelectStyle,
            minWidth: 140,
            // Visible cue when input is the "selected" display (not focused).
            color: selected || focused ? 'var(--ag-ink-soft)' : 'var(--ag-ink-hint)',
          }}
        />
        {focused && filtered.length > 0 ? (
          <ul
            role="listbox"
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 70,
              listStyle: 'none',
              margin: 0,
              padding: 4,
              backgroundColor: 'var(--ag-bg-elevated)',
              border: '1px solid var(--ag-rule)',
              borderRadius: 'var(--ag-radius-base)',
              boxShadow: '0 4px 12px rgba(42, 40, 38, 0.12)',
              maxHeight: 240,
              overflowY: 'auto',
              minWidth: 180,
            }}
          >
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={p.id === projectId}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onProjectChange(p.id)}
                  style={{
                    appearance: 'none',
                    background: p.id === projectId ? 'var(--ag-bg-sunken)' : 'transparent',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 10px',
                    borderRadius: 'var(--ag-radius-base)',
                    fontFamily: 'var(--ag-font-body)',
                    fontSize: 13,
                    color: 'var(--ag-ink-primary)',
                    cursor: 'pointer',
                  }}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </span>
    </span>
  );
}

function DateSelect({
  choice,
  customDate,
  onChoiceChange,
  onCustomDateChange,
}: {
  choice: DateChoice;
  customDate: string;
  onChoiceChange: (c: DateChoice) => void;
  onCustomDateChange: (d: string) => void;
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      <select
        value={choice}
        onChange={(e) => onChoiceChange(e.target.value as DateChoice)}
        aria-label="Fecha"
        style={pillSelectStyle}
      >
        <option value="today">Hoy</option>
        <option value="tomorrow">Mañana</option>
        <option value="custom">Elegir fecha…</option>
        <option value="none">Sin día</option>
      </select>
      {choice === 'custom' ? (
        <input
          type="date"
          value={customDate}
          onChange={(e) => onCustomDateChange(e.target.value)}
          aria-label="Fecha personalizada"
          style={{
            appearance: 'none',
            backgroundColor: 'var(--ag-bg)',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-pill)',
            padding: '4px 10px',
            fontFamily: 'var(--ag-font-mono)',
            fontSize: 12,
            color: 'var(--ag-ink-soft)',
            outline: 'none',
          }}
        />
      ) : null}
    </span>
  );
}

const pillSelectStyle: React.CSSProperties = {
  appearance: 'none',
  backgroundColor: 'var(--ag-bg)',
  border: '1px solid var(--ag-rule)',
  borderRadius: 'var(--ag-radius-pill)',
  padding: '4px 10px',
  fontFamily: 'var(--ag-font-body)',
  fontSize: 13,
  color: 'var(--ag-ink-soft)',
  outline: 'none',
};

function PriorityStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <button
      type="button"
      aria-label={`Prioridad ${value} de 5. Tocá para cambiar.`}
      onClick={() => onChange(value === 5 ? 1 : value + 1)}
      style={{
        appearance: 'none',
        background: 'var(--ag-bg)',
        border: '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-pill)',
        padding: '4px 10px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 12,
          color: 'var(--ag-ink-hint)',
        }}
      >
        P
      </span>
      <PriorityDots priority={value} />
    </button>
  );
}
