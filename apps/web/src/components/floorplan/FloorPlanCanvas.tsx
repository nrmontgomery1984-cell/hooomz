'use client';

/**
 * FloorPlanCanvas — SVG floor plan viewer with pan/zoom and click-to-select.
 *
 * Renders Room polygons from RoomScan data. Pan via mouse drag, zoom via
 * scroll wheel. Clicking a room fires onRoomSelect.
 *
 * All input coordinates are in mm. The canvas auto-fits the scan on mount.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { Room } from '@/lib/types/roomScan.types';

// ─── Color helpers ────────────────────────────────────────────────────────────

const STATUS_FILL: Record<string, string> = {
  pending: 'var(--blue-bg)',    // blue tint
  measured: 'var(--yellow-bg)',   // amber tint
  complete: 'var(--green-bg)',   // green tint
};

const STATUS_STROKE: Record<string, string> = {
  pending: 'var(--blue)',
  measured: 'var(--yellow)',
  complete: 'var(--green)',
};

// ─── Geometry helpers ────────────────────────────────────────────────────────

interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

function getBoundingBox(rooms: Room[]): BBox | null {
  if (rooms.length === 0) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const room of rooms) {
    for (const v of room.polygon.vertices) {
      if (v.x < minX) minX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.x > maxX) maxX = v.x;
      if (v.y > maxY) maxY = v.y;
    }
  }

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function polygonPoints(
  vertices: Array<{ x: number; y: number }>,
  scale: number,
  offsetX: number,
  offsetY: number,
): string {
  return vertices
    .map((v) => `${v.x * scale + offsetX},${v.y * scale + offsetY}`)
    .join(' ');
}

function centroid(vertices: Array<{ x: number; y: number }>): { x: number; y: number } {
  const n = vertices.length;
  if (n === 0) return { x: 0, y: 0 };
  const sum = vertices.reduce((acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }), { x: 0, y: 0 });
  return { x: sum.x / n, y: sum.y / n };
}

function sqmmToSqft(sqmm: number): number {
  return sqmm / 92903;
}

// ─── Scale bar ───────────────────────────────────────────────────────────────

function ScaleBar({ scale, padding }: { scale: number; padding: number }) {
  // Show a 1000mm (1m) scale bar, or 3ft (≈914mm) if that fits better
  const targetMm = 1000;
  const barPixels = targetMm * scale;

  return (
    <g transform={`translate(${padding}, ${padding})`}>
      <line
        x1={0}
        y1={0}
        x2={barPixels}
        y2={0}
        stroke="var(--charcoal)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <line x1={0} y1={-4} x2={0} y2={4} stroke="var(--charcoal)" strokeWidth={2} />
      <line x1={barPixels} y1={-4} x2={barPixels} y2={4} stroke="var(--charcoal)" strokeWidth={2} />
      <text
        x={barPixels / 2}
        y={-8}
        textAnchor="middle"
        fontSize={10}
        fill="var(--muted)"
        fontFamily="inherit"
      >
        1 m
      </text>
    </g>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface FloorPlanCanvasProps {
  rooms: Room[];
  selectedRoomId?: string | null;
  onRoomSelect?: (room: Room) => void;
  /** Height in px. Defaults to 480. */
  height?: number;
}

export function FloorPlanCanvas({
  rooms,
  selectedRoomId,
  onRoomSelect,
  height = 480,
}: FloorPlanCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgSize, setSvgSize] = useState({ width: 600, height });

  // Pan/zoom state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 40, y: 40 });
  const fitScale = useRef(1); // minimum zoom = the auto-fit scale

  // Measure SVG container on mount / resize
  useEffect(() => {
    if (!svgRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSvgSize({
          width: entry.contentRect.width,
          height,
        });
      }
    });
    ro.observe(svgRef.current);
    return () => ro.disconnect();
  }, [height]);

  // Clamp offset so the plan can't be dragged off-screen
  const clampOffset = useCallback(
    (off: { x: number; y: number }, s: number) => {
      const bbox = getBoundingBox(rooms);
      if (!bbox) return off;

      const planLeft = bbox.minX * s + off.x;
      const planRight = bbox.maxX * s + off.x;
      const planTop = bbox.minY * s + off.y;
      const planBottom = bbox.maxY * s + off.y;

      let { x, y } = off;

      // Don't let any edge go past the viewport boundary
      if (planLeft > 0) x = -bbox.minX * s;
      if (planTop > 0) y = -bbox.minY * s;
      if (planRight < svgSize.width) x = svgSize.width - bbox.maxX * s;
      if (planBottom < svgSize.height) y = svgSize.height - bbox.maxY * s;

      // If the plan is smaller than the viewport at this scale, center it
      const planW = (bbox.maxX - bbox.minX) * s;
      const planH = (bbox.maxY - bbox.minY) * s;
      if (planW <= svgSize.width) x = (svgSize.width - planW) / 2 - bbox.minX * s;
      if (planH <= svgSize.height) y = (svgSize.height - planH) / 2 - bbox.minY * s;

      return { x, y };
    },
    [rooms, svgSize.width, svgSize.height],
  );

  // Auto-fit on first load or room change
  useEffect(() => {
    const bbox = getBoundingBox(rooms);
    if (!bbox || bbox.width === 0 || bbox.height === 0) return;

    const padding = 16;
    const availW = svgSize.width - padding * 2;
    const availH = svgSize.height - padding * 2;
    const fit = Math.min(availW / bbox.width, availH / bbox.height);
    fitScale.current = fit; // lock minimum zoom

    // Center the plan
    const planW = bbox.width * fit;
    const planH = bbox.height * fit;
    const offX = padding + (availW - planW) / 2 - bbox.minX * fit;
    const offY = padding + (availH - planH) / 2 - bbox.minY * fit;

    setScale(fit);
    setOffset({ x: offX, y: offY });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms.length, svgSize.width, svgSize.height]);

  // ─── Zoom handler (no panning — zoom towards cursor, clamped) ─────────────

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    setScale((prev) => {
      const next = Math.min(Math.max(prev * factor, fitScale.current), 20);
      const ratio = next / prev;
      const newOff = {
        x: cursorX - ratio * (cursorX - offset.x),
        y: cursorY - ratio * (cursorY - offset.y),
      };
      setOffset(clampOffset(newOff, next));
      return next;
    });
  }, [offset, clampOffset]);

  // ─── Empty state ───────────────────────────────────────────────────────────

  if (rooms.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          color: 'var(--muted)',
          fontSize: 14,
        }}
      >
        No floor plan data. Import a RoomScan file to view.
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      width="100%"
      height={height}
      style={{
        display: 'block',
        background: 'var(--surface)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        cursor: 'default',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onWheel={handleWheel}
    >
      {/* Floor plan rooms */}
      <g>
        {rooms.map((room) => {
          const pts = polygonPoints(room.polygon.vertices, scale, offset.x, offset.y);
          const c = centroid(room.polygon.vertices);
          const cx = c.x * scale + offset.x;
          const cy = c.y * scale + offset.y;
          const isSelected = room.id === selectedRoomId;
          const fill = STATUS_FILL[room.status] ?? STATUS_FILL.pending;
          const stroke = STATUS_STROKE[room.status] ?? STATUS_STROKE.pending;
          const area = sqmmToSqft(room.polygon.area_sqmm);

          return (
            <g
              key={room.id}
              onClick={() => onRoomSelect?.(room)}
              style={{ cursor: 'pointer' }}
            >
              <polygon
                points={pts}
                fill={fill}
                stroke={isSelected ? 'var(--blue)' : stroke}
                strokeWidth={isSelected ? 2.5 : 1.5}
                strokeLinejoin="round"
              />
              {/* Room label — only if polygon is large enough */}
              {area > 20 && (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.max(9, Math.min(13, scale * 80))}
                  fill="var(--charcoal)"
                  fontFamily="inherit"
                  fontWeight={isSelected ? 700 : 400}
                  pointerEvents="none"
                >
                  {room.name}
                </text>
              )}
              {area > 20 && (
                <text
                  x={cx}
                  y={cy + Math.max(10, Math.min(16, scale * 95))}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.max(8, Math.min(11, scale * 65))}
                  fill="var(--muted)"
                  fontFamily="inherit"
                  pointerEvents="none"
                >
                  {area.toFixed(0)} ft²
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Scale bar (bottom-left) */}
      <g transform={`translate(16, ${height - 28})`}>
        <ScaleBar scale={scale} padding={0} />
      </g>
    </svg>
  );
}
