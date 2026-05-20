'use client';

/**
 * ActivityQuickAdd — SCR-051. Inline quick-add form for a new activity from
 * the Today screen.
 *
 * Pattern F-1 from DESIGN §5: collapsed CTA → tap → expanded inline form
 * with title autofocus, compact row (project/date/priority), and an optional
 * "+ más detalles" disclosure.
 *
 * On submit: invokes `onCreate` with the gathered fields, clears the form,
 * keeps focus on the title input for rapid sequential adds.
 */

import { useRef, useState } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { PriorityDots } from './PriorityDots';

export interface QuickAddDraft {
  title: string;
  projectLabel: string;
  dateLabel: string;
  priority: number;
  description?: string;
  scheduledTime?: string;
}

interface ActivityQuickAddProps {
  onCreate: (draft: QuickAddDraft) => void;
}

const PROJECTS = ['Inbox', 'Empresa Genomma', 'Personal', 'Side project'];
const DATES = ['Hoy', 'Mañana', 'Esta semana'];

export function ActivityQuickAdd({ onCreate }: ActivityQuickAddProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [project, setProject] = useState(PROJECTS[0]);
  const [dateLabel, setDateLabel] = useState(DATES[0]);
  const [priority, setPriority] = useState(3);
  const [moreOpen, setMoreOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  function reset() {
    setTitle('');
    setProject(PROJECTS[0]);
    setDateLabel(DATES[0]);
    setPriority(3);
    setMoreOpen(false);
    setDescription('');
    setScheduledTime('');
  }

  function close() {
    reset();
    setOpen(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreate({
      title: trimmed,
      projectLabel: project,
      dateLabel,
      priority,
      description: description.trim() || undefined,
      scheduledTime: scheduledTime.trim() || undefined,
    });
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
        <CompactSelect value={project} onChange={setProject} options={PROJECTS} />
        <CompactSelect value={dateLabel} onChange={setDateLabel} options={DATES} />
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
          disabled={!title.trim()}
          style={{
            appearance: 'none',
            backgroundColor: title.trim() ? 'var(--ag-ink-primary)' : 'var(--ag-bg-sunken)',
            border: 'none',
            borderRadius: 'var(--ag-radius-base)',
            padding: '8px 14px',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            fontWeight: 500,
            color: title.trim() ? 'var(--ag-accent-on)' : 'var(--ag-ink-hint)',
            cursor: title.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Crear →
        </button>
      </div>
    </form>
  );
}

function CompactSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        appearance: 'none',
        backgroundColor: 'var(--ag-bg)',
        border: '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-pill)',
        padding: '4px 10px',
        fontFamily: 'var(--ag-font-body)',
        fontSize: 13,
        color: 'var(--ag-ink-soft)',
        outline: 'none',
      }}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function PriorityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
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
