# 🧪 Test Strategy — {{PROJECT_NAME}}

> **Generado por:** `/docs`
> **Propósito:** Estrategia de testing y coverage goals.

---

## Pirámide de Tests

```
        ┌───────────┐
        │    E2E    │  ← Menos, más lentos, más valiosos
        ├───────────┤
        │ Integration│
        ├───────────┤
        │   Unit    │  ← Más, más rápidos, base sólida
        └───────────┘
```

| Nivel | Tipo        | Cobertura Goal  | Herramienta |
| ----- | ----------- | --------------- | ----------- |
| Base  | Unit        | 80%+            | Vitest      |
| Medio | Integration | 60%+            | Vitest      |
| Cima  | E2E         | Flujos críticos | Playwright  |

---

## Qué Testear por Prioridad

### P0 — Crítico (siempre)

| Área           | Qué testear                      |
| -------------- | -------------------------------- |
| Auth           | Login, logout, session, permisos |
| Data Mutations | Create, update, delete           |
| Business Rules | Validaciones, invariantes        |

### P1 — Importante

| Área    | Qué testear                       |
| ------- | --------------------------------- |
| Queries | Filtros, paginación, ordenamiento |
| State   | Transiciones de estado            |
| Errors  | Manejo de errores, mensajes       |

### P2 — Nice to have

| Área          | Qué testear               |
| ------------- | ------------------------- |
| UI Components | Renderizado, interacción  |
| Edge Cases    | Límites, vacíos, extremos |

---

## Cuándo Testear

| Trigger    | Tests              | Tiempo máx |
| ---------- | ------------------ | ---------- |
| Pre-commit | Lint + Typecheck   | 30s        |
| Pre-push   | Unit + Integration | 2min       |
| CI         | Full suite         | 5min       |
| Deploy     | E2E smoke          | 3min       |

---

## Test Patterns

### AAA Pattern

```typescript
it('should create entity', async () => {
  // Arrange
  const input = { name: 'Test' };

  // Act
  const result = await createEntity(input);

  // Assert
  expect(result.name).toBe('Test');
});
```

### Mocking

- 📌 Mock external services (emails, APIs)
- ✅ Use real DB for integration (Neon branch)
- ❌ No mocks en E2E

---

## Coverage Goals

| Área         | Mínimo | Ideal |
| ------------ | ------ | ----- |
| lib/actions/ | 80%    | 90%   |
| lib/db/      | 70%    | 80%   |
| components/  | 50%    | 70%   |

---

## Commands

```bash
pnpm test           # Unit tests
pnpm test:watch     # Watch mode
pnpm test:coverage  # Coverage report
pnpm test:e2e       # E2E (Neon branch)
```

---

_Generado por TimeKast Factory — /docs_
