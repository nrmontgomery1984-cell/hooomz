'use client';

/**
 * TrimRoomCanvas — SVG floor plan for the trim cut calculator.
 *
 * Shows the room outline with:
 *   • Baseboard (dashed amber line, offset inward) broken at door openings
 *   • Door symbols (gap + 90° swing arc) — blue
 *   • Window symbols (three parallel lines on wall) — teal
 *
 * All input coordinates in mm (from RoomScan).
 * Openings are positioned via wallIndex + wallOffset_mm.
 */

import { useMemo } from 'react';
import type { Point2D, RoomOpening } from '@/lib/types/roomScan.types';

// ─── Colors ───────────────────────────────────────────────────────────────────
const WALL_CLR    = '#1F2937';
const BASE_CLR    = '#F59E0B';  // amber baseboard
const DOOR_CLR    = '#1E3A8A';  // blue door
const WIN_CLR     = '#0F766E';  // teal window
const FILL_CLR    = 'rgba(241,245,249,0.7)'; // room fill

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function sub(a: Point2D, b: Point2D): [number, number] { return [a.x - b.x, a.y - b.y]; }
function length([x, y]: [number, number]): number { return Math.sqrt(x * x + y * y); }
function normalize(v: [number, number]): [number, number] {
  const l = length(v);
  return l > 1e-9 ? [v[0] / l, v[1] / l] : [0, 0];
}
// Rotate 90° CCW: (x,y) → (-y, x)
function rot90ccw([x, y]: [number, number]): [number, number] { return [-y, x]; }

/** Return the unit inward normal for wall A→B, toward room centroid. */
function inwardNormal(A: Point2D, B: Point2D, cx: number, cy: number): [number, number] {
  const dir = normalize(sub(B, A));
  const left = rot90ccw(dir);
  const mx = (A.x + B.x) / 2;
  const my = (A.y + B.y) / 2;
  const dot = (cx - mx) * left[0] + (cy - my) * left[1];
  return dot >= 0 ? left : [-left[0], -left[1]];
}

/** Point along wall A→B at distance d from A. */
function along(A: Point2D, dir: [number, number], d: number): Point2D {
  return { x: A.x + dir[0] * d, y: A.y + dir[1] * d };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  /** Room polygon vertices in mm (from RoomScan). */
  vertices: Point2D[];
  /** Openings from the room scan (positional data: wallIndex + wallOffset_mm). */
  openings: RoomOpening[];
  height?: number;
}

export function TrimRoomCanvas({ vertices, openings, height = 280 }: Props) {
  const svg = useMemo(() => {
    const n = vertices.length;
    if (n < 3) return null;

    const xs = vertices.map((v) => v.x);
    const ys = vertices.map((v) => v.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const roomW = maxX - minX, roomH = maxY - minY;

    const pad = Math.max(roomW, roomH) * 0.10;
    const vbX = minX - pad, vbY = minY - pad;
    const vbW = roomW + pad * 2, vbH = roomH + pad * 2;

    // Room centroid for inward-normal computation
    const cx = xs.reduce((a, b) => a + b, 0) / n;
    const cy = ys.reduce((a, b) => a + b, 0) / n;

    // Baseboard visual inset (adaptive: 2.5% of shorter room dimension)
    const baseOff = Math.max(40, Math.min(100, Math.min(roomW, roomH) * 0.025));
    // Stroke widths in SVG user units (mm)
    const wallStroke = vbW * 0.006;
    const baseStroke = vbW * 0.004;
    const symStroke  = vbW * 0.003;
    const dashLen    = vbW * 0.025;
    const gapLen     = vbW * 0.012;

    // Build polygon path for room fill
    const fillPath =
      vertices.map((v, i) => `${i === 0 ? 'M' : 'L'} ${v.x} ${v.y}`).join(' ') + ' Z';

    // Per-wall elements
    const wallLines: React.ReactNode[]  = [];
    const baseLines: React.ReactNode[]  = [];
    const openingSyms: React.ReactNode[] = [];

    for (let i = 0; i < n; i++) {
      const A = vertices[i];
      const B = vertices[(i + 1) % n];
      const dir  = normalize(sub(B, A));
      const wlen = length(sub(B, A));
      const inn  = inwardNormal(A, B, cx, cy);

      // Openings on this wall, sorted by wallOffset_mm
      const wallOps = openings
        .filter((o) => o.wallIndex === i)
        .sort((a, b) => a.wallOffset_mm - b.wallOffset_mm);

      // ── Wall line (drawn as segments, skipping door gaps) ──────────────────
      let pos = 0;
      for (const op of wallOps) {
        const opStart = op.wallOffset_mm;
        const opEnd   = op.wallOffset_mm + op.width_mm;

        if (op.type === 'door') {
          // Wall segment before door
          if (pos < opStart) {
            const P1 = along(A, dir, pos);
            const P2 = along(A, dir, opStart);
            wallLines.push(
              <line key={`w${i}-${pos}`}
                x1={P1.x} y1={P1.y} x2={P2.x} y2={P2.y}
                stroke={WALL_CLR} strokeWidth={wallStroke} strokeLinecap="square" />,
            );
          }
          // ── Door symbol ───────────────────────────────────────────────────
          const jamb1 = along(A, dir, opStart);
          const jamb2 = along(A, dir, opEnd);
          // Swing arc: hinge at jamb1, radius = door width, sweeps 90° toward room
          const arcEnd = {
            x: jamb1.x + inn[0] * op.width_mm,
            y: jamb1.y + inn[1] * op.width_mm,
          };
          // Door leaf line from hinge to arc end
          const doorLeafX2 = jamb1.x + inn[0] * op.width_mm;
          const doorLeafY2 = jamb1.y + inn[1] * op.width_mm;
          openingSyms.push(
            <g key={`door-${op.id}`}>
              {/* Jamb ticks */}
              <line x1={jamb1.x - inn[0]*wallStroke*1.5} y1={jamb1.y - inn[1]*wallStroke*1.5}
                    x2={jamb1.x + inn[0]*wallStroke*4}   y2={jamb1.y + inn[1]*wallStroke*4}
                    stroke={DOOR_CLR} strokeWidth={symStroke * 1.5} />
              <line x1={jamb2.x - inn[0]*wallStroke*1.5} y1={jamb2.y - inn[1]*wallStroke*1.5}
                    x2={jamb2.x + inn[0]*wallStroke*4}   y2={jamb2.y + inn[1]*wallStroke*4}
                    stroke={DOOR_CLR} strokeWidth={symStroke * 1.5} />
              {/* Door leaf */}
              <line x1={jamb1.x} y1={jamb1.y} x2={doorLeafX2} y2={doorLeafY2}
                    stroke={DOOR_CLR} strokeWidth={symStroke} />
              {/* 90° arc: A rx ry x-rotation large-arc sweep x y */}
              <path d={`M ${jamb2.x} ${jamb2.y} A ${op.width_mm} ${op.width_mm} 0 0 0 ${arcEnd.x} ${arcEnd.y}`}
                    fill="none" stroke={DOOR_CLR} strokeWidth={symStroke}
                    strokeDasharray={`${dashLen * 0.7} ${gapLen * 0.7}`} />
              {/* D label */}
              <text
                x={(jamb1.x + jamb2.x) / 2 + inn[0] * op.width_mm * 0.5}
                y={(jamb1.y + jamb2.y) / 2 + inn[1] * op.width_mm * 0.5}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={vbW * 0.03} fontWeight={700} fill={DOOR_CLR} fontFamily="inherit"
              >
                {op.label ?? 'D'}
              </text>
            </g>,
          );
          pos = opEnd;
        } else if (op.type === 'window') {
          // Wall continues through a window — draw full wall, add symbol on top
          const wStart = along(A, dir, opStart);
          const wEnd   = along(A, dir, opEnd);
          // Three parallel lines perpendicular to wall (looking down at sill)
          const lineOffsets = [0.15, 0.5, 0.85].map((t) => t * op.width_mm);
          openingSyms.push(
            <g key={`win-${op.id}`}>
              {/* Outer frame lines on wall face */}
              <line x1={wStart.x} y1={wStart.y} x2={wEnd.x} y2={wEnd.y}
                    stroke={WIN_CLR} strokeWidth={symStroke * 3} />
              <line x1={wStart.x + inn[0]*wallStroke*2} y1={wStart.y + inn[1]*wallStroke*2}
                    x2={wEnd.x + inn[0]*wallStroke*2}   y2={wEnd.y + inn[1]*wallStroke*2}
                    stroke={WIN_CLR} strokeWidth={symStroke} opacity={0.6} />
              {/* Centre cross-line (perpendicular to wall, at midpoint) */}
              {lineOffsets.map((off, li) => {
                const P = along(A, dir, opStart + off);
                return (
                  <line key={li}
                    x1={P.x} y1={P.y}
                    x2={P.x + inn[0] * wallStroke * 6} y2={P.y + inn[1] * wallStroke * 6}
                    stroke={WIN_CLR} strokeWidth={symStroke} opacity={0.5} />
                );
              })}
              {/* W label */}
              <text
                x={(wStart.x + wEnd.x) / 2 + inn[0] * baseOff * 1.5}
                y={(wStart.y + wEnd.y) / 2 + inn[1] * baseOff * 1.5}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={vbW * 0.028} fontWeight={700} fill={WIN_CLR} fontFamily="inherit"
              >
                {op.label ?? 'W'}
              </text>
            </g>,
          );
        }
      }
      // Remaining wall segment after last door
      if (pos < wlen) {
        const P1 = along(A, dir, pos);
        wallLines.push(
          <line key={`w${i}-end`}
            x1={P1.x} y1={P1.y} x2={B.x} y2={B.y}
            stroke={WALL_CLR} strokeWidth={wallStroke} strokeLinecap="square" />,
        );
      }
      // If no doors on this wall, draw full wall
      if (wallOps.filter((o) => o.type === 'door').length === 0) {
        wallLines.push(
          <line key={`w${i}-full`}
            x1={A.x} y1={A.y} x2={B.x} y2={B.y}
            stroke={WALL_CLR} strokeWidth={wallStroke} strokeLinecap="square" />,
        );
      }

      // ── Baseboard (inset, broken at doors) ────────────────────────────────
      const doorOps = wallOps.filter((o) => o.type === 'door');
      let bpos = 0;
      for (const dop of doorOps) {
        if (bpos < dop.wallOffset_mm) {
          const B1 = along(A, dir, bpos);
          const B2 = along(A, dir, dop.wallOffset_mm);
          baseLines.push(
            <line key={`base-${i}-${bpos}`}
              x1={B1.x + inn[0]*baseOff} y1={B1.y + inn[1]*baseOff}
              x2={B2.x + inn[0]*baseOff} y2={B2.y + inn[1]*baseOff}
              stroke={BASE_CLR} strokeWidth={baseStroke}
              strokeDasharray={`${dashLen} ${gapLen}`} strokeLinecap="round" />,
          );
        }
        bpos = dop.wallOffset_mm + dop.width_mm;
      }
      if (bpos < wlen) {
        const B1 = along(A, dir, bpos);
        const B2 = along(A, dir, wlen);
        baseLines.push(
          <line key={`base-${i}-end`}
            x1={B1.x + inn[0]*baseOff} y1={B1.y + inn[1]*baseOff}
            x2={B2.x + inn[0]*baseOff} y2={B2.y + inn[1]*baseOff}
            stroke={BASE_CLR} strokeWidth={baseStroke}
            strokeDasharray={`${dashLen} ${gapLen}`} strokeLinecap="round" />,
        );
      }
    }

    // Legend items
    const legY = vbY + vbH * 0.96;
    const legX = vbX + vbW * 0.03;
    const legFS = vbW * 0.026;
    const legSp = vbW * 0.17;

    return {
      vbX, vbY, vbW, vbH,
      fillPath,
      wallLines, baseLines, openingSyms,
      legX, legY, legFS, legSp, dashLen, gapLen,
      baseStroke, symStroke,
    };
  }, [vertices, openings]);

  if (!svg) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12,
        color: 'var(--text-3)', fontSize: 13 }}>
        No room scan data
      </div>
    );
  }

  const { vbX, vbY, vbW, vbH, fillPath, wallLines, baseLines, openingSyms,
          legX, legY, legFS, legSp, dashLen, gapLen, baseStroke, symStroke } = svg;

  return (
    <div style={{ width: '100%', height, background: 'var(--surface-1)',
      border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
      >
        {/* Room fill */}
        <path d={fillPath} fill={FILL_CLR} />

        {/* Baseboard (behind walls visually) */}
        {baseLines}

        {/* Walls */}
        {wallLines}

        {/* Openings on top */}
        {openingSyms}

        {/* Legend */}
        <g>
          {/* Baseboard swatch */}
          <line x1={legX} y1={legY} x2={legX + vbW * 0.05} y2={legY}
            stroke={BASE_CLR} strokeWidth={baseStroke * 1.5}
            strokeDasharray={`${dashLen} ${gapLen}`} strokeLinecap="round" />
          <text x={legX + vbW * 0.06} y={legY} dominantBaseline="middle"
            fontSize={legFS} fill="#6B7280" fontFamily="inherit">Baseboard</text>

          {/* Door swatch */}
          <rect x={legX + legSp} y={legY - legFS * 0.5} width={legFS} height={legFS}
            fill="none" stroke={DOOR_CLR} strokeWidth={symStroke * 1.2} />
          <text x={legX + legSp + legFS * 1.3} y={legY} dominantBaseline="middle"
            fontSize={legFS} fill="#6B7280" fontFamily="inherit">Door</text>

          {/* Window swatch */}
          <rect x={legX + legSp * 2.0} y={legY - legFS * 0.5} width={legFS} height={legFS}
            fill="none" stroke={WIN_CLR} strokeWidth={symStroke * 1.2} />
          <text x={legX + legSp * 2.0 + legFS * 1.3} y={legY} dominantBaseline="middle"
            fontSize={legFS} fill="#6B7280" fontFamily="inherit">Window</text>
        </g>
      </svg>
    </div>
  );
}
