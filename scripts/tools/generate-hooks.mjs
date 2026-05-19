#!/usr/bin/env node
/**
 * Generate HOOKS.md — Canonical registry of kit-shipped hooks, helpers, and
 * exported building blocks (action wrappers, DB helpers, form kit, UI wrappers).
 *
 * Usage: pnpm generate:hooks
 *
 * This is the SSOT skills anchor to when they need to reference a hook or
 * helper by name. See FX-004.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join, relative } from 'path';

// =============================================================================
// Scan targets — ordered for output
// =============================================================================
//
// Each category declares either:
//   - `glob`  → scan a directory, parse per-file exports
//   - `files` → explicit list of files to parse (barrels or single-purpose)
//
// `kind` filters what counts as an entry:
//   - 'value'     → functions, consts, classes (skip types/interfaces)
//   - 'component' → same, but hint output as React component
//
// `viaBarrel: true` means parse `export { A, B, type C }` statements from the
// barrel file itself (used for form/index.ts where the barrel is authoritative).

const CATEGORIES = [
  {
    label: 'Hooks',
    dir: 'src/lib/hooks',
    importPrefix: '@/lib/hooks',
    exclude: ['index.ts'],
    kind: 'value',
  },
  {
    label: 'Action Helpers',
    files: ['src/lib/actions/helpers.ts'],
    importPrefix: '@/lib/actions/helpers',
    kind: 'value',
  },
  {
    label: 'DB Helpers',
    dir: 'src/lib/db/helpers',
    importPrefix: '@/lib/db/helpers',
    kind: 'value',
  },
  {
    label: 'DB Utils',
    dir: 'src/lib/db/utils',
    importPrefix: '@/lib/db/utils',
    kind: 'value',
  },
  {
    label: 'Form Kit',
    files: ['src/components/form/index.ts'],
    importPrefix: '@/components/form',
    viaBarrel: true,
    kind: 'value',
  },
  {
    label: 'Common Components',
    dir: 'src/components/common',
    importPrefix: '@/components/common',
    exclude: ['index.ts'],
    kind: 'component',
  },
  {
    label: 'UI Wrappers (kit-shipped)',
    files: ['src/components/ui/confirm-dialog.tsx'],
    importPrefix: '@/components/ui',
    kind: 'component',
  },
];

// =============================================================================
// Parsing
// =============================================================================

/**
 * Extract top-level named exports from a single file's source text.
 *
 * Handles:
 *   export function foo(...)
 *   export async function foo(...)
 *   export const foo = ...
 *   export class Foo ...
 *   export { A, B, type C }  (types skipped)
 *
 * Returns entries like: { name, kind: 'function'|'const'|'class'|'reexport' }
 */
function parseExports(source) {
  const entries = [];

  // Per-line scan: cheap, but we only consider lines starting with `export `
  // (no multi-line exports to worry about for the kit's style).
  const lines = source.split('\n');

  for (const raw of lines) {
    const line = raw.trimStart();
    if (!line.startsWith('export ')) continue;

    // Skip default + re-export-all
    if (line.startsWith('export default')) continue;
    if (line.startsWith('export *')) continue;

    // Skip types/interfaces at top level — registry is for runtime exports
    if (/^export\s+(type|interface)\s+/.test(line)) continue;

    // export async function <name>
    let m = line.match(/^export\s+async\s+function\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (m) {
      entries.push({ name: m[1], kind: 'async function' });
      continue;
    }

    // export function <name>
    m = line.match(/^export\s+function\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (m) {
      entries.push({ name: m[1], kind: 'function' });
      continue;
    }

    // export const <name>
    m = line.match(/^export\s+const\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (m) {
      entries.push({ name: m[1], kind: 'const' });
      continue;
    }

    // export class <name>
    m = line.match(/^export\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (m) {
      entries.push({ name: m[1], kind: 'class' });
      continue;
    }

    // export { A, B, type C } (barrel re-exports)
    m = line.match(/^export\s*\{([^}]+)\}/);
    if (m) {
      const names = m[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        // Drop `type Foo` and `type Foo as Bar` — we only track values
        .filter((s) => !s.startsWith('type '))
        // Handle `foo as bar` — registry shows the external name (bar)
        .map((s) => {
          const asMatch = s.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+as\s+([A-Za-z_][A-Za-z0-9_]*)$/);
          return asMatch ? asMatch[2] : s;
        })
        .filter((s) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(s));

      for (const name of names) {
        entries.push({ name, kind: 'reexport' });
      }
    }
  }

  // Dedupe by name (re-exports can also appear as local exports)
  const seen = new Set();
  return entries.filter((e) => {
    if (seen.has(e.name)) return false;
    seen.add(e.name);
    return true;
  });
}

/**
 * Classify an entry by naming convention.
 *   useXxx       → hook
 *   PascalCase   → component (for 'component' categories) or class
 *   camelCase    → function / const
 *   UPPER_CASE   → constant
 */
function classify(entry, categoryKind) {
  const { name, kind } = entry;

  if (/^use[A-Z]/.test(name)) return 'hook';
  if (/^[A-Z_]+$/.test(name)) return 'constant';
  if (/^[A-Z]/.test(name)) {
    if (categoryKind === 'component') return 'component';
    if (kind === 'class') return 'class';
    return 'component'; // PascalCase function — likely a component (Can, RequireRole)
  }
  return kind === 'async function' ? 'async function' : kind === 'const' ? 'const' : 'function';
}

// =============================================================================
// Directory scan
// =============================================================================

function scanFiles(category) {
  const files = [];

  if (category.files) {
    for (const f of category.files) {
      if (existsSync(f)) files.push(f);
    }
  }

  if (category.dir && existsSync(category.dir)) {
    const excludes = new Set(category.exclude || []);
    for (const entry of readdirSync(category.dir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      if (excludes.has(entry.name)) continue;
      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      files.push(join(category.dir, entry.name));
    }
  }

  return files.sort();
}

/**
 * Convert a source file path to the `@/`-aliased module path a consumer would
 * use to import from it directly.
 *
 *   src/lib/hooks/usePermissions.tsx → @/lib/hooks/usePermissions
 *   src/lib/actions/helpers.ts       → @/lib/actions/helpers
 *   src/components/ui/confirm-dialog.tsx → @/components/ui/confirm-dialog
 */
function fileToModulePath(file) {
  return file.replace(/\.(ts|tsx)$/, '').replace(/^src\//, '@/');
}

/**
 * Determine the canonical import path for a given export.
 *
 * If the category declares itself as barrel-authoritative (`viaBarrel`) or the
 * name is re-exported from the directory's `index.ts`, the barrel is the
 * canonical entry point. Otherwise the importer must go direct to the source
 * file.
 *
 * This avoids lying in the registry: `Can` sits in `usePermissions.tsx` but is
 * NOT re-exported from `lib/hooks/index.ts`, so `import { Can } from '@/lib/hooks'`
 * would fail — the correct path is `@/lib/hooks/usePermissions`.
 */
function resolveImportPath(category, name, file, barrelNames) {
  if (category.viaBarrel) return category.importPrefix;
  if (barrelNames.has(name)) return category.importPrefix;
  return fileToModulePath(file);
}

function collectBarrelNames(category) {
  if (!category.dir) return new Set();
  const barrelPath = join(category.dir, 'index.ts');
  if (!existsSync(barrelPath)) return new Set();

  const source = readFileSync(barrelPath, 'utf-8');
  const names = new Set();
  for (const exp of parseExports(source)) {
    names.add(exp.name);
  }
  return names;
}

function collectEntries(category) {
  const files = scanFiles(category);
  const barrelNames = collectBarrelNames(category);
  const rows = [];

  for (const file of files) {
    const source = readFileSync(file, 'utf-8');
    const exports = parseExports(source);

    for (const exp of exports) {
      rows.push({
        name: exp.name,
        kind: classify(exp, category.kind),
        importPath: resolveImportPath(category, exp.name, file, barrelNames),
        file: relative(process.cwd(), file),
      });
    }
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

// =============================================================================
// Markdown rendering
// =============================================================================

function renderCategory(category, rows) {
  if (rows.length === 0) return '';

  let md = `## ${category.label}\n\n`;
  md += `📦 \`${category.importPrefix}\`\n\n`;
  md += `| Name | Kind | Import | File |\n`;
  md += `|------|------|--------|------|\n`;

  for (const row of rows) {
    md += `| \`${row.name}\` | ${row.kind} | \`${row.importPath}\` | \`${row.file}\` |\n`;
  }

  md += '\n---\n\n';
  return md;
}

function generate() {
  const today = new Date().toISOString().split('T')[0];

  let md = `# 🪝 HOOKS & HELPERS REGISTRY\n\n`;
  md += `> **Auto-generated** — Run \`pnpm generate:hooks\` to update. Regenerated automatically on pre-commit.\n`;
  md += `> **Purpose:** Canonical names and import paths for kit-shipped hooks, action wrappers, DB helpers, form kit, and UI wrappers. Skills and code generation MUST grep this file instead of inventing names.\n`;
  md += `> **Last updated:** ${today}\n\n`;
  md += `**Scope:** runtime value exports only (functions, components, consts, classes). Types and interfaces are intentionally excluded — signatures live in the source files.\n\n`;
  md += `---\n\n`;

  let totalRows = 0;
  const summary = [];

  for (const category of CATEGORIES) {
    const rows = collectEntries(category);
    totalRows += rows.length;
    summary.push({ label: category.label, count: rows.length });
    md += renderCategory(category, rows);
  }

  md += `## 📊 Summary\n\n`;
  md += `| Category | Count |\n`;
  md += `|----------|-------|\n`;
  for (const { label, count } of summary) {
    md += `| ${label} | ${count} |\n`;
  }
  md += `| **Total** | **${totalRows}** |\n\n`;
  md += `---\n\n_Generated by \`scripts/tools/generate-hooks.mjs\` — FX-004_\n`;

  return md;
}

// =============================================================================
// Main
// =============================================================================

const output = generate();
const outputPath = 'project/reference/HOOKS.md';

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, output);
console.log(`✅ ${outputPath} generated`);
