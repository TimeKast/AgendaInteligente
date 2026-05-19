# Phase 2.0: R0 Checks (Test Suite)

> **Scope:** Test gate — unit, integration, E2E
> **Tiempo:** ~2-5m
> **Nota:** lint/typecheck ya corre automático en pre-commit

---

## Quality Gate

// turbo

```bash
echo "🔍 R0: Test Suite Check"
echo "📋 Nota: lint/typecheck ya validados en pre-commit"
```

// turbo

```bash
echo "🧪 Unit + Integration Tests:"
pnpm test || { echo "❌ Tests failed"; exit 1; }
```

// turbo

```bash
echo "🧪 E2E Tests:"
if grep -q '"test:e2e"' package.json; then
  pnpm test:e2e || { echo "❌ E2E tests failed"; exit 1; }
else
  echo "⬜ No E2E configured (optional for R0)"
fi
```

---

## Pass Criteria

| Check       | Required          |
| ----------- | ----------------- |
| unit tests  | ✅ Pass           |
| integration | ✅ Pass           |
| e2e         | ✅ Pass if exists |

---

_R0 Complete → Continuar a Report_
