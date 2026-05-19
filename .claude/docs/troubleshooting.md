# Troubleshooting

> Problemas **específicos del Starter Kit** y cómo resolverlos.

---

## 🔐 Auth

### OAuth "redirect_uri_mismatch"

Los redirect URIs deben coincidir EXACTAMENTE:

```
# Dev
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/auth/callback/github

# Prod
https://tu-app.vercel.app/api/auth/callback/google
https://tu-app.vercel.app/api/auth/callback/github
```

**Dashboard:** [Google](https://console.cloud.google.com/apis/credentials) | [GitHub](https://github.com/settings/developers)

### Session Expires / AUTH_SECRET Issues

```typescript
// src/lib/auth/auth.ts — verificar:
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 días
}
```

`AUTH_SECRET` debe ser **idéntico** en todos los environments. Si cambia, todas las sessions se invalidan.

### Magic Link No Llega

```bash
# Test endpoint (dev o super_admin)
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to": "tu-email@ejemplo.com"}'
```

Checklist: `EMAIL_PROVIDER` configurado → `RESEND_API_KEY` / `EMAIL_SERVER_*` válido → revisar spam → verificar SPF/DKIM.

---

## 🗄️ Database

### Neon Connection Timeout

- Verificar `?sslmode=require` en `DATABASE_URL`
- **Free tier:** Proyecto se pausa después de 5 min inactivo — cualquier request lo reactiva
- Test: `psql $DATABASE_URL -c "SELECT 1"`

### Migrations Fail

```bash
# Ver estado
pnpm drizzle-kit status

# Generar migration nueva si schema cambió
pnpm db:generate

# Aplicar
pnpm db:migrate

# Solo dev local si DB está rota:
pnpm db:push
```

---

## 📱 PWA

### Install Prompt No Aparece

- ¿Ya está instalada? → Verificar en chrome://apps
- Cooldown 7 días tras dismiss → `localStorage.removeItem('pwa-install-dismissed')`
- DevTools → Application → Manifest → verificar que no hay errores

### Service Worker Not Updating

El SK usa **managed updates** — el nuevo SW espera en `waiting` hasta que el usuario haga click en el toast "Recargar".

**Si el toast no aparece:**

1. DevTools → Application → Service Workers → ¿Hay SW "waiting"?
2. Hard refresh: `Cmd+Shift+R`
3. Último recurso: DevTools → Application → Storage → "Clear site data"

> Server components no afectan precache. Ver `sk-pwa` §1 (caching firewall) + §3 (managed update flow).

---

## 🔧 Comandos de Diagnóstico Rápido

```bash
# Health check completo
pnpm lint && pnpm typecheck && pnpm test

# DB status
pnpm drizzle-kit status

# PWA check
pnpm pwa:check

# Email test
curl -X POST http://localhost:3000/api/email/test

# Nuclear reset
rm -rf .next node_modules && pnpm install && pnpm dev
```

---

_TimeKast Starter Kit — Troubleshooting_
