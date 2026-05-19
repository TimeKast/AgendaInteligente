# Phase 3: Generation

> **Carga:** Solo después de CHECKPOINT 1 aprobado

---

## 2.1 Crear Directorio

```bash
mkdir -p ./docs/planning
```

---

## 2.2 Cargar Template

// turbo

```bash
cat ./.agent/skills/roles/proposal/PROPOSAL.template.md 2>/dev/null || cat ./.agent/skills/roles/proposal/PROPOSAL.template.md
```

---

## 2.3 Generar PROPOSAL.md

**Usando información del Discovery Brief, generar documento con estas secciones:**

### Estructura Requerida

```markdown
# Propuesta: [Nombre del Proyecto]

## 1. Resumen Ejecutivo

[1-2 párrafos resumiendo el proyecto]

## 2. Objetivos

- Objetivo principal
- Objetivos secundarios

## 3. Solución Propuesta

[Descripción de alto nivel de la solución]

## 4. Usuarios y Roles

| Rol | Descripción | Acciones principales |
| --- | ----------- | -------------------- |

## 5. Flujos Principales

[Descripción de los flujos clave]

## 6. Alcance MVP

### Incluye:

- [Lista de features incluidos]

### Evolución planificada:

- [Lista de features para fases posteriores]

## 7. Supuestos y Decisiones Pendientes

| #   | Supuesto/Decisión | Estado |
| --- | ----------------- | ------ |

## 8. Próximos Pasos

1. Aprobación de esta propuesta
2. Inicio de documentación técnica
3. ...
```

---

## 2.4 Reglas de Redacción

**PROHIBIDO:**

- ❌ Tecnicismos (Next.js, API, PostgreSQL, etc.)
- ❌ Precios o costos
- ❌ Plazos específicos sin confirmar
- ❌ Lenguaje técnico de desarrollo

**OBLIGATORIO:**

- ✅ Lenguaje de negocio
- ✅ Términos que el cliente usa
- ✅ Supuestos marcados explícitamente
- ✅ Alcance claro (MVP y evolución)
- ✅ Lenguaje neutro y propositivo — NUNCA framing negativo
  - ❌ "No incluye", "excluido", "fuera de alcance"
  - ✅ "Evolución planificada", "fases posteriores", "siguiente iteración"

---

## 2.5 Guardar Documento

**Output:** `docs/planning/01_PROPOSAL.md`

---

## 2.6 Quality Check Post-Generación

// turbo

```bash
if [ -f "./docs/planning/01_PROPOSAL.md" ]; then
  echo "📄 01_PROPOSAL.md generado"
  echo ""
  echo "🔍 Quick validation:"

  # Check for technical terms
  TECH_TERMS=$(grep -iE "API|endpoint|database|schema|deploy|Next.js|React|PostgreSQL|Drizzle" ./docs/planning/01_PROPOSAL.md 2>/dev/null | wc -l)
  if [ "$TECH_TERMS" -gt 0 ]; then
    echo "  ⚠️ Found $TECH_TERMS lines with technical terms - review needed"
  else
    echo "  ✅ No technical jargon detected"
  fi

  # Check for price mentions
  PRICE_TERMS=$(grep -iE "\\$|USD|MXN|precio|costo|presupuesto|cotización" ./docs/planning/01_PROPOSAL.md 2>/dev/null | wc -l)
  if [ "$PRICE_TERMS" -gt 0 ]; then
    echo "  ⚠️ Found $PRICE_TERMS lines with price/cost mentions - should remove"
  else
    echo "  ✅ No pricing information detected"
  fi

  echo ""
  wc -l ./docs/planning/01_PROPOSAL.md
else
  echo "❌ 01_PROPOSAL.md not created"
fi
```

---

_Generation Complete → Continuar a Validation_
