'use client';

/**
 * CalendarConnectionsListLive — server-loaded calendar connections.
 *
 * Renders REAL rows from `calendar_connections` (Google for v1).
 * "+ Conectar otra cuenta" hits /api/calendar/google/connect (signs
 * CSRF state cookie + redirects to Google consent).
 * "Desconectar" hits /api/calendar/connections/[id]/disconnect.
 *
 * Replaces the kit-shipped CalendarConnectionsList that used local
 * useState + mocked OAuth dance.
 */

import { useState, useTransition, type ReactNode } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export interface CalendarConnectionRow {
  id: string;
  accountLabel: string;
  lastSyncLabel: string;
}

interface Props {
  icon: ReactNode;
  providerName: string;
  description: string;
  connections: CalendarConnectionRow[];
  /**
   * Where the "+ Conectar otra cuenta" button takes the browser
   * (route signs CSRF state + redirects to Google consent).
   * NULL = provider disabled.
   */
  connectHref: string | null;
  disabledBadge?: string;
}

export function CalendarConnectionsListLive({
  icon,
  providerName,
  description,
  connections: initial,
  connectHref,
  disabledBadge,
}: Props) {
  const [connections, setConnections] = useState(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const disabled = connectHref === null;

  function handleDisconnect(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/calendar/connections/${id}/disconnect`, {
          method: 'POST',
        });
        if (res.ok) {
          setConnections((prev) => prev.filter((c) => c.id !== id));
        }
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleSyncNow(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/calendar/connections/${id}/sync-now`, {
          method: 'POST',
        });
        if (res.ok) {
          toast.success('Sincronización solicitada. Vuelve en un minuto.');
        } else {
          const body = await res.json().catch(() => ({ error: 'unknown' }));
          toast.error(`No se pudo sincronizar: ${body.error ?? res.status}`);
        }
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <section
      style={{
        padding: 'var(--ag-space-4)',
        borderRadius: 'var(--ag-radius-card)',
        border: '1px solid var(--ag-rule)',
        backgroundColor: 'var(--ag-bg-elevated)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-3)',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--ag-space-2)' }}>
        <span style={{ color: 'var(--ag-ink-soft)' }}>{icon}</span>
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontSize: 16,
            fontWeight: 500,
            color: 'var(--ag-ink-primary)',
          }}
        >
          {providerName}
        </h3>
        {disabledBadge && (
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 11,
              color: 'var(--ag-ink-hint)',
              padding: '2px 8px',
              borderRadius: 'var(--ag-radius-pill)',
              backgroundColor: 'var(--ag-bg-sunken)',
            }}
          >
            {disabledBadge}
          </span>
        )}
      </header>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-body)',
          fontSize: 13,
          color: 'var(--ag-ink-soft)',
          lineHeight: 1.45,
        }}
      >
        {description}
      </p>

      {connections.length > 0 && (
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-2)',
          }}
        >
          {connections.map((c) => (
            <li
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--ag-space-3)',
                padding: 'var(--ag-space-2) var(--ag-space-3)',
                borderRadius: 'var(--ag-radius-base)',
                backgroundColor: 'var(--ag-bg)',
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span
                  style={{
                    fontFamily: 'var(--ag-font-body)',
                    fontSize: 14,
                    color: 'var(--ag-ink-primary)',
                  }}
                >
                  {c.accountLabel}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--ag-font-mono)',
                    fontSize: 11,
                    color: 'var(--ag-ink-hint)',
                  }}
                >
                  {c.lastSyncLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSyncNow(c.id)}
                disabled={isPending && pendingId === c.id}
                aria-label="Sincronizar ahora"
                title="Sincronizar ahora"
                style={{
                  appearance: 'none',
                  border: '1px solid var(--ag-rule)',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 'var(--ag-radius-base)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ag-ink-soft)',
                }}
              >
                <RefreshCw size={14} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => handleDisconnect(c.id)}
                disabled={isPending && pendingId === c.id}
                style={{
                  appearance: 'none',
                  border: '1px solid var(--ag-rule)',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: 'var(--ag-radius-base)',
                  fontFamily: 'var(--ag-font-body)',
                  fontSize: 12,
                  color: 'var(--ag-ink-soft)',
                }}
              >
                {isPending && pendingId === c.id ? '…' : 'Desconectar'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!disabled && connectHref && (
        <a
          href={connectHref}
          style={{
            appearance: 'none',
            border: '1px dashed var(--ag-rule)',
            background: 'transparent',
            cursor: 'pointer',
            padding: '10px 16px',
            borderRadius: 'var(--ag-radius-base)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-soft)',
            textDecoration: 'none',
          }}
        >
          <Plus size={14} strokeWidth={1.5} />
          {connections.length === 0 ? 'Conectar cuenta' : 'Conectar otra cuenta'}
        </a>
      )}
    </section>
  );
}
