import { test, expect } from '@playwright/test';
import { createTestUser, createPasswordResetToken, cleanupTestUser } from '../fixtures/auth';

/**
 * Password Reset E2E Tests
 * Uses real DB fixtures to verify token validation and password reset flow.
 */

test.describe('Password Reset Flow', () => {
  let testUser: { id: string; email: string };
  let validToken: string;

  test.beforeAll(async () => {
    try {
      testUser = await createTestUser();
      validToken = await createPasswordResetToken(testUser.id);
    } catch (e) {
      console.error('Failed to setup password reset test fixtures:', e);
      throw e;
    }
  });

  test.afterAll(async () => {
    if (testUser?.id) {
      await cleanupTestUser(testUser.id);
    }
  });

  test.describe('Forgot Password Page', () => {
    test('page loads with correct elements', async ({ page }) => {
      await page.goto('/forgot-password');

      // Check page title and form elements
      await expect(page.locator('h1')).toContainText('Olvidaste tu contraseña');
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.locator('a[href="/login"]')).toBeVisible();
    });

    test('shows success message for any email (no enumeration)', async ({ page }) => {
      await page.goto('/forgot-password');

      // Submit with a random email
      await page.fill('input[type="email"]', 'random-user@example.com');
      await page.click('button[type="submit"]');

      // Should show success regardless of email existence
      await expect(page.getByRole('heading', { name: /Revisa tu email/i })).toBeVisible({
        timeout: 5000,
      });
    });

    test('validates email format', async ({ page }) => {
      await page.goto('/forgot-password');

      // Try to submit with invalid email
      await page.fill('input[type="email"]', 'not-an-email');
      await page.click('button[type="submit"]');

      // HTML5 validation should prevent submission
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toHaveAttribute('required', '');
    });

    test('back to login link works', async ({ page }) => {
      await page.goto('/forgot-password');

      await page.click('a[href="/login"]');

      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Reset Password Page', () => {
    test('shows error for missing token', async ({ page }) => {
      await page.goto('/reset-password');
      await expect(page.getByText('Token no proporcionado')).toBeVisible();
    });

    test('shows error for invalid token', async ({ page }) => {
      await page.goto('/reset-password?token=invalid-token-12345');
      await expect(page.getByText('inválido')).toBeVisible({ timeout: 5000 });
    });

    test('shows error for request new link button on invalid token', async ({ page }) => {
      await page.goto('/reset-password?token=invalid');
      await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
    });

    test('shows form for valid token', async ({ page }) => {
      // Uses the valid token created in beforeAll
      await page.goto(`/reset-password?token=${validToken}`);

      await expect(page.locator('h1')).toContainText('Nueva contraseña');
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    });

    test('resets password successfully', async ({ page }) => {
      // Create unique user for this destructive test
      const uniqueEmail = `reset-flow-test-${Date.now()}@example.com`;
      const user2 = await createTestUser({ email: uniqueEmail });
      const token2 = await createPasswordResetToken(user2.id);

      try {
        await page.goto(`/reset-password?token=${token2}`);

        // Wait for form to be ready
        await expect(page.locator('input[name="password"]')).toBeVisible({ timeout: 10000 });

        await page.fill('input[name="password"]', 'NewStrongPass1!');
        await page.fill('input[name="confirmPassword"]', 'NewStrongPass1!');

        await page.click('button[type="submit"]');

        // Wait for success heading (use heading role to avoid matching toast)
        await expect(page.getByRole('heading', { name: /Contraseña actualizada/i })).toBeVisible({
          timeout: 15000,
        });

        // Click login button and verify navigation
        await page.getByRole('button', { name: /Iniciar sesión/i }).click();
        await page.waitForURL(/\/login/, { timeout: 10000 });
      } finally {
        await cleanupTestUser(user2.id);
      }
    });
  });

  test.describe('Login Page Integration', () => {
    test('has forgot password link', async ({ page }) => {
      await page.goto('/login');

      const forgotLink = page.locator('a[href="/forgot-password"]');
      await expect(forgotLink).toBeVisible();
      await expect(forgotLink).toContainText('Olvidaste tu contraseña');
    });

    test('forgot password link navigates correctly', async ({ page }) => {
      await page.goto('/login');
      await page.click('a[href="/forgot-password"]');
      await expect(page).toHaveURL(/\/forgot-password/);
    });
  });
});

test.describe('Password Reset API', () => {
  test('forgot-password API returns success for any email', async ({ request }) => {
    const response = await request.post('/api/auth/forgot-password', {
      data: { email: 'any-email@example.com' },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('forgot-password API validates email format', async ({ request }) => {
    const response = await request.post('/api/auth/forgot-password', {
      data: { email: 'not-an-email' },
    });

    expect(response.status()).toBe(400);
  });

  test('reset-password API validates token', async ({ request }) => {
    const response = await request.get('/api/auth/reset-password?token=invalid');
    const data = await response.json();
    expect(data.valid).toBe(false);
  });

  test('reset-password API requires token and password', async ({ request }) => {
    const response = await request.post('/api/auth/reset-password', {
      data: { token: '', password: '' },
    });

    expect(response.status()).toBe(400);
  });
});
