'use client';

/**
 * IntegrationCard — SCR-033. Card representing a third-party integration
 * (Google Calendar, WhatsApp, Outlook).
 *
 * States:
 *   - disconnected: shows "Conectar" button.
 *   - loading: shows spinner caption while a fake connect resolves.
 *   - connected: shows status line, "Sincronizar ahora" + "Desconectar".
 *   - disabled: cannot interact (used for "Próximamente v2" placeholders).
 *
 * Visual-only. No real OAuth; the "Conectar" button just flips state after
 * 1.5s so the demo feels alive.
 */

import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';

export type IntegrationState = 'disconnected' | 'loading' | 'connected' | 'disabled';

interface IntegrationCardProps {
  icon: ReactNode;
  name: string;
  description: string;
  /** Default state. Use 'disabled' for placeholder (v2) cards. */
  initialState?: IntegrationState;
  /** Caption shown when disabled (e.g. "Próximamente v2"). */
  disabledBadge?: string;
  /** When connected: short status line (e.g. "primary calendar · sync hace 8 min"). */
  connectedStatus?: string;
}

export function IntegrationCard({
  icon,
  name,
  description,
  initialState = 'disconnected',
  disabledBadge,
  connectedStatus = 'primary calendar · Última sync: hace 8 min',
}: IntegrationCardProps) {
  const [state, setState] = useState<IntegrationState>(initialState);

  const disabled = state === 'disabled';

  function handleConnect() {
    setState('loading');
    window.setTimeout(() => {
      setState('connected');
      toast.success('Conectado a Google Calendar.');
    }, 1500);
  }

  function handleSync() {
    toast('Sincronizando…', { duration: 1200 });
  }

  function handleDisconnect() {
    setState('disconnected');
    toast('Desconectado.');
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
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--ag-space-3)' }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontSize: 17,
              fontWeight: 500,
              color: 'var(--ag-ink-primary)',
            }}
          >
            {name}
          </h3>
          <StatusLine state={state} connectedStatus={connectedStatus} />
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

      <p
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-display)',
          fontStyle: 'italic',
          fontSize: 14,
          color: 'var(--ag-ink-soft)',
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>

      {!disabled ? (
        <div style={{ display: 'flex', gap: 'var(--ag-space-2)', flexWrap: 'wrap' }}>
          {state === 'disconnected' ? (
            <PrimaryButton onClick={handleConnect}>Conectar {name}</PrimaryButton>
          ) : null}
          {state === 'loading' ? (
            <span
              style={{
                fontFamily: 'var(--ag-font-display)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--ag-ink-hint)',
              }}
            >
              Conectando…
            </span>
          ) : null}
          {state === 'connected' ? (
            <>
              <PrimaryButton onClick={handleSync}>Sincronizar ahora</PrimaryButton>
              <GhostDestructive onClick={handleDisconnect}>Desconectar</GhostDestructive>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function StatusLine({
  state,
  connectedStatus,
}: {
  state: IntegrationState;
  connectedStatus: string;
}) {
  if (state === 'disabled') {
    return (
      <span
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 13,
          color: 'var(--ag-ink-hint)',
        }}
      >
        ○ No disponible
      </span>
    );
  }

  if (state === 'connected') {
    return (
      <span
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 13,
          color: 'var(--ag-success)',
        }}
      >
        ● Conectado · {connectedStatus}
      </span>
    );
  }

  return (
    <span
      style={{
        fontFamily: 'var(--ag-font-body)',
        fontSize: 13,
        color: 'var(--ag-ink-hint)',
      }}
    >
      ○ Desconectado
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        appearance: 'none',
        backgroundColor: 'var(--ag-ink-primary)',
        border: 'none',
        borderRadius: 'var(--ag-radius-base)',
        padding: '10px 16px',
        fontFamily: 'var(--ag-font-body)',
        fontSize: 14,
        fontWeight: 500,
        color: 'var(--ag-accent-on)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function GhostDestructive({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        appearance: 'none',
        background: 'transparent',
        border: '1px solid color-mix(in oklab, var(--ag-danger), transparent 60%)',
        borderRadius: 'var(--ag-radius-base)',
        padding: '10px 16px',
        fontFamily: 'var(--ag-font-body)',
        fontSize: 14,
        color: 'var(--ag-danger)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
