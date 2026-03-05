/**
 * Flooring Layout Types — Phase 4 (v30)
 *
 * Models a tile/plank layout calculation for a room polygon.
 * All position units in inches (converted from mm at service layer).
 */

import type { Point2D } from './roomScan.types';

export type PatternType = 'straight' | 'staggered' | 'herringbone' | 'diagonal';
export type StartCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface TileDimensions {
  width: number;   // inches
  length: number;  // inches
}

export interface LayoutConfig {
  pattern: PatternType;
  startCorner: StartCorner;
  rotation: number;        // degrees (0 for straight/staggered, 45 for diagonal)
  staggerOffset: number;   // 0-1, fraction of tile length offset on alternating rows
  groutWidth: number;      // inches (e.g. 0.125 = 1/8")
  wasteFactor: number;     // 0-1, extra stock factor (e.g. 0.10 = 10%)
}

export interface PlacedTile {
  id: string;
  vertices: Point2D[];     // 4 corners in room coordinates (inches)
  isCut: boolean;          // true if tile was clipped to room boundary
  cutPercentage: number;   // 0-1, fraction of original tile area remaining
  row: number;
  col: number;
}

export interface LayoutResult {
  tiles: PlacedTile[];
  fullTileCount: number;
  cutTileCount: number;
  totalTileCount: number;
  coverageArea: number;     // sqft actually covered
  wasteArea: number;        // sqft of material wasted in cuts
  wastePercentage: number;  // 0-1
  stockTilesNeeded: number; // boxes/tiles to order (includes waste factor)
}

export interface FlooringLayout {
  id: string;
  roomId: string;
  projectId: string;
  jobId: string;

  tileDimensions: TileDimensions;
  config: LayoutConfig;

  // Summary stats (full tile array is recalculated on render)
  result: {
    fullTileCount: number;
    cutTileCount: number;
    totalTileCount: number;
    coverageArea: number;
    wastePercentage: number;
    stockTilesNeeded: number;
  };

  optimizedAt: string | null;
  optimizationScore: number | null; // waste % at time of optimization

  createdAt: string;
  updatedAt: string;
}

export type CreateFlooringLayout = Omit<FlooringLayout, 'id' | 'createdAt' | 'updatedAt'>;

export interface OptimizationResult {
  bestConfig: LayoutConfig;
  bestScore: number;   // waste percentage (lower = better)
  iterations: number;
}
