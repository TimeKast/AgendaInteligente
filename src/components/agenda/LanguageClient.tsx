'use client';

/**
 * LanguageClient — language + timezone form bound to setLanguagePref.
 *
 * Common IANA timezones for LatAm + ES + UTC are pre-listed; "Otra"
 * shows a free-text input (any IANA string the user types). The
 * Zod schema validates the chars; PostgreSQL would reject truly bogus
 * names downstream.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { setLanguagePref } from '@/lib/actions/language';

const COMMON_TZ = [
  'America/Mexico_City',
  'America/Tijuana',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'America/Sao_Paulo',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Madrid',
  'Europe/London',
  'UTC',
];

interface Props {
  initialLanguage: 'es' | 'en';
  initialTimezone: string;
}

export function LanguageClient({ initialLanguage, initialTimezone }: Props) {
  const router = useRouter();
  const [language, setLanguage] = useState<'es' | 'en'>(initialLanguage);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [customTz, setCustomTz] = useState(!COMMON_TZ.includes(initialTimezone));
  const [isPending, startTransition] = useTransition();

  const dirty = language !== initialLanguage || timezone !== initialTimezone;

  function handleSave() {
    startTransition(async () => {
      const result = await setLanguagePref({ language, timezone: timezone.trim() });
      if (result.error) {
        toast.error(`No se pudo guardar: ${result.error}`);
        return;
      }
      toast.success('Idioma y zona guardados.');
      router.refresh();
    });
  }

  return (
    <main
      style={{
        paddingInline: 'var(--ag-space-4)',
        paddingTop: 'var(--ag-space-4)',
        paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-4)',
      }}
    >
      <Label text="Idioma">
        <div style={{ display: 'flex', gap: 8 }}>
          {(['es', 'en'] as const).map((l) => {
            const active = language === l;
            return (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                disabled={isPending}
                style={{
                  flex: 1,
                  appearance: 'none',
                  padding: '10px 16px',
                  borderRadius: 'var(--ag-radius-base)',
                  border: active ? '1.5px solid var(--ag-ink-primary)' : '1px solid var(--ag-rule)',
                  backgroundColor: active ? 'var(--ag-bg-elevated)' : 'transparent',
                  color: 'var(--ag-ink-primary)',
                  fontFamily: 'var(--ag-font-body)',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                {l === 'es' ? 'Español' : 'English'}
              </button>
            );
          })}
        </div>
      </Label>

      <Label text="Zona horaria">
        <select
          value={customTz ? '__custom__' : timezone}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '__custom__') {
              setCustomTz(true);
            } else {
              setCustomTz(false);
              setTimezone(v);
            }
          }}
          disabled={isPending}
          style={inputStyle}
        >
          {COMMON_TZ.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
          <option value="__custom__">Otra…</option>
        </select>
        {customTz && (
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="ej: Africa/Lagos"
            disabled={isPending}
            style={inputStyle}
          />
        )}
      </Label>

      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          paddingBlock: 'var(--ag-space-3)',
          paddingBottom: 'calc(var(--ag-space-3) + env(safe-area-inset-bottom, 0px))',
          backgroundColor: 'var(--ag-bg)',
          borderTop: '1px solid var(--ag-rule)',
          marginInline: 'calc(var(--ag-space-4) * -1)',
          paddingInline: 'var(--ag-space-4)',
        }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || isPending}
          style={{
            appearance: 'none',
            width: '100%',
            padding: '14px 20px',
            border: 'none',
            borderRadius: 'var(--ag-radius-base)',
            backgroundColor: dirty ? 'var(--ag-accent-primary)' : 'var(--ag-bg-sunken)',
            color: dirty ? 'var(--ag-accent-on)' : 'var(--ag-ink-hint)',
            fontFamily: 'var(--ag-font-body)',
            fontSize: 15,
            fontWeight: 500,
            cursor: dirty && !isPending ? 'pointer' : 'not-allowed',
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? 'Guardando…' : dirty ? 'Guardar' : 'Sin cambios'}
        </button>
      </footer>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--ag-radius-base)',
  border: '1px solid var(--ag-rule)',
  backgroundColor: 'var(--ag-bg-elevated)',
  color: 'var(--ag-ink-primary)',
  fontFamily: 'var(--ag-font-body)',
  fontSize: 15,
  outline: 'none',
};

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ag-slate)',
        }}
      >
        {text}
      </span>
      {children}
    </label>
  );
}
