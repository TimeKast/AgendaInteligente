import type { Check, Finding } from '../types';

/**
 * Enforce the bidirectional cross-reference pattern for declared `kb-*` ↔ `sk-*`
 * pairs (CC.md §7). Each half of a pair must carry 3 anchors:
 *
 *   1. Frontmatter `description` closes with `→ {partner}` (backticks optional)
 *   2. Body opener (first ~10 lines) contains literal `Pair:`
 *   3. Footer (last ~20 lines) contains literal `Cross-reference:`
 *
 * A missing anchor emits one P1 error. Rationale: silent drift in routing
 * anchors breaks semantic auto-loading without visible failure.
 *
 * To retire a pair (e.g., post-merge), remove its row from `PAIRS`.
 */

const PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['kb-security', 'sk-security'],
  ['kb-api', 'sk-api'],
  ['kb-db', 'sk-db'],
  ['kb-testing-nextjs', 'sk-testing-nextjs'],
  ['kb-ui', 'sk-ui'],
] as const;

const OPENER_LINES = 10;
const FOOTER_LINES = 20;

const SKILLS_IN_PAIRS = new Set<string>(PAIRS.flatMap(([a, b]) => [a, b]));

function partnerOf(name: string): string | null {
  for (const [a, b] of PAIRS) {
    if (name === a) return b;
    if (name === b) return a;
  }
  return null;
}

function hasDescriptionArrow(description: string, partner: string): boolean {
  const re = new RegExp(`→\\s*\`?${partner}\`?`);
  return re.test(description);
}

function openerHasPair(bodyLines: readonly string[]): boolean {
  return bodyLines.slice(0, OPENER_LINES).some((l) => l.includes('Pair:'));
}

function footerHasCrossReference(bodyLines: readonly string[]): boolean {
  return bodyLines.slice(-FOOTER_LINES).some((l) => l.includes('Cross-reference:'));
}

export const pairCrossRefsCheck: Check = (skill, ctx): Finding[] => {
  if (!SKILLS_IN_PAIRS.has(skill.name)) return [];

  const partner = partnerOf(skill.name);
  if (!partner) return [];

  // Portability guard: kb-* halves must stay portable to derived projects
  // that may not adopt the sk-* counterpart. Only enforce anchors when the
  // partner actually ships in this project. Asymmetric in intent, symmetric
  // in code — the guard fires for either half when its partner is absent.
  if (!ctx.skillNames.has(partner)) return [];

  const findings: Finding[] = [];
  const description = skill.frontmatter.description ?? '';

  if (!hasDescriptionArrow(description, partner)) {
    findings.push({
      skill: skill.name,
      check: 'pair-cross-refs',
      severity: 'error',
      message: `Missing description closing anchor — expected \`→ ${partner}\` in frontmatter description`,
      hint: `Append a closing sentence like "For kit-shipped primitives → \`${partner}\`" (or "For portable patterns → \`${partner}\`" in the sk-* half).`,
    });
  }

  if (!openerHasPair(skill.bodyLines)) {
    findings.push({
      skill: skill.name,
      check: 'pair-cross-refs',
      severity: 'error',
      message: `Missing body opener anchor — expected literal \`Pair:\` in first ${OPENER_LINES} lines of body`,
      hint: `Add a line near the top (inside a blockquote is fine) like "> Pair: [\`${partner}\`](../${partner}/SKILL.md) — …".`,
    });
  }

  if (!footerHasCrossReference(skill.bodyLines)) {
    findings.push({
      skill: skill.name,
      check: 'pair-cross-refs',
      severity: 'error',
      message: `Missing footer anchor — expected literal \`Cross-reference:\` in last ${FOOTER_LINES} lines of body`,
      hint: `Add a footer line like "_Cross-reference: [\`${partner}\`](../${partner}/SKILL.md) — …_".`,
    });
  }

  return findings;
};
