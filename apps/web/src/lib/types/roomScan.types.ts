/**
 * RoomScan Integration Types — Phase 2 (v30)
 *
 * RoomScan Pro exports XML files describing a floor plan's rooms, dimensions,
 * and openings (doors, windows). These types model the parsed result after
 * conversion into app-native mm-based coordinates.
 *
 * Unit convention: ALL measurements stored in mm.
 */

// ─── Geometry ─────────────────────────────────────────────────────────────────

export interface Point2D {
  x: number; // mm from scan origin
  y: number; // mm from scan origin
}

// ─── Openings ─────────────────────────────────────────────────────────────────

export type OpeningType = 'door' | 'window' | 'opening' | 'unknown';

export interface RoomOpening {
  id: string;
  type: OpeningType;
  width_mm: number;
  height_mm: number;
  /** Distance along the wall from the first vertex, in mm */
  wallOffset_mm: number;
  /** Index of the wall segment this opening sits on (0-based) */
  wallIndex: number;
  label: string | null;
}

// ─── Room Polygon ─────────────────────────────────────────────────────────────

export interface RoomPolygon {
  /** Ordered list of vertices forming the room boundary (closed — last→first implied) */
  vertices: Point2D[];
  /** Area in mm² (from shoelace formula; 1 sqft = 92903 mm²) */
  area_sqmm: number;
  /** Perimeter in mm */
  perimeter_mm: number;
}

// ─── Room ─────────────────────────────────────────────────────────────────────

export type RoomStatus = 'pending' | 'measured' | 'complete';

export interface Room {
  id: string;
  scanId: string;
  jobId: string;
  /** Room name from RoomScan (e.g. "Living Room", "Bedroom 1") */
  name: string;
  /** Polygon boundary, vertices in mm */
  polygon: RoomPolygon;
  /** Openings (doors, windows) on room walls */
  openings: RoomOpening[];
  /** Ceiling height in mm */
  ceilingHeight_mm: number;
  /** Number of casing sides: 1=single, 2=double, 3=triple, null=unknown */
  casingSides: 1 | 2 | 3 | null;
  /** Work status for this room */
  status: RoomStatus;
  /** Freeform notes from manager/operator */
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateRoom = Omit<Room, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateRoom = Partial<Omit<Room, 'id' | 'scanId' | 'jobId' | 'createdAt'>>;

// ─── RoomScan ─────────────────────────────────────────────────────────────────

export type ScanSource = 'roomscan_pro' | 'manual';
export type ScanStatus = 'processing' | 'ready' | 'error';

export interface RoomScan {
  id: string;
  jobId: string;
  /** Original filename of the XML upload */
  filename: string;
  source: ScanSource;
  status: ScanStatus;
  /** Number of rooms parsed from the scan */
  roomCount: number;
  /** Total floor area of all rooms in mm² */
  totalArea_sqmm: number;
  /** Raw XML string — stored for re-parsing if types change */
  rawXml: string | null;
  /** Error message if status === 'error' */
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateRoomScan = Omit<RoomScan, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateRoomScan = Partial<Omit<RoomScan, 'id' | 'jobId' | 'createdAt'>>;
