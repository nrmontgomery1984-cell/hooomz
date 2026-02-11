import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, 'setup.ts')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './reports/coverage',
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        '**/fixtures.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@hooomz/customers': path.resolve(__dirname, '../packages/customers/src'),
      '@hooomz/projects': path.resolve(__dirname, '../packages/projects/src'),
      '@hooomz/estimating': path.resolve(__dirname, '../packages/estimating/src'),
      '@hooomz/scheduling': path.resolve(__dirname, '../packages/scheduling/src'),
      '@hooomz/field-docs': path.resolve(__dirname, '../packages/field-docs/src'),
      '@hooomz/reporting': path.resolve(__dirname, '../packages/reporting/src'),
      '@hooomz/shared-contracts': path.resolve(__dirname, '../packages/shared-contracts/src'),
      '@hooomz/db': path.resolve(__dirname, '../packages/db/src'),
      '@hooomz/ui': path.resolve(__dirname, '../packages/ui/src'),
    },
  },
});
