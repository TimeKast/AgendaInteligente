# 🎭 E2E Scenarios — {{PROJECT_NAME}}

> **Generado por:** `/docs`
> **Propósito:** Flujos críticos a automatizar con Playwright.

---

## Flujos Críticos (P0)

> Estos flujos DEBEN pasar antes de cada deploy.

| ID      | Flujo             | Actor | Resultado Esperado |
| ------- | ----------------- | ----- | ------------------ |
| E2E-001 | Login             | User  | Ve dashboard       |
| E2E-002 | Logout            | User  | Ve login page      |
| E2E-003 | Create {{entity}} | Admin | Entity en tabla    |
| E2E-004 | Edit {{entity}}   | Admin | Cambios reflejados |
| E2E-005 | Delete {{entity}} | Admin | Entity removida    |

---

## Detalle: E2E-001 Login

**Pasos:**

1. Navegar a `/login`
2. Ingresar email válido
3. Ingresar password
4. Click "Iniciar Sesión"

**Assertions:**

- [ ] Redirige a `/dashboard`
- [ ] Nombre de usuario visible en header
- [ ] No errores en consola

**Código:**

```typescript
test('E2E-001: Login exitoso', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="submit"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
});
```

---

## Flujos P1 — Importantes

| ID      | Flujo           | Actor   | Resultado Esperado |
| ------- | --------------- | ------- | ------------------ |
| E2E-010 | Forgot Password | User    | Email enviado      |
| E2E-011 | Invite User     | Admin   | Invite creado      |
| E2E-012 | Accept Invite   | Invitee | Cuenta activa      |

---

## Flujos P2 — Nice to Have

| ID      | Flujo         | Actor | Resultado Esperado |
| ------- | ------------- | ----- | ------------------ |
| E2E-020 | Theme Toggle  | User  | Dark/Light mode    |
| E2E-021 | Mobile Drawer | User  | Menu abre/cierra   |

---

## Fixture Data

| Entidad    | Email/ID       | Password | Rol   |
| ---------- | -------------- | -------- | ----- |
| Test Admin | admin@test.com | test123  | ADMIN |
| Test User  | user@test.com  | test123  | USER  |

---

## Configuración Playwright

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
  ],
});
```

---

## Commands

```bash
pnpm test:e2e         # Run all E2E
pnpm test:e2e:ui      # Interactive mode
pnpm test:e2e -- --grep "E2E-001"  # Run specific
```

---

_Generado por TimeKast Factory — /docs_
