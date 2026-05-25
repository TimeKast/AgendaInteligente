'use client';

/**
 * CalendarConnectionsList — multi-account integration list per provider.
 *
 * Renders one section per calendar provider (Google, Outlook). Each section:
 *   - Header: provider icon + name + description.
 *   - Connected accounts list: email + last sync caption + per-row disconnect.
 *   - "+ Conectar otra cuenta" button → simulates 1.5s OAuth + appends a new
 *     mocked email to local state.
 *
 * Disabled state ("Próximamente v2") still renders the multi-connection
 * scaffolding but greys out the action button.
 *
 * Pure prototype — local useState only, no real OAuth.
 */

import { useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export interface CalendarConnection {
  /** Stable id; demo uses email but kept separate for future renames. */
  id: string;
  email: string;
  lastSyncLabel: string;
}

interface CalendarConnectionsListProps {
  icon: ReactNode;
  providerName: string;
  description: string;
  initialConnections?: CalendarConnection[];
  /** Pool of fake emails added in order each time the user taps "+ Conectar". */
  mockAdditionEmails?: string[];
  /** When true, render disabled placeholder UI ("Próximamente v2"). */
  disabled?: boolean;
  disabledBadge?: string;
}

const DEFAULT_MOCK_EMAILS = [
  'trabajo@timekast.mx',
  'fedelevi@gmail.com',
  'agenda+test@levi.dev',
];

export function CalendarConnectionsList({
  icon,
  providerName,
  description,
  initialConnections = [],
  mockAdditionEmails = DEFAULT_MOCK_EMAILS,
  disabled = false,
  disabledBadge,
}: CalendarConnectionsListProps) {
  const [connections, setConnections] = useState<CalendarConnection[]>(
    initialConnections,
  );
  const [loading, setLoading] = useState(false);

  function handleAddAccount() {
    if (disabled || loading) return;
    const nextIdx = connections.length % mockAdditionEmails.length;
    const nextEmail = mockAdditionEmails[nextIdx] ?? `cuenta${connections.length + 1}@demo.com`;
    setLoading(true);
    window.setTimeout(() => {
      setConnections((prev) => [
        ...prev,
        {
          id: `${providerName}-${Date.now()}`,
          email: nextEmail,
          lastSyncLabel: 'Sync hace unos segundos',
        },
      ]);
      setLoading(false);
      toast.success(`Conectado: ${nextEmail}`);
    }, 1500);
  }

  function handleDisconnect(id: string) {
    setConnections((prev) => prev.filter((c) => c.id !== id));
    toast('Cuenta desconectada.');
  }

  return (
    <article
      style={{
        backgroundColor: 'var(--ag-bg-elevated)',
        border: '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-card)',
        padding: 'var(--ag-space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-3)',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--ag-space-3)',
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 'var(--ag-radius-base)',
            backgroundColor: 'var(--ag-bg-sunken)',
            color: 'var(--ag-ink-soft)',
          }}
        >
          {icon}
        </span>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: 0,
            flex: 1,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontSize: 17,
              fontWeight: 500,
              color: 'var(--ag-ink-primary)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {providerName}
          </h3>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--ag-ink-soft)',
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        </div>
        {disabled && disabledBadge ? (
          <span
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--ag-slate)',
              border: '1px solid var(--ag-rule)',
              borderRadius: 'var(--ag-radius-pill)',
              padding: '2px 8px',
            }}
          >
            {disabledBadge}
          </span>
        ) : null}
      </header>

      {connections.length > 0 ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {connections.map((conn, idx) => (
            <li
              key={conn.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--ag-space-3)',
                paddingBlock: 'var(--ag-space-3)',
                borderTop: idx === 0 ? '1px solid var(--ag-rule)' : 'none',
                borderBottom: '1px solid var(--ag-rule)',
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--ag-font-body)',
                    fontSize: 14,
                    color: 'var(--ag-ink-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ● {conn.email}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--ag-font-body)',
                    fontSize: 12,
                    color: 'var(--ag-ink-hint)',
                  }}
                >
                  {conn.lastSyncLabel}
                </span>
              </div>
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => handleDisconnect(conn.id)}
                  aria-label={`Desconectar ${conn.email}`}
                  style={{
                    appearance: 'none',
                    background: 'transparent',
                    border: '1px solid color-mix(in oklab, var(--ag-danger), transparent 60%)',
                    borderRadius: 'var(--ag-radius-base)',
                    padding: '6px 10px',
                    fontFamily: 'var(--ag-font-body)',
                    fontSize: 13,
                    color: 'var(--ag-danger)',
                    cursor: 'pointer',
                  }}
                >
                  Desconectar
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p
          style={{
            margin: 0,
            paddingBlock: 'var(--ag-space-2)',
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
          }}
        >
          Sin cuentas conectadas.
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={handleAddAccount}
          disabled={disabled || loading}
          style={{
            appearance: 'none',
            background: 'transparent',
            border: '1px dashed var(--ag-rule)',
            borderRadius: 'var(--ag-radius-base)',
            padding: '10px 14px',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 14,
            color: disabled ? 'var(--ag-ink-hint)' : 'var(--ag-ink-soft)',
            cursor: disabled || loading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {loading ? (
            <span
              style={{
                fontFamily: 'var(--ag-font-display)',
                fontStyle: 'italic',
              }}
            >
              Conectando…
            </span>
          ) : (
            <>
              <Plus size={14} strokeWidth={1.5} aria-hidden />
              Conectar otra cuenta de {providerName}
            </>
          )}
        </button>
      </div>
    </article>
  );
}
