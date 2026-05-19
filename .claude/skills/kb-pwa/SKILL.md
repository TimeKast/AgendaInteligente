---
name: kb-pwa
description: Portable Progressive Web App patterns for Next.js App Router apps — managed Service Worker decision tree (Serwist vs next-pwa vs manual), update-available UX (prompt + deferred activation, never silent `skipWaiting`), offline fallback strategy per resource type, VAPID push setup, and `beforeinstallprompt` deferred install. Use when choosing PWA strategy for a new app or auditing SW/update UX. For kit-shipped infra → `sk-pwa`.
last-verified: 2026-04-23
---

# kb-pwa — Portable PWA Patterns

> Pair: [`sk-pwa`](../sk-pwa/SKILL.md)

Portable Progressive Web App patterns for Next.js (App Router) apps. Stack-anchored but project-agnostic — no paths into `src/`, no references to specific components of this kit.

---

## 1. Managed Service Worker — decision tree

| Situation                                | Choose                   | Why                                                                |
| ---------------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| Next.js **App Router** (13+), modern TS  | **Serwist**              | TS-first, App Router aware, Workbox-compatible, active maintenance |
| Next.js **Pages Router**, legacy project | `next-pwa`               | Still works for Pages Router; avoid for new App Router work        |
| Custom requirements (non-standard cache) | Manual SW + `register()` | Full control; only when Serwist strategies don't fit               |

Rule: don't hand-write a SW if a managed solution covers the case — you will leak cache bugs.

---

## 2. Update-available UX — never skipWaiting silently

When a new SW is installed, the old one is still controlling open tabs. Two options:

| Option                                | User impact                            | Verdict                  |
| ------------------------------------- | -------------------------------------- | ------------------------ |
| `self.skipWaiting()` immediately      | Forced reload, loses in-flight form/UI | Anti-pattern outside dev |
| **Show prompt, reload on user click** | User keeps control, no data loss       | Correct pattern          |

Pattern:

1. Listen for `registration.waiting` or a `controllerchange` / custom `message` event.
2. Surface a non-blocking UI affordance ("New version available — Reload").
3. On user action: `postMessage({ type: 'SKIP_WAITING' })` to the waiting worker → then `window.location.reload()`.

---

## 3. Offline strategy — per resource type

| Resource type                     | Strategy                     | Rationale                                               |
| --------------------------------- | ---------------------------- | ------------------------------------------------------- |
| HTML (pages)                      | **StaleWhileRevalidate**     | Instant render, refresh in background                   |
| Static assets (JS, CSS, fonts)    | **CacheFirst** (immutable)   | Hashed filenames, safe to cache long-term               |
| Images                            | CacheFirst (with expiry)     | Bandwidth-heavy, rarely change                          |
| API — public GETs                 | NetworkFirst + cache         | Prefer fresh, fall back to cache offline                |
| API — authenticated / mutations   | **NetworkOnly**              | Never cache auth-scoped or write responses              |
| API — sensitive data (PII, money) | **NetworkOnly**, no fallback | Stale financial/PII data is worse than an offline error |

Ship a dedicated **offline fallback page** for navigation requests that fail all strategies.

---

## 4. Web Push with VAPID

Setup:

1. Generate VAPID keypair once (`web-push generate-vapid-keys`). Store **private key server-side only**.
2. Expose **public key** via env (`NEXT_PUBLIC_VAPID_PUBLIC_KEY` — safe to ship to client).
3. Client subscribes via `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`.
4. POST the `PushSubscription` JSON to a Route Handler → persist per-user.
5. Server sends push via `web-push` using the private key + stored subscription.

Payload shape (keep small, < 4KB):

```ts
type PushPayload = {
  title: string;
  body: string;
  url?: string; // deep link opened on notification click
  icon?: string; // absolute URL
  tag?: string; // collapses duplicates
};
```

SW `push` handler: `event.waitUntil(self.registration.showNotification(title, { body, data: { url } }))`.
SW `notificationclick` handler: focus existing client if URL matches, else `clients.openWindow(url)`.

---

## 5. Install prompt — deferred pattern

`beforeinstallprompt` fires once per session and **must be captured synchronously**, but triggering the prompt without user intent is rejected by browsers and hurts engagement.

Pattern:

1. Listen for `beforeinstallprompt` → `event.preventDefault()` → store the event reference.
2. Render an "Install" affordance (button, banner) only when the reference exists.
3. On user click: `savedEvent.prompt()` → await `savedEvent.userChoice`.
4. Track `dismissed` state per user (localStorage) to avoid nagging.
5. Listen for `appinstalled` to clear the affordance.

---

## 6. Feature-flag gating — skip in dev

Service Workers cache aggressively and break HMR / hot reload. Guard registration behind an env flag:

- `NEXT_PUBLIC_PWA_ENABLED=true` in production + preview deploys.
- Default off (or unset) in local dev to keep dev loop fast.
- Registration code: `if (process.env.NEXT_PUBLIC_PWA_ENABLED === 'true' && 'serviceWorker' in navigator) { ... }`.

---

## 7. Anti-patterns

```
❌ self.skipWaiting() called unconditionally on install → loses user work
❌ Registering the SW in dev → stale cache breaks HMR
❌ Caching authenticated API responses → data leaks across users
❌ Caching sensitive data (PII, money, permissions) with any fallback
❌ Shipping VAPID private key in client bundle → anyone can send push as you
❌ Calling beforeinstallprompt.prompt() without user gesture → silent reject
❌ Hand-rolling a SW when Serwist covers the case → reinvented bugs
❌ No offline fallback page → white screen on first navigation offline
```

---

Cross-reference: [`sk-pwa`](../sk-pwa/SKILL.md) — kit-shipped PWA infrastructure (Serwist config, install/update components, VAPID wiring). [`sk-features-index`](../sk-features-index/SKILL.md) — feature catalog (`NEXT_PUBLIC_PWA_ENABLED`).
