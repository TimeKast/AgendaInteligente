'use client';

/**
 * DiscordWebhookForm — paste/save/clear a Discord webhook URL.
 *
 * Webhook approach over OAuth: zero Discord app setup, the user just
 * goes to Server Settings → Integrations → Webhooks → New Webhook
 * and pastes the URL. We POST check-in messages there. Tradeoff: no
 * read access (we can only send), no per-user identity — but that's
 * fine for notification-only use.
 */

import { useState, useTransition } from 'react';
import { setDiscordWebhook } from '@/lib/actions/onboarding';

interface DiscordWebhookFormProps {
  initialUrl: string | null;
}

export function DiscordWebhookForm({ initialUrl }: DiscordWebhookFormProps) {
  const [value, setValue] = useState(initialUrl ?? '');
  const [saved, setSaved] = useState(initialUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty = value.trim() !== (saved ?? '');
  const isConnected = saved !== null && saved !== '';

  function handleSave() {
    setError(null);
    const next = value.trim();
    startTransition(async () => {
      const result = await setDiscordWebhook({ webhookUrl: next || null });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(next);
    });
  }

  function handleClear() {
    setError(null);
    startTransition(async () => {
      const result = await setDiscordWebhook({ webhookUrl: null });
      if (result.error) {
        setError(result.error);
        return;
      }
      setValue('');
      setSaved('');
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
      <input
        type="url"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="https://discord.com/api/webhooks/..."
        aria-label="Discord webhook URL"
        disabled={isPending}
        style={{
          padding: '10px 12px',
          borderRadius: 'var(--ag-radius-base)',
          border: '1px solid var(--ag-rule)',
          backgroundColor: 'var(--ag-bg-elevated)',
          color: 'var(--ag-ink-primary)',
          fontFamily: 'var(--ag-font-mono)',
          fontSize: 13,
          outline: 'none',
        }}
      />
      {error && (
        <p
          role="alert"
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-body)',
            fontSize: 12,
            color: 'var(--ag-ink-hint)',
          }}
        >
          {error}
        </p>
      )}
      <div style={{ display: 'flex', gap: 'var(--ag-space-2)' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || isPending}
          style={{
            appearance: 'none',
            border: 'none',
            cursor: !dirty || isPending ? 'not-allowed' : 'pointer',
            padding: '10px 16px',
            borderRadius: 'var(--ag-radius-base)',
            backgroundColor: !dirty ? 'var(--ag-bg-sunken)' : 'var(--ag-ink-primary)',
            color: !dirty ? 'var(--ag-ink-hint)' : 'var(--ag-accent-on)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 14,
            fontWeight: 500,
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? 'Guardando…' : isConnected && !dirty ? 'Guardado' : 'Guardar webhook'}
        </button>
        {isConnected && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isPending}
            style={{
              appearance: 'none',
              border: '1px solid var(--ag-rule)',
              background: 'transparent',
              cursor: 'pointer',
              padding: '10px 16px',
              borderRadius: 'var(--ag-radius-base)',
              color: 'var(--ag-ink-soft)',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
            }}
          >
            Desconectar
          </button>
        )}
      </div>
    </div>
  );
}
