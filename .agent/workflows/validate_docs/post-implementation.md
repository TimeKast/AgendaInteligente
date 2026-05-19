# Phase V3: Post-Implementation Validation

> **Propósito:** Verificar que el código implementado refleja lo documentado
> y que la documentación del proyecto está actualizada.
>
> **Cuándo usar:** Pre-release, después de implementar el backlog.

---

## 3.1 Code vs Documentation

> 🔴 **OBLIGATORIO:** Verificar que la implementación es fiel a los docs.

### Schema vs Data Model

**Comparar `lib/db/schema/*.ts` contra `docs/planning/06_DATA_MODEL.md`:**

- [ ] ¿Cada E-XXX en data model tiene tabla correspondiente en schema?
- [ ] ¿Los campos (columnas) coinciden? ¿Hay campos extra no documentados?
- [ ] ¿Los tipos de datos coinciden? (string vs varchar, number vs integer)
- [ ] ¿Las relaciones (FK) coinciden con el diagrama de relaciones?
- [ ] ¿Hay tablas en schema que no están en data model? (scope creep)
- [ ] ¿Hay soft-delete donde los docs lo piden?

// turbo

```bash
echo "🔍 Schema vs Data Model..."
echo "📂 Schema files:"
ls lib/db/schema/*.ts 2>/dev/null | while read f; do
  tables=$(grep -c "export const" "$f" 2>/dev/null || echo "0")
  echo "  $(basename $f): $tables tables/exports"
done
echo ""
echo "📂 Data Model entities:"
grep -oE 'E-[0-9]+' docs/planning/06_DATA_MODEL.md 2>/dev/null | sort -u | while read e; do
  echo "  $e"
done
```

### Server Actions vs API Contracts

**Comparar `lib/actions/*.ts` contra `docs/planning/08_API_CONTRACTS.md`:**

- [ ] ¿Cada action documentada en 08 existe como función exportada?
- [ ] ¿Los parámetros de entrada coinciden?
- [ ] ¿Los tipos de retorno coinciden?
- [ ] ¿Hay actions en código que no están documentadas?
- [ ] ¿Se siguen las convenciones de error handling del SK?

### Business Rules en Código

**Comparar implementación contra `docs/planning/05_BUSINESS_RULES.md`:**

- [ ] ¿Cada BR-XXX tiene implementación verificable en el código?
- [ ] ¿Las validaciones Zod reflejan las reglas documentadas?
- [ ] ¿Hay reglas implementadas que no están documentadas?
- [ ] ¿Los mensajes de error corresponden a las reglas?

### UI vs Design

**Comparar pantallas implementadas contra `docs/planning/15_DESIGN.md`:**

- [ ] ¿Cada SCR-XXX tiene página correspondiente en `src/app/`?
- [ ] ¿Los componentes CMP-XXX existen y se usan donde se diseñaron?
- [ ] ¿Los data requirements de cada SCR coinciden con lo que la página consume?
- [ ] ¿Los FLW-XXX (flujos) se pueden recorrer de principio a fin?
- [ ] ¿Los estados UI documentados (loading, empty, error) están implementados?

---

## 3.2 Project Documentation

> Verificar que los docs del proyecto están actualizados con la implementación.

### README.md

- [ ] ¿Setup instructions funcionan? (clonar, instalar, configurar env, correr dev)
- [ ] ¿Variables de entorno necesarias están documentadas?
- [ ] ¿Features implementadas están listadas?
- [ ] ¿Stack tecnológico está actualizado?
- [ ] ¿Scripts disponibles están documentados? (`pnpm dev`, `pnpm test`, etc.)

### CHANGELOG.md (si existe)

- [ ] ¿Refleja los issues implementados?
- [ ] ¿Versión correcta?
- [ ] ¿Formato sigue convenciones (Keep a Changelog, etc.)?

### package.json

- [ ] ¿`version` es correcta?
- [ ] ¿`factoryVersion` corresponde al SK usado?
- [ ] ¿`agentKitVersion` está actualizado?
- [ ] ¿Scripts definidos corresponden a los documentados en README?

### .env.example

- [ ] ¿TODAS las variables de entorno usadas en el código están en `.env.example`?
- [ ] ¿Hay variables en `.env.example` que ya no se usan?
- [ ] ¿Cada variable tiene descripción/comentario?

// turbo

```bash
echo "🔍 Project Docs Check..."

# README
[ -f "README.md" ] && echo "✅ README.md exists ($(wc -l < README.md) lines)" || echo "🔴 README.md MISSING"

# CHANGELOG
[ -f "CHANGELOG.md" ] && echo "✅ CHANGELOG.md exists" || echo "⚠️ CHANGELOG.md missing (optional)"

# package.json versions
if [ -f "package.json" ]; then
  echo "📦 package.json:"
  echo "  version: $(grep '"version"' package.json | head -1 | cut -d'"' -f4)"
  echo "  factoryVersion: $(grep '"factoryVersion"' package.json | head -1 | cut -d'"' -f4 2>/dev/null || echo 'not set')"
  echo "  agentKitVersion: $(grep '"agentKitVersion"' package.json | head -1 | cut -d'"' -f4 2>/dev/null || echo 'not set')"
fi

# .env.example
[ -f ".env.example" ] && echo "✅ .env.example exists ($(wc -l < .env.example) lines)" || echo "🔴 .env.example MISSING"

# Check for env vars used in code but missing from .env.example
if [ -f ".env.example" ]; then
  echo ""
  echo "🔍 Env vars in code not in .env.example:"
  grep -rohE 'process\.env\.[A-Z_]+' lib/ src/ 2>/dev/null | sort -u | sed 's/process.env.//' | while read var; do
    grep -q "$var" .env.example 2>/dev/null || echo "  ❌ $var"
  done
fi
```

---

## 3.3 Issue Closure Validation

> Verificar que los issues marcados como ✅ Done realmente están implementados.

- [ ] ¿Cada issue ✅ Done tiene código correspondiente?
- [ ] ¿Los Acceptance Criteria de cada issue completo están marcados `[x]`?
- [ ] ¿Hay issues ✅ Done sin tests?
- [ ] ¿Hay issues abiertos que bloquean otros issues ya cerrados?

---

## 3.4 Output V3

### Resumen Post-Implementation

| Área                     | Checks | Passed | Failed | Status |
| ------------------------ | :----: | :----: | :----: | :----: |
| Schema vs Data Model     |   N    |   N    |   N    | ✅/🔴  |
| Actions vs API Contracts |   N    |   N    |   N    | ✅/🔴  |
| BR vs Code               |   N    |   N    |   N    | ✅/🔴  |
| UI vs Design             |   N    |   N    |   N    | ✅/🔴  |
| README                   |   N    |   N    |   N    | ✅/🔴  |
| package.json             |   N    |   N    |   N    | ✅/🔴  |
| .env.example             |   N    |   N    |   N    | ✅/🔴  |
| Issue closure            |   N    |   N    |   N    | ✅/🔴  |

### Hallazgos

```markdown
### [Severidad] Título

**Área:** Schema vs Data Model
**Doc:** 06_DATA_MODEL E-005
**Código:** lib/db/schema/beneficiaries.ts
**Problema:** Campo `accountNumber` en schema pero no en E-005
**Sugerencia:** Agregar a data model o remover del schema
```

---

_Post-Implementation Complete → Continuar a Report_
