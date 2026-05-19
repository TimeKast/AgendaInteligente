---
name: testing
description: Unit tests, integration tests, E2E tests with Vitest and Playwright
---

# 🧪 Testing Skill

> **Dominio:** Unit, integration, E2E tests.
> **Stack:** Vitest, Playwright, Testing Library.

---

## Principios Fundamentales

1. **Test behavior, not implementation** — qué hace, no cómo
2. **Arrange-Act-Assert** — estructura clara
3. **Mocks mínimos** — solo external dependencies
4. **Tests independientes** — no depender de orden
5. **Nombres descriptivos** — `should [behavior] when [condition]`

---

## SIEMPRE / NUNCA

**SIEMPRE:**

1. Un assertion por test (o relacionados)
2. Cleanup después de tests con side effects
3. Factory functions para test data
4. `testId` para selectores E2E

**NUNCA:**

1. Tests interdependientes
2. Mock de implementación interna
3. Hardcodear datos de prueba
4. Skip tests sin `.fixme()` documentado

---

## Estructura de Tests

```
/tests
  /unit              # Tests unitarios (Vitest)
    /lib
    /components
  /integration       # Tests de integración (Vitest + DB)
    /api
  /e2e               # Tests end-to-end (Playwright)
  /fixtures          # Datos de prueba
  /factories         # Factory functions
  setup.ts           # Setup global
```

---

## Unit Tests (Vitest)

### Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### Test de Función

```typescript
// tests/unit/lib/utils/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from '@/lib/utils/format';

describe('formatCurrency', () => {
  it('should format positive numbers with $ symbol', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('should format negative numbers with minus sign', () => {
    expect(formatCurrency(-100)).toBe('-$100.00');
  });
});

describe('formatDate', () => {
  it('should format date in locale format', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    expect(formatDate(date)).toMatch(/Jan 15, 2024/);
  });
});
```

### Test de Server Action con Mocks

```typescript
// tests/unit/lib/actions/users.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createUser } from '@/lib/actions/users';
import { db } from '@/lib/db/drizzle';
import { auth } from '@/lib/auth';

// Mock dependencies
vi.mock('@/lib/db/drizzle');
vi.mock('@/lib/auth');

describe('createUser', () => {
  const mockSession = {
    user: { id: 'user-123', email: 'admin@test.com' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as any);
  });

  it('should create user with valid input', async () => {
    const mockUser = {
      id: 'new-user-id',
      email: 'test@example.com',
      name: 'Test User',
    };

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockUser]),
      }),
    } as any);

    const result = await createUser({
      email: 'test@example.com',
      name: 'Test User',
    });

    expect(result).toEqual(mockUser);
  });

  it('should throw when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(createUser({ email: 'test@example.com', name: 'Test' })).rejects.toThrow(
      'UNAUTHORIZED'
    );
  });

  it('should throw on invalid email', async () => {
    await expect(createUser({ email: 'invalid', name: 'Test' })).rejects.toThrow();
  });
});
```

### Test de Componente

```typescript
// tests/unit/components/UserCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserCard } from '@/components/users/UserCard';

describe('UserCard', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  it('should render user name', () => {
    render(<UserCard user={mockUser} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render user email', () => {
    render(<UserCard user={mockUser} />);
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should render avatar with fallback initials', () => {
    render(<UserCard user={{ ...mockUser, avatarUrl: undefined }} />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <UserCard user={mockUser} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
```

---

## Integration Tests

### Test de API con DB Real

```typescript
// tests/integration/api/users.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createTestUser, cleanupTestUsers } from '@/tests/factories/users';

describe('Users API Integration', () => {
  const testUserIds: string[] = [];

  afterEach(async () => {
    // Cleanup after each test
    await cleanupTestUsers(testUserIds);
    testUserIds.length = 0;
  });

  it('should create and retrieve user', async () => {
    // Arrange
    const userData = {
      email: `test-${Date.now()}@example.com`,
      name: 'Integration Test User',
    };

    // Act - Create
    const [created] = await db.insert(users).values(userData).returning();
    testUserIds.push(created.id);

    // Assert - Create
    expect(created.email).toBe(userData.email);
    expect(created.id).toBeDefined();

    // Act - Retrieve
    const [found] = await db.select().from(users).where(eq(users.id, created.id));

    // Assert - Retrieve
    expect(found).toBeDefined();
    expect(found.name).toBe(userData.name);
  });

  it('should enforce unique email constraint', async () => {
    const email = `unique-${Date.now()}@example.com`;

    // First insert succeeds
    const [first] = await db.insert(users).values({ email, name: 'First' }).returning();
    testUserIds.push(first.id);

    // Second insert should fail
    await expect(db.insert(users).values({ email, name: 'Second' })).rejects.toThrow();
  });
});
```

---

## E2E Tests (Playwright)

### Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Test de Flujo Completo

```typescript
// tests/e2e/users.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login si es necesario
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display users list', async ({ page }) => {
    await page.goto('/users');

    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
    await expect(page.getByTestId('user-row')).toHaveCount.greaterThan(0);
  });

  test('should filter users by status', async ({ page }) => {
    await page.goto('/users');

    // Open filter
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Active' }).click();

    // Verify URL updated
    await expect(page).toHaveURL(/status=active/);

    // Verify all visible users are active
    const statuses = await page.getByTestId('user-status').allTextContents();
    expect(statuses.every((s) => s === 'Active')).toBe(true);
  });

  test('should create new user', async ({ page }) => {
    await page.goto('/users');

    // Click create button
    await page.getByRole('button', { name: 'New User' }).click();

    // Fill form
    await page.fill('[name="email"]', `new-${Date.now()}@example.com`);
    await page.fill('[name="name"]', 'New Test User');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.getByText('User created successfully')).toBeVisible();
  });
});
```

---

## Factories y Fixtures

### Factory Functions

```typescript
// tests/factories/users.ts
import { db } from '@/lib/db/drizzle';
import { users, type NewUser } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export function buildUser(overrides: Partial<NewUser> = {}): NewUser {
  return {
    email: `test-${Date.now()}-${Math.random()}@example.com`,
    name: 'Test User',
    isActive: true,
    ...overrides,
  };
}

export async function createTestUser(overrides: Partial<NewUser> = {}) {
  const [user] = await db.insert(users).values(buildUser(overrides)).returning();
  return user;
}

export async function cleanupTestUsers(ids: string[]) {
  if (ids.length > 0) {
    await db.delete(users).where(inArray(users.id, ids));
  }
}
```

### Fixtures JSON

```typescript
// tests/fixtures/users.json
{
  "adminUser": {
    "email": "admin@test.com",
    "name": "Admin User",
    "role": "admin"
  },
  "regularUser": {
    "email": "user@test.com",
    "name": "Regular User",
    "role": "user"
  }
}
```

---

## Mocking Patterns

### Mock Módulo Completo

```typescript
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));
```

### Mock Función Específica

```typescript
import * as authModule from '@/lib/auth';

vi.spyOn(authModule, 'auth').mockResolvedValue({
  user: { id: '123', email: 'test@test.com' },
});
```

### Mock de Tiempo

```typescript
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-15'));
});

afterEach(() => {
  vi.useRealTimers();
});
```

---

## Comandos

```bash
# Unit tests
pnpm test                    # Run all
pnpm test:watch              # Watch mode
pnpm test path/to/file       # Single file
pnpm test --coverage         # With coverage

# E2E tests
pnpm test:e2e                # Headless
pnpm test:e2e --ui           # Con UI
pnpm test:e2e --debug        # Debug mode
```

---

## 🧪 Checklist de Validación

### Unit Test Nuevo

- [ ] `describe` con nombre del módulo/función
- [ ] `it('should X when Y')` descriptivo
- [ ] Arrange-Act-Assert pattern
- [ ] Mocks solo para externals (DB, auth)
- [ ] Cleanup en `afterEach` si hay state

### Integration Test Nuevo

- [ ] Factory functions para test data
- [ ] Cleanup de datos de prueba
- [ ] No depende de orden de ejecución

### E2E Test Nuevo

- [ ] `test.beforeEach` para login si necesario
- [ ] `testId` para selectores estables
- [ ] Screenshots on failure
- [ ] No hardcodea datos

---

## Anti-Patrones

| ❌ Evitar               | ✅ Preferir               |
| ----------------------- | ------------------------- |
| Test de implementación  | Test de comportamiento    |
| Mock de todo            | Mock solo externals       |
| Tests interdependientes | Tests aislados            |
| `test('works')`         | `test('should X when Y')` |
| Datos hardcodeados      | Factories                 |
| Skip tests rotos        | Fix o `.fixme()`          |

---

## 🔗 Colaboración

| Con                  | Cuándo                               | Acción                             |
| -------------------- | ------------------------------------ | ---------------------------------- |
| **quality-engineer** | Testing strategy, coverage decisions | Escalar                            |
| **security**         | Auth test fixtures, security tests   | Cargar `domains/security/SKILL.md` |
| **db**               | Integration tests con DB             | Cargar `domains/db/SKILL.md`       |

---

_Skill de dominio del TimeKast Factory_
