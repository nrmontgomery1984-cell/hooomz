/**
 * RoomScan Converter
 *
 * Converts ParsedScanData (metres) to app-native Room/RoomScan shapes (mm).
 * Uses metersToMm() and the Shoelace formula from utils for area.
 */

import { metersToMm } from '../../utils/units';
import { calculatePolygonArea, calculatePolygonPerimeter } from '../../utils/geometry';
import type { ParsedScanData, ParsedRoom } from './types';
import type { Room, RoomOpening, RoomPolygon, Point2D, OpeningType } from '../../types/roomScan.types';

function convertOpenings(openings: import('./types').ParsedOpening[], idPrefix: string): RoomOpening[] {
  return openings.map((o, i) => ({
    id: `${idPrefix}_op_${i}`,
    type: o.type as OpeningType,
    width_mm: metersToMm(o.width_m),
    height_mm: metersToMm(o.height_m),
    wallOffset_mm: metersToMm(o.wallOffset_m),
    wallIndex: o.wallIndex,
    label: o.label,
  }));
}

function convertPolygon(parsedRoom: ParsedRoom): RoomPolygon {
  const vertices: Point2D[] = parsedRoom.vertices.map((v) => ({
    x: metersToMm(v.x),
    y: metersToMm(v.y),
  }));

  const area_sqmm = calculatePolygonArea(vertices);
  const perimeter_mm = calculatePolygonPerimeter(vertices);

  return { vertices, area_sqmm, perimeter_mm };
}

export interface ConvertedRooms {
  rooms: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>[];
  totalArea_sqmm: number;
}

/**
 * Convert ParsedScanData to room-shaped objects ready to be saved.
 * Caller must supply scanId and jobId.
 */
export function convertParsedToRooms(
  data: ParsedScanData,
  scanId: string,
  jobId: string,
): ConvertedRooms {
  const rooms: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>[] = data.rooms.map(
    (parsedRoom, i) => {
      const idPrefix = `${scanId}_r${i}`;
      const polygon = convertPolygon(parsedRoom);
      const openings = convertOpenings(parsedRoom.openings, idPrefix);

      return {
        scanId,
        jobId,
        name: parsedRoom.name,
        polygon,
        openings,
        ceilingHeight_mm: metersToMm(parsedRoom.ceilingHeight_m),
        casingSides: null,
        status: 'pending' as const,
        notes: null,
      };
    }
  );

  const totalArea_sqmm = rooms.reduce((sum, r) => sum + r.polygon.area_sqmm, 0);

  return { rooms, totalArea_sqmm };
}
