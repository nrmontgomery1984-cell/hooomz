/**
 * Flooring Layout Calculator
 *
 * Clips a grid of tiles against the room polygon using Sutherland-Hodgman.
 * All units in inches. Room polygon is passed in inches (converted from mm by caller).
 *
 * Grid is centered on the room center so perimeter cuts are balanced on all sides.
 */

import type { Point2D } from '../types/roomScan.types';
import type { TileDimensions, LayoutConfig, PlacedTile, LayoutResult } from '../types/flooringLayout.types';
import { getBoundingBox, expandBounds, tileCorners, polygonArea, clipPolygonToRoom } from './layoutGeometry';

// ─── Tile position grid ────────────────────────────────────────────────────────

interface TilePos { x: number; y: number; row: number; col: number }

/**
 * Center-aligned straight (and diagonal) grid.
 * A tile is centered on `center`; columns/rows extend outward to cover `eb`.
 */
function straightGrid(
  eb: ReturnType<typeof getBoundingBox>,
  center: Point2D,
  tw: number, tl: number,
): TilePos[] {
  const pos: TilePos[] = [];

  // Origin: top-left corner of the tile whose center is at `center`
  const ox = center.x - tw / 2;
  const oy = center.y - tl / 2;

  const colMin = Math.floor((eb.minX - ox) / tw) - 1;
  const colMax = Math.ceil((eb.maxX - ox) / tw) + 1;
  const rowMin = Math.floor((eb.minY - oy) / tl) - 1;
  const rowMax = Math.ceil((eb.maxY - oy) / tl) + 1;

  for (let r = rowMin; r <= rowMax; r++) {
    for (let c = colMin; c <= colMax; c++) {
      pos.push({ x: ox + c * tw, y: oy + r * tl, row: r - rowMin, col: c - colMin });
    }
  }
  return pos;
}

/**
 * Center-aligned staggered grid.
 * Stagger offset is a fraction of tile WIDTH (tw), not length.
 */
function staggeredGrid(
  eb: ReturnType<typeof getBoundingBox>,
  center: Point2D,
  tw: number, tl: number,
  config: LayoutConfig,
): TilePos[] {
  const pos: TilePos[] = [];
  // Stagger is a fraction of the tile WIDTH (the horizontal tile spacing)
  const offset = tw * config.staggerOffset;

  // Origin: top-left of the tile centered on `center`
  const ox = center.x - tw / 2;
  const oy = center.y - tl / 2;

  const colMin = Math.floor((eb.minX - ox) / tw) - 2;
  const colMax = Math.ceil((eb.maxX - ox) / tw) + 2;
  const rowMin = Math.floor((eb.minY - oy) / tl) - 1;
  const rowMax = Math.ceil((eb.maxY - oy) / tl) + 1;

  for (let r = rowMin; r <= rowMax; r++) {
    // ((r % 2) + 2) % 2 handles negative row indices correctly (JS % can return negative)
    const rowOff = ((r % 2) + 2) % 2 * offset;
    for (let c = colMin; c <= colMax; c++) {
      pos.push({ x: ox + c * tw + rowOff, y: oy + r * tl, row: r - rowMin, col: c - colMin });
    }
  }
  return pos;
}

function herringboneGrid(
  eb: ReturnType<typeof getBoundingBox>,
  center: Point2D,
  tw: number, tl: number,
): TilePos[] {
  // Simplified: alternating horizontal/vertical tiles in a brick-like unit
  const pos: TilePos[] = [];
  const unitW = tl;
  const unitH = tw * 2;

  const ox = center.x - unitW / 2;
  const oy = center.y - unitH / 2;

  const colMin = Math.floor((eb.minX - ox) / unitW) - 1;
  const colMax = Math.ceil((eb.maxX - ox) / unitW) + 1;
  const rowMin = Math.floor((eb.minY - oy) / unitH) - 1;
  const rowMax = Math.ceil((eb.maxY - oy) / unitH) + 1;

  for (let r = rowMin; r <= rowMax; r++) {
    for (let c = colMin; c <= colMax; c++) {
      const bx = ox + c * unitW;
      const by = oy + r * unitH;
      pos.push({ x: bx, y: by, row: (r - rowMin) * 2, col: c - colMin });
      pos.push({ x: bx + tl, y: by + tw, row: (r - rowMin) * 2 + 1, col: c - colMin });
    }
  }
  return pos;
}

// ─── Main calculator ───────────────────────────────────────────────────────────

export function calculateLayout(
  roomPolygon: Point2D[],
  tile: TileDimensions,
  config: LayoutConfig,
): LayoutResult {
  const bounds = getBoundingBox(roomPolygon);
  const expansion = Math.max(tile.width, tile.length) * 2;
  const eb = expandBounds(bounds, expansion);

  const tw = tile.width + config.groutWidth;
  const tl = tile.length + config.groutWidth;

  // Room center — used for both centering the tile grid and as the rotation origin
  const origin: Point2D = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
  const rotation = config.pattern === 'diagonal' ? 45 : config.rotation;

  const grid =
    config.pattern === 'staggered'   ? staggeredGrid(eb, origin, tw, tl, config) :
    config.pattern === 'herringbone' ? herringboneGrid(eb, origin, tile.width, tile.length) :
    straightGrid(eb, origin, tw, tl);   // 'straight' and 'diagonal'

  const fullArea = tile.width * tile.length;

  const placed: PlacedTile[] = [];
  let idx = 0;

  for (const pos of grid) {
    const corners = tileCorners(pos.x, pos.y, tile.width, tile.length, rotation, origin);

    // Clip tile against room polygon using Sutherland-Hodgman
    const clipped = clipPolygonToRoom(corners, roomPolygon);
    if (clipped.length < 3) continue;

    const area = polygonArea(clipped);
    const cutRatio = area / fullArea;

    if (cutRatio < 0.02) continue; // discard hairline slivers

    placed.push({
      id: `tile-${idx++}`,
      vertices: clipped,
      isCut: cutRatio < 0.99,
      cutPercentage: cutRatio,
      row: pos.row,
      col: pos.col,
    });
  }

  const full = placed.filter((t) => !t.isCut);
  const cut  = placed.filter((t) =>  t.isCut);

  const coverageArea = placed.reduce((s, t) => s + polygonArea(t.vertices), 0) / 144; // sq-in → sqft
  const totalMaterialArea = (fullArea * placed.length) / 144;
  const wasteArea = totalMaterialArea - coverageArea;
  const wastePercentage = totalMaterialArea > 0 ? wasteArea / totalMaterialArea : 0;

  // Stock: full tiles + cuts needing a new tile (< 50% remaining pairs up)
  const cutsNew  = cut.filter((t) => t.cutPercentage < 0.5).length;
  const cutsPair = cut.filter((t) => t.cutPercentage >= 0.5).length;
  const base = full.length + cutsNew + Math.ceil(cutsPair / 2);
  const stockTilesNeeded = Math.ceil(base * (1 + config.wasteFactor));

  return {
    tiles: placed,
    fullTileCount: full.length,
    cutTileCount: cut.length,
    totalTileCount: placed.length,
    coverageArea,
    wasteArea,
    wastePercentage,
    stockTilesNeeded,
  };
}
