/**
 * Unit tests — skill:lint checks.
 *
 * Each check gets one happy-path (no findings) + one detection case. Context is
 * synthesized per-test so tests don't depend on repo state.
 */
import { describe, it, expect } from 'vitest';

import { crossRefsCheck } from '@/../scripts/tools/skill-lint/checks/cross-refs';
import { packagesCheck } from '@/../scripts/tools/skill-lint/checks/packages';
import { symbolsCheck } from '@/../scripts/tools/skill-lint/checks/symbols';
import { ruleContradictionsCheck } from '@/../scripts/tools/skill-lint/checks/rule-contradictions';
import { antiEnumerationCheck } from '@/../scripts/tools/skill-lint/checks/anti-enumeration';
import { stalenessCheck } from '@/../scripts/tools/skill-lint/checks/staleness';
import { pairCrossRefsCheck } from '@/../scripts/tools/skill-lint/checks/pair-cross-refs';
import type { LintContext, Skill } from '@/../scripts/tools/skill-lint/types';

function mkSkill(opts: Partial<Skill> & { name: string; body: string }): Skill {
  return {
    name: opts.name,
    path: `/tmp/${opts.name}/SKILL.md`,
    raw: opts.body,
    frontmatter: opts.frontmatter ?? {},
    body: opts.body,
    bodyLines: opts.body.split('\n'),
  };
}

function mkCtx(overrides: Partial<LintContext> = {}): LintContext {
  return {
    skills: [],
    skillNames: new Set(['kb-testing', 'sk-api']),
    packageDeps: new Set(['zod', 'next']),
    hooksRegistry: new Set(['useTableState', 'withAuth']),
    repoRoot: process.cwd(),
    ...overrides,
  };
}

describe('crossRefsCheck', () => {
  it('passes when all refs exist', () => {
    const skill = mkSkill({ name: 'kb-api', body: 'See `sk-api` and `kb-testing` for more.' });
    expect(crossRefsCheck(skill, mkCtx())).toEqual([]);
  });

  it('flags a ref to an unknown skill', () => {
    const skill = mkSkill({ name: 'kb-api', body: 'Bad ref: kb-nonexistent-skill here.' });
    const findings = crossRefsCheck(skill, mkCtx());
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('error');
    expect(findings[0].message).toContain('kb-nonexistent-skill');
  });

  it('ignores self-references', () => {
    const skill = mkSkill({ name: 'kb-api', body: 'Within kb-api we do X.' });
    expect(crossRefsCheck(skill, mkCtx())).toEqual([]);
  });
});

describe('packagesCheck', () => {
  it('passes when all imports are declared', () => {
    const body = '```ts\nimport { z } from "zod";\n```';
    expect(packagesCheck(mkSkill({ name: 'x', body }), mkCtx())).toEqual([]);
  });

  it('flags import from undeclared package', () => {
    const body = '```ts\nimport foo from "not-installed-pkg";\n```';
    const findings = packagesCheck(mkSkill({ name: 'x', body }), mkCtx());
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toContain('not-installed-pkg');
  });

  it('treats server-only and node: prefix as builtins', () => {
    const body = '```ts\nimport "server-only";\nimport { readFile } from "node:fs/promises";\n```';
    expect(packagesCheck(mkSkill({ name: 'x', body }), mkCtx())).toEqual([]);
  });

  it('ignores imports in prose (outside code blocks)', () => {
    const body = 'We recommend `swr` but without importing it anywhere.';
    expect(packagesCheck(mkSkill({ name: 'x', body }), mkCtx())).toEqual([]);
  });
});

describe('symbolsCheck', () => {
  it('passes when symbol exists in HOOKS registry', () => {
    const skill = mkSkill({ name: 'x', body: 'Use `useTableState` for pagination.' });
    expect(symbolsCheck(skill, mkCtx())).toEqual([]);
  });

  it('passes for React framework hooks via allowlist', () => {
    const skill = mkSkill({ name: 'x', body: 'Wrap with `useMemo` and `useCallback`.' });
    expect(symbolsCheck(skill, mkCtx())).toEqual([]);
  });

  it('flags unknown useXxx symbol not in registry or allowlist', () => {
    // Force a symbol that rg won't find (no src/ containing it) by pointing
    // repoRoot at a fresh empty tmpdir is overkill — just pick a gibberish name.
    const skill = mkSkill({
      name: 'x',
      body: 'Use `useZzzGibberishXyz` carefully.',
    });
    const findings = symbolsCheck(skill, mkCtx({ repoRoot: '/tmp/does-not-exist-at-all' }));
    expect(findings.some((f) => f.message.includes('useZzzGibberishXyz'))).toBe(true);
  });
});

describe('ruleContradictionsCheck', () => {
  it('passes on the correct pyramid count', () => {
    const skill = mkSkill({ name: 'x', body: 'The 3-layer pyramid covers unit/component/e2e.' });
    expect(ruleContradictionsCheck(skill, mkCtx())).toEqual([]);
  });

  it('flags a wrong pyramid count in prose', () => {
    const skill = mkSkill({ name: 'x', body: 'The 4-layer pyramid adds integration tests.' });
    const findings = ruleContradictionsCheck(skill, mkCtx());
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toContain('4');
    expect(findings[0].message).toContain('3');
  });

  it('ignores contradictory numbers inside code blocks', () => {
    const skill = mkSkill({
      name: 'x',
      body: '```ts\n// The 7-layer pyramid used to be…\n```',
    });
    expect(ruleContradictionsCheck(skill, mkCtx())).toEqual([]);
  });
});

describe('antiEnumerationCheck', () => {
  it('passes when <=8 symbols enumerated', () => {
    const body = 'Use `useA`, `useB`, `useC`, `useD`.';
    expect(antiEnumerationCheck(mkSkill({ name: 'x', body }), mkCtx())).toEqual([]);
  });

  it('flags >8 enumerated without anchor', () => {
    const syms = Array.from(
      { length: 10 },
      (_, i) => `\`use${String.fromCharCode(65 + i)}xx\``
    ).join(', ');
    const body = `Hooks: ${syms}.`;
    const findings = antiEnumerationCheck(mkSkill({ name: 'x', body }), mkCtx());
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
  });

  it('passes when anchored to HOOKS.md even with many symbols', () => {
    const syms = Array.from(
      { length: 10 },
      (_, i) => `\`use${String.fromCharCode(65 + i)}xx\``
    ).join(', ');
    const body = `See project/reference/HOOKS.md for canonical list. Hooks: ${syms}.`;
    expect(antiEnumerationCheck(mkSkill({ name: 'x', body }), mkCtx())).toEqual([]);
  });
});

describe('stalenessCheck', () => {
  it('passes when last-verified is recent', () => {
    const today = new Date().toISOString().slice(0, 10);
    const skill = mkSkill({
      name: 'x',
      body: '',
      frontmatter: { 'last-verified': today },
    });
    expect(stalenessCheck(skill, mkCtx())).toEqual([]);
  });

  it('warns when the field is missing', () => {
    const skill = mkSkill({ name: 'x', body: '', frontmatter: {} });
    const findings = stalenessCheck(skill, mkCtx());
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
    expect(findings[0].message).toContain('missing');
  });

  it('warns when last-verified is older than 90 days', () => {
    const skill = mkSkill({
      name: 'x',
      body: '',
      frontmatter: { 'last-verified': '2000-01-01' },
    });
    const findings = stalenessCheck(skill, mkCtx());
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toMatch(/days old/);
  });
});

describe('pairCrossRefsCheck', () => {
  it('passes when all 3 anchors are present in a declared pair half', () => {
    const body = [
      '# kb-security',
      '',
      '> Pair: [`sk-security`](../sk-security/SKILL.md) — kit-shipped primitives.',
      '',
      '## Body',
      '',
      'content here',
      '',
      '_Cross-reference: [`sk-security`](../sk-security/SKILL.md) — kit infra._',
    ].join('\n');
    const skill = mkSkill({
      name: 'kb-security',
      body,
      frontmatter: { description: 'Portable auth patterns. For kit infra → `sk-security`.' },
    });
    expect(pairCrossRefsCheck(skill, mkCtx())).toEqual([]);
  });

  it('flags missing body opener "Pair:" with a single finding', () => {
    const body = [
      '# kb-security',
      '',
      '## Body',
      '',
      'content here',
      '',
      '_Cross-reference: [`sk-security`](../sk-security/SKILL.md)._',
    ].join('\n');
    const skill = mkSkill({
      name: 'kb-security',
      body,
      frontmatter: { description: 'For kit infra → `sk-security`.' },
    });
    const ctx = mkCtx({ skillNames: new Set(['kb-security', 'sk-security']) });
    const findings = pairCrossRefsCheck(skill, ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('error');
    expect(findings[0].message).toContain('body opener');
    expect(findings[0].message).toContain('Pair:');
  });

  it('flags all 3 anchors missing with 3 findings', () => {
    const skill = mkSkill({
      name: 'kb-ui',
      body: 'plain body with no anchors at all',
      frontmatter: { description: 'Portable UI patterns — no partner mention.' },
    });
    const ctx = mkCtx({ skillNames: new Set(['kb-ui', 'sk-ui']) });
    const findings = pairCrossRefsCheck(skill, ctx);
    expect(findings).toHaveLength(3);
    expect(findings.every((f) => f.severity === 'error')).toBe(true);
    expect(findings.every((f) => f.check === 'pair-cross-refs')).toBe(true);
    const messages = findings.map((f) => f.message).join('|');
    expect(messages).toContain('description');
    expect(messages).toContain('body opener');
    expect(messages).toContain('footer');
  });

  it('ignores skills not declared in PAIRS', () => {
    const skill = mkSkill({
      name: 'kb-debug',
      body: 'no anchors anywhere',
      frontmatter: { description: 'Some unrelated skill.' },
    });
    expect(pairCrossRefsCheck(skill, mkCtx())).toEqual([]);
  });

  it('accepts description arrow without backticks around partner name', () => {
    const body = [
      '> Pair: [sk-security](../sk-security/SKILL.md).',
      '',
      '_Cross-reference: sk-security._',
    ].join('\n');
    const skill = mkSkill({
      name: 'kb-security',
      body,
      frontmatter: { description: 'Portable auth. For kit infra → sk-security.' },
    });
    expect(pairCrossRefsCheck(skill, mkCtx())).toEqual([]);
  });

  it('skips enforcement when partner is absent from project (portability)', () => {
    // Simulates a derived project that took kb-security but not sk-security —
    // kb-security must NOT be required to point to a non-existent partner,
    // otherwise portability breaks.
    const skill = mkSkill({
      name: 'kb-security',
      body: 'body with no anchors at all',
      frontmatter: { description: 'No partner mention.' },
    });
    const ctxPartnerAbsent = mkCtx({ skillNames: new Set(['kb-security']) });
    expect(pairCrossRefsCheck(skill, ctxPartnerAbsent)).toEqual([]);
  });
});
