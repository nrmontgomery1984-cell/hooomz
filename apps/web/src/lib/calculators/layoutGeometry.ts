/**
 * Geometry helpers for flooring layout calculation.
 * All units in inches unless noted.
 */

import type { Point2D } from '../types/roomScan.types';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export function getBoundingBox(polygon: Point2D[]): BoundingBox {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  for (const p of polygon) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function expandBounds(b: BoundingBox, amount: number): BoundingBox {
  return {
    minX: b.minX - amount,
    minY: b.minY - amount,
    maxX: b.maxX + amount,
    maxY: b.maxY + amount,
    width: b.width + amount * 2,
    height: b.height + amount * 2,
  };
}

export function rotatePoint(p: Point2D, origin: Point2D, angleDeg: number): Point2D {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = p.x - origin.x;
  const dy = p.y - origin.y;
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
}

/** Returns the 4 corners of a tile, optionally rotated around `origin`. */
export function tileCorners(
  x: number,
  y: number,
  w: number,
  l: number,
  rotation: number,
  origin: Point2D,
): Point2D[] {
  const corners: Point2D[] = [
    { x: x,     y: y     },
    { x: x + w, y: y     },
    { x: x + w, y: y + l },
    { x: x,     y: y + l },
  ];
  if (rotation === 0) return corners;
  return corners.map((c) => rotatePoint(c, origin, rotation));
}

/** Shoelace formula — returns positive area regardless of winding order. */
export function polygonArea(vertices: Point2D[]): number {
  let area = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area / 2);
}

/** Ray-casting point-in-polygon. */
export function pointInPolygon(pt: Point2D, vertices: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x, yi = vertices[i].y;
    const xj = vertices[j].x, yj = vertices[j].y;
    if (((yi > pt.y) !== (yj > pt.y)) &&
        (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// ─── Sutherland-Hodgman polygon clipper ──────────────────────────────────────
// Clips `subject` against a convex `clip` polygon. Handles both CW and CCW
// winding. Works correctly for rectangular rooms and most residential shapes.

function segmentIntersect(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D): Point2D {
  const dx1 = p2.x - p1.x, dy1 = p2.y - p1.y;
  const dx2 = p4.x - p3.x, dy2 = p4.y - p3.y;
  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-10) return p1; // parallel edges — return fallback
  const t = ((p3.x - p1.x) * dy2 - (p3.y - p1.y) * dx2) / denom;
  return { x: p1.x + t * dx1, y: p1.y + t * dy1 };
}

/**
 * Clip `subject` polygon against `clip` polygon using Sutherland-Hodgman.
 * Returns the intersection polygon, or [] if there is no overlap.
 * Best for convex clip polygons (rectangles, simple rooms).
 */
export function clipPolygonToRoom(subject: Point2D[], clip: Point2D[]): Point2D[] {
  if (subject.length === 0 || clip.length < 3) return [];

  // Compute winding sign of clip polygon via shoelace sum.
  // Positive = CW in screen coords (y-down), negative = CCW.
  let shoelace = 0;
  for (let i = 0; i < clip.length; i++) {
    const j = (i + 1) % clip.length;
    shoelace += clip[i].x * clip[j].y - clip[j].x * clip[i].y;
  }
  const windingSign = shoelace >= 0 ? 1 : -1;

  let output = [...subject];

  for (let i = 0; i < clip.length; i++) {
    if (output.length === 0) return [];
    const input = output;
    output = [];
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const edgeDx = b.x - a.x;
    const edgeDy = b.y - a.y;

    for (let j = 0; j < input.length; j++) {
      const curr = input[j];
      const prev = input[(j + input.length - 1) % input.length];

      const crossCurr = edgeDx * (curr.y - a.y) - edgeDy * (curr.x - a.x);
      const crossPrev  = edgeDx * (prev.y  - a.y) - edgeDy * (prev.x  - a.x);

      const currInside = windingSign * crossCurr >= 0;
      const prevInside = windingSign * crossPrev  >= 0;

      if (currInside) {
        if (!prevInside) output.push(segmentIntersect(prev, curr, a, b));
        output.push(curr);
      } else if (prevInside) {
        output.push(segmentIntersect(prev, curr, a, b));
      }
    }
  }

  return output;
}
