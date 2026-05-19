# Phase 4: EPIC-SETUP Generation

> **Solo full mode.** Skip en `/backlog add`.
> **Propósito:** Generar issues de configuración inicial del proyecto.
> **Knowledge:** SKILL.md §1 (EPIC-SETUP tables)

---

## 4.1 Detectar si SETUP ya existe

// turbo

```bash
echo "🔍 Verificando si EPIC-SETUP ya existe..."
SETUP_COUNT=$(find ./docs/backlog -name "SETUP-*.md" -path "*/issues/*" 2>/dev/null | wc -l | tr -d ' ')

if [ "$SETUP_COUNT" -gt 0 ]; then
  echo "📦 EPIC-SETUP ya existe ($SETUP_COUNT issues) — SKIP"
else
  echo "🆕 EPIC-SETUP NO existe — GENERANDO"
fi
```

**Si ya existe → Skip a Phase 5.**

---

## 4.2 Generar EPIC-SETUP

**Si EPIC-SETUP NO existe:**

1. Crear `docs/backlog/M{N}/epics/EPIC-SETUP.md` con template de SKILL §1
2. Cargar inputs adicionales:

// turbo

```bash
cat ./docs/guides/getting-started.md 2>/dev/null | head -100 || echo "⚠️ getting-started.md no encontrado"
```

3. Generar los 9 issues obligatorios (SKILL §1 — tabla de issues obligatorios)
4. Preguntar al usuario cuáles opcionales aplican (SETUP-010/011/012)
5. Usar template ligero de SKILL §1

**Reglas (de SKILL §1):**

- EPIC-00 — siempre primer epic
- Solo configuración — NO código nuevo
- SSOT: getting-started.md
- XS/S effort — cada issue ≤ 2 horas

---

## 4.3 Validación SETUP

Verificar que cada SETUP issue:

- Tiene metadata block (ver SKILL §4)
- Tiene AC verificables
- Referencia getting-started.md o Discovery Brief §8-§9
- NO duplica funcionalidad SK

---

_EPIC-SETUP Complete → Continuar a Phase 5 (Generation)_
