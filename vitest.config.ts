/**
 * Vitest Configuration
 *
 * Test runner configuration for integration tests.
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',

    // Setup files
    setupFiles: ['./tests/setup.ts'],

    // Global test configuration
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'packages/*/src/**/*.ts',
        'apps/web/src/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },

    // Test timeout
    testTimeout: 10000,

    // Hook timeout
    hookTimeout: 10000,

    // Retry failed tests
    retry: 2,

    // Reporter
    reporter: ['verbose', 'html'],

    // Output
    outputFile: {
      html: './tests/reports/index.html',
    },
  },

  resolve: {
    alias: {
      '@hooomz/shared-contracts': path.resolve(__dirname, './packages/shared-contracts/src'),
      '@hooomz/customers': path.resolve(__dirname, './packages/customers/src'),
      '@hooomz/projects': path.resolve(__dirname, './packages/projects/src'),
      '@hooomz/estimating': path.resolve(__dirname, './packages/estimating/src'),
      '@hooomz/scheduling': path.resolve(__dirname, './packages/scheduling/src'),
      '@hooomz/field-docs': path.resolve(__dirname, './packages/field-docs/src'),
      '@hooomz/reporting': path.resolve(__dirname, './packages/reporting/src'),
      '@': path.resolve(__dirname, './apps/web/src'),
    },
  },
});
