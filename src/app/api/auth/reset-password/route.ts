/**
 * Reset Password API Route
 *
 * POST /api/auth/reset-password
 *
 * Validates token and updates password.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resetPassword, validateResetToken } from '@/lib/auth/password-reset';
import { checkRateLimit, getClientIP, rateLimitExceededResponse } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

const bodySchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// ─────────────────────────────────────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET - Validate token (for UI to check before showing form)
 */
export async function GET(req: Request) {
  try {
    // Rate limit check (10 req/min per IP)
    const ip = getClientIP(req);
    const rateLimitResult = await checkRateLimit(ip, 'resetPassword');

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token is required' }, { status: 400 });
    }

    const result = await validateResetToken(token);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('[/api/auth/reset-password] GET Error', { error });
    return NextResponse.json({ valid: false, error: 'Validation failed' }, { status: 500 });
  }
}

/**
 * POST - Reset password
 */
export async function POST(req: Request) {
  try {
    // Rate limit check (10 req/min per IP)
    const ip = getClientIP(req);
    const rateLimitResult = await checkRateLimit(ip, 'resetPassword');

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    // Parse body
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // Reset password
    const result = await resetPassword(token, password);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in.',
    });
  } catch (error) {
    logger.error('[/api/auth/reset-password] POST Error', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
