/**
 * Invite User Email Template
 *
 * Sent when an admin invites a new user to join the platform.
 */

import { getEnv } from '@/lib/env';
import { emailLayout, emailButton, defaultBranding } from './layout';

interface InviteUserEmailParams {
  /** Invite acceptance URL (required) */
  url: string;
  /** Name of the person who sent the invite (optional) */
  inviterName?: string;
  /** Organization/team name (optional, for multi-tenant) */
  organizationName?: string;
  /** Expiration time (default: "7 días") */
  expiresIn?: string;
}

/**
 * Generate invite user email HTML
 */
export function inviteUserEmail({
  url,
  inviterName,
  organizationName,
  expiresIn = '7 días',
}: InviteUserEmailParams): string {
  const env = getEnv();
  const appName = organizationName || env.NEXT_PUBLIC_APP_NAME || 'App';
  const inviter = inviterName || 'Un administrador';

  const b = defaultBranding;

  const button = emailButton({
    url,
    text: 'Aceptar invitación',
  });

  const content = `
    <h2 style="color: ${b.headingColor}; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">Has sido invitado</h2>
    <p style="margin: 0 0 16px 0;">
      <strong>${inviter}</strong> te ha invitado a unirte a <strong>${appName}</strong>.
    </p>
    <p style="margin: 0 0 16px 0;">
      Haz clic en el botón para aceptar la invitación y crear tu cuenta:
    </p>
    <div style="text-align: center;">
      ${button}
    </div>
    <p style="color: ${b.mutedTextColor}; font-size: 14px; margin: 16px 0;">
      Esta invitación expira en <strong>${expiresIn}</strong>.
    </p>
    <p style="color: ${b.mutedTextColor}; font-size: 14px; margin: 16px 0;">
      Si no esperabas esta invitación, puedes ignorar este email.
    </p>
    <hr style="border: none; border-top: 1px solid ${b.borderColor}; margin: 24px 0;" />
    <p style="color: ${b.mutedTextColor}; font-size: 12px; margin: 0;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:
      <br />
      <a href="${url}" style="color: ${b.primaryColor}; word-break: break-all;">${url}</a>
    </p>
  `;

  return emailLayout(content, {
    preheader: `${inviter} te ha invitado a ${appName}`,
  });
}

/**
 * Generate invite user email plain text version
 */
export function inviteUserEmailText({
  url,
  inviterName,
  organizationName,
  expiresIn = '7 días',
}: InviteUserEmailParams): string {
  const env = getEnv();
  const appName = organizationName || env.NEXT_PUBLIC_APP_NAME || 'App';
  const inviter = inviterName || 'Un administrador';

  return `
Has sido invitado a ${appName}

${inviter} te ha invitado a unirte a ${appName}.

Haz clic en el enlace para aceptar la invitación y crear tu cuenta:

${url}

Esta invitación expira en ${expiresIn}.

Si no esperabas esta invitación, puedes ignorar este email.
  `.trim();
}
