/**
 * SMTP Email Provider
 *
 * Uses Nodemailer for SMTP email delivery.
 * @see https://nodemailer.com
 */

import { logger } from '@/lib/logger';

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { getSmtpConfig } from '@/lib/env';
import type { EmailPayload, EmailResult } from './types';
import {
  EMAIL_LOGO_BASE64,
  EMAIL_LOGO_FILENAME,
  EMAIL_LOGO_CID,
  EMAIL_LOGO_CONTENT_TYPE,
} from './logo-data';

let transporter: Transporter | null = null;

/**
 * Get or create SMTP transporter (singleton)
 */
function getTransporter(): Transporter {
  if (!transporter) {
    const config = getSmtpConfig();
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
  }
  return transporter;
}

function resolveLogoAttachment(): nodemailer.SendMailOptions['attachments'] {
  if (process.env.EMAIL_LOGO_URL) return [];
  if (!EMAIL_LOGO_BASE64) return [];
  return [
    {
      filename: EMAIL_LOGO_FILENAME,
      content: Buffer.from(EMAIL_LOGO_BASE64, 'base64'),
      contentType: EMAIL_LOGO_CONTENT_TYPE,
      cid: EMAIL_LOGO_CID,
    },
  ];
}

/**
 * Send email using SMTP
 */
export async function sendWithSmtp(payload: EmailPayload): Promise<EmailResult> {
  try {
    const config = getSmtpConfig();
    const transport = getTransporter();

    const info = await transport.sendMail({
      from: config.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: process.env.SUPPORT_EMAIL || undefined,
      attachments: resolveLogoAttachment(),
      // Transactional email headers
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All',
      },
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[SMTP] Error sending email:', message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Verify SMTP connection (useful for testing)
 */
export async function verifySmtpConnection(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    return true;
  } catch (error) {
    console.error('[SMTP] Verification failed:', error instanceof Error ? error.message : error);
    return false;
  }
}
