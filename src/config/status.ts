/**
 * Status Design Tokens
 *
 * Centralized styling for entity status indicators (active/inactive).
 * Uses `color-500/15` opacity for backgrounds — works in ALL themes
 * without needing `dark:` variants.
 *
 * @example
 * import { STATUS_STYLES, getStatusStyle } from '@/config/status';
 *
 * const style = getStatusStyle('active');
 * <span className={style.badge}>Activo</span>
 */

export interface StatusStyle {
  /** Classes for badge pill (bg + text) */
  badge: string;
  /** Class for dot indicator (e.g., in TableFilter) */
  dot: string;
  /** Class for standalone text */
  text: string;
  /** Display label */
  label: string;
}

const DEFAULT_STATUS_STYLE: StatusStyle = {
  badge: 'bg-badge-slate-bg text-badge-slate-text',
  dot: 'bg-badge-slate-dot',
  text: 'text-badge-slate-text',
  label: 'Desconocido',
};

export const STATUS_STYLES: Record<string, StatusStyle> = {
  active: {
    badge: 'bg-badge-emerald-bg text-badge-emerald-text',
    dot: 'bg-badge-emerald-dot',
    text: 'text-badge-emerald-text',
    label: 'Activo',
  },
  inactive: {
    badge: 'bg-badge-red-bg text-badge-red-text',
    dot: 'bg-badge-red-dot',
    text: 'text-badge-red-text',
    label: 'Inactivo',
  },
};

/** Get status style object. Falls back to neutral gray. */
export function getStatusStyle(status: string): StatusStyle {
  return STATUS_STYLES[status] || DEFAULT_STATUS_STYLE;
}
