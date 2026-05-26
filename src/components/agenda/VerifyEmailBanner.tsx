'use client';

/**
 * VerifyEmailBanner (CMP-031, ISSUE-004).
 *
 * Persistent banner shown on /today when the user's email is unverified.
 * Provides a single inline CTA to re-send the verification email — the
 * actual sending is wired by the parent action on `/api/auth/resend-verify`
 * (issue follow-up). For v1 the banner is informational; we'll wire the
 * resend POST when the corresponding endpoint lands.
 *
 * Visibility rule: render ONLY if the session reports `emailVerified`
 * is null. The parent /today page reads the session and decides.
 *
 * Style: low-key (warm-book palette), dismissable is intentionally
 * disabled — the banner stays until verification completes.
 */

interface VerifyEmailBannerProps {
  /** The user's email, shown italic to confirm "we sent it where". */
  email: string;
}

export function VerifyEmailBanner({ email }: VerifyEmailBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        marginInline: 'var(--ag-space-4)',
        marginTop: 'var(--ag-space-3)',
        padding: 'var(--ag-space-3) var(--ag-space-4)',
        backgroundColor: 'var(--ag-bg-elevated)',
        border: '1px solid var(--ag-rule)',
        borderRadius: 'var(--ag-radius-base)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--ag-space-1)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-body)',
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--ag-ink-primary)',
        }}
      >
        Verifica tu email
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--ag-font-display)',
          fontStyle: 'italic',
          fontSize: 14,
          color: 'var(--ag-ink-soft)',
        }}
      >
        Te mandamos un link a <strong>{email}</strong>. Haz clic ahí para confirmar.
      </p>
    </div>
  );
}
