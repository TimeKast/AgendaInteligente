import type { NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { Session, User } from 'next-auth';
import type { AdapterUser } from 'next-auth/adapters';
import { getDefaultRole } from '@/config/roles';
import { isRouteAllowed } from '@/lib/auth/permissions';

/**
 * Generate unique cookie name per project
 * This prevents cookie conflicts when running multiple Next.js projects on localhost
 */
const cookieName = process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase().replace(/\s+/g, '-') || 'app';

export const authConfig = {
  // Trust host: auto-detect Vercel (VERCEL=1 always present) or manual override
  trustHost: !!process.env.VERCEL || process.env.AUTH_TRUST_HOST === 'true',

  // Use JWT for sessions (works better with credentials)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // ✅ Unique cookies per project (multi-project dev support)
  cookies: {
    sessionToken: {
      name: `authjs.session-token.${cookieName}`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `authjs.csrf-token.${cookieName}`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `authjs.callback-url.${cookieName}`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  // Custom pages
  pages: {
    signIn: '/login',
    error: '/error', // Custom error page (auth group)
  },

  // Edge-safe callbacks (no DB imports — safe for middleware)
  callbacks: {
    /**
     * JWT callback (Edge-safe) — Propagate user fields to token.
     * This runs in BOTH middleware (Edge) and server (Node) instances.
     * auth.ts extends this with DB-dependent logic (image sync).
     */
    jwt({
      token,
      user,
      trigger,
      session,
    }: {
      token: JWT;
      user?: User | AdapterUser;
      trigger?: 'signIn' | 'signUp' | 'update';
      session?: { role?: string; onboardingCompletedAt?: string | null };
    }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || getDefaultRole();
        token.picture = user.image;
      }
      if (trigger === 'update' && session) {
        if (session.role !== undefined) token.role = session.role;
        // Used by /onboarding/done to flip the bit without a full re-login.
        if (session.onboardingCompletedAt !== undefined) {
          token.onboardingCompletedAt = session.onboardingCompletedAt;
        }
      }
      return token;
    },

    /**
     * Session callback (Edge-safe) — Expose token fields to client.
     * Fully handled here — auth.ts does not need to override this.
     */
    session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.image = token.picture as string | undefined;
        // Onboarding-aware gating in middleware reads this; null means
        // "not yet onboarded".
        (session.user as { onboardingCompletedAt?: string | null }).onboardingCompletedAt =
          (token.onboardingCompletedAt as string | null | undefined) ?? null;
      }
      return session;
    },

    authorized({
      auth,
      request: { nextUrl },
    }: {
      auth: { user?: User & { onboardingCompletedAt?: string | null } } | null;
      request: { nextUrl: URL };
    }) {
      const isLoggedIn = !!auth?.user;

      // Routes that NEVER require authentication.
      const publicPaths = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/accept-invite',
        '/error',
        '/api/auth', // NextAuth API routes
        '/privacy',
        '/terms',
        '/offline',
      ];
      const isPublicRoute =
        nextUrl.pathname === '/' || // Landing page
        publicPaths.some((p) => nextUrl.pathname.startsWith(p));
      if (isPublicRoute) return true;

      // Everything past here requires a session.
      if (!isLoggedIn) return false;

      // Onboarding-aware gating (ISSUE-006):
      //   - User without onboarding_completed_at MUST stay in /onboarding/*
      //     and bounces from /today, /week, /categories, etc.
      //   - User already onboarded bounces out of /onboarding/* back to /today.
      //   - /api/* is exempt — API routes have their own auth + may be
      //     called legitimately during onboarding (e.g. the calendar
      //     OAuth dance redirects through /api/calendar/google/connect
      //     and back via /api/calendar/google/callback before the user
      //     reaches /onboarding/done).
      const isInOnboarding = nextUrl.pathname.startsWith('/onboarding');
      const isApiRoute = nextUrl.pathname.startsWith('/api/');
      const onboardingDone = !!auth?.user?.onboardingCompletedAt;

      if (!onboardingDone && !isInOnboarding && !isApiRoute) {
        return Response.redirect(new URL('/onboarding/language', nextUrl));
      }
      if (onboardingDone && isInOnboarding) {
        return Response.redirect(new URL('/today', nextUrl));
      }

      // Route-level ACL: check if user's role can access this route.
      // Fallback for AgendaInteligente is /today (kit default was the
      // generic /dashboard which isn't shipped in this project).
      const role = auth?.user?.role;
      if (role && !isRouteAllowed(nextUrl.pathname, role)) {
        return Response.redirect(new URL('/today', nextUrl));
      }

      return true;
    },
  },

  // Providers defined in auth.ts (Node runtime)
  providers: [],
} satisfies NextAuthConfig;
