# 📦 INVENTORY

> **Auto-generated** — Run `pnpm generate:inventory` to update
> **Regla:** SIEMPRE consultar antes de crear algo nuevo.
> **Last updated:** 2026-05-15

---

## 📚 Dependencies

| Package | Version |
|---------|--------|
| @auth/drizzle-adapter | 1.11.1 |
| @hookform/resolvers | 5.2.2 |
| @neondatabase/serverless | 1.0.2 |
| @radix-ui/react-alert-dialog | 1.1.15 |
| @radix-ui/react-dialog | 1.1.15 |
| @radix-ui/react-dropdown-menu | 2.1.16 |
| @radix-ui/react-popover | 1.1.15 |
| @radix-ui/react-select | 2.2.6 |
| @radix-ui/react-separator | 1.1.8 |
| @radix-ui/react-slot | 1.2.4 |
| @radix-ui/react-switch | 1.2.6 |
| @radix-ui/react-tabs | 1.1.13 |
| @radix-ui/react-tooltip | 1.2.8 |
| @sentry/nextjs | 10.43.0 |
| @tanstack/react-table | 8.21.3 |
| @upstash/ratelimit | 2.0.8 |
| @upstash/redis | 1.37.0 |
| bcryptjs | 3.0.3 |
| class-variance-authority | 0.7.1 |
| clsx | 2.1.1 |
| drizzle-orm | 0.45.2 |
| framer-motion | 12.36.0 |
| lucide-react | 0.562.0 |
| next | 16.2.4 |
| next-auth | 5.0.0-beta.30 |
| next-themes | 0.4.6 |
| nodemailer | 7.0.13 |
| react | 19.2.3 |
| react-dom | 19.2.3 |
| react-hook-form | 7.71.2 |
| recharts | 3.8.1 |
| resend | 6.9.3 |
| sharp | 0.34.5 |
| sonner | 2.0.7 |
| tailwind-merge | 3.5.0 |
| web-push | 3.6.7 |
| zod | 4.3.6 |

---

## 🛠️ NPM Scripts

| Command | Script |
|---------|--------|
| `pnpm dev` | `node scripts/tools/dev.mjs` |
| `pnpm dev:next` | `NODE_OPTIONS='--max-old-space-size=2048' next d...` |
| `pnpm prebuild` | `pnpm generate:email-logo` |
| `pnpm build` | `next build` |
| `pnpm start` | `next start` |
| `pnpm lint` | `eslint .` |
| `pnpm lint:fix` | `eslint . --fix` |
| `pnpm update-board` | `tsx scripts/tools/update-board.ts` |
| `pnpm board:status` | `tsx scripts/tools/board-status.ts` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm format` | `prettier --write .` |
| `pnpm format:check` | `prettier --check .` |
| `pnpm test` | `vitest run` |
| `pnpm test:watch` | `vitest` |
| `pnpm test:coverage` | `vitest run --coverage` |
| `pnpm test:e2e` | `tsx scripts/tools/e2e-runner.ts` |
| `pnpm test:e2e:direct` | `playwright test` |
| `pnpm test:e2e:ui` | `playwright test --ui` |
| `pnpm verify` | `pnpm lint && pnpm typecheck && pnpm test` |
| `pnpm knip` | `knip` |
| `pnpm analyze` | `next build && node scripts/tools/analyze-bundle...` |
| `pnpm env:check` | `tsx scripts/tools/env-check.ts` |
| `pnpm db:generate` | `drizzle-kit generate` |
| `pnpm db:migrate` | `drizzle-kit migrate` |
| `pnpm db:push` | `drizzle-kit push` |
| `pnpm db:studio` | `drizzle-kit studio` |
| `pnpm db:query` | `tsx scripts/tools/db-query.ts` |
| `pnpm db:seed` | `tsx --require dotenv/config src/lib/db/seed.ts ...` |
| `pnpm db:seed:admin` | `tsx --require dotenv/config src/lib/db/seeds/ad...` |
| `pnpm prepare` | `husky` |
| `pnpm pwa:check` | `echo 'Starting Lighthouse PWA audit...' && npx ...` |
| `pnpm setup:e2e` | `tsx scripts/tools/setup-e2e.ts` |
| `pnpm lighthouse` | `lhci autorun` |
| `pnpm lighthouse:collect` | `lhci collect --url=http://localhost:3000` |
| `pnpm lighthouse:assert` | `lhci assert` |
| `pnpm generate:email-logo` | `tsx scripts/tools/generate-email-logo.ts` |
| `pnpm generate:inventory` | `node scripts/tools/generate-inventory.mjs` |
| `pnpm generate:codebase` | `node scripts/tools/generate-codebase.mjs` |
| `pnpm generate:hooks` | `node scripts/tools/generate-hooks.mjs` |
| `pnpm skill:lint` | `tsx scripts/tools/skill-lint/index.ts` |

---

## 🛣️ Page Routes

| Route | File |
|-------|------|
| / | `src/app/page.tsx` |
| /accept-invite | `src/app/(auth)/accept-invite/page.tsx` |
| /dashboard | `src/app/(protected)/dashboard/page.tsx` |
| /error | `src/app/(auth)/error/page.tsx` |
| /forgot-password | `src/app/(auth)/forgot-password/page.tsx` |
| /login | `src/app/(auth)/login/page.tsx` |
| /notifications | `src/app/(protected)/notifications/page.tsx` |
| /offline | `src/app/offline/page.tsx` |
| /privacy | `src/app/(legal)/privacy/page.tsx` |
| /profile | `src/app/(protected)/profile/page.tsx` |
| /register | `src/app/(auth)/register/page.tsx` |
| /reset-password | `src/app/(auth)/reset-password/page.tsx` |
| /settings/general | `src/app/(protected)/settings/general/page.tsx` |
| /settings/users | `src/app/(protected)/settings/users/page.tsx` |
| /settings/users/[id] | `src/app/(protected)/settings/users/[id]/page.tsx` |
| /settings/users/nuevo | `src/app/(protected)/settings/users/nuevo/page.tsx` |
| /terms | `src/app/(legal)/terms/page.tsx` |

---

## 🔌 API Routes

| Endpoint | File |
|----------|------|
| /api/auth/[...nextauth] | `src/app/api/auth/[...nextauth]/route.ts` |
| /api/auth/forgot-password | `src/app/api/auth/forgot-password/route.ts` |
| /api/auth/register | `src/app/api/auth/register/route.ts` |
| /api/auth/reset-password | `src/app/api/auth/reset-password/route.ts` |
| /api/avatar/[userId] | `src/app/api/avatar/[userId]/route.ts` |
| /api/email/test | `src/app/api/email/test/route.ts` |
| /api/health | `src/app/api/health/route.ts` |
| /api/invites/accept | `src/app/api/invites/accept/route.ts` |
| /api/invites/send | `src/app/api/invites/send/route.ts` |
| /api/invites/validate | `src/app/api/invites/validate/route.ts` |
| /api/notifications/poll | `src/app/api/notifications/poll/route.ts` |
| /api/push/subscribe | `src/app/api/push/subscribe/route.ts` |
| /serwist/[path] | `src/app/serwist/[path]/route.ts` |

---

## 📊 Summary

| Metric | Value |
|--------|-------|
| Dependencies | 37 |
| Page Routes | 17 |
| API Routes | 13 |
| Components & Utils | 40 |
| **Total items** | **107** |

---

_Generated by `scripts/generate-inventory.mjs`_
