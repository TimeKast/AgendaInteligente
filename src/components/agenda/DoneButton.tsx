'use client';

/**
 * DoneButton — finalize onboarding + refresh JWT + navigate to /today.
 *
 * Why this can't be a server-action form submit:
 *   - `finalizeOnboarding` writes `users.onboarding_completed_at` in
 *     the DB.
 *   - The middleware (auth.config §authorized) reads the JWT, not the
 *     DB. The JWT was issued at signin with `onboardingCompletedAt:
 *     null` and stays that way until something triggers a refresh.
 *   - Server `redirect('/today')` after finalize → middleware sees
 *     stale JWT → bounces back to /onboarding/language.
 *
 * Fix: call `useSession().update()` which fires the `trigger='update'`
 * branch of the jwt callback (auth.ts), which re-reads
 * `onboardingCompletedAt` from the DB into the token. Then navigate.
 *
 * Linked: ISSUE-006 (onboarding-aware gating).
 */

import { useTransition, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { finalizeOnboarding } from '@/lib/actions/onboarding';

export function DoneButton() {
  const { update } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await finalizeOnboarding({});
      if (result.error) {
        setError(result.error);
        return;
      }
      // Force the JWT to re-read onboardingCompletedAt from the DB.
      // Without this, middleware bounces /today → /onboarding/language.
      await update();
      router.push('/today');
      router.refresh();
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
      {error && (
        <p
          role="alert"
          style={{
            margin: 0,
            fontFamily: 'var(--ag-font-body)',
            fontSize: 13,
            color: 'var(--ag-ink-hint)',
            textAlign: 'center',
          }}
        >
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        style={{
          appearance: 'none',
          border: 'none',
          cursor: isPending ? 'wait' : 'pointer',
          display: 'inline-flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          backgroundColor: 'var(--ag-accent-primary)',
          color: 'var(--ag-accent-on)',
          padding: '14px 20px',
          borderRadius: 'var(--ag-radius-base)',
          fontFamily: 'var(--ag-font-body)',
          fontSize: 15,
          fontWeight: 500,
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? 'Activando…' : 'Empezar →'}
      </button>
    </div>
  );
}
