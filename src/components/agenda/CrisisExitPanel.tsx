'use client';

/**
 * CrisisExitPanel — SCR-058. SAFETY-CRITICAL takeover panel.
 *
 * Shown when the conversational layer detects a crisis signal (AI-8). The
 * panel does ONE thing: redirect the user to a live crisis line. It does NOT
 * moralize, coach, or attempt to handle the situation.
 *
 * Default lines are MX (SAPTEL + 911). `tel:` links are wrapped so a tap on
 * mobile dials immediately.
 *
 * Visual-only — this prototype renders it as a standalone /chat/crisis-demo
 * route so the user can preview the layout.
 */

import Link from 'next/link';
import { Phone, AlertCircle } from 'lucide-react';

export function CrisisExitPanel() {
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
          Por favor contactá una línea de crisis.
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
          href="tel:8009112000"
          phone="800 911 2000"
          caption="SAPTEL · 24h · gratuito"
          primary
        />
        <CrisisCard href="tel:911" phone="911" caption="Emergencias" />
      </div>

      <Link
        href="/chat"
        style={{
          fontFamily: 'var(--ag-font-body)',
          fontSize: 14,
          color: 'var(--ag-ink-hint)',
          textDecoration: 'none',
          padding: '8px 16px',
        }}
      >
        ← Volver al chat
      </Link>
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
