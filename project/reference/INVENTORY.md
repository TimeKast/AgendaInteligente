# 📦 INVENTORY

> **Auto-generated** — Run `pnpm generate:inventory` to update
> **Regla:** SIEMPRE consultar antes de crear algo nuevo.
> **Last updated:** 2026-05-26

---

## 📚 Dependencies

| Package | Version |
|---------|--------|
| @anthropic-ai/sdk | 0.98.0 |
| @auth/drizzle-adapter | 1.11.1 |
| @dnd-kit/core | 6.3.1 |
| @dnd-kit/sortable | 10.0.0 |
| @dnd-kit/utilities | 3.2.2 |
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
| googleapis | 172.0.0 |
| inngest | 4.4.0 |
| lucide-react | 0.562.0 |
| next | 16.2.4 |
| next-auth | 5.0.0-beta.30 |
| next-themes | 0.4.6 |
| nodemailer | 7.0.13 |
| openai | 6.39.0 |
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
| / | `src\app\page.tsx` |
| /accept-invite | `src\app\(auth)\accept-invite\page.tsx` |
| /activity/[id] | `src\app\(agendaInteligente)\activity\[id]\page.tsx` |
| /categories | `src\app\(agendaInteligente)\categories\page.tsx` |
| /categories/[id] | `src\app\(agendaInteligente)\categories\[id]\page.tsx` |
| /chat | `src\app\(agendaInteligente)\chat\page.tsx` |
| /chat/crisis-demo | `src\app\(agendaInteligente)\chat\crisis-demo\page.tsx` |
| /dashboard | `src\app\(protected)\dashboard\page.tsx` |
| /error | `src\app\(auth)\error\page.tsx` |
| /forgot-password | `src\app\(auth)\forgot-password\page.tsx` |
| /goals | `src\app\(agendaInteligente)\goals\page.tsx` |
| /goals/[id] | `src\app\(agendaInteligente)\goals\[id]\page.tsx` |
| /login | `src\app\(auth)\login\page.tsx` |
| /month | `src\app\(agendaInteligente)\month\page.tsx` |
| /notifications | `src\app\(protected)\notifications\page.tsx` |
| /offline | `src\app\offline\page.tsx` |
| /onboarding/calendar | `src\app\(agendaInteligente)\onboarding\calendar\page.tsx` |
| /onboarding/context | `src\app\(agendaInteligente)\onboarding\context\page.tsx` |
| /onboarding/done | `src\app\(agendaInteligente)\onboarding\done\page.tsx` |
| /onboarding/language | `src\app\(agendaInteligente)\onboarding\language\page.tsx` |
| /onboarding/mic | `src\app\(agendaInteligente)\onboarding\mic\page.tsx` |
| /onboarding/push | `src\app\(agendaInteligente)\onboarding\push\page.tsx` |
| /onboarding/schedule | `src\app\(agendaInteligente)\onboarding\schedule\page.tsx` |
| /onboarding/timezone | `src\app\(agendaInteligente)\onboarding\timezone\page.tsx` |
| /privacy | `src\app\(legal)\privacy\page.tsx` |
| /profile | `src\app\(protected)\profile\page.tsx` |
| /projects | `src\app\(agendaInteligente)\projects\page.tsx` |
| /projects/[id] | `src\app\(agendaInteligente)\projects\[id]\page.tsx` |
| /register | `src\app\(auth)\register\page.tsx` |
| /reset-password | `src\app\(auth)\reset-password\page.tsx` |
| /settings | `src\app\(agendaInteligente)\settings\page.tsx` |
| /settings/account | `src\app\(agendaInteligente)\settings\account\page.tsx` |
| /settings/appearance | `src\app\(agendaInteligente)\settings\appearance\page.tsx` |
| /settings/billing | `src\app\(agendaInteligente)\settings\billing\page.tsx` |
| /settings/general | `src\app\(protected)\settings\general\page.tsx` |
| /settings/integrations | `src\app\(agendaInteligente)\settings\integrations\page.tsx` |
| /settings/intensity | `src\app\(agendaInteligente)\settings\intensity\page.tsx` |
| /settings/language | `src\app\(agendaInteligente)\settings\language\page.tsx` |
| /settings/notifications | `src\app\(agendaInteligente)\settings\notifications\page.tsx` |
| /settings/privacy | `src\app\(agendaInteligente)\settings\privacy\page.tsx` |
| /settings/users | `src\app\(protected)\settings\users\page.tsx` |
| /settings/users/[id] | `src\app\(protected)\settings\users\[id]\page.tsx` |
| /settings/users/nuevo | `src\app\(protected)\settings\users\nuevo\page.tsx` |
| /stats | `src\app\(agendaInteligente)\stats\page.tsx` |
| /tasks | `src\app\(agendaInteligente)\tasks\page.tsx` |
| /terms | `src\app\(legal)\terms\page.tsx` |
| /today | `src\app\(agendaInteligente)\today\page.tsx` |
| /week | `src\app\(agendaInteligente)\week\page.tsx` |

---

## 🔌 API Routes

| Endpoint | File |
|----------|------|
| /api/auth/[...nextauth] | `src\app\api\auth\[...nextauth]\route.ts` |
| /api/auth/forgot-password | `src\app\api\auth\forgot-password\route.ts` |
| /api/auth/register | `src\app\api\auth\register\route.ts` |
| /api/auth/reset-password | `src\app\api\auth\reset-password\route.ts` |
| /api/auth/verify | `src\app\api\auth\verify\route.ts` |
| /api/avatar/[userId] | `src\app\api\avatar\[userId]\route.ts` |
| /api/email/test | `src\app\api\email\test\route.ts` |
| /api/health | `src\app\api\health\route.ts` |
| /api/inngest | `src\app\api\inngest\route.ts` |
| /api/invites/accept | `src\app\api\invites\accept\route.ts` |
| /api/invites/send | `src\app\api\invites\send\route.ts` |
| /api/invites/validate | `src\app\api\invites\validate\route.ts` |
| /api/notifications/poll | `src\app\api\notifications\poll\route.ts` |
| /api/push/subscribe | `src\app\api\push\subscribe\route.ts` |
| /serwist/[path] | `src\app\serwist\[path]\route.ts` |

---

## 📊 Summary

| Metric | Value |
|--------|-------|
| Dependencies | 44 |
| Page Routes | 48 |
| API Routes | 15 |
| Components & Utils | 40 |
| **Total items** | **147** |

---

_Generated by `scripts/generate-inventory.mjs`_
