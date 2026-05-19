#!/usr/bin/env node
/**
 * Generate CODEBASE.md — Dependency map for AI agent context
 *
 * Usage: pnpm generate:codebase
 *
 * Scans TypeScript/TSX files, extracts import statements,
 * and generates a dependency graph showing which files depend
 * on which others and who uses them.
 *
 * @see CLN-006
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// ─── Configuration ───────────────────────────────────────────────────────────

const ROOT_DIRS = ['src', 'lib', 'components'];
const EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  'dist',
  'public',
  '__tests__',
  '__mocks__',
  'coverage',
];
const EXCLUDE_PATTERNS = ['.test.', '.spec.', '.mock.', '.stories.'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Recursively collect all source files from a directory
 */
function collectFiles(dir, files = []) {
  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.includes(entry.name)) continue;
      collectFiles(fullPath, files);
    } else if (entry.isFile() && EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      if (EXCLUDE_PATTERNS.some((p) => entry.name.includes(p))) continue;
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Resolve an import path to a real file path
 */
function resolveImport(importPath, fromFile) {
  // Handle @ alias → root-relative
  if (importPath.startsWith('@/')) {
    const resolved = importPath.replace('@/', '');
    return tryResolveFile(resolved);
  }

  // Handle relative imports
  if (importPath.startsWith('.')) {
    const dir = dirname(fromFile);
    const resolved = join(dir, importPath);
    return tryResolveFile(resolved);
  }

  // External package — skip
  return null;
}

/**
 * Try to resolve a path to an actual file (with extension guessing)
 */
function tryResolveFile(filePath) {
  // Try exact path first
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    return filePath;
  }

  // Try with extensions
  for (const ext of EXTENSIONS) {
    const withExt = filePath + ext;
    if (existsSync(withExt)) return withExt;
  }

  // Try index files
  for (const ext of EXTENSIONS) {
    const indexFile = join(filePath, `index${ext}`);
    if (existsSync(indexFile)) return indexFile;
  }

  return null;
}

/**
 * Extract local import paths from a file
 */
function extractImports(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const imports = [];

  // Match: import ... from '...' and import '...'
  const importRegex = /import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    // Only resolve local imports (@ alias or relative)
    if (importPath.startsWith('@/') || importPath.startsWith('.')) {
      imports.push(importPath);
    }
  }

  return imports;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function generateCodebase() {
  const today = new Date().toISOString().split('T')[0];

  // Collect all files
  const allFiles = [];
  for (const dir of ROOT_DIRS) {
    collectFiles(dir, allFiles);
  }

  // Build dependency map: file → [files it imports]
  const dependsOn = new Map();
  // Reverse map: file → [files that import it]
  const usedBy = new Map();

  for (const file of allFiles) {
    const imports = extractImports(file);
    const resolvedDeps = [];

    for (const imp of imports) {
      const resolved = resolveImport(imp, file);
      if (resolved && allFiles.includes(resolved)) {
        resolvedDeps.push(resolved);

        // Build reverse map
        if (!usedBy.has(resolved)) usedBy.set(resolved, []);
        usedBy.get(resolved).push(file);
      }
    }

    dependsOn.set(file, resolvedDeps);
  }

  // ─── Generate Markdown ────────────────────────────────────────────────────

  let md = `# 🗺️ CODEBASE — Dependency Map\n\n`;
  md += `> **Auto-generated** — Run \`pnpm generate:codebase\` to update\n`;
  md += `> **Last updated:** ${today}\n\n`;
  md += `---\n\n`;

  // ─── High-Risk Files (2+ dependents) ──────────────────────────────────────

  const highRisk = [...usedBy.entries()]
    .filter(([, users]) => users.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);

  if (highRisk.length > 0) {
    md += `## ⚠️ High-Risk Files\n\n`;
    md += `> Files with 2+ dependents — changes here may break multiple consumers.\n\n`;
    md += `| File | Dependents |\n`;
    md += `|------|------------|\n`;

    for (const [file, users] of highRisk) {
      md += `| \`${file}\` | ${users.length} |\n`;
    }

    md += `\n---\n\n`;
  }

  // ─── Full Dependency Map ──────────────────────────────────────────────────

  md += `## 📊 Full Dependency Map\n\n`;
  md += `| File | Depends On | Used By |\n`;
  md += `|------|------------|--------|\n`;

  const sortedFiles = [...dependsOn.keys()].sort();

  for (const file of sortedFiles) {
    const deps = dependsOn.get(file) || [];
    const users = usedBy.get(file) || [];

    const depsStr = deps.length > 0 ? deps.map((d) => `\`${d}\``).join(', ') : '—';
    const usersStr = users.length > 0 ? users.map((u) => `\`${u}\``).join(', ') : '—';

    md += `| \`${file}\` | ${depsStr} | ${usersStr} |\n`;
  }

  md += `\n---\n\n`;

  // ─── Summary ──────────────────────────────────────────────────────────────

  const totalFiles = allFiles.length;
  const totalConnections = [...dependsOn.values()].reduce((sum, deps) => sum + deps.length, 0);
  const orphanFiles = allFiles.filter(
    (f) => (dependsOn.get(f) || []).length === 0 && (usedBy.get(f) || []).length === 0
  ).length;

  md += `## 📈 Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total files analyzed | ${totalFiles} |\n`;
  md += `| Total connections | ${totalConnections} |\n`;
  md += `| High-risk files (2+ deps) | ${highRisk.length} |\n`;
  md += `| Orphan files (no connections) | ${orphanFiles} |\n\n`;
  md += `---\n\n_Generated by \`scripts/tools/generate-codebase.mjs\`_\n`;

  return md;
}

// ─── Execute ─────────────────────────────────────────────────────────────────

const output = generateCodebase();
const outputPath = 'project/reference/CODEBASE.md';

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, output);
console.log(`✅ ${outputPath} generated (dependency map)`);
