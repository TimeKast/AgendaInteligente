/**
 * Edge-runtime middleware for route gating.
 *
 * Uses the Edge-safe `authConfig` (no DB imports) so the bundle can run
 * on Vercel's Edge runtime. The actual gating policy (public vs
 * protected routes, role-based ACL) lives in `authConfig.callbacks
 * .authorized` in `lib/auth/auth.config.ts`.
 *
 * Note: the MAINTENANCE_MODE kill switch does NOT live here. Vercel's
 * Edge Middleware bundle inlines `process.env.X` at build time and
 * doesn't reliably see runtime env changes, so the maintenance gate
 * moved to the root `layout.tsx` (Serverless runtime), which reads the
 * env correctly and intercepts every page render before it commits.
 * Cron fanouts + `enqueueAndSend` gate on the same helper server-side.
 *
 * The matcher below excludes static assets, image optimization, and
 * NextAuth's own routes — avoiding wasted middleware invocations on
 * /_next/*, /favicon.ico, etc.
 *
 * Linked: ISSUE-003.
 */

// Next.js 16 static analysis can't trace a destructured re-export — keep
// the `middleware` export as a named const assignment so the compiler
// sees the function directly.
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';

const { auth } = NextAuth(authConfig);
export const middleware = auth;

export const config = {
  // Match everything EXCEPT:
  //   - /api/auth/* (NextAuth's own handlers — they manage their own auth)
  //   - /api/inngest (Inngest sync + invoke uses HMAC-signed payloads
  //     in the body; NextAuth's cookie-based auth would 401 it and
  //     functions never register)
  //   - /api/push/subscribe (browser push registration — runs auth
  //     inline via the route handler)
  //   - /_next/static, /_next/image (build assets)
  //   - /favicon.ico, /sw.js, /manifest.* (PWA chrome)
  //   - Common image extensions (perf — skip middleware on direct asset hits)
  matcher: [
    '/((?!api/auth|api/inngest|_next/static|_next/image|favicon.ico|sw.js|manifest|icons|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)',
  ],
};
