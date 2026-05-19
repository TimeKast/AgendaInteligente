# Document Versioning (runtime primitive)

> **Propósito:** Versionamiento de documentos generados por el pipeline cuando se re-visitan.
> **Uso:** Leído por el agente con Read tool desde el workflow que necesite versionar un doc.
> **El workflow caller define QUÉ archivo versionar y CUÁNDO aplicar versioning.**

---

## Instrucciones

Cuando un workflow va a MODIFICAR un documento del pipeline que ya existe:

### 1. Detectar versión actual

Buscar en el header del documento una línea tipo:
`> Version: vX.Y`

Si no existe → asumir `v1.0`.

### 2. Incrementar versión

| Tipo de cambio                 | Bump  | Ejemplo     |
| ------------------------------ | ----- | ----------- |
| Profundizar, agregar detalles  | Patch | v1.0 → v1.1 |
| Corregir errores, resolver OQs | Patch | v1.1 → v1.2 |
| Cambio de scope o alcance      | Minor | v1.2 → v2.0 |

### 3. Actualizar header

Agregar o actualizar la línea de versión en el header del documento:
`> Version: vX.Y`

### 4. Agregar changelog entry

Al final del documento, agregar o actualizar:

```markdown
## 📝 Version History

| Version | Date             | Changes              | Sections Affected |
| ------- | ---------------- | -------------------- | ----------------- |
| v1.0    | [fecha original] | Initial generation   | All               |
| v1.1    | [hoy]            | [resumen de cambios] | §X, §Y            |
```

---

## Reglas

> 🔴 **NUNCA sobreescribir silenciosamente.** Cada modificación = nueva versión con registro.
> 🔴 **NUNCA bajar de versión.** Solo incrementar.
> El versionamiento es informativo — no bloquea cambios, solo los registra.

---

_Document Versioning — Runtime primitive (shared)_
