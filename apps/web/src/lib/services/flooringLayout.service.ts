/**
 * FlooringLayoutService — orchestrates layout calculation, optimization, and persistence.
 *
 * Activity events logged:
 *   layout.saved      — user saves a layout config
 *   layout.optimized  — optimizer ran; best config stored
 *
 * All calculation runs on the main thread (polygon-clipping, synchronous).
 * Room polygon vertices come from the DB in mm and are converted to inches
 * before being passed to the calculator.
 */

import type { FlooringLayoutRepository } from '../repositories/flooringLayout.repository';
import type { RoomRepository } from '../repositories/room.repository';
import type { ActivityService } from '../repositories/activity.repository';
import type { Point2D } from '../types/roomScan.types';
import type {
  TileDimensions,
  LayoutConfig,
  LayoutResult,
  FlooringLayout,
  OptimizationResult,
} from '../types/flooringLayout.types';
import { calculateLayout } from '../calculators/flooringLayout.calculator';
import { optimizeLayout } from '../calculators/layoutOptimizer';

/** Convert a polygon stored in mm to inches (calculator works in inches). */
function mmToInchPolygon(polygon: Point2D[]): Point2D[] {
  return polygon.map((p) => ({ x: p.x / 25.4, y: p.y / 25.4 }));
}

export class FlooringLayoutService {
  constructor(
    private layoutRepo: FlooringLayoutRepository,
    private roomRepo: RoomRepository,
    private activity: ActivityService,
  ) {}

  // ─── Read ──────────────────────────────────────────────────────────────────

  async findByRoom(roomId: string): Promise<FlooringLayout | null> {
    return this.layoutRepo.findByRoom(roomId);
  }

  async findByProject(projectId: string): Promise<FlooringLayout[]> {
    return this.layoutRepo.findByProject(projectId);
  }

  // ─── Calculate (no persistence) ───────────────────────────────────────────

  /**
   * Calculate a layout result for a room with a given config.
   * Does NOT persist anything — use saveLayout() to persist.
   */
  async calculateForRoom(
    roomId: string,
    tile: TileDimensions,
    config: LayoutConfig,
  ): Promise<LayoutResult> {
    const room = await this.roomRepo.findById(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);

    const polygon = mmToInchPolygon(room.polygon.vertices);
    return calculateLayout(polygon, tile, config);
  }

  /**
   * Run the optimizer for a room without persisting.
   * Returns best config + score.
   */
  async optimizeForRoom(
    roomId: string,
    tile: TileDimensions,
    baseConfig?: Partial<LayoutConfig>,
  ): Promise<OptimizationResult> {
    const room = await this.roomRepo.findById(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);

    const polygon = mmToInchPolygon(room.polygon.vertices);
    return optimizeLayout(polygon, tile, baseConfig);
  }

  // ─── Persist ──────────────────────────────────────────────────────────────

  /**
   * Save (upsert) a layout for a room.
   * Recalculates stats from the current config before persisting.
   */
  async saveLayout(
    projectId: string,
    jobId: string,
    roomId: string,
    tile: TileDimensions,
    config: LayoutConfig,
  ): Promise<FlooringLayout> {
    const room = await this.roomRepo.findById(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);

    const polygon = mmToInchPolygon(room.polygon.vertices);
    const calcResult = calculateLayout(polygon, tile, config);

    const layout = await this.layoutRepo.upsertForRoom({
      projectId,
      jobId,
      roomId,
      tileDimensions: tile,
      config,
      result: {
        fullTileCount: calcResult.fullTileCount,
        cutTileCount: calcResult.cutTileCount,
        totalTileCount: calcResult.totalTileCount,
        coverageArea: calcResult.coverageArea,
        wastePercentage: calcResult.wastePercentage,
        stockTilesNeeded: calcResult.stockTilesNeeded,
      },
      optimizedAt: null,
      optimizationScore: null,
    });

    await this.activity.create({
      event_type: 'layout.saved',
      project_id: projectId,
      entity_type: 'room',
      entity_id: roomId,
      summary: `Layout saved for ${room.name}: ${calcResult.totalTileCount} tiles, ${(calcResult.wastePercentage * 100).toFixed(1)}% waste`,
      event_data: {
        pattern: config.pattern,
        tileDimensions: tile,
        wastePercentage: calcResult.wastePercentage,
        totalTileCount: calcResult.totalTileCount,
        roomName: room.name,
      },
    });

    return layout;
  }

  /**
   * Run the optimizer for a room, save the winning config, and return both.
   */
  async optimizeAndSave(
    projectId: string,
    jobId: string,
    roomId: string,
    tile: TileDimensions,
    baseConfig?: Partial<LayoutConfig>,
  ): Promise<{ layout: FlooringLayout; optimizationResult: OptimizationResult }> {
    const room = await this.roomRepo.findById(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);

    const polygon = mmToInchPolygon(room.polygon.vertices);
    const optimizationResult = optimizeLayout(polygon, tile, baseConfig);
    const calcResult = calculateLayout(polygon, tile, optimizationResult.bestConfig);

    const layout = await this.layoutRepo.upsertForRoom({
      projectId,
      jobId,
      roomId,
      tileDimensions: tile,
      config: optimizationResult.bestConfig,
      result: {
        fullTileCount: calcResult.fullTileCount,
        cutTileCount: calcResult.cutTileCount,
        totalTileCount: calcResult.totalTileCount,
        coverageArea: calcResult.coverageArea,
        wastePercentage: calcResult.wastePercentage,
        stockTilesNeeded: calcResult.stockTilesNeeded,
      },
      optimizedAt: new Date().toISOString(),
      optimizationScore: optimizationResult.bestScore,
    });

    await this.activity.create({
      event_type: 'layout.optimized',
      project_id: projectId,
      entity_type: 'room',
      entity_id: roomId,
      summary: `Layout optimized for ${room.name}: ${optimizationResult.iterations} configs tested, ${(optimizationResult.bestScore * 100).toFixed(1)}% waste`,
      event_data: {
        pattern: optimizationResult.bestConfig.pattern,
        tileDimensions: tile,
        iterations: optimizationResult.iterations,
        bestScore: optimizationResult.bestScore,
        roomName: room.name,
      },
    });

    return { layout, optimizationResult };
  }

  async deleteLayout(roomId: string): Promise<boolean> {
    return this.layoutRepo.deleteByRoom(roomId);
  }
}

export function createFlooringLayoutService(
  layoutRepo: FlooringLayoutRepository,
  roomRepo: RoomRepository,
  activity: ActivityService,
): FlooringLayoutService {
  return new FlooringLayoutService(layoutRepo, roomRepo, activity);
}
