/**
 * Email Layout Template v2
 *
 * Table-based layout with inline styles for maximum email client compatibility.
 * Supports dark mode defense via explicit bgcolor on all elements.
 *
 * @see docs/backlog/v1.1/issues/EMAIL-000-layout-v2.md
 */

import { getEnv, getAppUrl } from '@/lib/env';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface EmailBranding {
  primaryColor: string;
  buttonColor: string;
  buttonTextColor: string;
  backgroundColor: string;
  containerBgColor: string;
  headerBgColor: string;
  footerBgColor: string;
  textColor: string;
  headingColor: string;
  mutedTextColor: string;
  borderColor: string;
  // Semantic colors
  successColor: string;
  successBgColor: string;
  errorColor: string;
  errorBgColor: string;
  infoBgColor: string;
}

export interface LayoutOptions {
  /** Hidden preview text for email clients */
  preheader?: string;
  /** Custom branding (optional, defaults provided) */
  branding?: Partial<EmailBranding>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Branding
// ─────────────────────────────────────────────────────────────────────────────

const defaultBranding: EmailBranding = {
  primaryColor: '#1e40af',
  buttonColor: '#1e40af',
  buttonTextColor: '#ffffff',
  backgroundColor: '#f4f4f5', // Body/wrapper - SOLID, not transparent
  containerBgColor: '#ffffff',
  headerBgColor: '#fafafa',
  footerBgColor: '#f9fafb',
  textColor: '#374151',
  headingColor: '#111827',
  mutedTextColor: '#6b7280',
  borderColor: '#e5e7eb',
  // Semantic colors
  successColor: '#059669',
  successBgColor: '#f0fdf4',
  errorColor: '#dc2626',
  errorBgColor: '#fef2f2',
  infoBgColor: '#f9fafb',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate absolute URL for email assets
 * Uses APP_URL > NEXTAUTH_URL > NEXT_PUBLIC_APP_URL as base
 */
function getEmailAssetUrl(assetPath: string): string {
  const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || getAppUrl();
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Generate plain text fallback from HTML
 */
export function generateTextFallback(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wrap email content with consistent header/footer layout
 *
 * Uses table-based HTML with inline styles for maximum compatibility.
 * All backgrounds use explicit bgcolor attribute for dark mode defense.
 */
export function emailLayout(content: string, options: LayoutOptions = {}): string {
  const env = getEnv();
  const appName = env.NEXT_PUBLIC_APP_NAME || 'App';
  const appUrl = getAppUrl();
  const supportEmail = env.NEXT_PUBLIC_SUPPORT_EMAIL || '';

  // Merge branding with defaults
  const branding: EmailBranding = { ...defaultBranding, ...options.branding };

  // Header content: logo with fallback to styled text
  // STRATEGY:
  // 1. Prod: EMAIL_LOGO_URL is set -> Use URL
  // 2. Local/SMTP: EMAIL_LOGO_URL is missing -> Use CID (attachment)
  // This requires the sender (smtp.ts) to attach the logo as 'cid:logo' when the env var is missing.
  const logoSrc = process.env.EMAIL_LOGO_URL || 'cid:logo';

  const headerContent = logoSrc
    ? `<img
        src="${logoSrc}"
        alt="${appName}"
        width="150"
        style="display: block; margin: 0 auto; width: 150px; max-width: 150px; height: auto;"
      />`
    : `<h1 style="color: ${branding.primaryColor}; margin: 0; font-size: 24px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${appName}</h1>`;

  // Preheader (hidden preview text)
  const preheader = options.preheader
    ? `<span style="display: none !important; max-height: 0; overflow: hidden; mso-hide: all; font-size: 0; color: ${branding.backgroundColor}; line-height: 0;">${options.preheader}${'&zwnj;&nbsp;'.repeat(30)}</span>`
    : '';

  // Footer links
  const footerLinks = [];
  if (appUrl) {
    footerLinks.push(
      `<a href="${appUrl}" style="color: ${branding.mutedTextColor}; text-decoration: none;">${appUrl.replace(/^https?:\/\//, '')}</a>`
    );
  }
  if (supportEmail) {
    footerLinks.push(
      `<a href="mailto:${supportEmail}" style="color: ${branding.mutedTextColor}; text-decoration: none;">Soporte</a>`
    );
  }
  const footerLinksHtml =
    footerLinks.length > 0
      ? `<p style="margin: 8px 0 0 0; font-size: 12px;">${footerLinks.join(' &bull; ')}</p>`
      : '';

  return `
<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>${appName}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset - only critical styles that can't be inlined */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: ${branding.backgroundColor};" bgcolor="${branding.backgroundColor}">
  ${preheader}

  <!-- Wrapper table -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="${branding.backgroundColor}" style="background-color: ${branding.backgroundColor};">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <!-- Container table (600px max) -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: ${branding.containerBgColor}; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);" bgcolor="${branding.containerBgColor}">

          <!-- Header -->
          <tr>
            <td align="center" bgcolor="${branding.headerBgColor}" style="background-color: ${branding.headerBgColor}; padding: 32px 24px; border-bottom: 1px solid ${branding.borderColor};">
              ${headerContent}
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td bgcolor="${branding.containerBgColor}" style="background-color: ${branding.containerBgColor}; padding: 32px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: ${branding.textColor};">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" bgcolor="${branding.footerBgColor}" style="background-color: ${branding.footerBgColor}; padding: 24px; border-top: 1px solid ${branding.borderColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: ${branding.mutedTextColor}; font-size: 12px;">
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${appName}</p>
              ${footerLinksHtml}
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Button Component
// ─────────────────────────────────────────────────────────────────────────────

export interface ButtonOptions {
  url: string;
  text: string;
  branding?: Partial<EmailBranding>;
}

/**
 * Generate bulletproof CTA button
 * Works in all email clients including Outlook
 */
export function emailButton(options: ButtonOptions): string {
  const branding: EmailBranding = { ...defaultBranding, ...options.branding };

  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 16px 0;">
  <tr>
    <td align="center" bgcolor="${branding.buttonColor}" style="border-radius: 6px; background-color: ${branding.buttonColor};">
      <a href="${options.url}" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600; color: ${branding.buttonTextColor}; text-decoration: none; border-radius: 6px; background-color: ${branding.buttonColor};">
        ${options.text}
      </a>
    </td>
  </tr>
</table>
  `.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export { defaultBranding, getEmailAssetUrl };
