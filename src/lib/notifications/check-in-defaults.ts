/**
 * Default copy for the 3 daily check-ins.
 *
 * The user can override any field from `/settings/notifications` (stored
 * as nullable columns on `notification_prefs`). The fan-out handlers
 * call `resolveCheckInCopy()` to merge the override on top of these
 * defaults; empty / null overrides fall back to the strings here.
 *
 * Midday body supports a single `{win}` placeholder that the handler
 * substitutes with the user's first planned win of the day. If the user
 * keeps the default OR their custom body uses `{win}`, the substitution
 * happens server-side before push delivery. Bodies without the token
 * are sent verbatim.
 *
 * Linked: FT-085, US-085, check-in-handlers.
 */

export type DailySlot = 'morning' | 'midday' | 'evening';
export type Lang = 'es' | 'en';

interface SlotCopy {
  title: string;
  body: string;
}

const DEFAULTS: Record<Lang, Record<DailySlot, SlotCopy>> = {
  es: {
    morning: { title: 'Buenos días', body: '¿Cuál es la intención de hoy?' },
    midday: { title: 'Mediodía', body: 'Dijiste que ibas a {win}. ¿Cómo va?' },
    evening: { title: 'Cerramos el día', body: 'Una frase para cerrar?' },
  },
  en: {
    morning: { title: 'Good morning', body: "What's today's intention?" },
    midday: { title: 'Quick check', body: "You said you'd {win}. How's it going?" },
    evening: { title: 'Closing the day', body: 'One sentence to close?' },
  },
};

/** Default title + body for a slot in a given language. */
export function defaultCopy(slot: DailySlot, lang: Lang): SlotCopy {
  return DEFAULTS[lang][slot];
}

interface CopyOverrides {
  morningTitle?: string | null;
  morningBody?: string | null;
  middayTitle?: string | null;
  middayBody?: string | null;
  eveningTitle?: string | null;
  eveningBody?: string | null;
}

/**
 * Resolve the final `{ title, body }` for a slot:
 *   1. Pick override if present + non-empty (trimmed), else default.
 *   2. If body contains `{win}` and `anchor` is provided, substitute.
 *      No anchor → strip the token cleanly (no awkward "ibas a ." text).
 */
export function resolveCheckInCopy(
  slot: DailySlot,
  lang: Lang,
  overrides: CopyOverrides,
  anchor?: string
): SlotCopy {
  const def = defaultCopy(slot, lang);
  const titleOverride =
    slot === 'morning'
      ? overrides.morningTitle
      : slot === 'midday'
        ? overrides.middayTitle
        : overrides.eveningTitle;
  const bodyOverride =
    slot === 'morning'
      ? overrides.morningBody
      : slot === 'midday'
        ? overrides.middayBody
        : overrides.eveningBody;

  const title = titleOverride && titleOverride.trim().length > 0 ? titleOverride.trim() : def.title;
  let body = bodyOverride && bodyOverride.trim().length > 0 ? bodyOverride.trim() : def.body;

  if (body.includes('{win}')) {
    if (anchor && anchor.trim().length > 0) {
      body = body.replaceAll('{win}', anchor.trim());
    } else {
      // No anchor available — drop the token and collapse double spaces /
      // trailing punctuation that would look broken.
      body = body
        .replaceAll('{win}', '')
        .replace(/\s{2,}/g, ' ')
        .replace(/\s+([.,;:!?])/g, '$1')
        .trim();
    }
  }

  return { title, body };
}
