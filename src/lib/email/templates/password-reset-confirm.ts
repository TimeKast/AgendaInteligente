/**
 * Password Reset Confirmation Email Template
 *
 * Sent after a user successfully resets their password.
 * Positive confirmation tone - different from password-changed-alert (which is cautionary).
 */

import { getEnv, getAppUrl } from '@/lib/env';
import { emailLayout, emailButton, defaultBranding } from './layout';

interface PasswordResetConfirmParams {
  /** User's name (optional, for personalized greeting) */
  userName?: string;
  /** When the password was changed */
  changedAt: Date;
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
 * Generate password reset confirmation HTML
 */
export function passwordResetConfirmEmail({
  userName,
  changedAt,
}: PasswordResetConfirmParams): string {
  const env = getEnv();
  const appName = env.NEXT_PUBLIC_APP_NAME || 'App';
  const appUrl = getAppUrl();
  const loginUrl = `${appUrl}/login`;
  const greeting = userName ? `Hola ${userName},` : 'Hola,';
  const formattedDate = formatDate(changedAt);

  const b = defaultBranding;

  const button = emailButton({
    url: loginUrl,
    text: 'Ir a iniciar sesión',
  });

  const content = `
    <h2 style="color: ${b.successColor}; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">✓ Contraseña actualizada</h2>
    <p style="margin: 0 0 16px 0;">${greeting}</p>
    <p style="margin: 0 0 16px 0;">
      Tu contraseña en ${appName} fue actualizada exitosamente el <strong>${formattedDate}</strong>.
    </p>
    <div style="text-align: center;">
      ${button}
    </div>
    <hr style="border: none; border-top: 1px solid ${b.borderColor}; margin: 24px 0;" />
    <div style="background-color: ${b.successBgColor}; padding: 16px; border-radius: 6px; border-left: 4px solid ${b.successColor};">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: ${b.successColor};">Consejos de seguridad:</p>
      <ul style="margin: 0; padding-left: 20px; color: ${b.textColor}; font-size: 14px;">
        <li>No compartas tu contraseña con nadie</li>
        <li>Usa contraseñas únicas para cada servicio</li>
        <li>Considera usar un gestor de contraseñas</li>
      </ul>
    </div>
  `;

  return emailLayout(content, {
    preheader: `Tu contraseña en ${appName} fue actualizada exitosamente`,
  });
}

/**
 * Generate password reset confirmation plain text version
 */
export function passwordResetConfirmEmailText({
  userName,
  changedAt,
}: PasswordResetConfirmParams): string {
  const env = getEnv();
  const appName = env.NEXT_PUBLIC_APP_NAME || 'App';
  const appUrl = getAppUrl();
  const loginUrl = `${appUrl}/login`;
  const greeting = userName ? `Hola ${userName},` : 'Hola,';
  const formattedDate = formatDate(changedAt);

  return `
Contraseña actualizada en ${appName}

${greeting}

Tu contraseña fue actualizada exitosamente el ${formattedDate}.

Inicia sesión: ${loginUrl}

---

CONSEJOS DE SEGURIDAD:
• No compartas tu contraseña con nadie
• Usa contraseñas únicas para cada servicio
• Considera usar un gestor de contraseñas
  `.trim();
}
