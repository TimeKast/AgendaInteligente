/**
 * Login Alert Email Template
 *
 * Sent when a user logs in (if login alerts are enabled).
 * Security notification for new session detection.
 *
 * Feature flag: Enabled by default (will use user preferences)
 */

import { getEnv } from '@/lib/env';
import { emailLayout, defaultBranding } from './layout';

interface LoginAlertParams {
  /** User's name (optional, for personalized greeting) */
  userName?: string;
  /** When the login occurred */
  loginAt: Date;
  /** IP address where login originated (optional) */
  ipAddress?: string;
  /** Browser/device info (optional) */
  userAgent?: string;
  /** URL to report suspicious activity (optional) */
  suspiciousUrl?: string;
}

/**
 * Check if login alerts are enabled
 */
export function isLoginAlertEnabled(): boolean {
  // TODO: [NOTIF-003] Integrate with user notification preferences (security category)
  // Currently always enabled by default as the env var was deprecated
  return true;
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
 * Parse user agent to a more readable format
 */
function parseUserAgent(userAgent?: string): string {
  if (!userAgent) return 'Desconocido';

  // Simple parsing - extract browser and OS
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';

  return userAgent.slice(0, 50) + (userAgent.length > 50 ? '...' : '');
}

/**
 * Generate login alert HTML
 */
export function loginAlertEmail({
  userName,
  loginAt,
  ipAddress,
  userAgent,
  suspiciousUrl,
}: LoginAlertParams): string {
  const env = getEnv();
  const appName = env.NEXT_PUBLIC_APP_NAME || 'App';
  const supportEmail = env.NEXT_PUBLIC_SUPPORT_EMAIL || '';
  const greeting = userName ? `Hola ${userName},` : 'Hola,';
  const formattedDate = formatDate(loginAt);
  const device = parseUserAgent(userAgent);

  const b = defaultBranding;

  // Support/report link
  const reportUrl =
    suspiciousUrl ||
    (supportEmail
      ? `mailto:${supportEmail}?subject=Actividad%20sospechosa%20en%20mi%20cuenta`
      : '');
  const reportLink = reportUrl
    ? `<a href="${reportUrl}" style="color: ${b.primaryColor}; text-decoration: underline;">Asegura tu cuenta</a>`
    : 'contacta a soporte';

  // Details table
  const detailsRows = [
    `<tr><td style="padding: 8px 0; color: ${b.mutedTextColor};"><strong>Fecha:</strong></td><td style="padding: 8px 0;">${formattedDate}</td></tr>`,
  ];
  if (ipAddress) {
    detailsRows.push(
      `<tr><td style="padding: 8px 0; color: ${b.mutedTextColor};"><strong>IP:</strong></td><td style="padding: 8px 0;">${ipAddress}</td></tr>`
    );
  }
  if (userAgent) {
    detailsRows.push(
      `<tr><td style="padding: 8px 0; color: ${b.mutedTextColor};"><strong>Navegador:</strong></td><td style="padding: 8px 0;">${device}</td></tr>`
    );
  }

  const content = `
    <h2 style="color: ${b.headingColor}; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">Nuevo inicio de sesión</h2>
    <p style="margin: 0 0 16px 0;">${greeting}</p>
    <p style="margin: 0 0 16px 0;">
      Detectamos un nuevo inicio de sesión en tu cuenta de ${appName}.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; background-color: ${b.infoBgColor}; border-radius: 6px; padding: 16px; margin: 16px 0;">
      ${detailsRows.join('')}
    </table>
    <p style="color: ${b.mutedTextColor}; font-size: 14px; margin: 16px 0;">
      Si fuiste tú, puedes ignorar este email.
    </p>
    <hr style="border: none; border-top: 1px solid ${b.borderColor}; margin: 24px 0;" />
    <p style="margin: 0; padding: 16px; background-color: ${b.errorBgColor}; border-radius: 6px; border-left: 4px solid ${b.errorColor};">
      <strong style="color: ${b.errorColor};">¿No reconoces esta actividad?</strong><br />
      <span style="color: ${b.textColor};">Tu cuenta puede estar comprometida. ${reportLink} inmediatamente.</span>
    </p>
  `;

  return emailLayout(content, {
    preheader: `Nuevo inicio de sesión detectado en ${appName} - ${formattedDate}`,
  });
}

/**
 * Generate login alert plain text version
 */
export function loginAlertEmailText({
  userName,
  loginAt,
  ipAddress,
  userAgent,
}: LoginAlertParams): string {
  const env = getEnv();
  const appName = env.NEXT_PUBLIC_APP_NAME || 'App';
  const supportEmail = env.NEXT_PUBLIC_SUPPORT_EMAIL || 'soporte';
  const greeting = userName ? `Hola ${userName},` : 'Hola,';
  const formattedDate = formatDate(loginAt);
  const device = parseUserAgent(userAgent);

  let details = `Fecha: ${formattedDate}\n`;
  if (ipAddress) details += `IP: ${ipAddress}\n`;
  if (userAgent) details += `Navegador: ${device}\n`;

  return `
Nuevo inicio de sesión en ${appName}

${greeting}

Detectamos un nuevo inicio de sesión en tu cuenta.

${details}
Si fuiste tú, puedes ignorar este email.

---

¿NO RECONOCES ESTA ACTIVIDAD?

Tu cuenta puede estar comprometida.
Contacta soporte inmediatamente: ${supportEmail}
  `.trim();
}
