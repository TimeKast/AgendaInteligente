/**
 * Email Test Endpoint
 *
 * POST /api/email/test
 *
 * Protected: Only available in dev mode or for super admins.
 * Sends a test email to verify email configuration.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';
import { sendEmail, isEmailReady } from '@/lib/email';
import { isUserSuperAdmin } from '@/lib/auth/super-admin';
import { logger } from '@/lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiting (simple in-memory for dev)
// ─────────────────────────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit = 5, windowMs = 600000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || record.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Request Schema
// ─────────────────────────────────────────────────────────────────────────────

const bodySchema = z.object({
  to: z.string().email('Invalid email address'),
});

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // Auth check: dev mode OR super admin
    const session = await auth();
    const isDev = process.env.NODE_ENV !== 'production';
    const isSuperAdmin = isUserSuperAdmin(session?.user);

    if (!isDev && !isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if email is configured
    if (!isEmailReady()) {
      return NextResponse.json(
        { error: 'Email not configured. Set EMAIL_PROVIDER in your environment.' },
        { status: 503 }
      );
    }

    // Parse and validate body
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { to } = parsed.data;

    // Rate limit (5 per 10 min per email)
    if (!checkRateLimit(`test:${to}`)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again in 10 minutes.' },
        { status: 429 }
      );
    }

    // Send test email
    const result = await sendEmail({
      to,
      subject: 'Test Email from Starter Kit',
      html: `
        <h1>✅ It works!</h1>
        <p>Your email configuration is correct.</p>
        <p>Provider: <strong>${process.env.EMAIL_PROVIDER}</strong></p>
        <p>Sent at: <strong>${new Date().toISOString()}</strong></p>
      `,
      text: `It works! Your email configuration is correct. Provider: ${process.env.EMAIL_PROVIDER}`,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      provider: process.env.EMAIL_PROVIDER,
    });
  } catch (error) {
    logger.error('[/api/email/test] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
