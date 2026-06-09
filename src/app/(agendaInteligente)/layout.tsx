/**
 * AgendaInteligente prototype layout — scoped to the warm-book editorial skin.
 *
 * Why a separate route group:
 *   - The TimeKast `(protected)` group bakes neumorphism via DashboardShell.
 *   - The Design Brief explicitly prohibits neumorphism + blue SaaS primary.
 *   - This group renders ONLY the warm-book chrome (header, bottom nav, FAB)
 *     and exposes its own scoped CSS vars via `[data-theme="agenda"]`.
 *
 * Source of truth: project/planning/14_DESIGN_BRIEF.md §6, 15_DESIGN.md §9
 *
 * Note: the bottom nav + FAB are mounted inside an AgendaShell client component
 * so they can be conditionally rendered per route (e.g. hidden on /chat,
 * /onboarding, /activity/* detail screens).
 */

import type { Metadata } from 'next';
import { Source_Serif_4, Inter } from 'next/font/google';
import './agenda-tokens.css';
import { auth } from '@/lib/auth/auth';
import { recordActivity } from '@/lib/notifications/activity-tracker';
import { AgendaShell } from '@/components/agenda/AgendaShell';
import { AppearanceController } from '@/components/agenda/AppearanceController';

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--ag-font-display-loaded',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--ag-font-body-loaded',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AgendaInteligente — prototype',
};

export default async function AgendaLayout({ children }: { children: React.ReactNode }) {
  // Best-effort activity tracking — feeds the nag check-in logic in the
  // 5-min fanout cron. Fires on every authenticated page render (full
  // load or refresh). Internally throttled to 1/min so a Cmd-R spam
  // doesn't hammer Postgres. We don't redirect on auth failures here;
  // pages handle their own gating.
  const session = await auth();
  if (session?.user?.id) {
    // fire-and-forget; never block rendering
    void recordActivity(session.user.id);
  }

  return (
    <div
      data-theme="agenda"
      className={`${sourceSerif.variable} ${inter.variable} ag-shell`}
      style={{
        // Inline minimum to make the scoped class take precedence even if a
        // parent (e.g. html.dark from root layout) sets a different color-scheme.
        minHeight: '100dvh',
      }}
    >
      <AppearanceController />
      <AgendaShell>{children}</AgendaShell>
    </div>
  );
}
