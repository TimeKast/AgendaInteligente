# Phase 5: Close

> **Carga:** Solo después de CHECKPOINT 2 aprobado

---

## 4.1 Verificar Artefacto Final

// turbo

```bash
if [ -f "./docs/planning/01_PROPOSAL.md" ]; then
  echo "✅ 01_PROPOSAL.md existe"
  wc -l ./docs/planning/01_PROPOSAL.md
else
  echo "❌ 01_PROPOSAL.md no encontrado"
fi
```

---

## 4.2 Handoff Summary

**Mostrar al usuario:**

```markdown
## ✅ Propuesta Generada

**Proyecto:** [nombre]
**Archivo:** `docs/planning/01_PROPOSAL.md`

**Contenido:**

- Resumen ejecutivo
- Objetivos
- Solución propuesta
- Usuarios y roles
- Flujos principales
- Alcance MVP y evolución planificada
- Supuestos y decisiones

**Análisis de Cobertura:**

- Cobertura vs Discovery: [X%]
- Gaps corregidos: [N]

**Próximo paso:**

| #   | Acción           | Comando            |
| --- | ---------------- | ------------------ |
| 1   | Cliente aprueba  | Enviar PROPOSAL.md |
| 2   | Continuar a docs | `/docs`            |
```

---

## SSOT Chain Position

```
/start → /discovery → /proposal → /docs → /design → /backlog → /implement
                          ↑
                      COMPLETED
```

**Next in chain:** `/docs` (generar documentación técnica)

---

## Notas para /docs

Cuando el cliente apruebe la propuesta:

1. PROPOSAL.md queda como referencia de alcance aprobado
2. Features en propuesta = features a documentar
3. Usuarios en propuesta = personas a documentar

---

## 4.3 Re-Validate Option

> Si la validación multi-agente falló por error del modelo, ofrecer re-ejecutar.

**Mostrar:**

```markdown
| #   | Opción         | Acción                                |
| --- | -------------- | ------------------------------------- |
| 1   | **continuar**  | Proceder con commit                   |
| 2   | **re-validar** | Ejecutar solo validación multi-agente |
| 3   | **cancelar**   | Abortar                               |
```

**Si usuario elige 2 (re-validar):**

- Cargar y ejecutar SOLO la fase de validación del workflow
- Regresar a este checkpoint después

---

## Auto-Commit (post-approval)

> Después de CHECKPOINT aprobado, hacer commit automático.
> 🔴 **Antes de commit: actualizar Pipeline Status en `docs/planning/project-config.md`**
> → Cambiar fila `Proposal` de `⬜ Pendiente` a `✅ Completo`

// turbo

```bash
git add docs/planning/01_PROPOSAL.md docs/planning/project-config.md
git commit -m "docs(proposal): generate Proposal"
```

---

_Proposal Workflow Complete_
