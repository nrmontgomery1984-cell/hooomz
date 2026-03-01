/**
 * Labs Integration Seed Data — Tokens, tests, and voting ballots
 *
 * Seed arrays are empty — content is now created through the app
 * (Labs > Tokens, Labs > Tests, Labs > Voting). The seedLabsIntegrationData()
 * function signature is kept for backward compatibility with seedAll.ts.
 */

import type { Services } from '../services';

export interface LabsIntegrationSeedResult {
  tokens: number;
  tests: number;
  ballots: number;
}

export async function seedLabsIntegrationData(
  _services: Services,
  _onProgress?: (message: string) => void,
): Promise<LabsIntegrationSeedResult> {
  // No-op — seed arrays are empty. Content created through the app.
  return { tokens: 0, tests: 0, ballots: 0 };
}
