/**
 * Plans Seed — AgendaInteligente billing scaffold
 *
 * Inserts the single 'free' plan that v1 ships with. Pricing is intentionally
 * NULL (decision deferred to v2 per project-config §9.7). Limits are an empty
 * object so no caps are enforced yet — the structure exists so feature flags
 * and limits can be wired later without destructive migrations.
 *
 * Idempotent: uses `onConflictDoNothing()` on the unique `slug` column.
 *
 * Linked: E-070 (06_DATA_MODEL.md), BR-10, FT-110.
 */

import { db } from '../drizzle';
import { plans } from '../schema/billing';

export async function seedPlans(): Promise<void> {
  const result = await db
    .insert(plans)
    .values({
      slug: 'free',
      name: 'Free',
      description: 'Default plan for all users. No limits enforced in v1.',
      features: {},
      limits: {},
      active: true,
    })
    .onConflictDoNothing({ target: plans.slug })
    .returning({ id: plans.id, slug: plans.slug });

  if (result.length > 0) {
    console.log(`✅ Plan 'free' seeded (id=${result[0].id})`);
  } else {
    console.log(`✅ Plan 'free' already exists (idempotent)`);
  }
}
