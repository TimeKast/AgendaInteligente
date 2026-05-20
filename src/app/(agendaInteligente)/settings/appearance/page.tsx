'use client';

/**
 * SCR-034 — Settings / Apariencia
 *
 * Real dark mode toggle: persists preference in localStorage via
 * AppearanceController helpers; on change, mutates `data-mode` on the
 * `[data-theme="agenda"]` root so the dark CSS vars activate.
 *
 * "Sistema" follows `prefers-color-scheme` live.
 */

import { useEffect, useState, type CSSProperties } from 'react';
import { toast } from 'sonner';
import { Sun, Moon, Monitor } from 'lucide-react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { SettingsSection } from '@/components/agenda/SettingsSection';
import {
  readAppearance,
  writeAppearance,
  type AppearanceMode,
} from '@/components/agenda/AppearanceController';

type Option = {
  id: AppearanceMode;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const OPTIONS: Option[] = [
  {
    id: 'light',
    label: 'Claro',
    description: 'Cuaderno warm. Diseñado primero acá.',
    icon: <Sun size={18} strokeWidth={1.5} />,
  },
  {
    id: 'dark',
    label: 'Oscuro',
    description: 'Modo nocturno. La paleta warm pierde un poco de carácter.',
    icon: <Moon size={18} strokeWidth={1.5} />,
  },
  {
    id: 'system',
    label: 'Sistema',
    description: 'Auto según OS.',
    icon: <Monitor size={18} strokeWidth={1.5} />,
  },
];

export default function AppearanceSettingsPage() {
  // Hydration-safe: default to 'light' on SSR, then sync on mount.
  const [mode, setMode] = useState<AppearanceMode>('light');

  useEffect(() => {
    // Sync with persisted preference after hydration (window-only API).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(readAppearance());
  }, []);

  function pick(next: AppearanceMode) {
    if (next === mode) return;
    setMode(next);
    writeAppearance(next);
    toast('Guardado.');
  }

  return (
    <>
      <AgendaHeader dateLabel="Apariencia" backHref="/settings" />

      <main style={mainStyle}>
        <SettingsSection label="Tema">
          {OPTIONS.map((opt) => (
            <ThemeRadioCard
              key={opt.id}
              icon={opt.icon}
              label={opt.label}
              description={opt.description}
              checked={mode === opt.id}
              onSelect={() => pick(opt.id)}
            />
          ))}
        </SettingsSection>

        <p
          style={{
            margin: 0,
            paddingInline: 'var(--ag-space-4)',
            paddingTop: 'var(--ag-space-4)',
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
            lineHeight: 1.5,
          }}
        >
          El producto fue diseñado en modo claro. El oscuro funciona pero la paleta warm
          pierde un poco de carácter.
        </p>
      </main>
    </>
  );
}

function ThemeRadioCard({
  icon,
  label,
  description,
  checked,
  onSelect,
}: {
  icon: React.ReactNode;
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
        gridTemplateColumns: 'auto auto 1fr',
        alignItems: 'center',
        gap: 'var(--ag-space-3)',
        padding: 'var(--ag-space-3) var(--ag-space-4)',
        borderBottom: '1px solid color-mix(in oklab, var(--ag-rule), transparent 50%)',
        minHeight: 56,
        color: 'var(--ag-ink-primary)',
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
      <span aria-hidden style={{ color: 'var(--ag-ink-soft)', display: 'inline-flex' }}>
        {icon}
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
            lineHeight: 1.4,
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
  maxWidth: 480,
  marginInline: 'auto',
};
