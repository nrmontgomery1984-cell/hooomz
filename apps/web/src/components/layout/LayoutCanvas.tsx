'use client';

/**
 * LayoutCanvas — renders a flooring tile layout preview on an HTML5 canvas.
 *
 * Accepts the room polygon in mm (raw from DB) and a LayoutResult
 * (tile vertices already in room-coordinate inches from the calculator).
 * Scales everything to fill the canvas container.
 */

import { useRef, useEffect } from 'react';
import type { Point2D } from '@/lib/types/roomScan.types';
import type { LayoutResult } from '@/lib/types/flooringLayout.types';

interface Props {
  /** Room polygon vertices in mm (raw from DB). */
  roomPolygon: Point2D[];
  /** Layout result from calculateLayout(); null while calculating. */
  layoutResult: LayoutResult | null;
  /** Canvas height in px (width is 100% of container). */
  height?: number;
}

const PADDING = 16; // px

function mmToIn(mm: number): number {
  return mm / 25.4;
}

export function LayoutCanvas({ roomPolygon, layoutResult, height = 320 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas pixel size to match container
    const dpr = window.devicePixelRatio || 1;
    const cssW = container.clientWidth;
    const cssH = height;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, cssW, cssH);

    if (roomPolygon.length < 3) return;

    // Convert room polygon mm → inches
    const roomInches: Point2D[] = roomPolygon.map((p) => ({
      x: mmToIn(p.x),
      y: mmToIn(p.y),
    }));

    // Bounding box of room (inches)
    const xs = roomInches.map((p) => p.x);
    const ys = roomInches.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const roomW = maxX - minX;
    const roomH = maxY - minY;

    if (roomW <= 0 || roomH <= 0) return;

    // Scale so room fits inside canvas with padding
    const drawW = cssW - PADDING * 2;
    const drawH = cssH - PADDING * 2;
    const scale = Math.min(drawW / roomW, drawH / roomH);

    // Offset to center the room
    const offsetX = PADDING + (drawW - roomW * scale) / 2;
    const offsetY = PADDING + (drawH - roomH * scale) / 2;

    function toCanvas(p: Point2D): [number, number] {
      return [(p.x - minX) * scale + offsetX, (p.y - minY) * scale + offsetY];
    }

    // ── Draw tiles ──────────────────────────────────────────────────────────
    if (layoutResult && layoutResult.tiles.length > 0) {
      for (const tile of layoutResult.tiles) {
        if (tile.vertices.length < 3) continue;

        ctx.beginPath();
        const [fx, fy] = toCanvas(tile.vertices[0]);
        ctx.moveTo(fx, fy);
        for (let i = 1; i < tile.vertices.length; i++) {
          const [vx, vy] = toCanvas(tile.vertices[i]);
          ctx.lineTo(vx, vy);
        }
        ctx.closePath();

        if (tile.isCut) {
          // Cut tile: amber fill
          ctx.fillStyle = 'rgba(245,158,11,0.35)';
          ctx.strokeStyle = 'rgba(245,158,11,0.7)';
        } else {
          // Full tile: blue-green fill
          ctx.fillStyle = 'rgba(20,184,166,0.25)';
          ctx.strokeStyle = 'rgba(20,184,166,0.6)';
        }
        ctx.fill();
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // ── Draw room outline ────────────────────────────────────────────────────
    ctx.beginPath();
    const [rx0, ry0] = toCanvas(roomInches[0]);
    ctx.moveTo(rx0, ry0);
    for (let i = 1; i < roomInches.length; i++) {
      const [rx, ry] = toCanvas(roomInches[i]);
      ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.strokeStyle = '#1E3A8A';
    ctx.lineWidth = 2;
    ctx.stroke();

    // If no tiles yet, fill room with a light placeholder
    if (!layoutResult || layoutResult.tiles.length === 0) {
      ctx.fillStyle = 'rgba(30,58,138,0.06)';
      ctx.fill();
    }
  }, [roomPolygon, layoutResult, height]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height,
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
