import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load .env.local for local development
// This is required because Drizzle CLI doesn't automatically load .env.local
// like Next.js does. Without this, DATABASE_URL will be undefined.
config({ path: '.env.local' });

export default defineConfig({
  schema: './src/lib/db/schema/index.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
