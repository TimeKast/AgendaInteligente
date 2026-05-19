import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'tests/e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**', 'config/**'],
      /**
       * Coverage Exclusion Strategy
       *
       * These files are NOT "untested" — they are tested by different test types:
       *
       * | Excluded from unit coverage      | Tested by              |
       * |----------------------------------|------------------------|
       * | React components (*.tsx)          | E2E (Playwright)       |
       * | API routes (/api/**)             | E2E (Playwright)       |
       * | Next.js pages/layouts            | E2E (Playwright)       |
       * | DB connection/schema/migrations  | E2E (Neon branches)    |
       * | NextAuth config + middleware     | E2E (auth flows)       |
       * | shadcn UI primitives             | Tested by library      |
       *
       * Unit tests cover: config/, src/lib/actions/helpers, src/lib/validations/,
       * src/lib/email/templates/, src/lib/utils/, src/lib/auth/permissions, src/lib/logger
       */
      exclude: [
        // UI layer → tested by E2E (Playwright)
        'src/components/ui/**',
        'src/components/**/*.tsx',
        'src/app/**/page.tsx',
        'src/app/**/layout.tsx',
        'src/app/**/loading.tsx',
        'src/app/**/error.tsx',
        'src/app/manifest.ts',
        // API + server → tested by E2E (Playwright)
        'src/app/api/**',
        'middleware.ts',
        // DB layer → tested by E2E (Neon branches)
        'src/lib/db/drizzle.ts',
        'src/lib/db/schema/**',
        'src/lib/db/migrate.ts',
        // Auth config → tested by E2E (auth flows)
        'src/lib/auth/auth.ts',
        'src/lib/auth/auth.config.ts',
        // Generated/type files
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/config': path.resolve(__dirname, './src/config'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});
