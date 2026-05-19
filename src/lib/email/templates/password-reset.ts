/**
 * Password Reset Email Template
 */

import { getEnv } from '@/lib/env';
import { emailLayout, defaultBranding } from './layout';

interface PasswordResetEmailParams {
  url: string;
  userName?: string;
}

/**
 * Generate password reset email HTML
 */
export function passwordResetEmail({ url, userName }: PasswordResetEmailParams): string {
  const appName = getEnv().NEXT_PUBLIC_APP_NAME || 'App';
  const greeting = userName ? `Hola ${userName},` : 'Hola,';

  const b = defaultBranding;

  const content = `
    <h2>Restablecer contraseña</h2>
    <p>${greeting}</p>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
    <p style="text-align: center;">
      <a href="${url}" class="button">Restablecer contraseña</a>
    </p>
    <p class="muted">
      Si no solicitaste este cambio, ignora este email. Tu contraseña no cambiará.
    </p>
    <p class="muted">
      Este enlace expira en <strong>1 hora</strong> por seguridad.
    </p>
    <hr style="border: none; border-top: 1px solid ${b.borderColor}; margin: 24px 0;" />
    <p class="muted" style="font-size: 12px;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:
      <br />
      <a href="${url}" style="color: ${b.primaryColor}; word-break: break-all;">${url}</a>
    </p>
  `;

  return emailLayout(content, {
    preheader: `Restablecer contraseña en ${appName} - Enlace válido por 1 hora`,
  });
}

/**
 * Generate password reset email plain text version
 */
export function passwordResetEmailText({ url, userName }: PasswordResetEmailParams): string {
  const appName = getEnv().NEXT_PUBLIC_APP_NAME || 'App';
  const greeting = userName ? `Hola ${userName},` : 'Hola,';

  return `
Restablecer contraseña en ${appName}

${greeting}

Recibimos una solicitud para restablecer la contraseña de tu cuenta.

Haz clic en el enlace de abajo para crear una nueva contraseña:

${url}

Si no solicitaste este cambio, ignora este email. Tu contraseña no cambiará.

Este enlace expira en 1 hora por seguridad.
  `.trim();
}
