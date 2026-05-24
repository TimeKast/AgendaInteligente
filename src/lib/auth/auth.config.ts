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
      session?: { role?: string };
    }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || getDefaultRole();
        token.picture = user.image;
      }
      if (trigger === 'update' && session) {
        token.role = session.role;
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
      }
      return session;
    },

    authorized({
      auth,
      request: { nextUrl },
    }: {
      auth: { user?: User } | null;
      request: { nextUrl: URL };
    }) {
      const isLoggedIn = !!auth?.user;

      // Public routes that don't require authentication
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
        // AgendaInteligente prototype — visual-only, no backend.
        '/today',
        '/week',
        '/goals',
        '/chat',
        '/settings',
        '/activity',
        '/onboarding',
        '/categories',
        '/projects',
        '/stats',
        '/tasks',
      ];

      const isPublicRoute =
        nextUrl.pathname === '/' || // Landing page
        publicPaths.some((p) => nextUrl.pathname.startsWith(p));

      // Allow public routes and static assets
      if (isPublicRoute) return true;

      // Everything else requires authentication
      if (!isLoggedIn) return false;

      // Route-level ACL: check if user's role can access this route
      const role = auth?.user?.role;
      if (role && !isRouteAllowed(nextUrl.pathname, role)) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
  },

  // Providers defined in auth.ts (Node runtime)
  providers: [],
} satisfies NextAuthConfig;
