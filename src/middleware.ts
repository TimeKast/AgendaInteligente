/**
 * Edge-runtime middleware for route gating.
 *
 * Uses the Edge-safe `authConfig` (no DB imports) so the bundle can run on
 * Vercel's Edge runtime. The actual gating policy (public vs protected
 * routes, role-based ACL) lives in `authConfig.callbacks.authorized` in
 * `lib/auth/auth.config.ts` — that callback is invoked automatically per
 * request by NextAuth's middleware export.
 *
 * Why a separate middleware file when `authorized` already covers gating:
 *   - Explicit `src/middleware.ts` is the discoverable place new contributors
 *     look for "is this route protected?".
 *   - The matcher below excludes static assets, image optimization, and
 *     NextAuth's own routes — avoiding wasted middleware invocations on
 *     /_next/*, /favicon.ico, etc.
 *
 * Linked: ISSUE-003.
 */

import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';

// Next.js 16 static analysis can't trace a destructured re-export — keep
// the `middleware` export as a named const assignment so the compiler
// sees the function directly.
const { auth } = NextAuth(authConfig);
export const middleware = auth;

export const config = {
  // Match everything EXCEPT:
  //   - /api/auth/* (NextAuth's own handlers — they manage their own auth)
  //   - /_next/static, /_next/image (build assets)
  //   - /favicon.ico, /sw.js, /manifest.* (PWA chrome)
  //   - Common image extensions (perf — skip middleware on direct asset hits)
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|sw.js|manifest|icons|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)',
  ],
};
