#!/usr/bin/env tsx
/**
 * skill:lint — Validate skill content against the codebase and rules.
 *
 * Usage:
 *   pnpm skill:lint               # human output
 *   pnpm skill:lint --json        # machine-readable
 *   pnpm skill:lint --help
 *
 * Exit codes:
 *   0 — zero errors (warnings do not fail)
 *   1 — one or more errors
 *   2 — usage error
 *
 * See: project/backlog/v6.0/issues/FX-001-skill-lint-validator.md
 */

import { loadHooksRegistry, loadPackageDeps, loadSkills } from './loader';
import type { Check, Finding, LintContext, Skill } from './types';

import { crossRefsCheck } from './checks/cross-refs';
import { packagesCheck } from './checks/packages';
import { symbolsCheck } from './checks/symbols';
import { ruleContradictionsCheck } from './checks/rule-contradictions';
import { antiEnumerationCheck } from './checks/anti-enumeration';
import { stalenessCheck } from './checks/staleness';
import { pairCrossRefsCheck } from './checks/pair-cross-refs';

const HELP = `skill:lint — validate .claude/skills/*/SKILL.md against repo state

Usage:
  pnpm skill:lint             Run all checks, print colored summary
  pnpm skill:lint --json      Emit findings as JSON array (one obj per finding)
  pnpm skill:lint --help      Show this message

Checks (P1 — errors):
  cross-refs            Reference to a non-existent skill (kb-/sk-/...)
  packages              Import from a package not in package.json
  symbols               Mention of useX / withX / xFields not in HOOKS.md or src/
  rule-contradictions   Disagrees with a numeric rule (pyramid layers, max auto-skills)
  pair-cross-refs       Declared kb-*/sk-* pair missing a routing anchor (CC.md §7)

Checks (P2 — warnings):
  anti-enumeration      >8 symbol names listed without an anchor to the registry
  staleness             Frontmatter missing \`last-verified\` or >90 days old

Exit: 0 clean / 1 errors / 2 usage error
`;

const CHECKS: Check[] = [
  crossRefsCheck,
  packagesCheck,
  symbolsCheck,
  ruleContradictionsCheck,
  antiEnumerationCheck,
  stalenessCheck,
  pairCrossRefsCheck,
];

interface CliArgs {
  json: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { json: false, help: false };
  for (const a of argv) {
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--json') args.json = true;
    else {
      process.stderr.write(`unknown flag: ${a}\n${HELP}`);
      process.exit(2);
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// ANSI colors — only when stdout is a TTY
// ---------------------------------------------------------------------------

const ttyColor = process.stdout.isTTY && process.env.NO_COLOR !== '1';
const c = {
  red: (s: string) => (ttyColor ? `\x1b[31m${s}\x1b[0m` : s),
  yellow: (s: string) => (ttyColor ? `\x1b[33m${s}\x1b[0m` : s),
  green: (s: string) => (ttyColor ? `\x1b[32m${s}\x1b[0m` : s),
  dim: (s: string) => (ttyColor ? `\x1b[2m${s}\x1b[0m` : s),
  bold: (s: string) => (ttyColor ? `\x1b[1m${s}\x1b[0m` : s),
};

function runChecks(skills: Skill[], ctx: LintContext): Finding[] {
  const findings: Finding[] = [];
  for (const skill of skills) {
    for (const check of CHECKS) {
      findings.push(...check(skill, ctx));
    }
  }
  return findings;
}

function groupBy<T, K extends string>(items: T[], key: (t: T) => K): Map<K, T[]> {
  const out = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const arr = out.get(k);
    if (arr) arr.push(item);
    else out.set(k, [item]);
  }
  return out;
}

function renderHuman(skills: Skill[], findings: Finding[], elapsedMs: number): void {
  const bySkill = groupBy(findings, (f) => f.skill);
  const sortedNames = skills.map((s) => s.name);

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const name of sortedNames) {
    const list = bySkill.get(name) ?? [];
    const errors = list.filter((f) => f.severity === 'error').length;
    const warnings = list.filter((f) => f.severity === 'warning').length;
    totalErrors += errors;
    totalWarnings += warnings;

    if (errors === 0 && warnings === 0) {
      process.stdout.write(`${c.green('✅')} ${name}\n`);
      continue;
    }

    const parts: string[] = [];
    if (errors > 0) parts.push(c.red(`${errors} error${errors === 1 ? '' : 's'}`));
    if (warnings > 0) parts.push(c.yellow(`${warnings} warning${warnings === 1 ? '' : 's'}`));

    const icon = errors > 0 ? c.red('❌') : c.yellow('⚠️');
    process.stdout.write(`${icon}  ${c.bold(name)} (${parts.join(', ')})\n`);

    for (const f of list) {
      const tag = f.severity === 'error' ? c.red('error') : c.yellow('warn');
      const lineRef = f.line ? c.dim(`:${f.line}`) : '';
      process.stdout.write(`   ${tag} ${c.dim(`[${f.check}]`)} ${f.message}${lineRef}\n`);
      if (f.hint) process.stdout.write(`        ${c.dim('→ ' + f.hint)}\n`);
    }
  }

  process.stdout.write('\n');
  process.stdout.write(
    c.bold(
      `Scanned ${skills.length} skills in ${elapsedMs}ms — ` +
        `${c.red(`${totalErrors} errors`)}, ${c.yellow(`${totalWarnings} warnings`)}\n`
    )
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(HELP);
    process.exit(0);
  }

  const repoRoot = process.cwd();
  const t0 = Date.now();

  const skills = loadSkills(repoRoot);
  if (skills.length === 0) {
    process.stderr.write(`no skills found under ${repoRoot}/.claude/skills\n`);
    process.exit(2);
  }

  const ctx: LintContext = {
    skills,
    skillNames: new Set(skills.map((s) => s.name)),
    packageDeps: loadPackageDeps(repoRoot),
    hooksRegistry: loadHooksRegistry(repoRoot),
    repoRoot,
  };

  const findings = runChecks(skills, ctx);
  const elapsed = Date.now() - t0;

  if (args.json) {
    process.stdout.write(JSON.stringify(findings, null, 2) + '\n');
  } else {
    renderHuman(skills, findings, elapsed);
  }

  const errors = findings.filter((f) => f.severity === 'error').length;
  process.exit(errors > 0 ? 1 : 0);
}

main();
