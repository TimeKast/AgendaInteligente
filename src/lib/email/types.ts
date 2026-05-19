/**
 * Email Types
 *
 * Shared types for email module to avoid circular imports.
 */

export interface EmailPayload {
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** HTML content */
  html: string;
  /** Plain text fallback (optional) */
  text?: string;
}

export interface EmailResult {
  /** Whether the email was sent successfully */
  success: boolean;
  /** Message ID from the provider (if available) */
  messageId?: string;
  /** Error message (if failed) */
  error?: string;
}
