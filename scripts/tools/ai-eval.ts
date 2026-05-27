#!/usr/bin/env tsx
/**
 * AI eval harness — ISSUE-050c.
 *
 * Replays each fixture in `tests/ai-eval/golden/*.json` against the
 * relevant analyzer:
 *   - voice-principles → `lintAgentReply` (AI-1..6)
 *   - (future) crisis-detection / vague-language / etc.
 *
 * Exit 0 when pass-rate >= configured threshold per principle. Exit 1
 * otherwise, with a structured report.
 *
 * Usage:
 *   pnpm ai:eval              # run all eval suites
 *
 * Add a fixture: drop it into `tests/ai-eval/golden/<suite>.json` and
 * re-run. The runner is forgiving — fixtures that don't match the
 * known suite schema are reported as warnings, not failures.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { lintAgentReply, type VoicePrinciple } from '../../src/lib/ai/voice-linter';

interface VoiceFixture {
  id: string;
  lang: 'es' | 'en';
  reply: string;
  expect: 'pass' | 'fail';
  /** Required when expect === 'fail'. */
  principles?: VoicePrinciple[];
}

interface VoiceSuite {
  $doc?: string;
  fixtures: VoiceFixture[];
}

interface Counter {
  total: number;
  pass: number;
  fail: number;
  details: Array<{ id: string; reason: string }>;
}

function evalVoiceSuite(suite: VoiceSuite): Counter {
  const c: Counter = { total: 0, pass: 0, fail: 0, details: [] };
  for (const f of suite.fixtures) {
    c.total++;
    const violations = lintAgentReply(f.reply);
    const firedPrinciples = new Set(violations.map((v) => v.principle));
    const isPass = violations.length === 0;

    if (f.expect === 'pass') {
      if (isPass) {
        c.pass++;
      } else {
        c.fail++;
        c.details.push({
          id: f.id,
          reason: `expected pass, got violations: ${violations.map((v) => v.principle).join(', ')}`,
        });
      }
      continue;
    }

    // expect === 'fail'
    if (isPass) {
      c.fail++;
      c.details.push({ id: f.id, reason: 'expected violations but reply linted clean' });
      continue;
    }
    if (f.principles) {
      const missingExpected = f.principles.filter((p) => !firedPrinciples.has(p));
      if (missingExpected.length > 0) {
        c.fail++;
        c.details.push({
          id: f.id,
          reason: `expected ${f.principles.join(',')} to fire; missed ${missingExpected.join(',')}`,
        });
        continue;
      }
    }
    c.pass++;
  }
  return c;
}

function loadSuite(file: string): { suite: VoiceSuite; name: string } | null {
  const raw = readFileSync(file, 'utf8');
  const parsed = JSON.parse(raw) as VoiceSuite;
  if (!Array.isArray(parsed.fixtures)) return null;
  return { suite: parsed, name: file.split(/[\\/]/).pop() ?? file };
}

function main(): void {
  const dir = join(process.cwd(), 'tests', 'ai-eval', 'golden');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.error('No eval fixtures found in tests/ai-eval/golden/');
    process.exit(2);
  }

  let totalAll = 0;
  let passAll = 0;
  const failAll: Array<{ suite: string; id: string; reason: string }> = [];

  for (const f of files) {
    const loaded = loadSuite(join(dir, f));
    if (!loaded) continue;

    let counter: Counter;
    if (f === 'voice-principles.json') {
      counter = evalVoiceSuite(loaded.suite);
    } else {
      console.log(`⚠️  ${loaded.name}: no analyzer registered, skipping`);
      continue;
    }

    totalAll += counter.total;
    passAll += counter.pass;
    failAll.push(...counter.details.map((d) => ({ suite: loaded.name, ...d })));

    const rate = counter.total === 0 ? 0 : Math.round((counter.pass / counter.total) * 100);
    const icon = counter.fail === 0 ? '✅' : '❌';
    console.log(`${icon} ${loaded.name}: ${counter.pass}/${counter.total} (${rate}%)`);
  }

  if (failAll.length > 0) {
    console.log('\nFailures:');
    for (const f of failAll) {
      console.log(`  ✗ [${f.suite}] ${f.id} — ${f.reason}`);
    }
  }

  const overallRate = totalAll === 0 ? 0 : Math.round((passAll / totalAll) * 100);
  console.log(`\nOverall: ${passAll}/${totalAll} (${overallRate}%)`);

  // Threshold: voice-principles must be 100% (frozen safety contract).
  if (failAll.length > 0) {
    process.exit(1);
  }
}

main();
