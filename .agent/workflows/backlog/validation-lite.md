# Phase 7 (add mode): Validation Lite

> **Solo en `/backlog add`.**
> **Propósito:** Validar issue/epic/milestone recién creado contra backlog existente.
> Misma rigurosidad, diferente scope.

---

## 7c.0 Identify Generated Files

> 🔴 **NO usar `ls -t` para adivinar qué se generó.**
> El agente SABE qué archivos acaba de crear. Listarlos explícitamente.

```markdown
## Archivos generados en esta sesión:

| Archivo                                             | Tipo             |
| --------------------------------------------------- | ---------------- |
| `docs/backlog/M{N}/issues/{PREFIX}-{NUM}-{slug}.md` | Issue            |
| `docs/backlog/M{N}/epics/EPIC-{NN}-{NAME}.md`       | Epic (si aplica) |
```

> El agente valida CADA archivo de esta lista, no "el más reciente".

---

## 7c.1 Structural Validation (per file)

> Verificar que CADA archivo generado cumple formato SKILL §4.

**Checklist por issue:**

- [ ] Título correcto: `# PREFIX-NUM: Título`
- [ ] Metadata block completo (Status, Priority, Effort, SP, Epic)
- [ ] Descripción ≥ 3 oraciones
- [ ] User Story con P-XXX
- [ ] AC ≥ 3 checkboxes verificables
- [ ] Gherkin en español (si UI)
- [ ] Doc References (Inline) ≥ 2
- [ ] Contexto técnico ≥ 2 bullets
- [ ] SK Leverage declarado
- [ ] Skills/Agents asignados
- [ ] No placeholders ({...}, [TODO], TBD)

**Checklist por epic (si se creó):**

- [ ] Título con EPIC-NN
- [ ] Milestone, Status
- [ ] Tabla de issues completa
- [ ] Dependencias explícitas
- [ ] Scope (incluido / excluido)

**Para CADA archivo generado, ejecutar:**

// turbo

```bash
echo "🔍 Validando archivos generados..."
# El agente debe sustituir GENERATED_FILES con los paths reales
for GENERATED in $GENERATED_FILES; do
  if [ -f "$GENERATED" ]; then
    echo "📄 Validando: $(basename $GENERATED)"
    lines=$(wc -l < "$GENERATED")
    echo "   📏 Líneas: $lines (mínimo 30)"
    grep -qF '**Status:**' "$GENERATED" && echo "   ✅ Status" || echo "   ❌ Status falta"
    grep -qF '**Priority:**' "$GENERATED" && echo "   ✅ Priority" || echo "   ❌ Priority falta"
    grep -qF '**Story Points:**' "$GENERATED" && echo "   ✅ Story Points" || echo "   ❌ Story Points falta"
    grep -qF '**Epic:**' "$GENERATED" && echo "   ✅ Epic" || echo "   ❌ Epic falta"
    grep -q "## Criterios de Aceptación\|## Acceptance Criteria" "$GENERATED" && echo "   ✅ AC section" || echo "   ❌ AC falta"
    grep -q "Escenario:\|Scenario:" "$GENERATED" && echo "   ✅ Gherkin" || echo "   ⚠️ Gherkin falta (solo warning si no-UI)"
    grep -q "## SK Leverage" "$GENERATED" && echo "   ✅ SK Leverage" || echo "   ❌ SK Leverage falta"
    echo ""
  else
    echo "🔴 $GENERATED NO EXISTE — error de generación"
  fi
done
```

---

## 7c.2 Consistency Check (vs existing backlog)

**Verificar:**

1. **IDs no duplicados (global):**

// turbo

```bash
echo "🔍 Verificando IDs únicos..."
ALL_IDS=$(for f in docs/backlog/*/issues/*.md; do
  [ -f "$f" ] && head -1 "$f" | grep -oE '^# [A-Z]+-[0-9]+' | sed 's/^# //'
done | sort)
DUPES=$(echo "$ALL_IDS" | uniq -d)
[ -z "$DUPES" ] && echo "✅ Todos los IDs son únicos" || echo "🔴 IDs duplicados: $DUPES"
```

2. **Epic referenciado existe (por archivo generado):**

> El agente verifica que el epic referenciado en metadata de cada archivo generado existe.

3. **Dependencias existen (por archivo generado):**

> El agente verifica que cada `Blocked By` en archivos generados referencia un issue existente.

4. **Numbering consistency:**

> Si issue se agregó a epic existente:
>
> - ¿Su número secuencial es el siguiente disponible?
> - ¿El issue de testing sigue siendo el último?
> - Si no → renumerar testing issue

---

## 7c.3 Overlap Detection

> 🔴 ¿El nuevo issue duplica funcionalidad existente?

**Verificar contra:**

1. **SK:** `docs/reference/features.md`
   - Si recrea Auth/RBAC/DataTable/Nav/Push/SSE → 🔴 ELIMINAR o convertir a config
   - Si extiende algo del SK → ✅ aceptable

2. **Backlog existente:** ¿Hay un issue que ya cubra esto?
   - Buscar por título similar, mismo SCR/US/E reference
   - Si overlap → 🔴 Fusionar con existente o eliminar

---

## 7c.4 Quality Gate

> 🛑 Si ANY check BLOCKER falla → corregir ANTES de continuar a close.

| Check                 | Result | Status |
| --------------------- | ------ | ------ |
| Structural format     | ✅/🔴  |        |
| IDs únicos            | ✅/🔴  |        |
| Epic existe           | ✅/🔴  |        |
| Dependencies existen  | ✅/🔴  |        |
| SK overlap            | ✅/🔴  |        |
| Backlog overlap       | ✅/🔴  |        |
| Quality mínimos       | ✅/🔴  |        |
| Numbering consistency | ✅/🔴  |        |

---

_Validation Lite Complete → Continuar a Phase 8 (Close)_
