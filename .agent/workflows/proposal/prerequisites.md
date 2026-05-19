# Phase 2: Prerequisites

> **Carga:** Después de context.md

---

## Verificar Discovery Brief

// turbo

```bash
echo "📄 Verificando Discovery Brief..."
echo ""

if [ -f "./docs/planning/00_DISCOVERY_BRIEF.md" ]; then
  echo "✅ 00_DISCOVERY_BRIEF.md existe"
else
  echo "❌ 00_DISCOVERY_BRIEF.md — FALTA (requerido)"
  echo ""
  echo "🛑 STOP — Ejecutar /discovery primero"
  exit 1
fi
```

---

## Verificar Coverage Map del Brief

// turbo

```bash
echo "🔍 Validando Coverage Map del Discovery Brief..."
echo ""

# Check §1 (Idea)
if grep -qE "§1.*✅|§1.*:.*check|## §1" ./docs/planning/00_DISCOVERY_BRIEF.md 2>/dev/null; then
  echo "✅ §1 (Idea): Presente"
else
  echo "⚠️ §1 (Idea): Verificar"
fi

# Check §2 (Usuarios)
if grep -qE "§2.*✅|§2.*:.*check|## §2" ./docs/planning/00_DISCOVERY_BRIEF.md 2>/dev/null; then
  echo "✅ §2 (Usuarios): Presente"
else
  echo "⚠️ §2 (Usuarios): Verificar"
fi

# Check §3 (Features)
if grep -qE "§3.*✅|§3.*:.*check|## §3" ./docs/planning/00_DISCOVERY_BRIEF.md 2>/dev/null; then
  echo "✅ §3 (Features): Presente"
else
  echo "⚠️ §3 (Features): Verificar"
fi
```

---

## Cargar Discovery Brief

// turbo

```bash
echo "=== Discovery Brief ==="
cat ./docs/planning/00_DISCOVERY_BRIEF.md
```

---

## Extraer Información Clave

**El agente debe extraer del Discovery Brief:**

1. **Objetivo principal** del cliente (§1)
2. **Usuarios/roles** identificados (§2)
3. **Features MVP** prioritarios (§3)
4. **Restricciones** explícitas (§4 si existe)
5. **Términos del dominio** usados por el cliente

---

## Si Brief Incompleto

```markdown
🛑 **STOP — Discovery Brief Incompleto**

Las siguientes secciones están incompletas:

- [listar secciones faltantes]

**Acción requerida:** Ejecutar `/discovery` y completar las secciones antes de generar propuesta.
```

**ACTION:** Call `notify_user` NOW with `BlockedOnUser=true`. **NO CONTINUAR.**

---

_Prerequisites Complete → Ir a CHECKPOINT 1 → Continuar a Generation_
