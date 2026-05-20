/**
 * SCR-035 — Settings / Cuenta
 *
 * Read-only profile + provider info. For our demo the user signs in with
 * Google OAuth, so the "Cambiar email" and "Cambiar contraseña" forms are
 * NOT shown — replaced by italic-serif explanations.
 *
 * The "Cerrar sesión" footer button is a ghost — no real signOut wired.
 */

import type { CSSProperties } from 'react';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { ProfileHeader } from '@/components/agenda/ProfileHeader';
import { SettingsSection } from '@/components/agenda/SettingsSection';

export default function AccountSettingsPage() {
  return (
    <>
      <AgendaHeader dateLabel="Cuenta" backHref="/settings" />

      <main style={mainStyle}>
        <ProfileHeader
          initials="F"
          name="Federico Levi"
          email="fedelevi@hotmail.com"
          provider="Google"
          memberSince="19 de mayo, 2026"
        />

        <SettingsSection label="Cambiar email">
          <ExplanationRow>
            Tu email viene de Google. Cambialo desde tu cuenta de Google.
          </ExplanationRow>
        </SettingsSection>

        <SettingsSection label="Cambiar contraseña">
          <ExplanationRow>
            Iniciás con Google. Para usar contraseña, vinculá email/password desde signup.
          </ExplanationRow>
        </SettingsSection>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingBlock: 'var(--ag-space-6)',
          }}
        >
          <button
            type="button"
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--ag-ink-hint)',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              cursor: 'pointer',
              padding: '8px 16px',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </main>
    </>
  );
}

function ExplanationRow({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        padding: 'var(--ag-space-3) var(--ag-space-4)',
        fontFamily: 'var(--ag-font-display)',
        fontStyle: 'italic',
        fontSize: 14,
        color: 'var(--ag-ink-soft)',
        lineHeight: 1.5,
      }}
    >
      {children}
    </p>
  );
}

const mainStyle: CSSProperties = {
  paddingBottom: 'calc(64px + var(--ag-space-6) + env(safe-area-inset-bottom, 0px))',
  maxWidth: 480,
  marginInline: 'auto',
};
