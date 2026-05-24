'use client';

/**
 * SCR-032 — Settings / Idioma & zona horaria
 *
 * Visual-only. Two radio cards for language + a native select for timezone.
 * Auto-save: any change triggers a "Guardado." toast — no save button.
 */

import { useState, type CSSProperties } from 'react';
import { toast } from 'sonner';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { SettingsSection } from '@/components/agenda/SettingsSection';

type Lang = 'es' | 'en';

const TIMEZONES = [
  'America/Mexico_City',
  'America/Bogota',
  'America/Buenos_Aires',
  'America/Santiago',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Madrid',
  'Europe/London',
];

export default function LanguageSettingsPage() {
  const [lang, setLang] = useState<Lang>('es');
  const [tz, setTz] = useState('America/Mexico_City');

  function pickLang(next: Lang) {
    if (next === lang) return;
    setLang(next);
    toast('Guardado.');
  }

  function pickTz(next: string) {
    if (next === tz) return;
    setTz(next);
    toast('Guardado.');
  }

  return (
    <>
      <AgendaHeader dateLabel="Idioma & zona horaria" backHref="/settings" />

      <main className="ag-settings-content" style={mainStyle}>
        <SettingsSection label="Idioma">
          <RadioCard
            label="Español"
            description="LatAm neutro."
            checked={lang === 'es'}
            onSelect={() => pickLang('es')}
          />
          <RadioCard
            label="English"
            description="US English."
            checked={lang === 'en'}
            onSelect={() => pickLang('en')}
          />
        </SettingsSection>

        <SettingsSection label="Zona horaria">
          <div
            style={{
              padding: 'var(--ag-space-3) var(--ag-space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ag-space-2)',
            }}
          >
            <select
              value={tz}
              onChange={(e) => pickTz(e.target.value)}
              style={{
                appearance: 'none',
                backgroundColor: 'var(--ag-bg)',
                border: '1px solid var(--ag-rule)',
                borderRadius: 'var(--ag-radius-base)',
                padding: '10px 12px',
                fontFamily: 'var(--ag-font-body)',
                fontSize: 15,
                color: 'var(--ag-ink-primary)',
                outline: 'none',
              }}
            >
              {TIMEZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>
        </SettingsSection>

        <p
          style={{
            margin: 0,
            paddingInline: 'var(--ag-space-4)',
            paddingTop: 'var(--ag-space-3)',
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
          }}
        >
          Detectamos automáticamente al iniciar sesión.
        </p>
      </main>
    </>
  );
}

function RadioCard({
  label,
  description,
  checked,
  onSelect,
}: {
  label: string;
  description: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      style={{
        appearance: 'none',
        background: 'transparent',
        border: 'none',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        alignItems: 'center',
        gap: 'var(--ag-space-3)',
        padding: 'var(--ag-space-3) var(--ag-space-4)',
        borderBottom: '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
        minHeight: 56,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 18,
          height: 18,
          borderRadius: 'var(--ag-radius-pill)',
          boxShadow: 'inset 0 0 0 1px var(--ag-rule)',
          backgroundColor: checked ? 'var(--ag-ink-primary)' : 'transparent',
          position: 'relative',
        }}
      >
        {checked ? (
          <span
            style={{
              position: 'absolute',
              inset: 4,
              borderRadius: 'var(--ag-radius-pill)',
              backgroundColor: 'var(--ag-accent-on)',
            }}
          />
        ) : null}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 15,
            color: 'var(--ag-ink-primary)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
          }}
        >
          {description}
        </span>
      </span>
    </button>
  );
}

const mainStyle: CSSProperties = {
  paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
};
