'use client';

/**
 * MicStepBody — onboarding step 4/8 interactive body.
 *
 * Renders inside the OnboardingLayout's form, so the parent's
 * "Continuar" submit submits this body. The hidden `micEnabled`
 * input carries the current grant state — `setMicPref` persists it.
 *
 * The button calls `navigator.mediaDevices.getUserMedia({ audio: true })`
 * which triggers the browser's permission prompt. We immediately stop
 * the resulting tracks — we only wanted the prompt, not an open stream.
 */

import { useState } from 'react';
import { Check, Mic, X } from 'lucide-react';

type PermState = 'idle' | 'granted' | 'denied' | 'unsupported' | 'pending';

export function MicStepBody() {
  const [state, setState] = useState<PermState>('idle');

  async function requestMic() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setState('unsupported');
      return;
    }
    setState('pending');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release immediately — we only triggered the prompt.
      stream.getTracks().forEach((t) => t.stop());
      setState('granted');
    } catch {
      // User dismissed or denied. Browsers don't distinguish reliably.
      setState('denied');
    }
  }

  const enabled = state === 'granted';

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
        Sin micrófono solo puedes capturar escribiendo. Funciona igual.
      </p>

      {/* The form submit picks this up. Updated by the button below. */}
      <input type="hidden" name="micEnabled" value={enabled ? 'true' : 'false'} />

      <button
        type="button"
        onClick={requestMic}
        disabled={state === 'pending'}
        style={{
          appearance: 'none',
          border: '1px solid var(--ag-ink-primary)',
          background: enabled ? 'var(--ag-ink-primary)' : 'transparent',
          color: enabled ? 'var(--ag-accent-on)' : 'var(--ag-ink-primary)',
          padding: '10px 16px',
          borderRadius: 'var(--ag-radius-base)',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 14,
          cursor: state === 'pending' ? 'wait' : 'pointer',
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {enabled ? <Check size={16} strokeWidth={2} /> : <Mic size={16} strokeWidth={1.5} />}
        <span>
          {state === 'pending'
            ? 'Pidiendo permiso…'
            : enabled
              ? 'Micrófono habilitado'
              : 'Habilitar micrófono'}
        </span>
      </button>

      {state === 'denied' && (
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
          Permiso denegado. Puedes seguir sin micrófono o habilitarlo después en ajustes del
          navegador.
        </p>
      )}
      {state === 'unsupported' && (
        <p
          role="status"
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
          }}
        >
          Tu navegador no soporta captura de audio. Sigue sin micrófono.
        </p>
      )}
    </div>
  );
}
