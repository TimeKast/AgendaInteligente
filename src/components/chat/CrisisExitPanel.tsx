'use client';

/**
 * CrisisExitPanel — SAFETY-CRITICAL takeover panel (ISSUE-056b).
 *
 * Replaces the chat surface when AI-8 fires. Renders the crisis line
 * resolved by the server (so it always matches the user's TZ-inferred
 * country) plus a local emergency number. No moralizing copy, no
 * coachy framing — the panel exists to redirect to a live line.
 *
 * Sibling under /components/chat/ instead of editing the prototype
 * panel in /components/agenda/ so the standalone demo route keeps
 * working with its hardcoded MX defaults.
 *
 * Linked: AI-8, R-O-003, ISSUE-056, ISSUE-056b.
 */

import { Phone, AlertCircle } from 'lucide-react';

export interface CrisisLine {
  name: string;
  phone_display: string;
  phone_tel: string;
  hours: string;
  language: string;
}

export interface CrisisExitPanelProps {
  line: CrisisLine;
  /**
   * Local emergency number for the user's region. Defaults to 911
   * (MX/US/CA). Resolve from `countryFromTimezone` upstream if you
   * need 112 (ES, EU) or another local equivalent.
   */
  emergencyNumber?: string;
  /** Called when the user taps "Volver al chat". */
  onReturn?: () => void;
}

export function CrisisExitPanel({ line, emergencyNumber = '911', onReturn }: CrisisExitPanelProps) {
  return (
    <main
      style={{
        minHeight: '100dvh',
        backgroundColor: 'var(--ag-bg)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'var(--ag-space-6) var(--ag-space-4)',
        gap: 'var(--ag-space-6)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--ag-space-3)',
          textAlign: 'center',
          maxWidth: 420,
        }}
      >
        <AlertCircle size={28} strokeWidth={1.5} color="var(--ag-ink-soft)" aria-hidden />
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontSize: 26,
            fontWeight: 500,
            lineHeight: 1.3,
            color: 'var(--ag-ink-primary)',
          }}
        >
          No soy la herramienta para esto ahora.
        </h1>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-display)',
            fontStyle: 'italic',
            fontSize: 15,
            color: 'var(--ag-ink-soft)',
            lineHeight: 1.5,
          }}
        >
          Por favor contacta una línea de crisis.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-3)',
          width: '100%',
          maxWidth: 420,
        }}
      >
        <CrisisCard
          href={`tel:${line.phone_tel}`}
          phone={line.phone_display}
          caption={`${line.name} · ${line.hours}`}
          primary
        />
        <CrisisCard href={`tel:${emergencyNumber}`} phone={emergencyNumber} caption="Emergencias" />
      </div>

      <button
        type="button"
        onClick={onReturn}
        style={{
          appearance: 'none',
          background: 'transparent',
          border: 'none',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 14,
          color: 'var(--ag-ink-hint)',
          padding: '8px 16px',
          cursor: 'pointer',
        }}
      >
        ← Volver al chat
      </button>
    </main>
  );
}

function CrisisCard({
  href,
  phone,
  caption,
  primary = false,
}: {
  href: string;
  phone: string;
  caption: string;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        alignItems: 'center',
        gap: 'var(--ag-space-3)',
        padding: primary ? 'var(--ag-space-5)' : 'var(--ag-space-4)',
        backgroundColor: primary ? 'var(--ag-ink-primary)' : 'var(--ag-bg-elevated)',
        color: primary ? 'var(--ag-accent-on)' : 'var(--ag-ink-primary)',
        border: primary ? 'none' : '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-card)',
        textDecoration: 'none',
      }}
    >
      <Phone
        size={primary ? 28 : 22}
        strokeWidth={1.5}
        aria-hidden
        color={primary ? 'var(--ag-accent-on)' : 'var(--ag-ink-soft)'}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily: 'var(--ag-font-display)',
            fontSize: primary ? 26 : 20,
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
        >
          {phone}
        </span>
        <span
          style={{
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: primary
              ? 'color-mix(in oklab, var(--ag-accent-on), transparent 25%)'
              : 'var(--ag-ink-hint)',
          }}
        >
          {caption}
        </span>
      </div>
    </a>
  );
}
