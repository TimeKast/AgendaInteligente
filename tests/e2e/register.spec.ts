/**
 * Self-Registration E2E Smoke Tests — KIT-022
 *
 * Verifies UI behavior of the /register page without writing to the database.
 * (Full DB-write flow — registrar → auto-login → dashboard — is a manual
 *  smoke test per the issue verification section, mirroring the
 *  `invite.spec.ts` convention which also avoids real user creation.)
 *
 * Assumptions:
 * - NEXT_PUBLIC_AUTH_REGISTRATION=true (default)
 * - NEXT_PUBLIC_AUTH_PASSWORD=true (default)
 */

import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
  test('renders the registration form when flags are on', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: /crea tu cuenta/i })).toBeVisible();
    await expect(page.getByLabel(/tu nombre/i)).toBeVisible();
    await expect(page.getByLabel(/^email$/i)).toBeVisible();
    await expect(page.getByLabel(/^contraseña$/i)).toBeVisible();
    await expect(page.getByLabel(/confirmar contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /crear cuenta/i })).toBeVisible();
  });

  test('shows the "Regístrate" link on the login page', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    const link = page.getByRole('link', { name: /regístrate/i });
    await expect(link).toBeVisible();

    await link.click();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('"Ya tengo cuenta" link returns to /login', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'networkidle' });

    const back = page.getByRole('link', { name: /ya tengo cuenta/i });
    await expect(back).toBeVisible();

    await back.click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('rejects mismatched passwords client-side (no network call)', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'networkidle' });

    let registerCalled = false;
    await page.route('**/api/auth/register', (route) => {
      registerCalled = true;
      void route.abort();
    });

    await page.getByLabel(/tu nombre/i).fill('Test User');
    await page.getByLabel(/^email$/i).fill('e2e@test.com');
    await page.getByLabel(/^contraseña$/i).fill('password123');
    await page.getByLabel(/confirmar contraseña/i).fill('different456');
    await page.getByRole('button', { name: /crear cuenta/i }).click();

    await expect(page.getByText(/no coinciden/i)).toBeVisible();
    expect(registerCalled).toBe(false);
  });

  test('rejects names shorter than 2 chars client-side', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'networkidle' });

    let registerCalled = false;
    await page.route('**/api/auth/register', (route) => {
      registerCalled = true;
      void route.abort();
    });

    await page.getByLabel(/tu nombre/i).fill('J');
    await page.getByLabel(/^email$/i).fill('e2e@test.com');
    await page.getByLabel(/^contraseña$/i).fill('password123');
    await page.getByLabel(/confirmar contraseña/i).fill('password123');
    await page.getByRole('button', { name: /crear cuenta/i }).click();

    await expect(page.getByText(/al menos 2 caracteres/i)).toBeVisible();
    expect(registerCalled).toBe(false);
  });

  test('redirects to /login on 403 RegistrationDisabled response', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'networkidle' });

    await page.route('**/api/auth/register', (route) =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'RegistrationDisabled' }),
      })
    );

    await page.getByLabel(/tu nombre/i).fill('Test User');
    await page.getByLabel(/^email$/i).fill('e2e@test.com');
    await page.getByLabel(/^contraseña$/i).fill('password123');
    await page.getByLabel(/confirmar contraseña/i).fill('password123');
    await page.getByRole('button', { name: /crear cuenta/i }).click();

    await expect(page).toHaveURL(/\/login$/);
  });
});
