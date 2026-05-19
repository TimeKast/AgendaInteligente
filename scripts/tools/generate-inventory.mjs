#!/usr/bin/env node
/**
 * Generate INVENTORY.md - Catalog of starter kit components
 *
 * Usage: pnpm generate:inventory
 *
 * This script scans the codebase and generates a markdown inventory
 * of all components, hooks, utilities, dependencies, and routes
 * for AI agent reference.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { basename, dirname, join } from 'path';

const DIRS_TO_SCAN = [
  // UI Components
  { path: 'components/ui', category: 'UI Primitives (shadcn)' },
  { path: 'components/common', category: 'Common Components' },
  { path: 'components/layout', category: 'Layout Components' },
  { path: 'components/form', category: 'Form Components' },
  { path: 'components/dashboard', category: 'Dashboard Components' },
  { path: 'components/auth', category: 'Auth Components' },
  { path: 'components/pwa', category: 'PWA Components' },
  { path: 'components/branding', category: 'Branding Components' },
  { path: 'components/providers', category: 'Providers' },

  // Hooks
  { path: 'lib/hooks', category: 'Hooks' },

  // Library
  { path: 'lib/auth', category: 'Auth Utilities' },
  { path: 'lib/db/schema', category: 'Database Schema' },
  { path: 'lib/email/templates', category: 'Email Templates' },
  { path: 'lib/utils', category: 'Utilities' },
  { path: 'lib/pwa', category: 'PWA Utilities' },
];

/**
 * Scan a directory for TypeScript/TSX files
 */
function scanDir(dir, pattern) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true })
    .filter((f) => f.isFile() && (f.name.endsWith('.ts') || f.name.endsWith('.tsx')))
    .filter((f) => !f.name.startsWith('index'))
    .filter((f) => !pattern || pattern.test(f.name))
    .map((f) => basename(f.name, f.name.endsWith('.tsx') ? '.tsx' : '.ts'))
    .sort();
}

/**
 * Get dependencies from package.json
 */
function getDependencies() {
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
  const deps = Object.entries(pkg.dependencies || {}).map(([name, version]) => ({
    name,
    version: version.replace(/^\^|~/, ''),
  }));
  return deps.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get npm scripts from package.json
 */
function getScripts() {
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
  return Object.entries(pkg.scripts || {}).map(([name, command]) => ({
    name,
    command: command.length > 50 ? command.substring(0, 47) + '...' : command,
  }));
}

/**
 * Scan app directory for routes
 */
function scanRoutes(dir, prefix = '') {
  if (!existsSync(dir)) return [];

  const routes = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Handle route groups like (auth), (dashboard)
      let routeSegment = entry.name;
      if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
        routeSegment = ''; // Route groups don't add to URL
      }

      const newPrefix = routeSegment ? `${prefix}/${routeSegment}` : prefix;
      routes.push(...scanRoutes(fullPath, newPrefix));
    } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
      routes.push({
        route: prefix || '/',
        file: fullPath,
        type: 'page',
      });
    } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
      routes.push({
        route: prefix || '/',
        file: fullPath,
        type: 'api',
      });
    }
  }

  return routes;
}

/**
 * Generate the inventory markdown content
 */
function generateInventory() {
  const today = new Date().toISOString().split('T')[0];

  let md = `# 📦 INVENTORY

> **Auto-generated** — Run \`pnpm generate:inventory\` to update
> **Regla:** SIEMPRE consultar antes de crear algo nuevo.
> **Last updated:** ${today}

---

`;

  let totalItems = 0;

  // ============ DEPENDENCIES SECTION ============
  const deps = getDependencies();
  if (deps.length > 0) {
    md += `## 📚 Dependencies\n\n`;
    md += `| Package | Version |\n`;
    md += `|---------|--------|\n`;

    for (const { name, version } of deps) {
      md += `| ${name} | ${version} |\n`;
    }

    md += '\n---\n\n';
    totalItems += deps.length;
  }

  // ============ SCRIPTS SECTION ============
  const scripts = getScripts();
  if (scripts.length > 0) {
    md += `## 🛠️ NPM Scripts\n\n`;
    md += `| Command | Script |\n`;
    md += `|---------|--------|\n`;

    for (const { name, command } of scripts) {
      md += `| \`pnpm ${name}\` | \`${command}\` |\n`;
    }

    md += '\n---\n\n';
    totalItems += scripts.length;
  }

  // ============ ROUTES SECTION ============
  const pageRoutes = scanRoutes('src/app').filter((r) => r.type === 'page');
  const apiRoutes = scanRoutes('src/app').filter((r) => r.type === 'api');

  if (pageRoutes.length > 0) {
    md += `## 🛣️ Page Routes\n\n`;
    md += `| Route | File |\n`;
    md += `|-------|------|\n`;

    for (const { route, file } of pageRoutes.sort((a, b) => a.route.localeCompare(b.route))) {
      md += `| ${route} | \`${file}\` |\n`;
    }

    md += '\n---\n\n';
    totalItems += pageRoutes.length;
  }

  if (apiRoutes.length > 0) {
    md += `## 🔌 API Routes\n\n`;
    md += `| Endpoint | File |\n`;
    md += `|----------|------|\n`;

    for (const { route, file } of apiRoutes.sort((a, b) => a.route.localeCompare(b.route))) {
      md += `| ${route} | \`${file}\` |\n`;
    }

    md += '\n---\n\n';
    totalItems += apiRoutes.length;
  }

  // ============ COMPONENTS SECTION ============
  for (const { path, category, pattern } of DIRS_TO_SCAN) {
    const items = scanDir(path, pattern);
    if (items.length === 0) continue;

    totalItems += items.length;

    md += `## ${category}\n\n`;
    md += `📁 \`${path}/\`\n\n`;
    md += `| Name | Import |\n`;
    md += `|------|--------|\n`;

    for (const item of items) {
      md += `| ${item} | \`@/${path}/${item}\` |\n`;
    }

    md += '\n---\n\n';
  }

  // ============ SUMMARY SECTION ============
  md += `## 📊 Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Dependencies | ${deps.length} |\n`;
  md += `| Page Routes | ${pageRoutes.length} |\n`;
  md += `| API Routes | ${apiRoutes.length} |\n`;
  md += `| Components & Utils | ${totalItems - deps.length - pageRoutes.length - apiRoutes.length} |\n`;
  md += `| **Total items** | **${totalItems}** |\n\n`;

  md += `---\n\n_Generated by \`scripts/generate-inventory.mjs\`_\n`;

  return md;
}

// Main execution
const output = generateInventory();
const outputPath = 'project/reference/INVENTORY.md';

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, output);
console.log(`✅ ${outputPath} generated`);
