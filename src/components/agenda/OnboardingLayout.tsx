/**
 * OnboardingLayout — shared chrome for /onboarding/* steps.
 *
 * Differs from the regular agenda shell:
 *   - No header, no bottom nav, no FAB (AgendaShell already hides them).
 *   - Top: 8-dot progress indicator + optional "Saltar" link top-right.
 *   - Body: single column max-w-480px.
 *   - Footer: primary "Continuar →" CTA full width.
 *
 * Used by every page under /onboarding/<step>.
 */

import Link from 'next/link';
import type { ReactNode } from 'react';
import { OnboardingProgress } from './OnboardingProgress';

interface OnboardingLayoutProps {
  /** 1-indexed step number (1..8). */
  step: number;
  /** Section title shown serif at the top of the body. */
  title: string;
  /** Optional sub-line shown below the title (italic serif). */
  subtitle?: string;
  /** Where the primary CTA navigates to (next step / done). */
  continueHref: string;
  /** CTA label override (default "Continuar →"). */
  continueLabel?: string;
  /** Show "Saltar" top-right? Hidden on step 1 per spec. */
  showSkip?: boolean;
  /** Where "Saltar" links to. Defaults to the same continueHref. */
  skipHref?: string;
  /** Body content. */
  children: ReactNode;
}

export function OnboardingLayout({
  step,
  title,
  subtitle,
  continueHref,
  continueLabel = 'Continuar →',
  showSkip = true,
  skipHref,
  children,
}: OnboardingLayoutProps) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar: progress + skip */}
      <header
        style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr 60px',
          alignItems: 'center',
          paddingInline: 'var(--ag-space-4)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + var(--ag-space-2))',
        }}
      >
        <div />
        <OnboardingProgress current={step} />
        <div style={{ textAlign: 'right' }}>
          {showSkip ? (
            <Link
              href={skipHref ?? continueHref}
              style={{
                fontFamily: 'var(--ag-font-body)',
                fontSize: 13,
                color: 'var(--ag-ink-hint)',
                textDecoration: 'none',
                padding: 'var(--ag-space-1) var(--ag-space-2)',
              }}
            >
              Saltar
            </Link>
          ) : null}
        </div>
      </header>

      <main
        style={{
          flex: 1,
          maxWidth: 480,
          width: '100%',
          marginInline: 'auto',
          paddingInline: 'var(--ag-space-4)',
          paddingTop: 'var(--ag-space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ag-space-5)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ag-space-2)' }}>
          <span
            style={{
              fontFamily: 'var(--ag-font-mono)',
              fontSize: 12,
              color: 'var(--ag-ink-hint)',
              letterSpacing: '0.04em',
            }}
          >
            Paso {step} de 8
          </span>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--ag-font-display)',
              fontSize: 26,
              fontWeight: 500,
              lineHeight: 1.25,
              color: 'var(--ag-ink-primary)',
            }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--ag-font-display)',
                fontStyle: 'italic',
                fontSize: 16,
                lineHeight: 1.55,
                color: 'var(--ag-ink-soft)',
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        <div style={{ flex: 1 }}>{children}</div>
      </main>

      {/* Footer CTA */}
      <footer
        style={{
          paddingInline: 'var(--ag-space-4)',
          paddingTop: 'var(--ag-space-3)',
          paddingBottom: 'calc(var(--ag-space-5) + env(safe-area-inset-bottom, 0px))',
          backgroundColor: 'var(--ag-bg)',
          maxWidth: 480,
          width: '100%',
          marginInline: 'auto',
        }}
      >
        <Link
          href={continueHref}
          style={{
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
            textDecoration: 'none',
          }}
        >
          {continueLabel}
        </Link>
      </footer>
    </div>
  );
}
