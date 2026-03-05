/**
 * Sample Rooms Seed — creates a RoomScan + 2 rooms for the demo job.
 *
 * Rooms:
 *   SEED-ROOM-001: Living Room  (~18×14 ft = 252 sqft)
 *   SEED-ROOM-002: Primary Bedroom (~14×12 ft = 168 sqft)
 *
 * Guard: skips if SEED-ROOM-001 already exists.
 */

import { getStorage } from '../../storage/initialize';
import { StoreNames } from '../../storage/StorageAdapter';
import type { Room, RoomScan } from '../../types/roomScan.types';

const SENTINEL_ROOM_ID = 'SEED-ROOM-001';
const SEED_SCAN_ID = 'SEED-SCAN-001';

const SEED_TS = '2026-03-01T12:00:00.000Z';

// 18×14 ft = 5486×4267 mm
const LIVING_ROOM_VERTICES = [
  { x: 0, y: 0 },
  { x: 5486, y: 0 },
  { x: 5486, y: 4267 },
  { x: 0, y: 4267 },
];
// area = 5486 * 4267 = 23_408_162 sqmm ≈ 252 sqft
// perimeter = 2*(5486+4267) = 19_506 mm ≈ 64 ft
const LIVING_ROOM_AREA = 5486 * 4267;
const LIVING_ROOM_PERIMETER = 2 * (5486 + 4267);

// 14×12 ft = 4267×3657 mm
const BEDROOM_VERTICES = [
  { x: 0, y: 0 },
  { x: 4267, y: 0 },
  { x: 4267, y: 3657 },
  { x: 0, y: 3657 },
];
// area = 4267 * 3657 = 15_608_319 sqmm ≈ 168 sqft
// perimeter = 2*(4267+3657) = 15_848 mm ≈ 52 ft
const BEDROOM_AREA = 4267 * 3657;
const BEDROOM_PERIMETER = 2 * (4267 + 3657);

function buildScan(jobId: string): RoomScan {
  return {
    id: SEED_SCAN_ID,
    jobId,
    filename: 'demo-seed-scan.xml',
    source: 'manual',
    status: 'ready',
    roomCount: 2,
    totalArea_sqmm: LIVING_ROOM_AREA + BEDROOM_AREA,
    rawXml: null,
    errorMessage: null,
    createdAt: SEED_TS,
    updatedAt: SEED_TS,
  };
}

function buildRooms(jobId: string): Room[] {
  return [
    {
      id: 'SEED-ROOM-001',
      scanId: SEED_SCAN_ID,
      jobId,
      name: 'Living Room',
      polygon: {
        vertices: LIVING_ROOM_VERTICES,
        area_sqmm: LIVING_ROOM_AREA,
        perimeter_mm: LIVING_ROOM_PERIMETER,
      },
      openings: [
        { id: 'SEED-OPEN-LR-1', type: 'window', width_mm: 1219, height_mm: 1219, wallOffset_mm: 1500, wallIndex: 1, label: 'Window 1' },
        { id: 'SEED-OPEN-LR-2', type: 'window', width_mm: 1219, height_mm: 1219, wallOffset_mm: 1500, wallIndex: 3, label: 'Window 2' },
        { id: 'SEED-OPEN-LR-3', type: 'door', width_mm: 914, height_mm: 2032, wallOffset_mm: 800, wallIndex: 0, label: 'Entry' },
      ],
      ceilingHeight_mm: 2438,
      casingSides: 2,
      status: 'measured',
      notes: null,
      createdAt: SEED_TS,
      updatedAt: SEED_TS,
    },
    {
      id: 'SEED-ROOM-002',
      scanId: SEED_SCAN_ID,
      jobId,
      name: 'Primary Bedroom',
      polygon: {
        vertices: BEDROOM_VERTICES,
        area_sqmm: BEDROOM_AREA,
        perimeter_mm: BEDROOM_PERIMETER,
      },
      openings: [
        { id: 'SEED-OPEN-BR-1', type: 'window', width_mm: 1067, height_mm: 1219, wallOffset_mm: 1200, wallIndex: 1, label: 'Window 1' },
        { id: 'SEED-OPEN-BR-2', type: 'door', width_mm: 813, height_mm: 2032, wallOffset_mm: 600, wallIndex: 0, label: 'Hallway' },
        { id: 'SEED-OPEN-BR-3', type: 'door', width_mm: 762, height_mm: 2032, wallOffset_mm: 2800, wallIndex: 2, label: 'Closet' },
      ],
      ceilingHeight_mm: 2438,
      casingSides: 2,
      status: 'measured',
      notes: null,
      createdAt: SEED_TS,
      updatedAt: SEED_TS,
    },
  ];
}

export async function seedSampleRooms(jobId: string): Promise<boolean> {
  const storage = getStorage();

  // Sentinel guard
  const existing = await storage.get<Room>(StoreNames.ROOMS, SENTINEL_ROOM_ID);
  if (existing) return false;

  // Create scan record first (rooms reference it via scanId)
  const scan = buildScan(jobId);
  await storage.set(StoreNames.ROOM_SCANS, scan.id, scan);

  // Create rooms
  const rooms = buildRooms(jobId);
  await storage.setMany(
    StoreNames.ROOMS,
    rooms.map((r) => ({ key: r.id, value: r })),
  );

  return true;
}
