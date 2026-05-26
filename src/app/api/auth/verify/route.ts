/**
 * Email Verification Endpoint (ISSUE-004)
 *
 * GET /api/auth/verify?token=<base64url>
 *
 * Public endpoint (clicked from the email link). Resolves the token, sets
 * `users.email_verified = now()`, and redirects:
 *
 *   - ok        → /today?verified=1     (sessioned user sees the banner clear)
 *   - invalid   → /login?error=VerifyInvalid
 *
 * The endpoint NEVER differentiates "token expired" from "token never
 * existed" in the response — both collapse to the same redirect. The
 * verifier helper logs the distinction internally for ops.
 *
 * No CSRF concern (read-only GET that consumes a server-side token + idempotent
 * net effect: setting email_verified once is the same as setting it twice).
 *
 * @see KIT-022 (register), ISSUE-004
 */

import { NextResponse } from 'next/server';
import { verifyEmailToken } from '@/lib/auth/email-verification';
import { isDatabaseConfigured, getAppUrl } from '@/lib/env';
import { logger } from '@/lib/logger';

export async function GET(req: Request) {
  if (!isDatabaseConfigured()) {
    logger.error('[/api/auth/verify] DATABASE_URL not configured');
    return NextResponse.redirect(`${getAppUrl()}/login?error=VerifyUnavailable`);
  }

  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(`${getAppUrl()}/login?error=VerifyInvalid`);
  }

  const result = await verifyEmailToken(token);
  if (!result.ok) {
    return NextResponse.redirect(`${getAppUrl()}/login?error=VerifyInvalid`);
  }

  // On success, redirect into the app — middleware will route to onboarding
  // if the user hasn't finished it yet, or to /today otherwise.
  return NextResponse.redirect(`${getAppUrl()}/today?verified=1`);
}

// Disable any caching — token consumption is one-shot.
export const dynamic = 'force-dynamic';
