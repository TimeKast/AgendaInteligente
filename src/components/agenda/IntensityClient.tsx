'use client';

/**
 * IntensityClient — radio list + setIntensityMode persistence.
 *
 * Selecting "listening" shows an inline confirmation (no modal —
 * keeps the surface simple) before the write because it changes
 * agent behavior for 48h.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { setIntensityMode } from '@/lib/actions/intensity';

type Mode = 'sharp' | 'standard' | 'gentle' | 'listening';

interface ModeDef {
  value: Mode;
  title: string;
  description: string;
  warn?: boolean;
}

const MODES: ModeDef[] = [
  { value: 'sharp', title: 'Sharp', description: 'Directo, sin rodeos. Cuestiona lenguaje vago.' },
  {
    value: 'standard',
    title: 'Standard',
    description: 'Equilibrado. Refleja antes de cuestionar.',
  },
  { value: 'gentle', title: 'Gentle', description: 'Cálido. Espera más antes de presionar.' },
  {
    value: 'listening',
    title: 'Listening',
    description: 'Solo escucha. No interpela. Se auto-revierte en 48h.',
    warn: true,
  },
];

interface Props {
  initialMode: Mode;
  expiresAt: string | null;
}

export function IntensityClient({ initialMode, expiresAt }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [pendingWarn, setPendingWarn] = useState<Mode | null>(null);
  const [isPending, startTransition] = useTransition();

  function apply(next: Mode) {
    if (next === mode) return;
    const prev = mode;
    setMode(next);
    startTransition(async () => {
      const result = await setIntensityMode({ mode: next });
      if (result.error) {
        toast.error(`No se pudo cambiar: ${result.error}`);
        setMode(prev);
        return;
      }
      toast.success(
        next === 'listening'
          ? 'Modo Listening activo. Vuelve a Gentle en 48h.'
          : 'Modo actualizado.'
      );
      router.refresh();
    });
  }

  function handleSelect(next: Mode, warn: boolean) {
    if (warn && next !== mode) {
      setPendingWarn(next);
      return;
    }
    apply(next);
  }

  return (
    <main
      style={{
        paddingInline: 'var(--ag-space-4)',
        paddingTop: 'var(--ag-space-4)',
        paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-3)',
      }}
    >
      <p
        style={{
          margin: 0,
          marginBottom: 'var(--ag-space-2)',
          fontFamily: 'var(--ag-font-display)',
          fontStyle: 'italic',
          fontSize: 16,
          lineHeight: 1.55,
          color: 'var(--ag-ink-soft)',
        }}
      >
        Cómo el agente te interpela. Puedes cambiar en cualquier momento.
        {mode === 'listening' && expiresAt && (
          <>
            <br />
            <span style={{ fontSize: 13, color: 'var(--ag-ink-hint)' }}>
              Listening expira: {new Date(expiresAt).toLocaleString('es-MX')}
            </span>
          </>
        )}
      </p>

      {MODES.map((m) => {
        const active = mode === m.value;
        return (
          <label
            key={m.value}
            style={{
              display: 'block',
              padding: 'var(--ag-space-4)',
              borderRadius: 'var(--ag-radius-card)',
              backgroundColor: 'var(--ag-bg-elevated)',
              boxShadow: active
                ? 'inset 0 0 0 1.5px var(--ag-ink-primary)'
                : 'inset 0 0 0 1px var(--ag-rule)',
              cursor: isPending ? 'wait' : 'pointer',
              opacity: isPending && !active ? 0.6 : 1,
            }}
          >
            <input
              type="radio"
              name="intensity"
              value={m.value}
              checked={active}
              onChange={() => handleSelect(m.value, !!m.warn)}
              disabled={isPending}
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ag-space-2)' }}>
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--ag-font-display)',
                  fontSize: 17,
                  fontWeight: 500,
                  color: 'var(--ag-ink-primary)',
                }}
              >
                {m.title}
              </h3>
              {m.warn && (
                <span
                  style={{
                    fontFamily: 'var(--ag-font-mono)',
                    fontSize: 10,
                    color: 'var(--ag-ink-hint)',
                    padding: '2px 6px',
                    border: '1px solid var(--ag-rule)',
                    borderRadius: 'var(--ag-radius-pill)',
                  }}
                >
                  48h
                </span>
              )}
            </div>
            <p
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--ag-font-body)',
                fontSize: 13,
                color: 'var(--ag-ink-soft)',
                lineHeight: 1.5,
              }}
            >
              {m.description}
            </p>
          </label>
        );
      })}

      {pendingWarn && (
        <div
          role="alertdialog"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'color-mix(in oklab, var(--ag-ink-primary), transparent 60%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--ag-space-4)',
            zIndex: 100,
          }}
          onClick={() => setPendingWarn(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--ag-bg)',
              padding: 'var(--ag-space-5)',
              borderRadius: 'var(--ag-radius-card)',
              maxWidth: 360,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ag-space-3)',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--ag-font-display)',
                fontSize: 18,
                color: 'var(--ag-ink-primary)',
              }}
            >
              ¿Activar Listening?
            </h2>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--ag-font-display)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--ag-ink-soft)',
              }}
            >
              El agente no te interpela durante 48h y vuelve solo a Gentle. Útil si necesitas
              espacio.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setPendingWarn(null)}
                style={{
                  appearance: 'none',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ag-ink-hint)',
                  fontFamily: 'var(--ag-font-body)',
                  fontSize: 14,
                  padding: '8px 12px',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = pendingWarn;
                  setPendingWarn(null);
                  apply(next);
                }}
                style={{
                  appearance: 'none',
                  background: 'var(--ag-ink-primary)',
                  color: 'var(--ag-accent-on)',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: 'var(--ag-radius-base)',
                  fontFamily: 'var(--ag-font-body)',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Activar Listening
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
