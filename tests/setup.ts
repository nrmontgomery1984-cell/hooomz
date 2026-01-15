/**
 * Test Setup
 *
 * Global test configuration and setup utilities.
 */

import { beforeEach, afterEach } from 'vitest';

// Mock IndexedDB for testing
export function setupTestEnvironment() {
  // Setup runs before each test file
  beforeEach(() => {
    // Clear any existing data
    if (typeof indexedDB !== 'undefined') {
      indexedDB.deleteDatabase('hooomz-test-db');
    }
  });

  afterEach(() => {
    // Cleanup after tests
    if (typeof indexedDB !== 'undefined') {
      indexedDB.deleteDatabase('hooomz-test-db');
    }
  });
}

// Helper to wait for async operations
export async function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper to retry async operations
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 100
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxAttempts - 1) {
        await waitFor(delay);
      }
    }
  }

  throw lastError;
}

// Mock localStorage
export function mockLocalStorage() {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
}

// Mock Date for consistent testing
export function mockDate(isoString: string) {
  const mockNow = new Date(isoString).getTime();
  const RealDate = Date;

  global.Date = class extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(mockNow);
      } else {
        super(...args);
      }
    }

    static now() {
      return mockNow;
    }
  } as any;

  return () => {
    global.Date = RealDate;
  };
}
