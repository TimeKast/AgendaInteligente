'use client';

/**
 * PushStepBody — onboarding step 3/8 interactive body.
 *
 * Lives inside OnboardingLayout's form, so the parent "Continuar"
 * submits the hidden `pushEnabled` input — `setPushPref` persists.
 *
 * Wraps the existing `usePushSubscription` hook which handles VAPID
 * key + Service Worker subscription + server registration via
 * /api/push/subscribe. If VAPID is unconfigured (dev / preview
 * without keys), the subscribe call throws — we degrade to "no soportado"
 * so the user can still complete onboarding.
 */

import { Bell, Check, X } from 'lucide-react';
import { usePushSubscription } from '@/lib/hooks/usePushSubscription';

export function PushStepBody() {
  const push = usePushSubscription();

  // Derive from the hook's error directly — no extra state needed.
  const denied = push.error?.message === 'NotificationDenied';
  const vapidMissing = push.error?.message?.includes('VAPID') ?? false;

  async function handleEnable() {
    try {
      await push.subscribe();
    } catch {
      // Error surfaces via push.error; the derived flags above react.
    }
  }

  const enabled = push.isSubscribed && push.permission === 'granted';
  const unsupported = !push.isSupported || push.permission === 'unsupported';

  return (
    <div
      style={{
        padding: 'var(--ag-space-4)',
        borderRadius: 'var(--ag-radius-card)',
        backgroundColor: 'var(--ag-bg-elevated)',
        boxShadow: 'inset 0 0 0 1px var(--ag-rule)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-3)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-body)',
          fontSize: 14,
          lineHeight: 1.55,
          color: 'var(--ag-ink-soft)',
        }}
      >
        Sin push solo abres la app cuando te acuerdas. La mayoría se olvida.
      </p>

      <input type="hidden" name="pushEnabled" value={enabled ? 'true' : 'false'} />

      <button
        type="button"
        onClick={handleEnable}
        disabled={push.isLoading || unsupported || enabled}
        style={{
          appearance: 'none',
          border: '1px solid var(--ag-ink-primary)',
          background: enabled ? 'var(--ag-ink-primary)' : 'transparent',
          color: enabled ? 'var(--ag-accent-on)' : 'var(--ag-ink-primary)',
          padding: '10px 16px',
          borderRadius: 'var(--ag-radius-base)',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 14,
          cursor: push.isLoading ? 'wait' : unsupported || enabled ? 'default' : 'pointer',
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          opacity: unsupported ? 0.6 : 1,
        }}
      >
        {enabled ? <Check size={16} strokeWidth={2} /> : <Bell size={16} strokeWidth={1.5} />}
        <span>
          {push.isLoading
            ? 'Pidiendo permiso…'
            : enabled
              ? 'Notificaciones activas'
              : unsupported
                ? 'No soportado en este navegador'
                : 'Habilitar notificaciones'}
        </span>
      </button>

      {denied && (
        <p
          role="status"
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <X size={14} aria-hidden />
          Permiso denegado. Puedes seguir sin push o habilitarlo después en ajustes del navegador.
        </p>
      )}
      {vapidMissing && (
        <p
          role="status"
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
          }}
        >
          Push aún no está configurado en este entorno. Sigue sin notificaciones.
        </p>
      )}
    </div>
  );
}
