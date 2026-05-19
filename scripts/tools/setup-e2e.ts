#!/usr/bin/env npx tsx

/**
 * E2E Setup Script
 *
 * Interactive setup for E2E tests in CI with Neon database.
 * Uses browser-based authentication (no API keys needed).
 *
 * Usage: pnpm setup:e2e
 *
 * Prerequisites:
 * - Neon CLI: npm install -g neonctl (or neon)
 * - GitHub CLI: brew install gh (or see https://cli.github.com/)
 */

import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function exec(cmd: string, options?: { silent?: boolean }): string {
  try {
    return execSync(cmd, {
      encoding: 'utf-8',
      stdio: options?.silent ? 'pipe' : 'inherit',
    });
  } catch {
    return '';
  }
}

function checkCommand(cmd: string): boolean {
  const result = spawnSync('which', [cmd], { encoding: 'utf-8' });
  return result.status === 0;
}

// Detect which Neon CLI is available (modern `neon` or legacy `neonctl`)
function getNeonCli(): string | null {
  if (checkCommand('neon')) return 'neon';
  if (checkCommand('neonctl')) return 'neonctl';
  return null;
}

// Resolve the exact installed `@playwright/test` version.
// Lockfile is preferred (matches what's actually installed); package.json range
// is the fallback for repos where the lockfile hasn't been generated yet.
export function resolvePlaywrightVersion(gitRoot: string): string {
  const lockfilePath = path.join(gitRoot, 'pnpm-lock.yaml');
  if (fs.existsSync(lockfilePath)) {
    const lockfile = fs.readFileSync(lockfilePath, 'utf-8');
    // Match resolved version: lines like `      '@playwright/test': 1.58.2`
    // (NOT `        specifier: ^1.58.2` — that has the range prefix).
    const match = lockfile.match(/^\s+'@playwright\/test':\s+(\d+\.\d+\.\d+(?:-[\w.]+)?)\s*$/m);
    if (match) return match[1];
  }

  const pkgPath = path.join(gitRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const spec =
      pkg.devDependencies?.['@playwright/test'] ?? pkg.dependencies?.['@playwright/test'];
    if (typeof spec === 'string') {
      const stripped = spec.replace(/^[\^~]/, '');
      if (/^\d+\.\d+\.\d+/.test(stripped)) return stripped;
    }
  }

  console.error('❌ @playwright/test not found in pnpm-lock.yaml or package.json');
  console.error('   Run `pnpm install` first.');
  process.exit(1);
}

async function main() {
  console.log('\n🚀 E2E Setup - Configure E2E tests with Neon + GitHub\n');

  // =========================================================================
  // Pre-flight checks
  // =========================================================================
  console.log('📋 Pre-flight checks...\n');

  // Check we're in a git repo
  const gitRoot = exec('git rev-parse --show-toplevel 2>/dev/null', { silent: true }).trim();
  if (!gitRoot) {
    console.error('❌ Not in a git repository');
    process.exit(1);
  }
  console.log('  ✓ Git repository detected');

  // Check e2e.yml.example exists
  const workflowDir = path.join(gitRoot, '.github', 'workflows');
  const templatePath = path.join(workflowDir, 'e2e.yml.example');
  if (!fs.existsSync(templatePath)) {
    console.error('❌ e2e.yml.example not found');
    console.error("   Make sure you're in the timekast-starter-kit repo");
    process.exit(1);
  }
  console.log('  ✓ E2E workflow template found');

  // Check Neon CLI (support both `neon` and `neonctl`)
  const neonCli = getNeonCli();
  if (!neonCli) {
    console.error('❌ Neon CLI not found');
    console.error('   Install with: npm install -g neonctl');
    process.exit(1);
  }
  console.log(`  ✓ Neon CLI found (${neonCli})`);

  // Check GitHub CLI
  if (!checkCommand('gh')) {
    console.error('❌ GitHub CLI not found');
    console.error('   Install with: brew install gh');
    process.exit(1);
  }
  console.log('  ✓ GitHub CLI found');

  // Get repo info from origin remote (not upstream or other remotes)
  const originUrl = exec('git remote get-url origin 2>/dev/null', { silent: true }).trim();
  if (!originUrl) {
    console.error('❌ No origin remote found');
    console.error('   Run: git remote add origin <your-repo-url>');
    process.exit(1);
  }

  // Extract owner/repo from URL (handles both HTTPS and SSH formats)
  // https://github.com/owner/repo.git -> owner/repo
  // git@github.com:owner/repo.git -> owner/repo
  const repoMatch = originUrl.match(/github\.com[:/]([^/]+\/[^/.]+)(?:\.git)?$/);
  if (!repoMatch) {
    console.error('❌ Could not parse GitHub repo from origin URL');
    console.error(`   Origin URL: ${originUrl}`);
    process.exit(1);
  }
  const repo = repoMatch[1];
  console.log(`  ✓ GitHub repo: ${repo}\n`);

  // =========================================================================
  // Authentication
  // =========================================================================
  const neonAuth = exec(`${neonCli} me 2>/dev/null`, { silent: true });
  if (!neonAuth) {
    console.log('🔐 Authenticating with Neon...');
    exec(`${neonCli} auth`);
  } else {
    console.log('  ✓ Already authenticated with Neon');
  }

  const ghAuth = exec('gh auth status 2>/dev/null', { silent: true });
  if (!ghAuth.includes('Logged in')) {
    console.log('🔐 Authenticating with GitHub...');
    exec('gh auth login');
  } else {
    console.log('  ✓ Already authenticated with GitHub');
  }

  // =========================================================================
  // Neon Project Selection
  // =========================================================================
  console.log('\n📦 Neon Projects:\n');
  exec(`${neonCli} projects list`);

  const projectChoice = await prompt('\nEnter project name (or "new" to create): ');

  let projectId: string;
  if (projectChoice.toLowerCase() === 'new') {
    const projectName = await prompt('Project name: ');
    const result = exec(`${neonCli} projects create --name "${projectName}" --output json`, {
      silent: true,
    });
    try {
      const parsed = JSON.parse(result);
      // Handle various response formats
      projectId = parsed.project?.id ?? parsed.id;
      if (!projectId) throw new Error('No project ID');
      console.log(`\n  ✓ Created: ${projectName}`);
    } catch {
      console.error('❌ Failed to create project');
      process.exit(1);
    }
  } else {
    const result = exec(`${neonCli} projects list --output json`, { silent: true });
    try {
      const parsed = JSON.parse(result);
      const projects = Array.isArray(parsed) ? parsed : (parsed.projects ?? []);
      const found = projects.find(
        (p: { name: string }) => p.name.toLowerCase() === projectChoice.toLowerCase()
      );
      if (!found) {
        console.error(`❌ Project "${projectChoice}" not found`);
        process.exit(1);
      }
      projectId = found.id;
      console.log(`  ✓ Using: ${found.name}`);
    } catch {
      console.error('❌ Failed to list projects');
      process.exit(1);
    }
  }

  // =========================================================================
  // Get Connection String (let CLI handle default branch)
  // =========================================================================
  console.log('\n🔗 Getting connection string...');

  // Use project-id flag - CLI will use default branch automatically
  const connResult = exec(`${neonCli} connection-string --project-id ${projectId}`, {
    silent: true,
  });

  const connectionString = connResult.trim();
  if (!connectionString.startsWith('postgresql://')) {
    console.error('❌ Invalid connection string');
    console.error(`   Try: ${neonCli} connection-string --project-id ${projectId}`);
    process.exit(1);
  }
  console.log('  ✓ Got DATABASE_URL');

  // =========================================================================
  // Set GitHub Secret (using --body, no temp files)
  // =========================================================================
  console.log('\n📤 Configuring GitHub...\n');
  console.log('  Setting DATABASE_URL secret...');

  // Use --body flag to avoid shell escaping issues and temp files
  const secretResult = spawnSync(
    'gh',
    ['secret', 'set', 'DATABASE_URL', '-R', repo, '--body', connectionString],
    {
      encoding: 'utf-8',
      stdio: 'pipe',
    }
  );

  if (secretResult.status !== 0) {
    console.error('❌ Failed to set secret');
    console.error(secretResult.stderr);
    process.exit(1);
  }
  console.log('  ✓ DATABASE_URL secret set');

  // =========================================================================
  // Get Neon API Key (for branch isolation)
  // =========================================================================
  console.log('\n🔑 Neon API Key Setup (for E2E branch isolation)');
  console.log('   E2E tests create temporary database branches for isolation.');
  console.log('   This requires a Neon API key.\n');

  console.log('   To create an API key:');
  console.log('   1. Go to: https://console.neon.tech');
  console.log('   2. Click your profile → Account Settings → API Keys');
  console.log('   3. Click "Create new API key"');
  console.log('   4. Copy the key (starts with "neon_api_key_")\n');

  const apiKey = await prompt('Paste your Neon API key (or press Enter to skip): ');

  if (apiKey) {
    // Set NEON_API_KEY secret
    const apiKeyResult = spawnSync(
      'gh',
      ['secret', 'set', 'NEON_API_KEY', '-R', repo, '--body', apiKey],
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    if (apiKeyResult.status !== 0) {
      console.error('❌ Failed to set NEON_API_KEY');
      console.error(apiKeyResult.stderr);
    } else {
      console.log('  ✓ NEON_API_KEY secret set');
    }

    // Set NEON_PROJECT_ID secret
    const projectIdResult = spawnSync(
      'gh',
      ['secret', 'set', 'NEON_PROJECT_ID', '-R', repo, '--body', projectId],
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    if (projectIdResult.status !== 0) {
      console.error('❌ Failed to set NEON_PROJECT_ID');
      console.error(projectIdResult.stderr);
    } else {
      console.log('  ✓ NEON_PROJECT_ID secret set');
    }

    // Also save to .env.local for local development
    const envLocalPath = path.join(gitRoot, '.env.local');
    if (fs.existsSync(envLocalPath)) {
      let envContent = fs.readFileSync(envLocalPath, 'utf-8');
      if (!envContent.includes('NEON_API_KEY')) {
        envContent += `\n# E2E Testing (Neon Branch Isolation)\nNEON_API_KEY="${apiKey}"\nNEON_PROJECT_ID="${projectId}"\n`;
        fs.writeFileSync(envLocalPath, envContent);
        console.log('  ✓ Added to .env.local');
      }
    }
  } else {
    console.log('  ⚠️  Skipped - E2E tests will not use branch isolation');
    console.log('     Run pnpm setup:e2e again to configure later');
  }

  // =========================================================================
  // Copy E2E Workflow
  // =========================================================================
  const targetPath = path.join(workflowDir, 'e2e.yml');
  console.log('  Enabling E2E workflow...');
  const playwrightVersion = resolvePlaywrightVersion(gitRoot);
  console.log(`  ✓ Resolved @playwright/test: ${playwrightVersion}`);
  const template = fs.readFileSync(templatePath, 'utf-8');
  const generated = template.replace(/__PLAYWRIGHT_VERSION__/g, playwrightVersion);
  if (generated.includes('__PLAYWRIGHT_VERSION__')) {
    console.error('❌ Placeholder substitution failed — aborting.');
    process.exit(1);
  }
  fs.writeFileSync(targetPath, generated);
  console.log('  ✓ Created .github/workflows/e2e.yml');

  // =========================================================================
  // Done
  // =========================================================================
  console.log('\n✅ Setup complete!\n');

  const shouldCommit = await prompt('Commit and push? (y/n): ');
  if (shouldCommit.toLowerCase() === 'y') {
    exec('git add .github/workflows/e2e.yml');
    exec('git commit -m "chore: enable E2E tests in CI"');
    console.log('\n  ✓ Committed');

    const shouldPush = await prompt('Push now? (y/n): ');
    if (shouldPush.toLowerCase() === 'y') {
      exec('git push');
      console.log('  ✓ Pushed - E2E tests will run on next CI\n');
    } else {
      console.log('  Run: git push\n');
    }
  } else {
    console.log('\n  Next steps:');
    console.log('  git add .github/workflows/e2e.yml');
    console.log('  git commit -m "chore: enable E2E tests in CI"');
    console.log('  git push\n');
  }

  rl.close();
}

// Only run as CLI — allow importing `resolvePlaywrightVersion` from tests/smokes
// without triggering the interactive setup flow.
const isMainModule =
  typeof process.argv[1] === 'string' &&
  import.meta.url === `file://${path.resolve(process.argv[1])}`;
if (isMainModule) {
  main().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
