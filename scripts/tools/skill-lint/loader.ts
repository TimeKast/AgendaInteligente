import { readdirSync, readFileSync, existsSync } from 'fs';
import { basename, join } from 'path';

import type { Skill } from './types';

const SKILLS_DIR = '.claude/skills';

export function loadSkills(repoRoot: string): Skill[] {
  const absDir = join(repoRoot, SKILLS_DIR);
  if (!existsSync(absDir)) return [];

  const skills: Skill[] = [];

  for (const entry of readdirSync(absDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    // _shared holds runtime primitives (no SKILL.md by design — see CC.md §7)
    if (entry.name.startsWith('_')) continue;

    const skillPath = join(absDir, entry.name, 'SKILL.md');
    if (!existsSync(skillPath)) continue;

    const raw = readFileSync(skillPath, 'utf-8');
    const { frontmatter, body } = splitFrontmatter(raw);

    skills.push({
      name: entry.name,
      path: skillPath,
      raw,
      frontmatter,
      body,
      bodyLines: body.split('\n'),
    });
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

function splitFrontmatter(raw: string): { frontmatter: Record<string, string>; body: string } {
  if (!raw.startsWith('---\n') && !raw.startsWith('---\r\n')) {
    return { frontmatter: {}, body: raw };
  }

  // Find the closing `---` delimiter after the opening one
  const lines = raw.split('\n');
  let closeIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      closeIdx = i;
      break;
    }
  }
  if (closeIdx === -1) return { frontmatter: {}, body: raw };

  const fmBlock = lines.slice(1, closeIdx).join('\n');
  const body = lines.slice(closeIdx + 1).join('\n');

  return { frontmatter: parseFrontmatterBlock(fmBlock), body };
}

/**
 * Minimal YAML-ish parser for skill frontmatter.
 *
 * Supports flat `key: value` and multi-line `key: >` folded-scalar blocks.
 * Good enough for the skill corpus — we only extract a few known fields.
 */
function parseFrontmatterBlock(block: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = block.split('\n');

  let currentKey: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (currentKey !== null) {
      result[currentKey] = buffer.join(' ').trim();
    }
    currentKey = null;
    buffer = [];
  };

  for (const raw of lines) {
    const m = raw.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (m && !raw.startsWith(' ') && !raw.startsWith('\t')) {
      flush();
      currentKey = m[1];
      const value = m[2];
      // Folded-scalar start: `key: >` — collect following indented lines
      if (value.trim() === '>' || value.trim() === '|') {
        buffer = [];
        continue;
      }
      buffer = [value];
    } else if (currentKey !== null && (raw.startsWith('  ') || raw.startsWith('\t'))) {
      buffer.push(raw.trim());
    }
  }
  flush();

  return result;
}

export function loadPackageDeps(repoRoot: string): Set<string> {
  const pkgPath = join(repoRoot, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
  };
  return new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
    ...Object.keys(pkg.optionalDependencies ?? {}),
  ]);
}

export function loadHooksRegistry(repoRoot: string): Set<string> {
  const path = join(repoRoot, 'project/reference/HOOKS.md');
  if (!existsSync(path)) return new Set();

  const raw = readFileSync(path, 'utf-8');
  const names = new Set<string>();
  // Entries render as: | `name` | kind | `@/import` | `file` |
  const rowRe = /^\|\s*`([A-Za-z_][A-Za-z0-9_]*)`\s*\|/gm;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(raw)) !== null) {
    names.add(m[1]);
  }
  return names;
}

export function skillBasename(path: string): string {
  return basename(path);
}
