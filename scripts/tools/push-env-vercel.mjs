#!/usr/bin/env node

/**
 * push-env-vercel.mjs
 *
 * Reads .env.local and pushes environment variables to Vercel via REST API.
 * Handles DATABASE_URL_POOLER override and target classification (production/preview/development).
 *
 * Usage:
 *   node scripts/tools/push-env-vercel.mjs [options]
 *
 * Options:
 *   --clean     Delete ALL existing env vars before pushing (recommended for first setup)
 *   --dry-run   Show what would be pushed without making API calls
 *   --verbose   Show detailed output for debugging
 *   --help      Show this help message
 *
 * Prerequisites:
 *   1. Run `vercel link` to connect to your Vercel project
 *   2. Set VERCEL_TOKEN in .env.local (https://vercel.com/account/tokens)
 *   3. Optionally set DATABASE_URL_POOLER for serverless-friendly connection string
 *
 * @see project/backlog/v5.2/issues/DEPLOY-001-vercel-autodeploy.md
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { createInterface } from 'readline';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const VERCEL_API = 'https://api.vercel.com';

/** Variables that should never be pushed to Vercel */
const SKIP_VARS = new Set([
  'NEXT_PUBLIC_APP_URL', // Vercel auto-generates app URLs
  'VERCEL_TOKEN', // Meta — used by this script, not the app
  'DATABASE_URL_POOLER', // Meta — used to override DATABASE_URL
]);

/** Variables that only apply to production */
const PRODUCTION_ONLY = new Set(['VERCEL_PROJECT_PRODUCTION_URL']);

/** Variables that should NOT be set in production (dev/preview only) */
const DEV_ONLY = new Set(['MAILPIT_SMTP_HOST', 'MAILPIT_SMTP_PORT', 'MAILPIT_UI_URL']);

// ─────────────────────────────────────────────────────────────────────────────
// CLI Helpers
// ─────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = {
  clean: args.includes('--clean'),
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose'),
  help: args.includes('--help'),
};

function log(msg) {
  console.log(msg);
}

function verbose(msg) {
  if (flags.verbose) console.log(`  [verbose] ${msg}`);
}

function error(msg) {
  console.error(`❌ ${msg}`);
}

function success(msg) {
  console.log(`✅ ${msg}`);
}

/** Prompt user for yes/no confirmation */
function confirm(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${question} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Help
// ─────────────────────────────────────────────────────────────────────────────

if (flags.help) {
  log(`
push-env-vercel.mjs — Push .env.local variables to Vercel

Usage:
  node scripts/tools/push-env-vercel.mjs [options]

Options:
  --clean     Delete ALL existing env vars before pushing
  --dry-run   Show what would be pushed without making API calls
  --verbose   Show detailed output for debugging
  --help      Show this help message

Skipped variables (never pushed):
  ${[...SKIP_VARS].join(', ')}

Example:
  node scripts/tools/push-env-vercel.mjs --dry-run   # Preview changes
  node scripts/tools/push-env-vercel.mjs --clean      # Full sync
  node scripts/tools/push-env-vercel.mjs              # Push new/changed vars
`);
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// .env Parser
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a .env file into a Map of key-value pairs.
 * Handles quoted values (single, double, backtick) and inline comments.
 */
function parseEnvFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const vars = new Map();

  for (const line of content.split('\n')) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Match KEY=VALUE (value may be quoted)
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    let value = rawValue.trim();

    // Handle quoted values: extract content between matching quotes
    // This correctly handles: KEY="value"   # inline comment
    const quoteMatch = value.match(/^(["'`])(.*)\1\s*(#.*)?$/);
    if (quoteMatch) {
      // Quoted value — content between quotes, ignore trailing comment
      value = quoteMatch[2];
    } else {
      // Unquoted value — strip inline comments
      const commentIndex = value.indexOf(' #');
      if (commentIndex > 0) {
        value = value.substring(0, commentIndex).trim();
      }
    }

    vars.set(key, value);
  }

  return vars;
}

// ─────────────────────────────────────────────────────────────────────────────
// Vercel API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Make an authenticated request to the Vercel API.
 */
async function vercelApi(method, path, token, body = null) {
  const url = `${VERCEL_API}${path}`;
  verbose(`${method} ${url}`);

  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Vercel API error (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

/**
 * Get existing env vars from a Vercel project.
 */
async function getExistingVars(projectId, token) {
  const data = await vercelApi('GET', `/v9/projects/${projectId}/env`, token);
  return data.envs || [];
}

/**
 * Delete an env var from a Vercel project.
 */
async function deleteVar(projectId, envId, token) {
  await vercelApi('DELETE', `/v9/projects/${projectId}/env/${envId}`, token);
}

/**
 * Create an env var on a Vercel project.
 */
async function createVar(projectId, token, { key, value, target, type = 'encrypted' }) {
  await vercelApi('POST', `/v10/projects/${projectId}/env`, token, {
    key,
    value,
    target,
    type,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Target Classification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine which Vercel targets a variable should apply to.
 * Returns an array of target environments: production, preview, development.
 */
function classifyTargets(key) {
  if (PRODUCTION_ONLY.has(key)) {
    return ['production'];
  }
  if (DEV_ONLY.has(key)) {
    return ['preview', 'development'];
  }
  // Most vars apply to all environments
  return ['production', 'preview', 'development'];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  log('');
  log('🚀 push-env-vercel — Push .env.local to Vercel');
  log('─'.repeat(50));

  // 1. Check project is linked
  const projectPath = join(process.cwd(), '.vercel', 'project.json');
  if (!existsSync(projectPath)) {
    error('Project not linked to Vercel.');
    log('');
    log('Run `vercel link` to connect this directory to a Vercel project.');

    const shouldLink = await confirm('Would you like to run `vercel link` now?');
    if (shouldLink) {
      log('');
      log('Running vercel link...');
      try {
        execSync('npx vercel link', { stdio: 'inherit', cwd: process.cwd() });
        // Re-check
        if (!existsSync(projectPath)) {
          error('vercel link did not create project.json. Please try again.');
          process.exit(1);
        }
        success('Project linked successfully!');
        log('');
      } catch {
        error('vercel link failed. Please run it manually.');
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }

  // 2. Read project config
  const projectConfig = JSON.parse(readFileSync(projectPath, 'utf-8'));
  const projectId = projectConfig.projectId;
  const orgId = projectConfig.orgId;
  verbose(`Project ID: ${projectId}`);
  verbose(`Org ID: ${orgId}`);

  // 3. Read .env.local
  const envPath = join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) {
    error('.env.local not found. Create it first.');
    process.exit(1);
  }

  const envVars = parseEnvFile(envPath);
  log(`📄 Found ${envVars.size} variables in .env.local`);

  // 4. Get token
  const token = envVars.get('VERCEL_TOKEN') || process.env.VERCEL_TOKEN;
  if (!token) {
    error('VERCEL_TOKEN not found.');
    log('Set it in .env.local or as an environment variable.');
    log('Get one at: https://vercel.com/account/tokens');
    process.exit(1);
  }
  verbose('Token found');

  // 5. Apply DATABASE_URL_POOLER override
  const poolerUrl = envVars.get('DATABASE_URL_POOLER');
  if (poolerUrl) {
    log(`🔄 DATABASE_URL_POOLER found — will override DATABASE_URL for Vercel`);
    envVars.set('DATABASE_URL', poolerUrl);
    verbose(`DATABASE_URL overridden with pooler URL`);
  }

  // 6. Filter and classify variables
  const toPush = [];
  const skipped = [];

  for (const [key, value] of envVars) {
    if (SKIP_VARS.has(key)) {
      skipped.push(key);
      continue;
    }
    // Skip empty values
    if (!value) {
      skipped.push(`${key} (empty)`);
      continue;
    }

    const target = classifyTargets(key);
    toPush.push({ key, value, target });
  }

  log(`📦 Variables to push: ${toPush.length}`);
  log(`⏭️  Skipped: ${skipped.length} (${skipped.join(', ')})`);

  // 7. Show dry-run summary
  if (flags.dryRun || flags.verbose) {
    log('');
    log('Variables to push:');
    for (const { key, value, target } of toPush) {
      const masked = value.length > 8 ? `${value.substring(0, 4)}...${value.slice(-4)}` : '****';
      log(`  ${key} = ${masked}  [${target.join(', ')}]`);
    }
  }

  if (flags.dryRun) {
    log('');
    log('🏁 Dry run complete. No changes made.');
    process.exit(0);
  }

  // 8. Confirm
  log('');
  const shouldProceed = await confirm(`Push ${toPush.length} variables to Vercel?`);
  if (!shouldProceed) {
    log('Cancelled.');
    process.exit(0);
  }

  // 9. Clean existing vars if --clean
  if (flags.clean) {
    log('');
    log('🧹 Cleaning existing env vars...');
    try {
      const existing = await getExistingVars(projectId, token);
      for (const env of existing) {
        verbose(`Deleting: ${env.key} (${env.id})`);
        await deleteVar(projectId, env.id, token);
      }
      success(`Deleted ${existing.length} existing variables`);
    } catch (err) {
      error(`Failed to clean: ${err.message}`);
      process.exit(1);
    }
  }

  // 10. Push variables
  log('');
  log('📤 Pushing variables...');
  let successCount = 0;
  let errorCount = 0;

  for (const { key, value, target } of toPush) {
    try {
      await createVar(projectId, token, { key, value, target });
      verbose(`✅ ${key}`);
      successCount++;
    } catch (err) {
      // If var already exists, try to update by deleting first
      if (err.message.includes('already exists') || err.message.includes('ENV_ALREADY_EXISTS')) {
        try {
          verbose(`${key} already exists — updating...`);
          const existing = await getExistingVars(projectId, token);
          const found = existing.filter((e) => e.key === key);
          for (const e of found) {
            await deleteVar(projectId, e.id, token);
          }
          await createVar(projectId, token, { key, value, target });
          verbose(`✅ ${key} (updated)`);
          successCount++;
        } catch (updateErr) {
          error(`${key}: ${updateErr.message}`);
          errorCount++;
        }
      } else {
        error(`${key}: ${err.message}`);
        errorCount++;
      }
    }
  }

  // 11. Summary
  log('');
  log('─'.repeat(50));
  success(`Pushed: ${successCount}/${toPush.length} variables`);
  if (errorCount > 0) {
    error(`Failed: ${errorCount}`);
  }

  // Dashboard link (dynamic from project.json)
  log('');
  log(`💡 Verify in dashboard:`);
  log(`   https://vercel.com → Project Settings → Environment Variables`);
  log('');
  log('📌 Next steps:');
  log('   1. git push origin develop  → Trigger deploy');
  log('   2. Verify build succeeds in Vercel dashboard');
}

main().catch((err) => {
  error(err.message);
  if (flags.verbose) console.error(err);
  process.exit(1);
});
