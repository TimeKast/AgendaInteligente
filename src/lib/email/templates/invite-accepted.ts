/**
 * Invite Accepted Email Template
 *
 * Welcome email sent after a user accepts an invite and creates their account.
 */

import { getEnv, getAppUrl } from '@/lib/env';
import { emailLayout, emailButton, defaultBranding } from './layout';

interface InviteAcceptedParams {
  /** User's name (optional, for personalized greeting) */
  userName?: string;
  /** Organization/team name (optional, for multi-tenant) */
  organizationName?: string;
}

/**
 * Generate invite accepted (welcome) email HTML
 */
export function inviteAcceptedEmail({
  userName,
  organizationName,
}: InviteAcceptedParams = {}): string {
  const env = getEnv();
  const appName = organizationName || env.NEXT_PUBLIC_APP_NAME || 'App';
  const appUrl = getAppUrl();
  const supportEmail = env.NEXT_PUBLIC_SUPPORT_EMAIL || '';
  const dashboardUrl = `${appUrl}/dashboard`;
  const greeting = userName ? `Hola ${userName},` : 'Hola,';

  const b = defaultBranding;

  const button = emailButton({
    url: dashboardUrl,
    text: 'Ir al dashboard',
  });

  const supportLine = supportEmail
    ? `<p style="color: ${b.mutedTextColor}; font-size: 14px; margin: 16px 0;">
        Si tienes preguntas, escríbenos a
        <a href="mailto:${supportEmail}" style="color: ${b.primaryColor};">${supportEmail}</a>.
      </p>`
    : '';

  const content = `
    <h2 style="color: ${b.successColor}; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">¡Bienvenido a ${appName}!</h2>
    <p style="margin: 0 0 16px 0;">${greeting}</p>
    <p style="margin: 0 0 16px 0;">
      Tu cuenta ha sido creada exitosamente. Ya puedes acceder a todas las funcionalidades.
    </p>
    <div style="text-align: center;">
      ${button}
    </div>
    ${supportLine}
    <hr style="border: none; border-top: 1px solid ${b.borderColor}; margin: 24px 0;" />
    <p style="color: ${b.mutedTextColor}; font-size: 12px; margin: 0;">
      Este es un email de confirmación. No necesitas responder.
    </p>
  `;

  return emailLayout(content, {
    preheader: `¡Bienvenido a ${appName}! Tu cuenta está lista`,
  });
}

/**
 * Generate invite accepted email plain text version
 */
export function inviteAcceptedEmailText({
  userName,
  organizationName,
}: InviteAcceptedParams = {}): string {
  const env = getEnv();
  const appName = organizationName || env.NEXT_PUBLIC_APP_NAME || 'App';
  const appUrl = getAppUrl();
  const supportEmail = env.NEXT_PUBLIC_SUPPORT_EMAIL || '';
  const dashboardUrl = `${appUrl}/dashboard`;
  const greeting = userName ? `Hola ${userName},` : 'Hola,';

  const supportLine = supportEmail ? `Si tienes preguntas, escríbenos a ${supportEmail}.` : '';

  return `
¡Bienvenido a ${appName}!

${greeting}

Tu cuenta ha sido creada exitosamente. Ya puedes acceder a todas las funcionalidades.

Ir al dashboard: ${dashboardUrl}

${supportLine}
  `.trim();
}
