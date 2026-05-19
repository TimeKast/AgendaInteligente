/**
 * RBAC Route Access Verification — E2E Tests
 *
 * Automatically tests that each role can only access routes permitted
 * by ROUTE_ACL in permissions.ts. Fully dynamic:
 *
 * - Adding a route to ROUTE_ACL → tests auto-expand (no spec changes)
 * - Adding a role to ROLES → auth.setup creates user + storageState
 * - Empty ROUTE_ACL (SK default) → tests skip gracefully
 *
 * @see SKT-003
 */

import { test, expect } from '@playwright/test';
import { AUTH_FILES } from '../fixtures/auth-files';
import {
  TESTABLE_ROLES,
  PROTECTED_ROUTES,
  getBlockedRoutes,
  getAllowedRoutes,
  hasProtectedRoutes,
} from '../fixtures/rbac';

// Skip all tests if no protected routes are configured (SK default)
test.skip(!hasProtectedRoutes(), 'No protected routes in ROUTE_ACL — RBAC tests skipped');

test.describe('RBAC Route Access', () => {
  // =========================================================================
  // Blocked access tests — parametrized by role × blocked route
  // =========================================================================

  for (const role of TESTABLE_ROLES) {
    const blocked = getBlockedRoutes(role);

    if (blocked.length === 0) continue;

    test.describe(`${role}: blocked routes`, () => {
      test.use({ storageState: AUTH_FILES[role] });

      for (const route of blocked) {
        test(`should redirect ${role} away from ${route.label}`, async ({ page }) => {
          await page.goto(route.path);
          // Middleware redirects unauthorized users to /dashboard (not 403)
          await page.waitForURL(/dashboard/, { timeout: 10000 });

          const currentUrl = page.url();
          expect(currentUrl).not.toContain(route.path);
        });
      }
    });
  }

  // =========================================================================
  // Allowed access tests — parametrized by role × allowed route
  // =========================================================================

  for (const role of TESTABLE_ROLES) {
    const allowed = getAllowedRoutes(role);

    if (allowed.length === 0) continue;

    test.describe(`${role}: allowed routes`, () => {
      test.use({ storageState: AUTH_FILES[role] });

      for (const route of allowed) {
        test(`should allow ${role} to access ${route.label}`, async ({ page }) => {
          await page.goto(route.path, { waitUntil: 'domcontentloaded' });
          // Page loads without redirect — URL stays on the route
          await page.waitForTimeout(1000);

          const currentUrl = page.url();
          expect(currentUrl).toContain(route.path);
        });
      }
    });
  }

  // =========================================================================
  // Super admin bypasses all ACL — smoke test
  // =========================================================================

  if (PROTECTED_ROUTES.length > 0) {
    test.describe('super_admin: bypasses all ACL', () => {
      test.use({ storageState: AUTH_FILES['super_admin'] });

      test('should access all protected routes', async ({ page }) => {
        // Pick the first protected route as smoke test
        const route = PROTECTED_ROUTES[0];
        await page.goto(route.path, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        const currentUrl = page.url();
        expect(currentUrl).toContain(route.path);
      });
    });
  }
});
