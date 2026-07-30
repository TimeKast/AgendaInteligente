/**
 * Edge-runtime middleware for route gating.
 *
 * Two responsibilities, in order:
 *
 * 1. **Maintenance kill switch** — if `MAINTENANCE_MODE` is truthy (or
 *    unset — default is ON, safe-by-default), every request is
 *    rewritten to `/maintenance`. The Inngest webhook is exempted at
 *    the matcher level so background events can still drain, but the
 *    handlers themselves early-return via `isMaintenanceMode()` so
 *    nothing actually fires.
 *
 * 2. **Auth gating** — uses the Edge-safe `authConfig` (no DB imports)
 *    so the bundle can run on Vercel's Edge runtime. The actual gating
 *    policy (public vs protected routes, role-based ACL) lives in
 *    `authConfig.callbacks.authorized` in `lib/auth/auth.config.ts`.
 *
 * The matcher below excludes static assets, image optimization, and
 * NextAuth's own routes — avoiding wasted middleware invocations on
 * /_next/*, /favicon.ico, etc.
 *
 * Linked: ISSUE-003.
 */

import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth/auth.config';
import { isMaintenanceMode } from '@/lib/env';

const { auth } = NextAuth(authConfig);

// NextAuth v5 middleware pattern: `auth(handler)` returns a middleware
// with the session already resolved on `req.auth`. We short-circuit
// with the maintenance rewrite BEFORE reading the session; the auth
// callback (`authorized` in auth.config) still runs for anything that
// passes through (returning `undefined` = default gating path).
export const middleware = auth((req) => {
  const maintenance = isMaintenanceMode();
  // TEMPORARY diagnostic — expose what the middleware sees so we can
  // debug env-var injection on the Edge runtime from a curl. Remove
  // once we've confirmed the kill switch works end-to-end.
  const rawMode = process.env.MAINTENANCE_MODE;
  const rawKind =
    rawMode === undefined ? 'undefined' : rawMode === '' ? 'empty' : `str:${rawMode.length}`;

  if (maintenance && req.nextUrl.pathname !== '/maintenance') {
    const url = req.nextUrl.clone();
    url.pathname = '/maintenance';
    const res = NextResponse.rewrite(url, { status: 503 });
    res.headers.set('X-Maintenance-Debug', 'on');
    res.headers.set('X-Maintenance-Raw', rawKind);
    return res;
  }
  const res = NextResponse.next();
  res.headers.set('X-Maintenance-Debug', 'off');
  res.headers.set('X-Maintenance-Raw', rawKind);
  return res;
});

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
