/**
 * Playwright Global Teardown
 *
 * Simple teardown for E2E tests.
 * Individual tests handle their own cleanup.
 */

async function globalTeardown() {
  console.warn('[E2E] Global teardown complete.');
}

export default globalTeardown;
