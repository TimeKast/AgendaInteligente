/**
 * Admin Seed — Superadmin Bootstrap
 *
 * Creates the initial superadmin user with self-reference for audit fields.
 * Can be run standalone or as part of the main seed orchestrator.
 *
 * Run standalone: pnpm db:seed:admin
 *
 * Required env vars:
 * - SUPER_ADMIN_EMAIL — Email for the superadmin
 *
 * Optional env vars:
 * - SUPER_ADMIN_PASSWORD — Password (if not set, user is OAuth-only)
 * - SUPER_ADMIN_NAME — Display name (default: "Super Admin")
 *
 * @example
 * ```bash
 * SUPER_ADMIN_EMAIL=admin@example.com pnpm db:seed:admin
 * ```
 *
 * ## Idempotency
 *
 * This seed is idempotent — it checks if the admin exists before creating.
 * Safe to run multiple times (useful for recovery from lockout scenarios).
 *
 * ## Self-Reference Pattern
 *
 * The superadmin is a special case: since it's the first user, it creates
 * itself (createdBy = self, modifiedBy = self).
 *
 * @see SEED-001
 */

// Load environment variables from .env.local (required for tsx standalone execution)
import 'dotenv/config';

import { randomUUID } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../drizzle';
import { users } from '../schema';

/**
 * Seed the superadmin user.
 *
 * @returns true if admin was created, false if skipped/exists
 */
export async function seedAdmin(): Promise<boolean> {
  const email = process.env.SUPER_ADMIN_EMAIL;

  if (!email) {
    console.log('⚠️  SUPER_ADMIN_EMAIL not set, skipping admin seed');
    return false;
  }

  // Idempotent: check if already exists
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    console.log(`ℹ️  Admin already exists: ${email}`);
    return false;
  }

  // Generate ID before insert for self-reference
  const adminId = randomUUID();

  // Hash password if provided
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

  // Generate humanId from sequence (avoid hardcoded collision)
  const seqResult = await db.execute<{ nextval: string }>(sql`SELECT nextval('user_human_id_seq')`);
  const nextval = seqResult.rows[0].nextval;
  const humanId = `USR-${String(nextval).padStart(4, '0')}`;

  // Insert with self-reference for audit fields
  await db.insert(users).values({
    id: adminId,
    humanId,
    email,
    name: process.env.SUPER_ADMIN_NAME ?? 'Super Admin',
    role: 'super_admin',
    password: hashedPassword,
    // Audit fields with self-reference
    createdBy: adminId,
    modifiedBy: adminId,
  });

  console.log(`✅ Admin created: ${email}`);
  return true;
}

// Allow standalone execution
if (require.main === module) {
  console.log('🌱 Seeding admin...');
  seedAdmin()
    .then((created) => {
      if (created) {
        console.log('✅ Admin seed complete');
      } else {
        console.log('ℹ️  Admin seed skipped');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Admin seed failed:', error);
      process.exit(1);
    });
}
