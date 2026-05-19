---
name: webapp-testing
description: Web application testing principles. E2E, Playwright, deep audit strategies.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Web App Testing

> Stack-agnostic E2E testing principles. Battle-tested rules for stable, maintainable browser tests.
> For unit/integration patterns → see `testing-patterns` skill.

---

## 1. E2E Test Principles

### What to Test

| Priority | Tests                            | Why               |
| -------- | -------------------------------- | ----------------- |
| 1        | Happy path user flows            | Revenue-critical  |
| 2        | Authentication + authorization   | Security-critical |
| 3        | Critical business actions (CRUD) | Data integrity    |
| 4        | Error handling + edge cases      | User trust        |

### Testing Pyramid for Web

```
        /\          E2E (Few — expensive, slow)
       /  \         Critical user flows only
      /----\
     /      \       Integration (Some)
    /--------\      API, data flow, server actions
   /          \
  /------------\    Unit (Many — fast, cheap)
                    Functions, logic, utils
```

> **Opinion:** E2E tests are expensive to write AND maintain. Use them for flows that
> would cost real money if broken. Everything else → unit/integration.

---

## 2. E2E Stability — 9 Hard Rules

> Verified in production across multiple projects. Violating ANY rule → flaky suite.
> These are non-negotiable for stable E2E infrastructure.

### R1: Semantic Selectors Only

Never use CSS classes or implementation details as selectors.

```
❌ page.locator('.btn-primary')
❌ page.locator('[class*="submit"]')
❌ page.locator('div > div > button')

✅ page.getByRole('button', { name: 'Submit' })
✅ page.locator('[data-testid="submit-btn"]')
✅ page.getByText('Save changes')
```

**Why:** CSS classes change with redesigns. Semantic selectors survive refactors.

### R2: High-Range IDs for Test Data

Never use low IDs (1, 2, 3) that collide with seeds or production data.

```
❌ const testUserId = 1;
❌ overrides: { id: 5 }

✅ const testUserId = 9_000_001;
✅ overrides: { humanId: `USR-T${crypto.randomBytes(4).toString('hex')}` }
```

**Why:** Low IDs collide with seed data. Random or high-range IDs guarantee isolation.

### R3: Independent Tests

Never share state between specs. Each test must be self-sufficient.

```
❌ let sharedUser; // set in test 1, used in test 2
❌ test('delete user created in previous test')

✅ test.beforeEach(async () => { user = await createTestUser(); })
✅ test.afterEach(async () => { await cleanupTestUser(user.id); })
```

**Exception:** `serial` mode with explicit state passing (e.g., CRUD flows where
create → edit → delete is the user journey being tested).

### R4: storageState for Auth

Never log in via UI in spec files. Use Playwright's storageState.

```
❌ async function loginAs(page, email, password) { ... }
❌ await page.goto('/login'); await page.fill('#email', ...);

✅ // auth.setup.ts runs ONCE before all specs
✅ test.use({ storageState: AUTH_FILES.admin });
```

**Why:** `loginAs()` is 3-5s per test. storageState is instant. Multiply by 50 tests.

For mid-test role switching, use `browser.newContext()`:

```ts
// Clean isolation — doesn't pollute other tests
const userCtx = await browser.newContext({ storageState: AUTH_FILES.user });
const page = await userCtx.newPage();
try {
  /* test */
} finally {
  await userCtx.close();
}
```

### R5: Deterministic Seed / Factory Functions

Never depend on data created by other tests or external state.

```
❌ test('edit user', () => { /* assumes user from test 1 exists */ })
❌ const users = await db.select().from(users); // random production data

✅ const user = await createTestUser({ role: 'admin', name: 'Test Admin' });
✅ // Use factory with explicit overrides — predictable, isolated
```

### R6: No Arbitrary Conditional Guards

Never skip tests based on runtime conditions unless in a serial flow.

```
❌ test.skip(process.env.CI === 'true', 'flaky on CI');
❌ if (await element.isVisible()) { /* maybe test, maybe not */ }

✅ test.skip(!hasProtectedRoutes(), 'No ROUTE_ACL configured');  // intentional
✅ // Skip only for documented, structural reasons — not flakiness
```

**Why:** Conditional skips hide bugs. If a test is flaky, fix it — don't skip it.

### R7: AlertDialog — Handle Before Trigger

Set up dialog handlers BEFORE the action that triggers them.

```
❌ await page.click('#delete-btn');
❌ await page.locator('[role="alertdialog"]').waitFor(); // too late

✅ page.on('dialog', dialog => dialog.accept());
✅ await page.click('#delete-btn');
// OR for Radix AlertDialog:
✅ await page.click('#delete-btn');
✅ await page.locator('[role="alertdialog"]').waitFor();
✅ await page.getByRole('button', { name: 'Confirm' }).click();
```

### R8: Hydration-Aware Waiting

Always wait for elements before interacting. Frameworks like Next.js, Nuxt, SvelteKit
have server-rendered HTML that needs client-side hydration.

```
❌ await page.goto('/users');
❌ await page.click('#create-btn'); // Element exists in HTML but not hydrated

✅ await page.goto('/users', { waitUntil: 'networkidle' });
✅ await page.waitForSelector('#create-btn', { timeout: 10000 });
✅ await page.click('#create-btn');
```

**Turbopack/Vite cold-compile:** First navigation compiles the route. Use 30s timeout
for auth.setup, 10s for subsequent pages.

### R9: Heavy Pages in Serial Mode

Don't parallelize specs that require full page loads of complex pages.

```
❌ // 5 CRUD tests all navigating to /dashboard with data tables
❌ test.describe.configure({ mode: 'parallel' }); // Resource contention

✅ test.describe.configure({ mode: 'serial' });
✅ // Sequential: less resource contention, more predictable
```

**When to use serial:** CRUD flows, data-heavy pages, tests that modify shared data.
**When parallel is fine:** Independent pages, read-only tests, isolated contexts.

---

## 3. RBAC Access Verification

> Pattern for verifying route-level access control. Stack-agnostic.

### Declarative Pattern: ACL × Roles

The most maintainable RBAC test pattern is **parametrized**: define which roles
can access which routes in a config, then iterate.

```
┌─────────────────────┐     ┌──────────────┐
│  ROUTE_ACL (config) │     │ ROLES (config)│
│  /admin → [admin]   │  ×  │ admin        │  → Parametrized Tests
│  /billing → [admin] │     │ user         │
│  /reports → [mgr]   │     │ manager      │
└─────────────────────┘     └──────────────┘
```

### Implementation Pattern

```ts
// 1. Transform config → testable data
const PROTECTED_ROUTES = Object.entries(ROUTE_ACL).map(([path, allowed]) => ({
  path,
  allowed,
}));

// 2. Test blocked access (parametrized)
for (const role of TESTABLE_ROLES) {
  for (const route of getBlockedRoutes(role)) {
    test(`${role} blocked from ${route.path}`, async ({ page }) => {
      // Navigate and verify redirect (not 403 page)
      await page.goto(route.path);
      await page.waitForURL(/dashboard/);
      expect(page.url()).not.toContain(route.path);
    });
  }
}

// 3. Test allowed access
for (const role of TESTABLE_ROLES) {
  for (const route of getAllowedRoutes(role)) {
    test(`${role} can access ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      expect(page.url()).toContain(route.path);
    });
  }
}
```

### Key Design Decisions

| Decision                               | Rationale                                      |
| -------------------------------------- | ---------------------------------------------- |
| Skip super_admin in parametrized tests | Always bypasses ACL — test separately as smoke |
| Redirect to dashboard, not 403         | Better UX than error pages                     |
| Graceful skip if no ACL                | Empty ACL = no protected routes = skip tests   |
| Config is SSOT                         | Add route to ACL → tests auto-expand           |

### Zero Maintenance

Adding a role or route to the config automatically adds tests.
No spec files need modification — the parametrized loop expands dynamically.

---

## 4. Playwright Principles

### Core Concepts

| Concept           | Use                          |
| ----------------- | ---------------------------- |
| Page Object Model | Encapsulate page logic       |
| Fixtures          | Reusable test setup          |
| Assertions        | Built-in auto-wait           |
| Trace Viewer      | Debug failures (first retry) |
| storageState      | Auth session persistence     |

### Recommended Configuration

| Setting     | Value               | Why                        |
| ----------- | ------------------- | -------------------------- |
| Retries     | 2 on CI, 1 locally  | Catch true flakes          |
| Trace       | `on-first-retry`    | Debug without overhead     |
| Screenshots | `on-failure`        | Evidence for failures      |
| Video       | `retain-on-failure` | Full failure reproduction  |
| Workers     | 2 (CI), 50% (local) | Balance speed vs stability |
| Timeout     | 30s                 | Handle cold compiles       |

### Project Dependencies

Use Playwright project dependencies for one-time setup:

```ts
// playwright.config.ts
projects: [
  { name: 'setup', testDir: './tests/e2e', testMatch: 'auth.setup.ts' },
  { name: 'chromium', dependencies: ['setup'], use: { ...devices['Desktop Chrome'] } },
];
```

---

## 5. API Testing Principles

### Coverage Areas

| Area           | Tests                               |
| -------------- | ----------------------------------- |
| Status codes   | 200, 400, 401, 403, 404, 500        |
| Response shape | Matches expected schema             |
| Error messages | User-friendly, structured           |
| Edge cases     | Empty, large, special chars         |
| Auth           | Protected endpoints require session |

---

## 6. Test Organization

### File Structure

```
tests/
├── e2e/             # Full user flows (Playwright)
│   ├── auth.setup.ts    # One-time auth setup
│   ├── *.spec.ts        # Feature specs
│   └── rbac-routes.spec.ts  # Parametrized RBAC
├── fixtures/        # Shared test utilities
│   ├── auth.ts          # User factories + cleanup
│   ├── auth-files.ts    # storageState paths
│   └── rbac.ts          # RBAC test utilities
├── global-setup.ts  # DB sequences, migrations
└── .auth/           # storageState files (gitignored)
```

### Naming Convention

| Pattern       | Example                 |
| ------------- | ----------------------- |
| Feature-based | `user-admin.spec.ts`    |
| Flow-based    | `checkout-flow.spec.ts` |
| RBAC          | `rbac-routes.spec.ts`   |

---

## 7. CI Integration

### Pipeline Steps

1. Install dependencies + browsers
2. Run database migrations (if needed)
3. Start dev server
4. Run tests (with retries)
5. Upload artifacts on failure (traces, screenshots)
6. Cleanup (Neon branches, test data)

### Parallelization

| Strategy | Use                      |
| -------- | ------------------------ |
| Per file | Playwright default       |
| Sharding | Large suites (50+ tests) |
| Workers  | Multiple browsers        |
| Serial   | CRUD flows, shared data  |

---

## 8. Anti-Patterns (Battle-Tested)

| ❌ Don't                         | ✅ Do                                   | Real Impact                       |
| -------------------------------- | --------------------------------------- | --------------------------------- |
| Test implementation details      | Test user-visible behavior              | Survives refactors                |
| Use `page.waitForTimeout(3000)`  | Use `waitForSelector` or `waitForURL`   | Eliminates 80% of flakiness       |
| Login via UI in every test       | Use storageState                        | 3-5s saved per test               |
| Skip cleanup                     | `afterEach` + factory functions         | Tests stay independent            |
| Ignore flaky tests               | Fix root cause immediately              | Flakiness compounds exponentially |
| Use CSS selectors                | Use semantic selectors                  | Survives CSS redesigns            |
| Hardcode 10s timeouts everywhere | Calibrate: 30s setup, 10s interactions  | Cold-compile aware                |
| Run all tests in parallel        | Serial for CRUD, parallel for read-only | Reduces resource contention       |

---

> **Remember:** A flaky test is worse than no test. It erodes trust in the entire suite.
> Fix flakiness at the root, or delete the test. Never skip and move on.

---

_Cross-reference: `testing-patterns` for unit/integration/mocking principles._
