/**
 * Generic Notification Email Template
 *
 * Reusable template for sending notification-type emails.
 * Supports dynamic title, body, optional CTA button, and category badge.
 *
 * @see NOTIF-004
 */

import { getEnv, getAppUrl } from '@/lib/env';
import { emailLayout, emailButton, defaultBranding } from './layout';
import { NOTIFICATION_CATEGORIES } from '@/config/notifications';

// =============================================================================
// Types
// =============================================================================

export interface NotificationEmailParams {
  /** Notification title — used as email subject and heading */
  title: string;
  /** Notification body text */
  body: string;
  /** Category ID (e.g. 'general', 'security', 'documents') */
  category: string;
  /** Optional CTA button text */
  ctaText?: string;
  /** Optional CTA button URL (relative or absolute) */
  ctaUrl?: string;
}

export interface NotificationEmailResult {
  /** Email subject line */
  subject: string;
  /** Full HTML email content */
  html: string;
}

// =============================================================================
// Category Badge
// =============================================================================

/** Map category to a display-friendly color for the badge */
function getCategoryBadgeColor(category: string): string {
  const colorMap: Record<string, string> = {
    security: '#dc2626',
    system: '#6b7280',
    general: '#2563eb',
    documents: '#059669',
    investments: '#d97706',
    reports: '#7c3aed',
  };
  return colorMap[category] || '#6b7280';
}

/** Get the category display label */
function getCategoryLabel(category: string): string {
  const cat = NOTIFICATION_CATEGORIES[category as keyof typeof NOTIFICATION_CATEGORIES];
  return cat?.label || category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Generate an inline category badge for the email header
 */
function categoryBadge(category: string): string {
  const color = getCategoryBadgeColor(category);
  const label = getCategoryLabel(category);

  return `
    <span style="
      display: inline-block;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 600;
      color: ${color};
      background-color: ${color}1a;
      border: 1px solid ${color}33;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    ">${label}</span>
  `.trim();
}

// =============================================================================
// Template
// =============================================================================

/**
 * Generate a generic notification email.
 *
 * @example
 * ```ts
 * const { subject, html } = notificationEmail({
 *   title: 'Nuevo documento disponible',
 *   body: 'Se subió "Contrato Q1.pdf" a tu carpeta de documentos.',
 *   category: 'documents',
 *   ctaText: 'Ver documento',
 *   ctaUrl: '/documents/123',
 * });
 *
 * await sendEmail({ to: userEmail, subject, html });
 * ```
 */
export function notificationEmail({
  title,
  body,
  category,
  ctaText,
  ctaUrl,
}: NotificationEmailParams): NotificationEmailResult {
  const env = getEnv();
  const appName = env.NEXT_PUBLIC_APP_NAME || 'App';
  const appUrl = getAppUrl();
  const b = defaultBranding;

  // Resolve CTA URL to absolute
  const absoluteCtaUrl = ctaUrl && !ctaUrl.startsWith('http') ? `${appUrl}${ctaUrl}` : ctaUrl;

  // Build CTA button if URL provided
  const ctaButton =
    absoluteCtaUrl && ctaText ? emailButton({ url: absoluteCtaUrl, text: ctaText }) : '';

  const content = `
    <!-- Category badge -->
    <div style="margin: 0 0 16px 0;">
      ${categoryBadge(category)}
    </div>

    <!-- Title -->
    <h2 style="color: ${b.headingColor}; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
      ${title}
    </h2>

    <!-- Body -->
    <p style="margin: 0 0 24px 0; color: ${b.textColor}; line-height: 1.6;">
      ${body}
    </p>

    <!-- CTA Button (optional) -->
    ${ctaButton}
  `;

  const subject = `${title} — ${appName}`;

  const html = emailLayout(content, {
    preheader: `${title} — ${body.slice(0, 100)}`,
  });

  return { subject, html };
}

/**
 * Generate plain text version of the notification email.
 *
 * @public SK API — exported for email accessibility (multipart/alternative).
 */
export function notificationEmailText({
  title,
  body,
  category,
  ctaText,
  ctaUrl,
}: NotificationEmailParams): string {
  const env = getEnv();
  const appName = env.NEXT_PUBLIC_APP_NAME || 'App';
  const appUrl = getAppUrl();
  const label = getCategoryLabel(category);

  const absoluteCtaUrl = ctaUrl && !ctaUrl.startsWith('http') ? `${appUrl}${ctaUrl}` : ctaUrl;

  let text = `[${label}] ${title}\n\n${body}`;

  if (absoluteCtaUrl && ctaText) {
    text += `\n\n${ctaText}: ${absoluteCtaUrl}`;
  }

  text += `\n\n—\n${appName}`;

  return text.trim();
}
