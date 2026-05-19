# 🛠️ Runbooks — {{PROJECT_NAME}}

> **Generado por:** `/docs`
> **Propósito:** Procedimientos operacionales para el equipo.

---

## Resumen de Procedimientos

| ID      | Runbook            | Cuándo            |
| ------- | ------------------ | ----------------- |
| RUN-001 | Deployment         | Cada release      |
| RUN-002 | Database Migration | Cambios de schema |
| RUN-003 | Rollback           | Incidentes        |
| RUN-004 | Monitoring         | Alertas           |

---

## RUN-001: Deployment

### Pre-flight Checklist

- [ ] Tests pasan: `pnpm verify`
- [ ] No secrets expuestos en código
- [ ] Variables de entorno configuradas
- [ ] Migrations pendientes aplicadas

### Deploy (Vercel)

```bash
# Push trigger auto-deploy
git push origin main
```

### Verificar Deploy

1. Abrir preview URL
2. Check `/api/health` → `{"status": "ok"}`
3. Test flujo crítico (login, CRUD principal)

### Rollback

```bash
# Vercel rollback a deployment anterior
vercel rollback [deployment-id]
```

---

## RUN-002: Database Migration

### Pre-flight

- [ ] Backup de DB (si producción)
- [ ] Branch de Neon para test (opcional)

### Generar Migración

```bash
pnpm db:generate
```

### Revisar SQL Generado

```bash
cat drizzle/XXXX_*.sql
```

### Aplicar Migración

```bash
pnpm db:migrate
```

### Rollback

> ⚠️ Drizzle NO tiene rollback automático.
> Crear migración inversa manualmente.

---

## RUN-003: Rollback de Aplicación

### Pasos

1. Identificar último deployment estable
2. `vercel rollback [deployment-id]`
3. Verificar funcionalidad
4. Investigar causa del problema

---

## RUN-004: Monitoreo

### Health Check

```bash
curl https://{{DOMAIN}}/api/health
```

### Logs

```bash
# Vercel logs
vercel logs --follow
```

### Métricas

- Vercel Analytics
- Neon Dashboard

---

_Generado por TimeKast Factory — /docs_
