import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * TimeKast Factory — ESLint Configuration
 * Next.js 16+ | TypeScript | Flat Config
 *
 * Uses the new ESLint flat config format (eslint.config.mjs)
 * Compatible with Next.js 16+ built-in ESLint support
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Global ignores
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'blob-report/**',
    'next-env.d.ts',
    '*.config.js',
    '*.config.mjs',
    'public/workbox-*.js',
    'public/sw.js',
  ]),

  // Custom rules (optional overrides)
  {
    rules: {
      // Block unused vars at commit time (lint-staged enforces this)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // Allow explicit any in specific cases (escape hatch)
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Allow console in CLI scripts and logger (they run outside Next.js runtime or ARE the logger)
  {
    files: ['lib/logger.ts', 'lib/db/seed.ts', 'scripts/**/*.mjs', 'scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
]);

export default eslintConfig;
