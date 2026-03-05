/**
 * RoomScanService — orchestrates XML import, scan + room CRUD.
 *
 * Activity events logged:
 *   scan.uploaded   — new scan imported from XML
 *   scan.deleted    — scan and its rooms removed
 *   room.updated    — room fields changed
 */

import { parseRoomScanXML, convertParsedToRooms } from '../parsers/roomscan';
import type { RoomScanRepository } from '../repositories/roomScan.repository';
import type { RoomRepository } from '../repositories/room.repository';
import type { ActivityService } from '../repositories/activity.repository';
import type { RoomScan, Room, UpdateRoom, UpdateRoomScan } from '../types/roomScan.types';

export class RoomScanService {
  constructor(
    private scanRepo: RoomScanRepository,
    private roomRepo: RoomRepository,
    private activity: ActivityService,
  ) {}

  // ─── Import ───────────────────────────────────────────────────────────────

  /**
   * Parse an XML string, create a RoomScan record, and persist all rooms.
   * Returns the created scan or throws on parse failure.
   */
  async importFromXML(
    jobId: string,
    filename: string,
    xmlString: string,
  ): Promise<{ scan: RoomScan; rooms: Room[] }> {
    const parseResult = parseRoomScanXML(xmlString);

    if (!parseResult.ok) {
      // Create an error-state scan record so users can see the failure
      const errorScan = await this.scanRepo.create({
        jobId,
        filename,
        source: 'roomscan_pro',
        status: 'error',
        roomCount: 0,
        totalArea_sqmm: 0,
        rawXml: xmlString,
        errorMessage: parseResult.error,
      });
      return { scan: errorScan, rooms: [] };
    }

    const { rooms: roomData, totalArea_sqmm } = convertParsedToRooms(
      parseResult.data,
      `rscan_${Date.now()}`,
      jobId,
    );

    // Create scan record first (status: processing)
    const scan = await this.scanRepo.create({
      jobId,
      filename,
      source: 'roomscan_pro',
      status: 'processing',
      roomCount: roomData.length,
      totalArea_sqmm,
      rawXml: xmlString,
      errorMessage: null,
    });

    // Persist rooms with the scan's real ID
    const ts = new Date().toISOString();
    const rooms: Room[] = roomData.map((r, i) => ({
      ...r,
      id: `room_${scan.id}_${i}`,
      scanId: scan.id,
      createdAt: ts,
      updatedAt: ts,
    }));

    await this.roomRepo.saveMany(rooms);

    // Mark scan ready
    const readyScan = await this.scanRepo.update(scan.id, { status: 'ready' });

    // Log activity
    await this.activity.create({
      event_type: 'scan.uploaded',
      project_id: jobId,
      entity_type: 'room_scan',
      entity_id: scan.id,
      summary: `Floor plan imported: ${filename} (${rooms.length} rooms)`,
      event_data: { filename, roomCount: rooms.length, totalArea_sqmm },
    });

    return { scan: readyScan ?? scan, rooms };
  }

  // ─── Scan CRUD ────────────────────────────────────────────────────────────

  async findScanById(id: string): Promise<RoomScan | null> {
    return this.scanRepo.findById(id);
  }

  async findScansByJob(jobId: string): Promise<RoomScan[]> {
    return this.scanRepo.findByJob(jobId);
  }

  async updateScan(id: string, changes: UpdateRoomScan): Promise<RoomScan | null> {
    return this.scanRepo.update(id, changes);
  }

  async deleteScan(id: string): Promise<boolean> {
    const scan = await this.scanRepo.findById(id);
    if (!scan) return false;

    // Delete all associated rooms first
    await this.roomRepo.deleteByScan(id);

    const deleted = await this.scanRepo.delete(id);
    if (deleted) {
      await this.activity.create({
        event_type: 'scan.deleted',
        project_id: scan.jobId,
        entity_type: 'room_scan',
        entity_id: id,
        summary: `Floor plan deleted: ${scan.filename}`,
        event_data: { filename: scan.filename },
      });
    }
    return deleted;
  }

  // ─── Room CRUD ────────────────────────────────────────────────────────────

  async findRoomById(id: string): Promise<Room | null> {
    return this.roomRepo.findById(id);
  }

  async findRoomsByScan(scanId: string): Promise<Room[]> {
    return this.roomRepo.findByScan(scanId);
  }

  async findRoomsByJob(jobId: string): Promise<Room[]> {
    return this.roomRepo.findByJob(jobId);
  }

  async updateRoom(id: string, changes: UpdateRoom): Promise<Room | null> {
    const existing = await this.roomRepo.findById(id);
    if (!existing) return null;

    const updated = await this.roomRepo.update(id, changes);
    if (updated) {
      await this.activity.create({
        event_type: 'room.updated',
        project_id: existing.jobId,
        entity_type: 'room',
        entity_id: id,
        summary: `Room updated: ${existing.name}`,
        event_data: { room_name: existing.name, changes: Object.keys(changes) },
      });
    }
    return updated;
  }

  async deleteRoom(id: string): Promise<boolean> {
    return this.roomRepo.delete(id);
  }

  // ─── Demo Seed ────────────────────────────────────────────────────────────

  /**
   * Creates a hardcoded demo scan + 4 rooms for a given job.
   * Used for local testing/demo. Safe to call multiple times — creates a new scan each call.
   */
  async seedDemoRooms(jobId: string): Promise<{ scan: RoomScan; rooms: Room[] }> {
    const ts = new Date().toISOString();
    const scanId = `rscan_demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const CEILING = 2438; // 8 ft in mm

    const demoRooms: Room[] = [
      {
        id: `room_${scanId}_0`,
        scanId,
        jobId,
        name: 'Living Room',
        polygon: {
          vertices: [
            { x: 0, y: 0 },
            { x: 4572, y: 0 },
            { x: 4572, y: 5486 },
            { x: 0, y: 5486 },
          ],
          area_sqmm: 4572 * 5486,       // ~270 sqft
          perimeter_mm: 2 * (4572 + 5486),
        },
        openings: [
          { id: `op_${scanId}_0_0`, type: 'door', width_mm: 813, height_mm: 2032, wallOffset_mm: 1200, wallIndex: 1, label: 'Hallway' },
          { id: `op_${scanId}_0_1`, type: 'window', width_mm: 914, height_mm: 914, wallOffset_mm: 800, wallIndex: 0, label: 'Front' },
          { id: `op_${scanId}_0_2`, type: 'window', width_mm: 914, height_mm: 914, wallOffset_mm: 2600, wallIndex: 0, label: 'Front' },
        ],
        ceilingHeight_mm: CEILING,
        casingSides: 2,
        status: 'measured',
        notes: null,
        createdAt: ts,
        updatedAt: ts,
      },
      {
        id: `room_${scanId}_1`,
        scanId,
        jobId,
        name: 'Kitchen',
        polygon: {
          vertices: [
            { x: 4877, y: 0 },
            { x: 7925, y: 0 },
            { x: 7925, y: 3658 },
            { x: 4877, y: 3658 },
          ],
          area_sqmm: 3048 * 3658,       // ~120 sqft
          perimeter_mm: 2 * (3048 + 3658),
        },
        openings: [
          { id: `op_${scanId}_1_0`, type: 'door', width_mm: 813, height_mm: 2032, wallOffset_mm: 400, wallIndex: 3, label: 'Hallway' },
          { id: `op_${scanId}_1_1`, type: 'window', width_mm: 1067, height_mm: 762, wallOffset_mm: 1000, wallIndex: 0, label: 'Side' },
        ],
        ceilingHeight_mm: CEILING,
        casingSides: 2,
        status: 'measured',
        notes: null,
        createdAt: ts,
        updatedAt: ts,
      },
      {
        id: `room_${scanId}_2`,
        scanId,
        jobId,
        name: 'Master Bedroom',
        polygon: {
          vertices: [
            { x: 0, y: 5791 },
            { x: 3962, y: 5791 },
            { x: 3962, y: 10058 },
            { x: 0, y: 10058 },
          ],
          area_sqmm: 3962 * 4267,       // ~182 sqft
          perimeter_mm: 2 * (3962 + 4267),
        },
        openings: [
          { id: `op_${scanId}_2_0`, type: 'door', width_mm: 813, height_mm: 2032, wallOffset_mm: 600, wallIndex: 0, label: 'Hallway' },
          { id: `op_${scanId}_2_1`, type: 'window', width_mm: 1219, height_mm: 1067, wallOffset_mm: 900, wallIndex: 1, label: 'Rear' },
          { id: `op_${scanId}_2_2`, type: 'window', width_mm: 914, height_mm: 914, wallOffset_mm: 2400, wallIndex: 1, label: 'Rear' },
        ],
        ceilingHeight_mm: CEILING,
        casingSides: 2,
        status: 'pending',
        notes: null,
        createdAt: ts,
        updatedAt: ts,
      },
      {
        id: `room_${scanId}_3`,
        scanId,
        jobId,
        name: 'Bedroom 2',
        polygon: {
          vertices: [
            { x: 4877, y: 5791 },
            { x: 7925, y: 5791 },
            { x: 7925, y: 9144 },
            { x: 4877, y: 9144 },
          ],
          area_sqmm: 3048 * 3353,       // ~110 sqft
          perimeter_mm: 2 * (3048 + 3353),
        },
        openings: [
          { id: `op_${scanId}_3_0`, type: 'door', width_mm: 813, height_mm: 2032, wallOffset_mm: 500, wallIndex: 3, label: 'Hallway' },
          { id: `op_${scanId}_3_1`, type: 'window', width_mm: 914, height_mm: 914, wallOffset_mm: 1100, wallIndex: 2, label: 'Rear' },
        ],
        ceilingHeight_mm: CEILING,
        casingSides: 1,
        status: 'pending',
        notes: null,
        createdAt: ts,
        updatedAt: ts,
      },
    ];

    const totalArea_sqmm = demoRooms.reduce((sum, r) => sum + r.polygon.area_sqmm, 0);

    const scan = await this.scanRepo.create({
      jobId,
      filename: 'demo-floor-plan.xml',
      source: 'manual',
      status: 'processing',
      roomCount: demoRooms.length,
      totalArea_sqmm,
      rawXml: null,
      errorMessage: null,
    });

    // Rewrite room IDs to use the persisted scan ID
    const rooms: Room[] = demoRooms.map((r, i) => ({
      ...r,
      id: `room_${scan.id}_${i}`,
      scanId: scan.id,
    }));

    await this.roomRepo.saveMany(rooms);
    await this.scanRepo.update(scan.id, { status: 'ready' });

    await this.activity.create({
      event_type: 'scan.uploaded',
      project_id: jobId,
      entity_type: 'room_scan',
      entity_id: scan.id,
      summary: `Demo floor plan loaded (${rooms.length} rooms)`,
      event_data: { filename: 'demo-floor-plan.xml', roomCount: rooms.length, totalArea_sqmm },
    });

    return { scan: { ...scan, status: 'ready' }, rooms };
  }
}

export function createRoomScanService(
  scanRepo: RoomScanRepository,
  roomRepo: RoomRepository,
  activity: ActivityService,
): RoomScanService {
  return new RoomScanService(scanRepo, roomRepo, activity);
}
