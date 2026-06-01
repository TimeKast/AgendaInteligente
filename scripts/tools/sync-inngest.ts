#!/usr/bin/env tsx
/**
 * Manual Inngest sync.
 *
 * PUT /api/inngest on the configured target. The Inngest SDK's serve()
 * handler responds with `Successfully registered` + the modified flag.
 * Use this after a Vercel deploy if you need to register functions
 * immediately and don't want to wait for the GitHub Action's 120s
 * settling window.
 *
 * Usage:
 *   pnpm sync:inngest                              # syncs production
 *   pnpm sync:inngest http://localhost:3002        # syncs local dev
 *   APP_URL=https://... pnpm sync:inngest          # env override
 */

const DEFAULT_URL = 'https://agenda-inteligente-zeta.vercel.app';

async function main(): Promise<void> {
  const base = process.argv[2] ?? process.env.APP_URL ?? DEFAULT_URL;
  const target = `${base.replace(/\/$/, '')}/api/inngest`;

  console.log(`Syncing ${target} …`);
  const res = await fetch(target, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Body:   ${body}`);
  if (!res.ok) {
    console.error(`FAILED: status ${res.status}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(2);
});
