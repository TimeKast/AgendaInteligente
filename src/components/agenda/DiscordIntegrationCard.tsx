'use client';

/**
 * DiscordIntegrationCard — single-account Discord integration with multi-server
 * picker.
 *
 * States:
 *   - disconnected → "Conectar Discord" button.
 *   - loading      → spinner caption (1.5s mock).
 *   - connected    → handle line ("@fedelevi#1234") + server picker dropdown
 *                    + disconnect button.
 *
 * Pure visual prototype — local useState, no real OAuth.
 */

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

type State = 'disconnected' | 'loading' | 'connected';

const SERVERS = ['TimeKast', 'Personal', 'AgendaInteligente Beta'];

export function DiscordIntegrationCard() {
  const [state, setState] = useState<State>('disconnected');
  const [server, setServer] = useState<string>(SERVERS[0] ?? '');

  function handleConnect() {
    setState('loading');
    window.setTimeout(() => {
      setState('connected');
      toast.success('Discord conectado.');
    }, 1500);
  }

  function handleDisconnect() {
    setState('disconnected');
    toast('Discord desconectado.');
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
          <MessageSquare size={20} strokeWidth={1.5} />
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
            Discord
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
            Recibí check-ins y capturá tareas desde Discord.
          </p>
        </div>
      </header>

      <p
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-body)',
          fontSize: 12,
          color: 'var(--ag-ink-hint)',
        }}
      >
        Una sola cuenta por usuario — Discord ata el integration al usuario, no
        al servidor.
      </p>

      {state === 'connected' ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ag-space-3)',
            borderTop: '1px solid var(--ag-rule)',
            paddingTop: 'var(--ag-space-3)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              color: 'var(--ag-success)',
            }}
          >
            ● Conectado · @fedelevik#1234
          </span>

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
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
              Server activo
            </span>
            <select
              value={server}
              onChange={(e) => {
                setServer(e.target.value);
                toast(`Server activo: ${e.target.value}`);
              }}
              style={{
                appearance: 'none',
                backgroundColor: 'var(--ag-bg)',
                border: '1px solid var(--ag-rule)',
                borderRadius: 'var(--ag-radius-base)',
                padding: '10px 12px',
                fontFamily: 'var(--ag-font-body)',
                fontSize: 14,
                color: 'var(--ag-ink-primary)',
                cursor: 'pointer',
              }}
            >
              {SERVERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: 'flex', gap: 'var(--ag-space-2)' }}>
            <button
              type="button"
              onClick={handleDisconnect}
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
              Desconectar
            </button>
          </div>
        </div>
      ) : null}

      {state === 'disconnected' ? (
        <button
          type="button"
          onClick={handleConnect}
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
            alignSelf: 'flex-start',
          }}
        >
          Conectar Discord
        </button>
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
    </article>
  );
}
