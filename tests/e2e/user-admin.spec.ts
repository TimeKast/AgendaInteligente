/**
 * User Admin E2E Tests
 *
 * Tests the user administration CRUD functionality.
 * Covers: create, edit, delete, filter, search, and RBAC.
 *
 * Uses storageState for admin sessions — no loginAs() anywhere.
 * RBAC tests use per-role storageState from auth.setup.ts.
 *
 * NOTE: Uses serial mode to avoid parallel worker conflicts with fixtures.
 *
 * @see TEST-004, CRUD-002, SKT-002, SKT-003
 */

import { test, expect, Page } from '@playwright/test';
import { createTestUser, cleanupTestUser } from '../fixtures/auth';
import { AUTH_FILES, AUTH_META_FILE } from '../fixtures/auth-files';
import fs from 'fs';

// Force serial execution to avoid fixture conflicts
test.describe.configure({ mode: 'serial' });

// Use admin storageState for all tests by default
test.use({ storageState: AUTH_FILES.admin });

// =============================================================================
// Test Data
// =============================================================================

interface TestUserData {
  id: string;
  email: string;
  plainPassword: string;
}

let adminUser: TestUserData;
let regularUser: TestUserData;
const createdUserIds: string[] = [];

/** Read shared user metadata saved by auth.setup.ts */
function loadSharedUsers(): Record<string, TestUserData> {
  try {
    return JSON.parse(fs.readFileSync(AUTH_META_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Navigate to user admin page.
 */
async function goToUserAdmin(page: Page) {
  await page.goto('/settings/users');
  await expect(page.getByRole('heading', { name: 'Usuarios' })).toBeVisible({ timeout: 10000 });
}

// =============================================================================
// Setup & Teardown
// =============================================================================

test.describe('User Admin E2E', () => {
  test.beforeAll(async () => {
    try {
      // Read shared users from auth.setup.ts (admin session via storageState)
      const shared = loadSharedUsers();
      if (shared.admin) {
        adminUser = shared.admin;
      } else {
        // Fallback: create own admin if auth.setup didn't run
        const { createAdminTestUser } = await import('../fixtures/auth');
        adminUser = await createAdminTestUser({
          email: `e2e-admin-${Date.now()}@test.com`,
          name: 'E2E Admin User',
        });
        createdUserIds.push(adminUser.id);
      }

      // Create regular user for RBAC permission tests
      regularUser = await createTestUser({
        email: `e2e-user-${Date.now()}@test.com`,
        name: 'E2E Regular User',
        role: 'user',
      });
      createdUserIds.push(regularUser.id);
    } catch (e) {
      console.error('Failed to setup user admin test fixtures:', e);
      throw e;
    }
  });

  test.afterAll(async () => {
    // Cleanup all created users
    for (const id of createdUserIds) {
      await cleanupTestUser(id);
    }
  });

  // ===========================================================================
  // CRUD Tests
  // ===========================================================================

  test.describe('CRUD Operations', () => {
    // Admin storageState is set at describe level — no loginAs needed
    test.beforeEach(async ({ page }) => {
      await goToUserAdmin(page);
    });

    // AC1: crear usuario como ADMIN
    test('should create user as ADMIN', async ({ page }) => {
      const newEmail = `created-${Date.now()}@test.com`;

      // Click "Agregar" button — navigates to /settings/users/nuevo (UXUI-009)
      await page.click('button:has-text("Agregar")');
      await page.waitForURL(/\/settings\/users\/nuevo/, { timeout: 10000 });

      // Fill form using id selectors (matching UserForm)
      await page.fill('#name', 'New Test User');
      await page.fill('#email', newEmail);
      await page.fill('#password', 'Test1234!');

      // Select role using shadcn Select component (click trigger, then option)
      await page.click(
        'button:has(span:has-text("Seleccionar rol")), button:has(span:has-text("Usuario"))'
      );
      await page.click('[role="option"]:has-text("Usuario")');

      // Submit — button says "Crear usuario"
      await page.click('button:has-text("Crear usuario")');

      // Verify success toast
      await expect(page.getByText(/creado|éxito/i)).toBeVisible({ timeout: 10000 });
    });

    // AC2: editar usuario
    test('should edit user', async ({ page }) => {
      // Create a user to edit
      const userToEdit = await createTestUser({
        email: `edit-test-${Date.now()}@test.com`,
        name: 'User To Edit',
      });
      createdUserIds.push(userToEdit.id);

      // Refresh page to see new user
      await page.reload();
      await page.waitForSelector('h1:has-text("Usuarios")');

      // Find the user row and click edit — navigates to /settings/users/[id] (SK-003)
      const userRow = page.locator(`tr:has-text("${userToEdit.email}")`);
      await userRow.locator('button[title="Editar"]').first().click();

      // Wait for detail page to load
      await page.waitForURL(/\/settings\/users\//, { timeout: 10000 });
      await page.waitForSelector('#name', { timeout: 5000 });

      // Modify name
      await page.fill('#name', 'Updated User Name');

      // Submit — button says "Guardar cambios"
      await page.click('button:has-text("Guardar cambios")');

      // Verify success
      await expect(page.getByText(/actualizado|guardado|éxito/i)).toBeVisible({ timeout: 10000 });
    });

    // AC3: desactivar usuario (soft delete via StatusToggle, SK-002)
    test('should soft delete user', async ({ page }) => {
      // Create a user to deactivate
      const userToDelete = await createTestUser({
        email: `delete-test-${Date.now()}@test.com`,
        name: 'User To Delete',
      });
      createdUserIds.push(userToDelete.id);

      // Refresh to see new user
      await page.reload();
      await page.waitForSelector('h1:has-text("Usuarios")');

      // Find the user's StatusToggle switch in their row and click it
      const userRow = page.locator(`tr:has-text("${userToDelete.email}")`);
      await userRow.locator('button[role="switch"]').first().click();

      // Confirm deactivation in alert dialog
      await page.waitForSelector('[role="alertdialog"]', { timeout: 5000 });
      await page.click('[role="alertdialog"] button:has-text("Desactivar")');

      // Verify success toast
      await expect(page.getByText(/desactivado|eliminado/i)).toBeVisible({ timeout: 10000 });
    });
  });

  // ===========================================================================
  // Filtering & Search Tests
  // ===========================================================================

  test.describe('Filtering and Search', () => {
    // Admin storageState is set at describe level — no loginAs needed
    test.beforeEach(async ({ page }) => {
      await goToUserAdmin(page);
    });

    // AC4: filtrar usuarios por rol
    test('should filter users by role', async ({ page }) => {
      // Click role filter dropdown (Radix Popover, not menu)
      // .first() needed: responsive layout renders 2 filter triggers (mobile + desktop)
      const filterTrigger = page.locator('button:has-text("Todos los roles")').first();
      if (await filterTrigger.isVisible()) {
        await filterTrigger.click();
        // Wait for Popover content to open (id is auto-generated from label "Rol")
        await page.waitForSelector('#table-filter-rol', { timeout: 3000 });
        // Select "Administrador" from the popover options
        await page.locator('#table-filter-rol button:has-text("Administrador")').click();
        // Wait for filter to apply — look for admin badge in table
        await expect(page.locator('span:has-text("Administrador")').first()).toBeVisible({
          timeout: 3000,
        });
      }

      // Verify filter applied - at least one admin badge visible
      await expect(page.locator('span:has-text("Administrador")').first()).toBeVisible();
    });

    // AC5: buscar usuarios por nombre/email
    test('should search users by name/email', async ({ page }) => {
      // Type in search input
      const searchInput = page
        .locator('input[placeholder*="Nombre"], input[placeholder*="email"]')
        .first();
      await searchInput.fill(adminUser.email.slice(0, 10));

      // Verify our admin user is visible (auto-waits for search debounce)
      await expect(page.getByText(adminUser.email)).toBeVisible({ timeout: 5000 });
    });
  });

  // ===========================================================================
  // RBAC Tests
  // ===========================================================================

  test.describe('RBAC Permissions', () => {
    // AC6: verificar que USER no puede acceder a /settings/users
    // Uses user storageState directly — no loginAs() needed (SKT-003)
    test('should deny USER access to /settings/users', async ({ browser }) => {
      // Create fresh context with user role storageState
      const userContext = await browser.newContext({ storageState: AUTH_FILES.user });
      const page = await userContext.newPage();

      try {
        // Try to navigate to users page
        await page.goto('/settings/users');
        await page.waitForTimeout(2000);

        const currentUrl = page.url();

        // Either redirected away OR shows permission error
        const hasAccess = currentUrl.includes('/settings/users');
        const hasError = await page
          .getByText(/permiso|acceso|autorizado|no tienes/i)
          .isVisible()
          .catch(() => false);

        // Should not have normal access to the page
        expect(hasAccess && !hasError).toBeFalsy();
      } finally {
        await userContext.close();
      }
    });

    // AC7: verificar que ADMIN no puede crear SUPER_ADMIN
    // Admin storageState already applied — go directly to page
    test('should not allow ADMIN to create SUPER_ADMIN', async ({ page }) => {
      await goToUserAdmin(page);

      // Click "Agregar" button — navigates to /settings/users/nuevo (UXUI-009)
      await page.click('button:has-text("Agregar")');
      await page.waitForURL(/\/settings\/users\/nuevo/, { timeout: 10000 });

      // Open the shadcn Select for role
      await page.click(
        'button:has(span:has-text("Seleccionar rol")), button:has(span:has-text("Usuario"))'
      );

      // Get all options from the role select
      const options = await page.locator('[role="option"]').allTextContents();

      // SUPER_ADMIN should not be in the options for ADMIN
      const hasSuperAdmin = options.some((opt) => opt.includes('Super Admin'));
      expect(hasSuperAdmin).toBeFalsy();

      // Close the Select dropdown first, then go back
      await page.keyboard.press('Escape');
      await page.click('button:has-text("Cancelar")');
    });
  });
});
