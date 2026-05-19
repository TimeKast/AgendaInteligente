/**
 * E2E Auth Setup — Dynamic storageState per role
 *
 * Iterates over ALL roles from config/roles.ts and creates a test user
 * for each one, saving authenticated sessions as storageState files.
 *
 * This is fully dynamic: adding a role to ROLES automatically creates
 * a new test user + storageState. Zero maintenance.
 *
 * Runs ONCE before all specs as a Playwright project dependency.
 *
 * @see SKT-002, SKT-003
 */

import { test as setup } from '@playwright/test';
import { createTestUser } from '../fixtures/auth';
import { ROLES } from '@/config/roles';
import { AUTH_DIR, AUTH_FILES, AUTH_META_FILE } from '../fixtures/auth-files';
import fs from 'fs';

setup.describe('Auth Setup', () => {
  setup('create shared test users and save auth state', async ({ page }) => {
    fs.mkdirSync(AUTH_DIR, { recursive: true });

    const users: Record<string, { id: string; email: string; plainPassword: string }> = {};

    // Dynamic: iterate ALL roles from config SSOT
    const allRoles = Object.values(ROLES);

    for (const role of allRoles) {
      const user = await createTestUser({
        role,
        email: `e2e-${role}-${Date.now()}@test.com`,
        name: `E2E ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      });
      users[role] = { id: user.id, email: user.email, plainPassword: user.plainPassword };

      // Login and save storageState
      // Note: first run triggers Turbopack cold-compile of /login — needs extra time
      await page.goto('/login', { waitUntil: 'networkidle' });
      await page.waitForSelector('#email', { timeout: 30000 });
      await page.fill('#email', user.email);
      await page.fill('#password', user.plainPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/dashboard|settings/, {
        timeout: 30000,
        waitUntil: 'domcontentloaded',
      });

      // Save authenticated session
      await page.context().storageState({ path: AUTH_FILES[role] });

      // Clear cookies for next login
      await page.context().clearCookies();
    }

    // Save user metadata for specs that need IDs (e.g., cleanup)
    fs.writeFileSync(AUTH_META_FILE, JSON.stringify(users, null, 2));
  });
});
