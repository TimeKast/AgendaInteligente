/**
 * Lightweight User-Agent parser for push device labels.
 *
 * Returns a friendly "Browser en OS" string for display in the
 * "Mis dispositivos" list. Falls back to "Dispositivo desconocido"
 * when the UA is empty or doesn't match common patterns.
 *
 * No external library — the matching surface is intentionally narrow:
 * we only need to disambiguate a user's own devices (Chrome desktop vs
 * Safari iPhone vs Firefox laptop), not classify every UA on Earth.
 */

interface ParsedUserAgent {
  browser: string;
  os: string;
  /** Combined "Browser en OS" for direct display */
  label: string;
}

const UNKNOWN: ParsedUserAgent = {
  browser: 'Dispositivo desconocido',
  os: '',
  label: 'Dispositivo desconocido',
};

export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  if (!ua) return UNKNOWN;

  const browser = detectBrowser(ua);
  const os = detectOs(ua);

  if (!browser && !os) return UNKNOWN;

  const label = browser && os ? `${browser} en ${os}` : browser || os;
  return { browser: browser || 'Dispositivo desconocido', os, label };
}

function detectBrowser(ua: string): string {
  // Order matters: Edge / Opera / Brave / Vivaldi advertise as Chrome too,
  // so they must be checked before plain Chrome.
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/Vivaldi/.test(ua)) return 'Vivaldi';
  if (/Brave/.test(ua)) return 'Brave';
  if (/Firefox\//.test(ua)) return 'Firefox';
  // Safari must be checked before Chrome too — but Chrome also includes "Safari"
  // in its UA, so we test for Chrome first and fall through to Safari only if Chrome fails.
  if (/Chrome\/|CriOS\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return '';
}

function detectOs(ua: string): string {
  if (/iPad/.test(ua)) return 'iPad';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/Android/.test(ua)) return 'Android';
  if (/Mac OS X|Macintosh/.test(ua)) return 'macOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Linux/.test(ua)) return 'Linux';
  return '';
}
