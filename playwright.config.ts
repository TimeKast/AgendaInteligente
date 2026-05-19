import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { readFileSync } from 'fs';

// Load .env.local for local development (includes DATABASE_URL)
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// Read port from package.json (SSOT)
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));
const E2E_PORT = pkg.ports?.e2e ?? 3005;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  reporter: 'html',
  timeout: 60_000,

  // Global setup/teardown (simplified - no longer creates test schemas)
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',

  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    // Auth setup: creates test users and saves storageState (runs once)
    { name: 'setup', testMatch: /auth\.setup/ },
    // Main tests: depend on setup for authenticated sessions
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],

  // NOTE: webServer is NOT configured here.
  // The e2e-runner.ts wrapper script handles server startup with the correct
  // DATABASE_URL from the temporary Neon branch. This solves the timing issue
  // where Playwright evaluates config BEFORE globalSetup runs.
  //
  // For debugging without branch isolation:
  //   1. Start server manually: pnpm dev
  //   2. Run: pnpm test:e2e:direct
});
