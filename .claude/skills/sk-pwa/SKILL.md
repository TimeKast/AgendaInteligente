---
name: sk-pwa
description: Kit-shipped PWA infrastructure for the TimeKast Starter Kit — Serwist Service Worker at `src/app/sw.ts` wired via `withSerwist` in `next.config.ts`, SW caching headers, managed update UX (`PwaUpdateToast`), install prompt (`PwaInstallToast`/`IosA2hsHint`), install/SW hooks in `src/lib/pwa/`, manifest icons, and VAPID push. Use when integrating with kit PWA — never register a custom SW or replace the managed update flow. For portable patterns → `kb-pwa`.
last-verified: 2026-04-23
---

# sk-pwa — Kit-Shipped PWA Infrastructure

> Pair: [`kb-pwa`](../kb-pwa/SKILL.md) — portable PWA patterns (when to ship a SW, managed-update decision, offline strategy, install UX principles).

**What this skill covers:** the concrete PWA primitives the TimeKast Starter Kit ships — their paths, configuration, and integration contracts. When a task touches the SW, install prompt, update flow, or push notifications, read this first instead of writing from scratch.

> **Registry anchors** — hooks y componentes exportados por el kit (install hook, PWA toasts, etc.) están indexados en [`project/reference/HOOKS.md`](../../../project/reference/HOOKS.md) + [`project/reference/INVENTORY.md`](../../../project/reference/INVENTORY.md) (autogen — SSOT de import paths). Service Worker canónico vive en `src/app/sw.ts`. Strategies de Serwist (NetworkFirst, StaleWhileRevalidate, etc.) → docs oficiales de Serwist. Esta skill enseña **cuándo aplicar cada strategy**, no enumera la superficie pública de Serwist.

---

## 1. Service Worker — `src/app/sw.ts`

**App Router native location.** Next.js (via `@serwist/turbopack`) compiles `src/app/sw.ts` to `/sw.js` at the origin.

- Built with **Serwist** (successor to Workbox): `Serwist`, `CacheFirst`, `StaleWhileRevalidate`, `NetworkFirst`, `ExpirationPlugin`.
- Combines two concerns in one SW: (a) precache + runtime caching for offline/PWA, (b) `push` + `notificationclick` handlers for VAPID push.
- Precache manifest is injected at build time: `precacheEntries: self.__SW_MANIFEST`.
- `SW_VERSION` constant (`'1.0'` as of writing) forces SW-file content change on release. Bump on each release or replace with CI build id / git SHA.

### Caching firewall (strict)

The kit intentionally ships a **conservative** runtime caching list. The `sw.ts` header comment documents the safety rules:

- NEVER cache navigations (HTML documents) — breaks Next.js streaming SSR hydration.
- NEVER cache RSC payloads (requests with `RSC: 1` header) — stale RSC = fatal server/client tree mismatch.
- NEVER cache `/api/*` — includes SSE streams, server actions, auth callbacks.
- NEVER cache Next.js server actions (`POST` with `Next-Action` header).
- Only cache immutable/static: fonts, images, CSS, `/_next/static/*`.

**Pattern:** no catch-all / firewall rule. If no `runtimeCaching` matcher matches, Serwist **passes the request through to the browser natively** (no `respondWith()`). This avoids the `NetworkOnly` trap where the SW rejects when the server is unreachable and kills the page.

### Shipped `runtimeCaching` matchers

| Matcher                                   | Handler                                      | Cache name                 |
| ----------------------------------------- | -------------------------------------------- | -------------------------- |
| `https://fonts.gstatic.com/*`             | `CacheFirst` (1 year, 4 entries)             | `google-fonts-webfonts`    |
| `https://fonts.googleapis.com/*`          | `StaleWhileRevalidate` (7 days, 4 entries)   | `google-fonts-stylesheets` |
| Local font files (`.woff2`, `.ttf`, etc.) | `StaleWhileRevalidate` (7 days, 4 entries)   | `static-font-assets`       |
| Images (`.jpg/.png/.svg/.webp/...`)       | `StaleWhileRevalidate` (30 days, 64 entries) | `static-image-assets`      |
| `/_next/image?url=...`                    | `NetworkFirst` (1 day, 64 entries)           | `next-image`               |
| CSS (`.css`, `.less`)                     | `StaleWhileRevalidate` (1 day, 32 entries)   | `static-style-assets`      |

> `/_next/static/*.js` is **not** a runtime rule — it's already in the precache manifest (content-hashed). Adding a runtime rule would duplicate cache surface.

### Managed update flags

```ts
new Serwist({
  skipWaiting: false, // New SW waits in "waiting" until user opts in
  clientsClaim: false, // Don't take over controllerless clients silently
  navigationPreload: false, // Incompatible with "don't cache navigations"
  runtimeCaching: safeRuntimeCaching,
});
```

This is the **managed-update** contract — the core reason the kit's PWA is stable. See §3.

---

## 2. SW caching headers — `next.config.ts`

**Critical:** Next.js's default `s-maxage=31536000` on static assets would freeze the SW file for one year. The kit overrides this:

```ts
// next.config.ts → headers()
{ source: '/serwist/:path*', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }] },
{ source: '/sw.js',          headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }] },
```

Plus security headers (`X-Frame-Options`, `HSTS`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) applied to `/:path*`.

**Wrapping order in `next.config.ts`:**

```ts
export default withSerwist(sentryConfig); // Sentry → then Serwist
```

Touching this order or removing the headers will silently break SW updates in production.

---

## 3. Managed update flow — `src/components/pwa/PwaUpdateToast.tsx`

Mount once (typically from `Providers.tsx`). Detects a waiting SW and prompts the user instead of silently taking over.

Flow:

1. On mount, skip if no active controller (first install ≠ update).
2. Check `registration.waiting` (already waiting), `registration.installing` (installing now), or listen to `updatefound`.
3. When a SW reaches `state === 'installed'` and `registration.waiting` is set, show a Sonner toast: _"Nueva versión disponible — Recargar"_ with `duration: Infinity`.
4. On click: `waitingSW.postMessage({ type: 'SKIP_WAITING' })`.
5. SW `message` listener calls `self.skipWaiting()` → becomes active → browser fires `controllerchange` → toast's listener calls `window.location.reload()`.

**This is the "Recargar" button flow.** Do not replace with silent `skipWaiting` — it breaks open tabs with mixed bundles.

### 3.1 Update detection cadence (4 triggers)

`PwaUpdateToast` calls `registration.update()` on **four** triggers, not just at mount. Long-running mobile PWAs that never close would otherwise miss new SWs for days (browser default is ~24h cache):

| Trigger            | Effect                                                       | Why                                                                                   |
| ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Mount              | First render after the component lands.                      | Baseline check on app load.                                                           |
| Pathname change    | Every client-side route change (via `usePathname()`).        | Active users navigating naturally hit fresh checks without a hard reload.             |
| `visibilitychange` | Tab returns to foreground (`visibilityState === 'visible'`). | User came back to the app after focus was elsewhere — high signal moment for a check. |
| `window 'focus'`   | Window regains focus.                                        | Complement to visibilitychange; some browsers fire one and not the other.             |

`registration.update()` is **idempotent and rate-limited by the browser**. Calling it more often is a noop when the SW response hasn't changed, so no throttle is needed. The component only fires the request — it does not force activation. The `SKIP_WAITING` postMessage stays gated by the user clicking the toast's "Recargar" button (§3 step 4).

The `controllerchange` listener stays inside `showUpdateToast` (gated by `toastShown.current`) — it only fires once per session when the user opts in.

---

## 4. Install prompt — `src/components/pwa/PwaInstallToast.tsx` + `IosA2hsHint.tsx`

### Chromium / Android (`PwaInstallToast`)

- Uses `usePwaInstall()` hook (`src/lib/pwa/usePwaInstall.ts`) — captures `beforeinstallprompt`, tracks `appinstalled`, exposes `canInstall` / `isInstalled` / `promptInstall`.
- Only shows on protected routes: `PROTECTED_ROUTES = ['/dashboard', '/settings', '/profile']`.
- 7-day cooldown after dismissal via `localStorage['pwa-install-dismissed']`.
- 3-second delay before showing; Sonner toast with _"Instalar"_ + _"Más tarde"_ actions.

### iOS Safari (`IosA2hsHint`)

- `beforeinstallprompt` doesn't fire on iOS — show a manual hint instead.
- Detects iOS Safari + non-standalone mode via UA sniffing + `navigator.standalone`.
- Fixed bottom-sheet with Share icon + instructions.
- One-shot via `localStorage['ios-a2hs-shown']`.

---

## 5. Helpers — `src/lib/pwa/`

| File                     | Export                                                      | Purpose                                                                                                                                                                                                           |
| ------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `usePwaInstall.ts`       | `usePwaInstall()`                                           | Client hook — `beforeinstallprompt` capture, `appinstalled` tracking, `promptInstall()` trigger                                                                                                                   |
| `sw-listener.ts`         | `registerSwListener()`                                      | Mount once in `Providers.tsx` — handles `SW_NAVIGATE` postMessage from SW notificationclick + logs `controllerchange`                                                                                             |
| `usePullToRefresh.ts`    | `usePullToRefresh()`                                        | Client hook — touch gesture driver. Consumed by both `<PullToRefreshShell>` (default, shell-mounted) and `<PullToRefresh>` (per-screen advanced). Detail → [`sk-pull-to-refresh`](../sk-pull-to-refresh/SKILL.md) |
| `shellPullToRefresh.tsx` | `ShellPTRProvider`, `useShellPTR()`, `useDisableShellPTR()` | Counter-based context that lets a screen opt-out of the shell-wide PTR while it owns its own refresh callback. Mounted by `DashboardShell`.                                                                       |
| `index.ts`               | Barrel                                                      | Re-exports                                                                                                                                                                                                        |

> The kit ships **two PTR primitives** at `src/components/pwa/`: `<PullToRefreshShell>` (default — mounted once in `DashboardShell`, gated by `isMobile()`, hardcoded `router.refresh()`) and `<PullToRefresh>` (per-screen wrapper for custom scroll containers). Both are exported from `@/components/pwa`. The default gate is capability-based (`isMobile()`), not PWA-only — `usePwaInstall()` composition is opt-in via `enabled={isInstalled}` on the wrapper. See [`sk-pull-to-refresh`](../sk-pull-to-refresh/SKILL.md) for callback patterns, the a11y rule (always pair with a visible "Actualizar" button), and the `useDisableShellPTR()` opt-out.

**SW_NAVIGATE contract:** the SW's `notificationclick` handler does NOT call `client.navigate()` directly. Instead it `postMessage({ type: 'SW_NAVIGATE', url })` to an existing tab, and `registerSwListener` on the client calls `window.location.href = url`. Keeps the SW out of the navigation path → no state corruption from mixed bundles.

---

## 6. Manifest & icons — `public/pwa/`

Shipped assets:

```
public/pwa/
├── apple-touch-icon.png   (iOS home-screen icon)
├── icon-192.png           (Android baseline + notification icon + badge)
├── icon-256.png
├── icon-384.png
├── icon-512.png           (Android splash / install)
└── maskable-512.png       (Android maskable — required for adaptive icons)
```

The web manifest itself is served from `src/app/manifest.ts` (Next.js App Router convention) — edit there, not a static `.webmanifest` file. If missing, add via `src/app/manifest.ts` following Next.js Metadata API.

**Notification defaults in `sw.ts`:**

```ts
const DEFAULT_ICON = '/pwa/icon-192.png';
const DEFAULT_BADGE = '/pwa/icon-192.png';
const DEFAULT_URL = '/notifications';
```

---

## 7. Feature flag

> **No explicit `NEXT_PUBLIC_PWA_ENABLED` in `src/lib/env.ts`.** The kit's env schema does not gate the PWA behind a flag — it's always compiled and registered if `@serwist/turbopack` runs. To disable in dev, either (a) don't register the SW from the client, or (b) branch on `process.env.NODE_ENV`.
>
> **If a derived project needs an explicit flag**, add `NEXT_PUBLIC_PWA_ENABLED: booleanString` to `envSchema` and gate the `<PwaUpdateToast />` / `<PwaInstallToast />` / `registerSwListener()` mounts from `Providers.tsx`.

Push notifications **are** gated — see §8.

---

## 8. Push notifications (VAPID)

### Env vars (`src/lib/env.ts`)

| Var                                 | Scope           | Purpose                                                                |
| ----------------------------------- | --------------- | ---------------------------------------------------------------------- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`      | Public          | Client subscribes with this                                            |
| `VAPID_PRIVATE_KEY`                 | **Server-only** | Signs push payloads server-side                                        |
| `VAPID_SUBJECT`                     | Server-only     | `mailto:` or URL identifying the app                                   |
| `NEXT_PUBLIC_NOTIFICATIONS_ENABLED` | Public          | Master feature flag (also gates in-app/email — see `sk-notifications`) |

Accessors: `isPushConfigured()` returns `true` only when all three are present. `getVapidConfig()` throws a helpful error (`Generate keys with: npx web-push generate-vapid-keys`) if called while unconfigured.

### SW-side flow (in `src/app/sw.ts`)

- `push` event: parses JSON payload `{ title?, body?, url?, icon?, badge? }`, falls back to plain text. Calls `self.registration.showNotification(title, options)` with `tag: \`push-${Date.now()}\`` so notifications stack instead of replacing.
- `notificationclick` event: `event.notification.close()`, then tries to focus an existing window and post `SW_NAVIGATE`. Fallback: `self.clients.openWindow(absoluteUrl)`.

### Cross-reference

Dispatch (server-side web-push invocation, subscription storage, delivery tracking) lives in [`sk-notifications`](../sk-notifications/SKILL.md). This skill documents only the SW reception side and env config.

---

## 9. Cómo extender

### Add a route caching rule

Edit `src/app/sw.ts` → `safeRuntimeCaching` array. Respect the firewall rules (§1): no navigations, no RSC, no `/api/*`, no `POST`. Prefer `StaleWhileRevalidate` for assets that rarely change, `NetworkFirst` for things that must stay fresh but need offline fallback. Always attach an `ExpirationPlugin` with `maxEntries` + `maxAgeSeconds`.

### Change offline fallback

Not shipped by default. To add: precache an `/offline` page, register a `NavigationRoute` rule in `safeRuntimeCaching` that matches `request.mode === 'navigate'` — but **only** if you're willing to give up the "don't cache navigations" guarantee. Test hydration / RSC behavior thoroughly.

### Extend the push payload

1. Update the SW `PushPayload` interface in `src/app/sw.ts`.
2. Update the server-side dispatcher in `sk-notifications` to include the new fields.
3. For non-trivial payload changes, bump `SW_VERSION` — otherwise users keep the old parser until their SW updates.

### Expose a new deep link from notificationclick

The SW already forwards `payload.url` verbatim to the client via `SW_NAVIGATE`. No SW change needed — just send the URL in the server-side push payload.

---

## 10. Troubleshooting (DevTools)

| Síntoma                           | Diagnóstico                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| Toast "Nueva versión" no aparece  | DevTools → Application → Service Workers: ¿hay SW `waiting`? Si no, no hay update real  |
|                                   | Console: buscar errores de `PwaUpdateToast` (mount/listener)                            |
|                                   | Forzar: DevTools → Service Workers → "Update" / `registration.update()`                 |
| SW viejo sigue activo tras reload | DevTools → Service Workers → "Skip waiting" (manual override del flow managed)          |
|                                   | Nuclear: DevTools → Application → Storage → "Clear site data"                           |
| Errores `no-response` en consola  | Alguna regla en `safeRuntimeCaching` está interceptando requests que no debería         |
|                                   | Confirmar que solo hay matchers para assets estáticos (fonts/images/CSS/`_next/static`) |

**Bump manual de `SW_VERSION`:** cambia la constante en `src/app/sw.ts` para forzar byte-diff del archivo `/sw.js` y disparar el flow de update sin necesidad de cambios de bundle.

---

## 11. Anti-patterns

```
❌ Register a custom SW outside src/app/sw.ts (breaks Serwist precache manifest injection)
❌ Add skipWaiting: true or clientsClaim: true to the Serwist instance (breaks managed updates — tabs die on takeover)
❌ Remove the no-cache/no-store/must-revalidate headers for /sw.js in next.config.ts (users stuck on old SW forever)
❌ Cache navigations, RSC, /api/*, or Next-Action POSTs in runtimeCaching (fatal hydration / auth / stream bugs)
❌ Call client.navigate() directly from the SW's notificationclick (use SW_NAVIGATE postMessage — kit pattern)
❌ Commit VAPID_PRIVATE_KEY to git or expose via NEXT_PUBLIC_* (private key is server-only)
❌ Edit primitives in src/components/ui/ to change notification/install styling — wrap, don't fork (SK.md §3.3)
❌ Silently dispatch SKIP_WAITING without user consent (breaks open tabs — the toast is the opt-in)
```

---

Cross-reference: [`kb-pwa`](../kb-pwa/SKILL.md) — portable patterns. [`sk-notifications`](../sk-notifications/SKILL.md) — push dispatch, subscription storage, in-app/email channels. [`sk-features-index`](../sk-features-index/SKILL.md) — feature catalog.
