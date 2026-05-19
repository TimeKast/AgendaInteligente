# ⚡ Quickstart: De idea a app en 7 pasos

## Paso 0: Prepara el repo

```bash
# Si usaste el template de GitHub, ya estás listo
# Si clonaste, asegúrate de tener un repo limpio:
git init
git add .
git commit -m "Initial commit from template"
```

---

## Paso 1: Discovery (5-10 min)

Dile al AI:

```
Tengo una idea para una app: [DESCRIBE TU IDEA EN 2-3 ORACIONES].
Por favor ejecuta /plan/1.0_Discovery.md
```

**Resultado**: Brief estructurado (YAML) en sección B4.

✅ **Revisa y confirma** antes de continuar.

---

## Paso 2: Propuesta (5-10 min)

Dile al AI:

```
Continúa con /plan/1.1_Propuesta.md
```

**Resultado**: `/docs/Propuesta.md` — documento listo para cliente.

✅ **Revisa y confirma** antes de continuar.

---

## Paso 3: Documentación (15-30 min)

Dile al AI:

```
Continúa con /plan/2.0_Documentacion.md
```

**Resultado**: Todos los archivos de `/docs` generados.

✅ **Revisa y confirma** antes de continuar.

---

## Paso 4: Backlog (10-20 min)

Dile al AI:

```
Continúa con /plan/2.1_Backlog.md
```

**Resultado**: `GITHUB_BACKLOG.md` con todos los issues y milestones.

✅ **Revisa y confirma** antes de continuar.

---

## Paso 5: Environment Setup (10-15 min)

Dile al AI:

```
Ejecuta /plan/2.2_Setup_Ambiente.md
```

**Resultado**:

- Dependencias instaladas
- `.env.local` configurado
- Servicios externos conectados (Neon, Vercel, etc.)
- `npm run build` y `npm run dev` funcionando

✅ **Verifica** que todo funciona antes de continuar.

---

## Paso 6: Ejecución (variable)

Dile al AI:

```
Ejecuta el siguiente issue de /plan/3.0_Ejecucion_Local.md
```

Repite hasta completar todos los issues.
El AI ejecutará **un issue a la vez** y esperará tu confirmación.

---

## Paso 7: Auditoría Final

Cuando todos los issues estén DONE:

```
Ejecuta /plan/4.0_Auditoria.md
```

**Resultado**: Reporte de auditoría + decisión de entrega.

---

## 🎉 ¡Listo!

Tu app está documentada, implementada, y auditada.

---

## Tips

- **Siempre confirma** antes de que el AI continúe
- Si algo no está claro, **pregunta** antes de aprobar
- El AI no inventará features - solo implementa lo documentado
- Si cambias de opinión, edita los docs y vuelve a ejecutar el paso relevante

---

## 🔧 Mantenimiento (Post-Desarrollo)

Estos prompts se usan **después** de completar el flujo principal, cuando haces cambios o mejoras:

### Auditoría de Cambios

Después de implementar mejoras o fixes:

```
Ejecuta /plan/7.0_Mantenimiento_Auditoria.md
```

### Sincronizar Documentación

Cuando los cambios afectaron el comportamiento de la app:

```
Ejecuta /plan/7.1_Mantenimiento_Docs.md
```
