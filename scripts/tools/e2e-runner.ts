#!/usr/bin/env npx tsx
/**
 * E2E Test Runner with Neon Branch Isolation
 *
 * This script ensures complete database isolation for E2E tests by:
 * 1. Creating a temporary Neon branch
 * 2. Starting the dev server with the branch's DATABASE_URL
 * 3. Running Playwright tests
 * 4. Cleaning up (stopping server + deleting branch)
 *
 * Usage:
 *   pnpm test:e2e                    # Run all tests
 *   pnpm test:e2e tests/e2e/auth.ts  # Run specific test
 *   pnpm test:e2e --headed           # Run with browser visible
 *
 * Why a wrapper script?
 *   Playwright evaluates config BEFORE globalSetup runs, so the webServer
 *   would start with the original DATABASE_URL. This wrapper ensures the
 *   branch is created BEFORE any server starts.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables first
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { spawn, ChildProcess, execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  createE2EBranch,
  deleteE2EBranch,
  validateNeonCredentials,
  cleanupZombieBranches,
} from './neon-branch';

// Read port from package.json (SSOT)
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'));
const E2E_PORT = pkg.ports?.e2e ?? 3005;
const DEV_SERVER_URL = `http://localhost:${E2E_PORT}`;
const SERVER_STARTUP_TIMEOUT = 60000; // 60 seconds
const SERVER_CHECK_INTERVAL = 500; // 0.5 seconds

/**
 * Kill any process using the E2E port
 */
function killE2EPort(): void {
  try {
    if (process.platform === 'win32') {
      execSync(`npx kill-port ${E2E_PORT}`, { stdio: 'pipe' });
    } else {
      execSync(`lsof -ti:${E2E_PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'pipe' });
    }
  } catch {
    // Port might not be in use, ignore
  }
}

/**
 * Wait for the dev server to be ready
 */
async function waitForServer(url: string, timeout: number): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      // Any response (2xx, 3xx, 4xx, 5xx) means the server is accepting connections.
      // We don't need a healthy response — just proof the server is alive.
      await fetch(url, { method: 'HEAD', redirect: 'manual' });
      return;
    } catch {
      // Server not ready yet (connection refused)
    }
    await new Promise((resolve) => setTimeout(resolve, SERVER_CHECK_INTERVAL));
  }

  throw new Error(`Server did not start within ${timeout / 1000} seconds`);
}

/**
 * Start the Next.js dev server with custom environment
 */
function startDevServer(databaseUrl: string): ChildProcess {
  console.log(`\n🚀 Starting dev server on port ${E2E_PORT}...`);

  // Use `next dev` directly with `-p` flag — pnpm scripts don't forward
  // extra args, so `pnpm dev:next --port X` silently ignores the port.
  const serverProcess = spawn('pnpm', ['next', 'dev', '--turbopack', '-p', String(E2E_PORT)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=2048',
      DATABASE_URL: databaseUrl,
      PORT: String(E2E_PORT),
      // Ensure consistent auth config for tests
      AUTH_SECRET: process.env.AUTH_SECRET || 'test-secret-minimum-32-characters-required',
      AUTH_TRUST_HOST: 'true',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
  });

  let serverReady = false;

  serverProcess.stdout?.on('data', (data) => {
    const line = data.toString().trim();
    if (!line) return;

    // Always show startup info (Next.js banner, port, env)
    if (
      line.includes('Next.js') ||
      line.includes('Local:') ||
      line.includes('Network:') ||
      line.includes('Environments:') ||
      line.includes('Ready in') ||
      line.includes('Starting...')
    ) {
      console.log(`   ${line}`);
      if (line.includes('Ready in')) serverReady = true;
      return;
    }

    // After server is ready, suppress HTTP request logs to reduce noise
    if (serverReady) return;

    // During startup, only show non-request lines
    const isRequestLog = /^\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+/.test(line);
    if (!isRequestLog) {
      console.log(`   ${line}`);
    }
  });

  serverProcess.stderr?.on('data', (data) => {
    const line = data.toString().trim();
    // Only show errors, not warnings
    if (line.includes('Error') || line.includes('error')) {
      console.error(`   ❌ ${line}`);
    }
  });

  return serverProcess;
}

/**
 * Run Playwright tests
 */
function runPlaywrightTests(databaseUrl: string, args: string[]): Promise<number> {
  return new Promise((resolve) => {
    console.log('\n🧪 Running Playwright tests...\n');

    const testProcess = spawn('pnpm', ['playwright', 'test', ...args], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        // Never auto-open HTML report — it blocks the runner and prevents cleanup
        PLAYWRIGHT_HTML_OPEN: 'never',
      },
      stdio: 'inherit',
      shell: true,
    });

    testProcess.on('close', (code) => {
      resolve(code ?? 1);
    });
  });
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  E2E Tests with Neon Branch Isolation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Validate credentials early
  console.log('\n📋 Pre-flight checks...');
  validateNeonCredentials();

  // Cleanup zombie branches from previous failed runs
  await cleanupZombieBranches();

  let branchId: string | null = null;
  let serverProcess: ChildProcess | null = null;
  let exitCode = 1;
  let cleaningUp = false;

  // Shared cleanup function — safe to call multiple times
  async function cleanup(signal?: string): Promise<void> {
    if (cleaningUp) return;
    cleaningUp = true;

    if (signal) console.log(`\n\n⚠️  Received ${signal}, cleaning up...`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Cleanup');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Stop server
    if (serverProcess) {
      console.log('\n🛑 Stopping dev server...');
      serverProcess.kill('SIGTERM');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      serverProcess.kill('SIGKILL');
      console.log('   ✓ Server stopped');
    }

    // Delete branch
    if (branchId) {
      await deleteE2EBranch(branchId);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(exitCode === 0 ? '  ✅ Tests passed!' : '  ❌ Tests failed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  // Register signal handlers BEFORE creating branch
  const signalHandler = (signal: string) => {
    cleanup(signal).then(() => process.exit(1));
  };
  process.on('SIGINT', () => signalHandler('SIGINT'));
  process.on('SIGTERM', () => signalHandler('SIGTERM'));

  try {
    // 1. Create Neon branch
    const { branchId: id, connectionUri, branchName } = await createE2EBranch();
    branchId = id;

    console.log(`   📊 Using branch: ${branchName}`);

    // 2. Kill any existing server on E2E port
    killE2EPort();

    // 3. Start dev server with branch DATABASE_URL
    serverProcess = startDevServer(connectionUri);

    // 4. Wait for server to be ready
    console.log('   ⏳ Waiting for server...');
    await waitForServer(DEV_SERVER_URL, SERVER_STARTUP_TIMEOUT);
    console.log('   ✓ Server ready\n');

    // 5. Run Playwright tests
    exitCode = await runPlaywrightTests(connectionUri, args);
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    exitCode = 1;
  } finally {
    await cleanup();
  }

  // Don't auto-open the report — it blocks the terminal until Ctrl+C and
  // breaks agent runs that need to inspect the exit code. The Playwright
  // summary already shows pass/flaky/fail counts; print the command so the
  // user can open the report explicitly when needed.
  if (exitCode !== 0) {
    console.log('📊 Ver report: pnpm exec playwright show-report\n');
  }
  process.exit(exitCode);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
