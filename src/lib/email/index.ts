/**
 * Email Service - Main Entry Point
 *
 * Provides a unified interface for sending emails via Resend or SMTP.
 * The provider is selected based on EMAIL_PROVIDER environment variable.
 *
 * @example
 * import { sendEmail, isEmailReady } from '@/lib/email';
 *
 * if (isEmailReady()) {
 *   await sendEmail({
 *     to: 'user@example.com',
 *     subject: 'Hello',
 *     html: '<h1>Hello World</h1>',
 *   });
 * }
 */

import { getEmailProvider, isEmailConfigured } from '@/lib/env';
import { sendWithResend } from './resend';
import { sendWithSmtp } from './smtp';
import type { EmailPayload, EmailResult } from './types';

// Re-export types
export type { EmailPayload, EmailResult } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Main API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if email is configured and ready to send
 */
export function isEmailReady(): boolean {
  return isEmailConfigured();
}

/**
 * Send an email using the configured provider
 *
 * @param payload - Email content (to, subject, html, text)
 * @returns Result with success status and optional error
 *
 * @throws Error if no email provider is configured
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const provider = getEmailProvider();

  if (provider === 'none') {
    throw new Error(
      'Email not configured. Set EMAIL_PROVIDER to "resend" or "smtp" in your environment.'
    );
  }

  if (!isEmailConfigured()) {
    throw new Error(
      `Email provider "${provider}" is selected but not properly configured. ` +
        'Check EMAIL_FROM and provider-specific variables.'
    );
  }

  if (provider === 'resend') {
    return sendWithResend(payload);
  }

  if (provider === 'smtp') {
    return sendWithSmtp(payload);
  }

  // Should never reach here due to enum validation
  throw new Error(`Unknown email provider: ${provider}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-exports
// ─────────────────────────────────────────────────────────────────────────────

export { sendWithResend } from './resend';
export { sendWithSmtp, verifySmtpConnection } from './smtp';
export { emailLayout, emailButton, generateTextFallback } from './templates/layout';
export { magicLinkEmail, magicLinkEmailText } from './templates/magic-link';
export { passwordResetEmail, passwordResetEmailText } from './templates/password-reset';
export { verifyEmail, verifyEmailText } from './templates/verify-email';
export { passwordChangedEmail, passwordChangedEmailText } from './templates/password-changed';
export { loginAlertEmail, loginAlertEmailText, isLoginAlertEnabled } from './templates/login-alert';
export {
  passwordResetConfirmEmail,
  passwordResetConfirmEmailText,
} from './templates/password-reset-confirm';
export { inviteUserEmail, inviteUserEmailText } from './templates/invite-user';
export { inviteAcceptedEmail, inviteAcceptedEmailText } from './templates/invite-accepted';
export { notificationEmail, notificationEmailText } from './templates/notification';
export type { NotificationEmailParams, NotificationEmailResult } from './templates/notification';
