/**
 * RoomScan XML Parser — internal types.
 *
 * ParsedScanData is the intermediate representation produced by the parser
 * before conversion to app-native Room/RoomScan types.
 * All length values from the XML are in metres (RoomScan Pro default).
 */

export interface ParsedVertex {
  x: number; // metres
  y: number; // metres
}

export interface ParsedOpening {
  type: 'door' | 'window' | 'opening' | 'unknown';
  width_m: number;
  height_m: number;
  wallOffset_m: number;
  wallIndex: number;
  label: string | null;
}

export interface ParsedRoom {
  /** Room name from XML <room name="..."> */
  name: string;
  /** Ordered polygon vertices (metres) */
  vertices: ParsedVertex[];
  /** Ceiling height in metres */
  ceilingHeight_m: number;
  /** Openings found on this room's walls */
  openings: ParsedOpening[];
}

export interface ParsedScanData {
  /** Source app name, e.g. "RoomScan Pro" */
  appName: string | null;
  /** App version string */
  appVersion: string | null;
  /** Export timestamp from XML, ISO string or raw string */
  exportedAt: string | null;
  rooms: ParsedRoom[];
}

export interface ParseError {
  ok: false;
  error: string;
}

export interface ParseSuccess {
  ok: true;
  data: ParsedScanData;
}

export type ParseResult = ParseSuccess | ParseError;
