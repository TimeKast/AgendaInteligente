/**
 * Resend Email Provider
 *
 * Uses Resend API for email delivery.
 * @see https://resend.com/docs
 */

import { logger } from '@/lib/logger';

import { Resend } from 'resend';
import { getResendConfig } from '@/lib/env';
import type { EmailPayload, EmailResult } from './types';
import {
  EMAIL_LOGO_BASE64,
  EMAIL_LOGO_FILENAME,
  EMAIL_LOGO_CID,
  EMAIL_LOGO_CONTENT_TYPE,
} from './logo-data';

let resendClient: Resend | null = null;

/**
 * Get or create Resend client (singleton)
 */
function getClient(): Resend {
  if (!resendClient) {
    const config = getResendConfig();
    resendClient = new Resend(config.apiKey);
  }
  return resendClient;
}

/**
 * Send email using Resend
 */
export async function sendWithResend(payload: EmailPayload): Promise<EmailResult> {
  try {
    const config = getResendConfig();
    const client = getClient();

    const logoAttachments =
      !process.env.EMAIL_LOGO_URL && EMAIL_LOGO_BASE64
        ? [
            {
              filename: EMAIL_LOGO_FILENAME,
              content: EMAIL_LOGO_BASE64,
              contentType: EMAIL_LOGO_CONTENT_TYPE,
              contentId: EMAIL_LOGO_CID,
            },
          ]
        : undefined;

    const { data, error } = await client.emails.send({
      from: config.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      attachments: logoAttachments,
      // Transactional email headers
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All',
      },
      replyTo: process.env.SUPPORT_EMAIL || undefined,
    });

    if (error) {
      logger.error('[Resend] Error sending email:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[Resend] Exception:', message);
    return {
      success: false,
      error: message,
    };
  }
}
