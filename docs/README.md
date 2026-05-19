# 📚 Documentation — Cliente-facing

> Reservado para documentación que el **cliente final** consume post-entrega.

---

## 3-audience rule

Este repo segmenta docs por audiencia. Confundir buckets es un smell:

| Directorio      | Audiencia                 | Viaja con…        | Ejemplos                                                          |
| --------------- | ------------------------- | ----------------- | ----------------------------------------------------------------- |
| `docs/`         | Cliente final             | Entregable        | user manuals, runbooks, release notes, product narrative          |
| `project/`      | Dev del proyecto derivado | Proyecto derivado | backlog, planning, reference autogen, migration, reports          |
| `.claude/docs/` | Dev del kit               | Kit Claude        | getting-started, troubleshooting, CHANGELOG factory, ARCHITECTURE |

---

## Estado actual

Hoy esta carpeta está **vacía por diseño** — aún no existen user manuals ni runbooks del cliente. Cuando aparezcan vivirán aquí.

Si buscas:

- **Backlog, planning, reference, reports** → [`project/`](../project/)
- **Kit onboarding, troubleshooting, CHANGELOG del Starter Kit** → [`.claude/docs/`](../.claude/docs/)

---

_TimeKast — docs/ cliente-facing (vacío hasta que existan entregables al cliente)_
