/**
 * Next.js Middleware
 *
 * Handles:
 * - Authentication (via NextAuth v5)
 * - Correlation ID generation for request tracing
 *
 * @see OBS-003
 */

import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // 1. Auth check handled by 'authorized' callback in auth.config.ts
  // If we reach here, the request is authorized or public.

  // 2. Correlation ID — generate or pass through
  const correlationId = req.headers.get('x-correlation-id') ?? crypto.randomUUID();

  // Propagate to downstream (server components, API routes)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-correlation-id', correlationId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Also expose on response for client-side tracing
  response.headers.set('x-correlation-id', correlationId);

  return response;
});

export const config = {
  // Check all routes except static assets
  // We keep API routes in matcher to potentially protect them if needed,
  // though typically API routes use session check inside the route.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\..*).*)'],
};
