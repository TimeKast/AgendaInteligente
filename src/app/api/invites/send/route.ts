/**
 * Send Invite API Endpoint
 *
 * POST /api/invites/send
 *
 * Creates an invite and sends the email.
 * Requires a role with `canInvite: true` in ROLE_CONFIG, or dev mode.
 * Supports optional `role` field to assign a role to the invited user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { createInviteToken } from '@/lib/invites';
import { sendEmail, inviteUserEmail, inviteUserEmailText } from '@/lib/email';
import { getEnv, getAppUrl, isEmailConfigured } from '@/lib/env';
import { logger } from '@/lib/logger';
import { checkRateLimit, getClientIP, rateLimitExceededResponse } from '@/lib/rate-limit';
import {
  canInvite,
  getAssignableRoles,
  getDefaultRole,
  getRoleDisplayName,
  isValidRole,
  type Role,
} from '@/config/roles';

interface SendInviteBody {
  email: string;
  role?: string;
}

function validateBody(body: unknown): body is SendInviteBody {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  if (typeof b.email !== 'string' || !b.email.includes('@')) return false;
  if (b.role !== undefined && typeof b.role !== 'string') return false;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit per IP (KIT-020 §C — `inviteToken` bucket)
    const ip = getClientIP(request);
    const rateLimit = await checkRateLimit(ip, 'inviteToken');
    if (!rateLimit.success) return rateLimitExceededResponse(rateLimit);

    // Check authorization — role must have canInvite, or dev mode
    const session = await auth();
    const isDev = process.env.NODE_ENV === 'development';
    const inviterRole = (session?.user as { role?: string })?.role || '';
    const isAuthorized = isDev || canInvite(inviterRole);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'cannot_invite', message: 'Tu rol no tiene permisos para invitar usuarios' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!validateBody(body)) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Email requerido' },
        { status: 400 }
      );
    }

    const { email } = body;

    // Determine the role to assign — default to lowest privilege
    const targetRole: Role = (
      body.role && isValidRole(body.role) ? body.role : getDefaultRole()
    ) as Role;

    // Validate the inviter can assign this role
    const assignable = getAssignableRoles(inviterRole);
    if (!isDev && !assignable.includes(targetRole)) {
      return NextResponse.json(
        {
          error: 'invalid_role',
          message: `No tienes permisos para asignar el rol "${getRoleDisplayName(targetRole)}"`,
        },
        { status: 403 }
      );
    }

    // Use name, or email username, or fallback to 'El equipo'
    const inviterName =
      session?.user?.name ||
      (session?.user?.email ? session.user.email.split('@')[0] : null) ||
      'El equipo';

    // Create invite token — store target role in metadata
    const { token, invite } = await createInviteToken(email, session?.user?.id || undefined, {
      metadata: { role: targetRole },
    });

    // Build accept URL
    const appUrl = getAppUrl();
    const acceptUrl = `${appUrl}/accept-invite?token=${token}`;

    // Check if email is configured
    if (!isEmailConfigured()) {
      // Return token directly for manual testing
      logger.warn('[Send Invite] Email not configured, returning token for manual testing');
      return NextResponse.json({
        success: true,
        message: 'Email no configurado. Usa el link directamente:',
        acceptUrl,
        invite: {
          id: invite.id,
          email: invite.email,
          role: targetRole,
          expiresAt: invite.expiresAt,
        },
      });
    }

    // Send email
    const appName = getEnv().NEXT_PUBLIC_APP_NAME || 'App';
    const result = await sendEmail({
      to: email,
      subject: `Te han invitado a ${appName}`,
      html: inviteUserEmail({ url: acceptUrl, inviterName }),
      text: inviteUserEmailText({ url: acceptUrl, inviterName }),
    });

    if (!result.success) {
      logger.error('[Send Invite] Email failed:', result.error);
      return NextResponse.json({
        success: false,
        error: 'email_failed',
        message: 'Error al enviar email. Token creado, puedes usar el link:',
        acceptUrl,
      });
    }

    logger.info('[Send Invite] Invite sent', {
      to: email,
      inviteId: invite.id,
      role: targetRole,
    });

    return NextResponse.json({
      success: true,
      message: `Invitación enviada a ${email} con rol ${getRoleDisplayName(targetRole)}`,
      invite: {
        id: invite.id,
        email: invite.email,
        role: targetRole,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    logger.error('[Send Invite] Error:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'Error del servidor' },
      { status: 500 }
    );
  }
}
