import type { Check, Finding } from '../types';
import { stripCodeBlocks, stripInlineCode } from '../body-utils';

const PREFIX_RE = /\b((?:kb|sk|doc|tk|op|pj|fx)-[a-z][a-z0-9-]*)\b/g;

/**
 * Detect cross-references to skills that do not exist.
 *
 * Scope:
 *   - Scans the body (frontmatter description is excluded — it often includes
 *     narrative mentions that aren't hard links)
 *   - Fenced code blocks AND inline backticks stripped (paths/commands inside
 *     code are data, not references)
 *   - Skips the skill's own name (self-mention is never a broken ref)
 */
export const crossRefsCheck: Check = (skill, ctx): Finding[] => {
  const findings: Finding[] = [];
  const stripped = stripInlineCode(stripCodeBlocks(skill.body));
  const lines = stripped.split('\n');

  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpExecArray | null;
    const re = new RegExp(PREFIX_RE.source, 'g');
    while ((m = re.exec(line)) !== null) {
      const name = m[1];
      if (name === skill.name) continue;
      if (ctx.skillNames.has(name)) continue;

      const key = `${name}@${i}`;
      if (seen.has(key)) continue;
      seen.add(key);

      findings.push({
        skill: skill.name,
        check: 'cross-refs',
        severity: 'error',
        message: `Cross-ref to non-existent skill \`${name}\``,
        line: i + 1,
        hint: `Verify the skill name or remove the reference.`,
      });
    }
  }

  return findings;
};
