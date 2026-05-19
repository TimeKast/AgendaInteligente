# Runtime primitives compartidas

> **Qué es esto:** bloques reusables invocados por workflows (`tk-*`) **durante su ejecución**. No es una skill (no tiene `SKILL.md`); cada `.md` es autónomo y se carga con Read tool desde la fase que lo necesite.

---

## Catálogo

| Primitiva                        | Propósito                                                       | Cuándo se invoca                               |
| -------------------------------- | --------------------------------------------------------------- | ---------------------------------------------- |
| [`versioning.md`](versioning.md) | Versionar documentos del pipeline al re-visitar (`v1.0 → v1.1`) | Antes de modificar un doc generado previamente |

> **Historial:** `context-check.md` y `checkpoint-transparency.md` fueron retirados. El self-report de context-status era theater (la realidad la sabe el harness, que ya hace auto-compact). La "checkpoint transparency" que emitían se cubre naturalmente en los templates de CP1/CP2 de cada workflow — no necesita bloque compartido.

---

## Reglas de uso

- **Cargar con Read tool**, no con `cat`.
- El workflow caller decide **cuándo** invocar la primitiva y **qué hacer** con su output.
- Cada primitiva es independiente.
- **No** agregar primitivas sin un workflow concreto que las consuma (YAGNI).

---

## Consumidores actuales

- _(ninguno activo — `versioning.md` está pendiente de re-evaluación)_

---

_TimeKast Factory — Runtime shared primitives_
