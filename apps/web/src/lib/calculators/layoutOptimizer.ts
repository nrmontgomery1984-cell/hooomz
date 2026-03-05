/**
 * Layout Optimizer — finds the LayoutConfig that minimises waste for a given room + tile.
 */

import type { Point2D } from '../types/roomScan.types';
import type { TileDimensions, LayoutConfig, OptimizationResult, PatternType, StartCorner } from '../types/flooringLayout.types';
import { calculateLayout } from './flooringLayout.calculator';

const PATTERNS: PatternType[] = ['straight', 'staggered', 'diagonal'];
const CORNERS: StartCorner[]  = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const STAGGER_OFFSETS = [0.25, 0.33, 0.5];

const DEFAULT_CONFIG: LayoutConfig = {
  pattern: 'staggered',
  startCorner: 'top-left',
  rotation: 0,
  staggerOffset: 0.33,
  groutWidth: 0.125,
  wasteFactor: 0.10,
};

export function optimizeLayout(
  roomPolygon: Point2D[],
  tile: TileDimensions,
  baseConfig: Partial<LayoutConfig> = {},
): OptimizationResult {
  let bestConfig: LayoutConfig = { ...DEFAULT_CONFIG, ...baseConfig };
  let bestScore = Infinity;
  let iterations = 0;

  for (const pattern of PATTERNS) {
    for (const startCorner of CORNERS) {
      const offsets = pattern === 'staggered' ? STAGGER_OFFSETS : [0.33];
      for (const staggerOffset of offsets) {
        iterations++;
        const config: LayoutConfig = {
          ...DEFAULT_CONFIG,
          ...baseConfig,
          pattern,
          startCorner,
          staggerOffset,
          rotation: pattern === 'diagonal' ? 45 : 0,
        };
        try {
          const result = calculateLayout(roomPolygon, tile, config);
          if (result.wastePercentage < bestScore) {
            bestScore = result.wastePercentage;
            bestConfig = config;
          }
        } catch {
          // skip failed configs
        }
      }
    }
  }

  return { bestConfig, bestScore, iterations };
}
