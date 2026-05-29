/**
 * SCR-035 — Settings / Cuenta (server-loaded).
 *
 * Reads the user's profile + their OAuth accounts to know which
 * providers are linked. Read-only view for v1.
 */

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { loadAccountSettings } from '@/lib/db/queries/settings';
import { AgendaHeader } from '@/components/agenda/AgendaHeader';
import { ProfileHeader } from '@/components/agenda/ProfileHeader';
import { SettingsSection } from '@/components/agenda/SettingsSection';
import { userInitial } from '@/lib/domain/day-calc';

const SPANISH_MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function memberSinceLabel(createdAt: Date | null): string {
  if (!createdAt) return '';
  return `${createdAt.getDate()} de ${SPANISH_MONTHS[createdAt.getMonth()]}, ${createdAt.getFullYear()}`;
}

const PROVIDER_LABEL: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  credentials: 'Email + contraseña',
  email: 'Magic link',
};

export default async function AccountSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/settings/account');
  }
  const data = await loadAccountSettings(session.user.id);

  const providers = (data?.providers ?? []).map((p) => PROVIDER_LABEL[p] ?? p);
  if (data?.hasPassword && !providers.includes('Email + contraseña')) {
    providers.push('Email + contraseña');
  }
  const providerLabel = providers.length > 0 ? providers.join(' + ') : 'Email + contraseña';

  return (
    <>
      <AgendaHeader dateLabel="Cuenta" backHref="/settings" />

      <main className="ag-settings-content" style={mainStyle}>
        <ProfileHeader
          initials={userInitial(data?.name ?? data?.email)}
          name={data?.name ?? '—'}
          email={data?.email ?? ''}
          provider={providerLabel}
          memberSince={memberSinceLabel(data?.createdAt ?? null)}
        />

        <SettingsSection label="Cambiar email">
          <ExplanationRow>
            {providers.includes('Google')
              ? 'Tu email viene de Google. Cámbialo desde tu cuenta de Google.'
              : 'Edición de email vendrá en una próxima versión.'}
          </ExplanationRow>
        </SettingsSection>

        <SettingsSection label="Cambiar contraseña">
          <ExplanationRow>
            {data?.hasPassword
              ? 'Edición de contraseña vendrá en una próxima versión.'
              : providers.includes('Google')
                ? 'Inicias con Google. Para usar contraseña, agrega email/password desde signup.'
                : 'No tienes contraseña configurada.'}
          </ExplanationRow>
        </SettingsSection>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingBlock: 'var(--ag-space-6)',
          }}
        >
          <Link
            href="/api/auth/signout"
            prefetch={false}
            style={{
              color: 'var(--ag-ink-hint)',
              fontFamily: 'var(--ag-font-body)',
              fontSize: 14,
              padding: '8px 16px',
              textDecoration: 'none',
            }}
          >
            Cerrar sesión
          </Link>
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
};
