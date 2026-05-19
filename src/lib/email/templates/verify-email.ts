/**
 * Verify Email Template
 *
 * Sent when a user registers and needs to verify their email address.
 */

import { getEnv } from '@/lib/env';
import { emailLayout, emailButton, defaultBranding } from './layout';

interface VerifyEmailParams {
  /** Verification URL (required) */
  url: string;
  /** User's name (optional, for personalized greeting) */
  userName?: string;
  /** Expiration time (default: "24 horas") */
  expiresIn?: string;
}

/**
 * Generate email verification HTML
 */
export function verifyEmail({ url, userName, expiresIn = '24 horas' }: VerifyEmailParams): string {
  const appName = getEnv().NEXT_PUBLIC_APP_NAME || 'App';
  const greeting = userName ? `Hola ${userName},` : 'Hola,';
  const b = defaultBranding;

  const button = emailButton({
    url,
    text: 'Verificar email',
  });

  const content = `
    <h2 style="color: ${b.headingColor}; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">Verifica tu email</h2>
    <p style="margin: 0 0 16px 0;">${greeting}</p>
    <p style="margin: 0 0 16px 0;">Gracias por registrarte en ${appName}. Por favor verifica tu email haciendo clic en el botón:</p>
    <div style="text-align: center;">
      ${button}
    </div>
    <p style="color: ${b.mutedTextColor}; font-size: 14px; margin: 16px 0;">
      Este enlace expira en <strong>${expiresIn}</strong>.
    </p>
    <p style="color: ${b.mutedTextColor}; font-size: 14px; margin: 16px 0;">
      Si no creaste esta cuenta, puedes ignorar este email.
    </p>
    <hr style="border: none; border-top: 1px solid ${b.borderColor}; margin: 24px 0;" />
    <p style="color: ${b.mutedTextColor}; font-size: 12px; margin: 0;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:
      <br />
      <a href="${url}" style="color: ${b.primaryColor}; word-break: break-all;">${url}</a>
    </p>
  `;

  return emailLayout(content, {
    preheader: `Verifica tu email en ${appName} - Válido por ${expiresIn}`,
  });
}

/**
 * Generate email verification plain text version
 */
export function verifyEmailText({
  url,
  userName,
  expiresIn = '24 horas',
}: VerifyEmailParams): string {
  const appName = getEnv().NEXT_PUBLIC_APP_NAME || 'App';
  const greeting = userName ? `Hola ${userName},` : 'Hola,';

  return `
Verifica tu email en ${appName}

${greeting}

Gracias por registrarte en ${appName}. Por favor verifica tu email haciendo clic en el enlace:

${url}

Este enlace expira en ${expiresIn}.

Si no creaste esta cuenta, puedes ignorar este email.
  `.trim();
}
