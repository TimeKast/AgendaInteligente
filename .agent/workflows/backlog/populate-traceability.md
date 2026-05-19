# Phase 6b: Populate Traceability Matrix

> **Carga:** Después de gap-analysis.md, antes de validation.
> **Solo full mode.**
> **Propósito:** Auto-poblar 14_TRACEABILITY.md con mapeos US→Issue.

---

## 6b.1 Extraer Mapeos de Issues

// turbo

```bash
echo "🔍 Extrayendo mapeos US→Issue..."

for issue in ./docs/backlog/*/issues/*.md; do
  if [ -f "$issue" ]; then
    ISSUE_ID=$(basename "$issue" .md | sed 's/-[a-z].*//i')
    US_REF=$(grep -oE "Implementa:\s*US-[0-9]+" "$issue" 2>/dev/null | sed 's/Implementa:\s*//')
    if [ -n "$US_REF" ]; then
      echo "📎 $US_REF → $ISSUE_ID"
    fi
  fi
done
```

---

## 6b.2 Verificar 14_TRACEABILITY.md existe

// turbo

```bash
if [ ! -f "./docs/planning/14_TRACEABILITY.md" ]; then
  echo "❌ 14_TRACEABILITY.md no existe"
  echo "👉 Ejecutar /docs primero para crear stub"
else
  echo "✅ 14_TRACEABILITY.md existe"
fi
```

---

## 6b.3 Generar Tabla de Mapeos

**El agente debe:**

1. Leer todos los issues generados
2. Extraer `Implementa: US-XXX` de cada issue
3. Crear tabla y actualizar 14_TRACEABILITY.md:

```markdown
## Mapeo US → Issue

| US-XXX | Issue    | Epic      | Test Status | Deploy Status |
| ------ | -------- | --------- | ----------- | ------------- |
| US-001 | AUTH-001 | EPIC-AUTH | ⚪ Pending  | ⚪ Pending    |
```

---

## 6b.4 Validar Cobertura

// turbo

```bash
echo "🔍 Validando cobertura US→Issue..."
US_COUNT=$(grep -oE "US-[0-9]+" ./docs/planning/04_USER_STORIES.md 2>/dev/null | sort -u | wc -l)
echo "📊 User Stories en 04_USER_STORIES: $US_COUNT"

MAPPED_COUNT=$(grep -ohE "Implementa:\s*US-[0-9]+" ./docs/backlog/*/issues/*.md 2>/dev/null | sort -u | wc -l)
echo "📊 User Stories mapeadas a Issues: $MAPPED_COUNT"

if [ "$MAPPED_COUNT" -lt "$US_COUNT" ]; then
  echo "⚠️ Hay US sin issue asignado"
else
  echo "✅ Todas las US tienen issue"
fi
```

---

## 6b.5 Non-Traceable Issues (Enabling Work)

> Issues que NO mapean a US pero son necesarios.

**El agente debe:**

1. Identificar issues sin `Implementa: US-XXX`
2. Clasificar por tipo (Testing, Infra, ADR, etc.)
3. Actualizar 14_TRACEABILITY.md:

```markdown
## Non-Traceable Issues (Enabling Work)

| Issue          | Tipo           | Justificación            |
| -------------- | -------------- | ------------------------ |
| SHELL-004-test | Testing        | Epic test, no mapea a US |
| ADR-001-...    | ADR/Decision   | Decisión arquitectónica  |
| INFRA-001-...  | Infrastructure | Setup CI/CD              |
```

> 🔴 Todo issue DEBE estar trazado O declarado como Non-Traceable.

---

## 6b.6 Update Board

// turbo

```bash
pnpm update-board
echo "✅ BOARD.md actualizado"
```

---

_Phase 6b Complete → Continuar a CHECKPOINT 2_
