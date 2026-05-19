/**
 * Validate Invite Token API Endpoint
 *
 * GET /api/invites/validate?token=...
 *
 * Validates an invite token without marking it as used.
 * Returns invite data if valid.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateInviteToken } from '@/lib/invites';
import { checkRateLimit, getClientIP, rateLimitExceededResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Rate limit per IP (KIT-020 §C — `inviteToken` bucket; protects token brute-force)
  const ip = getClientIP(request);
  const rateLimit = await checkRateLimit(ip, 'inviteToken');
  if (!rateLimit.success) return rateLimitExceededResponse(rateLimit);

  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ valid: false, error: 'Token requerido' }, { status: 400 });
  }

  const validation = await validateInviteToken(token);

  if (!validation.valid || !validation.invite) {
    return NextResponse.json({
      valid: false,
      error: validation.error || 'Token inválido',
    });
  }

  // Return invite data (without sensitive fields)
  return NextResponse.json({
    valid: true,
    email: validation.invite.email,
    expiresAt: validation.invite.expiresAt,
    // inviterName would come from joining with users table if needed
  });
}
