/**
 * Auth helpers — thin wrappers around NextAuth `auth()` for ergonomic use in
 * Server Components, Server Actions and Route Handlers.
 *
 * Why a wrapper instead of using `auth()` directly:
 *   - `getCurrentUser()` returns just the user (or null) — no `.user?.` chains
 *     littering callsites.
 *   - `requireAuth()` throws/redirects on no-session — kills the `if (!user) redirect()`
 *     boilerplate everywhere.
 *
 * Both helpers are safe to call from any Node-runtime context (server
 * components, server actions, route handlers). Do NOT use from middleware /
 * Edge runtime — there, use `auth()` from `next-auth` directly via the
 * Edge-safe config.
 *
 * Linked: ISSUE-003, FT-001.
 */

import { redirect } from 'next/navigation';
import { auth } from './auth';

/**
 * Returns the current authenticated user, or `null` if no session exists.
 *
 * @example
 *   const user = await getCurrentUser();
 *   if (!user) return <SignedOutView />;
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Returns the current authenticated user, or redirects to `/login` if no
 * session. Use in Server Components that MUST have an authenticated user.
 *
 * @param redirectTo - Optional path to redirect to after login.
 * @example
 *   const user = await requireAuth();          // → redirects to /login
 *   const user = await requireAuth('/today');  // → redirects to /login?callbackUrl=/today
 */
export async function requireAuth(redirectTo?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const loginUrl = redirectTo ? `/login?callbackUrl=${encodeURIComponent(redirectTo)}` : '/login';
    redirect(loginUrl);
  }
  return user;
}
