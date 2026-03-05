/**
 * RoomScan Pro XML Parser
 *
 * Parses the XML export format from RoomScan Pro into ParsedScanData.
 * Uses browser-native DOMParser — no external dependencies.
 *
 * RoomScan Pro XML structure (representative):
 * <scan app="RoomScan Pro" version="5.x" exported="2026-03-01T...">
 *   <room name="Living Room">
 *     <ceiling height="2.4"/>
 *     <polygon>
 *       <vertex x="0.0" y="0.0"/>
 *       <vertex x="4.2" y="0.0"/>
 *       ...
 *     </polygon>
 *     <openings>
 *       <opening type="door" width="0.91" height="2.03" wallOffset="1.2" wallIndex="0" label="Front Door"/>
 *     </openings>
 *   </room>
 * </scan>
 *
 * All lengths in the XML are in metres.
 */

import type { ParseResult, ParsedScanData, ParsedRoom, ParsedOpening, ParsedVertex } from './types';

function attr(el: Element, name: string): string | null {
  return el.getAttribute(name);
}

function numAttr(el: Element, name: string, fallback = 0): number {
  const v = el.getAttribute(name);
  if (!v) return fallback;
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

function parseOpenings(roomEl: Element): ParsedOpening[] {
  const openingsEl = roomEl.querySelector('openings');
  if (!openingsEl) return [];

  const result: ParsedOpening[] = [];
  const items = openingsEl.querySelectorAll('opening');

  items.forEach((el) => {
    const rawType = attr(el, 'type') ?? 'unknown';
    let type: ParsedOpening['type'] = 'unknown';
    if (rawType === 'door') type = 'door';
    else if (rawType === 'window') type = 'window';
    else if (rawType === 'opening') type = 'opening';

    result.push({
      type,
      width_m: numAttr(el, 'width'),
      height_m: numAttr(el, 'height', 2.0),
      wallOffset_m: numAttr(el, 'wallOffset'),
      wallIndex: Math.round(numAttr(el, 'wallIndex')),
      label: attr(el, 'label'),
    });
  });

  return result;
}

function parsePolygon(roomEl: Element): ParsedVertex[] {
  const polygonEl = roomEl.querySelector('polygon');
  if (!polygonEl) return [];

  const vertices: ParsedVertex[] = [];
  polygonEl.querySelectorAll('vertex').forEach((el) => {
    vertices.push({
      x: numAttr(el, 'x'),
      y: numAttr(el, 'y'),
    });
  });

  return vertices;
}

function parseCeilingHeight(roomEl: Element): number {
  const ceilingEl = roomEl.querySelector('ceiling');
  if (!ceilingEl) return 2.4; // default 2.4m
  return numAttr(ceilingEl, 'height', 2.4);
}

function parseRooms(doc: Document): ParsedRoom[] {
  const rooms: ParsedRoom[] = [];
  doc.querySelectorAll('room').forEach((roomEl) => {
    const name = attr(roomEl, 'name') ?? 'Unknown Room';
    const vertices = parsePolygon(roomEl);
    if (vertices.length < 3) return; // skip degenerate rooms

    rooms.push({
      name,
      vertices,
      ceilingHeight_m: parseCeilingHeight(roomEl),
      openings: parseOpenings(roomEl),
    });
  });
  return rooms;
}

/**
 * Parse a RoomScan Pro XML string into ParsedScanData.
 * Returns a discriminated union — check result.ok before using result.data.
 */
export function parseRoomScanXML(xmlString: string): ParseResult {
  if (!xmlString || !xmlString.trim()) {
    return { ok: false, error: 'Empty XML input' };
  }

  let doc: Document;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(xmlString, 'application/xml');
  } catch {
    return { ok: false, error: 'Failed to parse XML: invalid document' };
  }

  // DOMParser signals errors via a <parsererror> element
  const parseErrorEl = doc.querySelector('parsererror');
  if (parseErrorEl) {
    return {
      ok: false,
      error: `XML parse error: ${parseErrorEl.textContent?.slice(0, 200) ?? 'unknown'}`,
    };
  }

  const scanEl = doc.querySelector('scan');
  if (!scanEl) {
    return { ok: false, error: 'Invalid RoomScan XML: no <scan> root element found' };
  }

  const rooms = parseRooms(doc);
  if (rooms.length === 0) {
    return { ok: false, error: 'No valid rooms found in scan file' };
  }

  const data: ParsedScanData = {
    appName: attr(scanEl, 'app'),
    appVersion: attr(scanEl, 'version'),
    exportedAt: attr(scanEl, 'exported'),
    rooms,
  };

  return { ok: true, data };
}
