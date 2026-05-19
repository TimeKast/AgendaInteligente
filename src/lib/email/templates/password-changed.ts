/**
 * Password Changed Alert Email Template
 *
 * Sent when a user's password is changed. Security notification.
 */

import { getEnv } from '@/lib/env';
import { emailLayout, defaultBranding } from './layout';

interface PasswordChangedParams {
  /** User's name (optional, for personalized greeting) */
  userName?: string;
  /** When the password was changed */
  changedAt: Date;
  /** IP address where change originated (optional) */
  ipAddress?: string;
  /** Browser/device info (optional) */
  userAgent?: string;
}

/**
 * Format date in Spanish locale
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate password changed alert HTML
 */
export function passwordChangedEmail({
  userName,
  changedAt,
  ipAddress,
  userAgent,
}: PasswordChangedParams): string {
  const env = getEnv();
  const appName = env.NEXT_PUBLIC_APP_NAME || 'App';
  const supportEmail = env.NEXT_PUBLIC_SUPPORT_EMAIL || '';
  const greeting = userName ? `Hola ${userName},` : 'Hola,';
  const formattedDate = formatDate(changedAt);

  const b = defaultBranding;

  // Device info section (optional)
  let deviceInfo = '';
  if (ipAddress || userAgent) {
    const parts = [];
    if (ipAddress) parts.push(`<strong>IP:</strong> ${ipAddress}`);
    if (userAgent) parts.push(`<strong>Dispositivo:</strong> ${userAgent}`);
    deviceInfo = `
      <p style="color: ${b.mutedTextColor}; font-size: 14px; margin: 16px 0; padding: 12px; background-color: ${b.infoBgColor}; border-radius: 6px;">
        ${parts.join('<br />')}
      </p>
    `;
  }

  // Support link
  const supportLink = supportEmail
    ? `<a href="mailto:${supportEmail}?subject=Problema%20de%20seguridad%20-%20Cambio%20de%20contraseña%20no%20autorizado" style="color: ${b.primaryColor}; text-decoration: underline;">Contacta soporte</a>`
    : 'contacta a soporte';

  const content = `
    <h2 style="color: ${b.headingColor}; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">Tu contraseña fue cambiada</h2>
    <p style="margin: 0 0 16px 0;">${greeting}</p>
    <p style="margin: 0 0 16px 0;">
      Tu contraseña en ${appName} fue cambiada el <strong>${formattedDate}</strong>.
    </p>
    ${deviceInfo}
    <p style="color: ${b.mutedTextColor}; font-size: 14px; margin: 16px 0;">
      Si realizaste este cambio, puedes ignorar este email.
    </p>
    <hr style="border: none; border-top: 1px solid ${b.borderColor}; margin: 24px 0;" />
    <p style="margin: 0; padding: 16px; background-color: ${b.errorBgColor}; border-radius: 6px; border-left: 4px solid ${b.errorColor};">
      <strong style="color: ${b.errorColor};">¿No fuiste tú?</strong><br />
      <span style="color: ${b.textColor};">Tu cuenta puede estar comprometida. ${supportLink} inmediatamente.</span>
    </p>
  `;

  return emailLayout(content, {
    preheader: `Tu contraseña en ${appName} fue cambiada - ${formattedDate}`,
  });
}

/**
 * Generate password changed alert plain text version
 */
export function passwordChangedEmailText({
  userName,
  changedAt,
  ipAddress,
  userAgent,
}: PasswordChangedParams): string {
  const env = getEnv();
  const appName = env.NEXT_PUBLIC_APP_NAME || 'App';
  const supportEmail = env.NEXT_PUBLIC_SUPPORT_EMAIL || 'soporte';
  const greeting = userName ? `Hola ${userName},` : 'Hola,';
  const formattedDate = formatDate(changedAt);

  let deviceInfo = '';
  if (ipAddress) deviceInfo += `IP: ${ipAddress}\n`;
  if (userAgent) deviceInfo += `Dispositivo: ${userAgent}\n`;

  return `
Tu contraseña fue cambiada en ${appName}

${greeting}

Tu contraseña fue cambiada el ${formattedDate}.
${deviceInfo}
Si realizaste este cambio, puedes ignorar este email.

---

¿NO FUISTE TÚ?

Tu cuenta puede estar comprometida.
Contacta soporte inmediatamente: ${supportEmail}
  `.trim();
}
