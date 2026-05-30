'use client';

/**
 * GoalsClient — list + inline create.
 *
 * Lists goals grouped by scope (quarter / year / 5year / life). "+ Nueva"
 * picks scope + title + optional deadline. Detail/edit lives in
 * /goals/[id]. Status pills + review fields defer to the detail page.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, Target } from 'lucide-react';
import { createGoal } from '@/lib/actions/goal';
import type { GoalListRow } from '@/lib/db/queries/goals';

interface Props {
  initial: GoalListRow[];
}

type Scope = 'quarter' | 'year' | '5year' | 'life';

const SCOPE_LABEL: Record<Scope, string> = {
  quarter: 'Trimestre',
  year: 'Año',
  '5year': '5 años',
  life: 'Vida',
};

const SCOPE_ORDER: Scope[] = ['quarter', 'year', '5year', 'life'];

const STATUS_LABEL: Record<string, string> = {
  active: '',
  achieved: '✓ lograda',
  partial: '~ parcial',
  abandoned: '✗ abandonada',
};

export function GoalsClient({ initial }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [newScope, setNewScope] = useState<Scope>('quarter');
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [isPending, startTransition] = useTransition();

  const needsDeadline = newScope === 'quarter' || newScope === 'year';

  function handleCreate() {
    const title = newTitle.trim();
    if (!title) return;
    if (needsDeadline && !newDeadline) {
      toast.error('Trimestre/Año requieren deadline.');
      return;
    }
    startTransition(async () => {
      const result = await createGoal({
        title,
        scope: newScope,
        deadline: newDeadline || null,
      });
      if (result.error) {
        toast.error(`No se pudo crear: ${result.error}`);
        return;
      }
      if (result.data) {
        setRows((prev) => [
          ...prev,
          {
            id: result.data!.id,
            title,
            scope: newScope,
            status: 'active',
            deadline: newDeadline || null,
          },
        ]);
      }
      setNewTitle('');
      setNewDeadline('');
      setCreating(false);
      toast.success('Meta creada.');
      router.refresh();
    });
  }

  return (
    <main
      style={{
        paddingInline: 'var(--ag-space-4)',
        paddingTop: 'var(--ag-space-4)',
        paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-4)',
      }}
    >
      {SCOPE_ORDER.map((scope) => {
        const items = rows.filter((g) => g.scope === scope);
        if (items.length === 0) return null;
        return (
          <section key={scope}>
            <h2
              style={{
                margin: 0,
                paddingBlock: 'var(--ag-space-2)',
                fontFamily: 'var(--ag-font-body)',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ag-slate)',
              }}
            >
              {SCOPE_LABEL[scope]}
            </h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {items.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/goals/${g.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--ag-space-3)',
                      padding: 'var(--ag-space-3)',
                      borderBottom: '1px solid var(--ag-rule)',
                      textDecoration: 'none',
                      color: 'var(--ag-ink-primary)',
                    }}
                  >
                    <Target size={16} strokeWidth={1.5} color="var(--ag-ink-soft)" />
                    <span style={{ flex: 1, fontFamily: 'var(--ag-font-body)', fontSize: 15 }}>
                      {g.title}
                    </span>
                    {g.deadline && (
                      <span
                        style={{
                          fontFamily: 'var(--ag-font-mono)',
                          fontSize: 11,
                          color: 'var(--ag-ink-hint)',
                        }}
                      >
                        {g.deadline}
                      </span>
                    )}
                    {STATUS_LABEL[g.status] && (
                      <span
                        style={{
                          fontFamily: 'var(--ag-font-body)',
                          fontSize: 11,
                          color: 'var(--ag-ink-hint)',
                          fontStyle: 'italic',
                        }}
                      >
                        {STATUS_LABEL[g.status]}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {rows.length === 0 && (
        <p
          style={{
            margin: 0,
            paddingBlock: 'var(--ag-space-4)',
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--ag-ink-hint)',
            textAlign: 'center',
          }}
        >
          Sin metas todavía. Crea la primera.
        </p>
      )}

      {creating ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 'var(--ag-space-3)',
            border: '1px solid var(--ag-rule)',
            borderRadius: 'var(--ag-radius-base)',
            backgroundColor: 'var(--ag-bg-elevated)',
          }}
        >
          <select
            value={newScope}
            onChange={(e) => setNewScope(e.target.value as Scope)}
            disabled={isPending}
            style={selectStyle}
          >
            {SCOPE_ORDER.map((s) => (
              <option key={s} value={s}>
                {SCOPE_LABEL[s]}
              </option>
            ))}
          </select>
          <input
            type="text"
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Título de la meta"
            disabled={isPending}
            style={selectStyle}
          />
          <input
            type="date"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            disabled={isPending}
            style={selectStyle}
            placeholder={needsDeadline ? 'Deadline (requerido)' : 'Deadline (opcional)'}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              disabled={isPending || !newTitle.trim()}
              style={{
                flex: 1,
                padding: '8px 14px',
                border: 'none',
                borderRadius: 'var(--ag-radius-base)',
                backgroundColor: 'var(--ag-ink-primary)',
                color: 'var(--ag-accent-on)',
                fontFamily: 'var(--ag-font-body)',
                fontSize: 13,
                cursor: !newTitle.trim() ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.7 : 1,
              }}
            >
              Crear
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setNewTitle('');
                setNewDeadline('');
              }}
              style={{
                padding: '8px 12px',
                border: 'none',
                background: 'transparent',
                color: 'var(--ag-ink-hint)',
                fontFamily: 'var(--ag-font-body)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          style={{
            appearance: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 14px',
            border: '1px dashed var(--ag-rule)',
            borderRadius: 'var(--ag-radius-base)',
            background: 'transparent',
            color: 'var(--ag-ink-soft)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 14,
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          <Plus size={14} strokeWidth={1.5} />
          Nueva meta
        </button>
      )}
    </main>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 'var(--ag-radius-base)',
  border: '1px solid var(--ag-rule)',
  backgroundColor: 'var(--ag-bg)',
  fontFamily: 'var(--ag-font-body)',
  fontSize: 14,
  outline: 'none',
};
