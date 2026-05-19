/**
 * Magic Link Email Template
 */

import { getEnv } from '@/lib/env';
import { emailLayout, defaultBranding } from './layout';

interface MagicLinkEmailParams {
  url: string;
  host: string;
}

/**
 * Generate magic link email HTML
 */
export function magicLinkEmail({ url, host: _host }: MagicLinkEmailParams): string {
  const appName = getEnv().NEXT_PUBLIC_APP_NAME || 'App';

  const b = defaultBranding;

  const content = `
    <h2>Inicia sesión en ${appName}</h2>
    <p>Haz clic en el botón de abajo para iniciar sesión en tu cuenta.</p>
    <p style="text-align: center;">
      <a href="${url}" class="button">Iniciar sesión</a>
    </p>
    <p class="muted">
      Si no solicitaste este email, puedes ignorarlo de forma segura.
    </p>
    <p class="muted">
      Este enlace expira en 24 horas y solo puede usarse una vez.
    </p>
    <hr style="border: none; border-top: 1px solid ${b.borderColor}; margin: 24px 0;" />
    <p class="muted" style="font-size: 12px;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:
      <br />
      <a href="${url}" style="color: ${b.primaryColor}; word-break: break-all;">${url}</a>
    </p>
  `;

  return emailLayout(content, {
    preheader: `Inicia sesión en ${appName} - Enlace válido por 24 horas`,
  });
}

/**
 * Generate magic link email plain text version
 */
export function magicLinkEmailText({ url, host: _host }: MagicLinkEmailParams): string {
  const appName = getEnv().NEXT_PUBLIC_APP_NAME || 'App';

  return `
Inicia sesión en ${appName}

Haz clic en el enlace de abajo para iniciar sesión:

${url}

Si no solicitaste este email, puedes ignorarlo de forma segura.

Este enlace expira en 24 horas y solo puede usarse una vez.
  `.trim();
}
