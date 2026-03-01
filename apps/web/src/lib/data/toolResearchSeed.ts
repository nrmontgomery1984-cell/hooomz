/**
 * Tool Research Seed Data — Platforms, research items, and inventory
 *
 * Seed arrays are empty — content is now created through the app
 * (Labs > Tool Research). The seedToolResearchData() function signature
 * is kept for backward compatibility with seedAll.ts.
 */

import type { Services } from '../services';

export interface ToolResearchSeedResult {
  platforms: number;
  researchItems: number;
  inventoryItems: number;
}

export async function seedToolResearchData(
  _services: Services,
  _onProgress?: (message: string) => void,
): Promise<ToolResearchSeedResult> {
  // No-op — seed arrays are empty. Content created through the app.
  return { platforms: 0, researchItems: 0, inventoryItems: 0 };
}
