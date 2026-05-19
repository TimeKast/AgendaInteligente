/**
 * Forgot Password API Route
 *
 * POST /api/auth/forgot-password
 *
 * Initiates password reset flow. Always returns success to prevent
 * user enumeration (attacker can't determine which emails exist).
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requestPasswordReset } from '@/lib/auth/password-reset';
import { isEmailConfigured } from '@/lib/env';
import { logger } from '@/lib/logger';
import { checkRateLimit, getClientIP, rateLimitExceededResponse } from '@/lib/rate-limit';

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

const bodySchema = z.object({
  email: z.string().email('Invalid email address'),
});

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // Parse body
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Rate limit check (5 req/min per IP)
    const ip = getClientIP(req);
    const rateLimitResult = await checkRateLimit(ip, 'forgotPassword');

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    // Check if email is configured
    if (!isEmailConfigured()) {
      // Return success anyway to not reveal config issues
      return NextResponse.json({
        success: true,
        message: 'If an account exists, you will receive a reset email.',
      });
    }

    // Request password reset (handles user lookup, token generation, email)
    await requestPasswordReset(parsed.data.email);

    // Always return success to prevent user enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists, you will receive a reset email.',
    });
  } catch (error) {
    logger.error('[/api/auth/forgot-password] Error', { error });

    // Still return success to prevent enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists, you will receive a reset email.',
    });
  }
}
