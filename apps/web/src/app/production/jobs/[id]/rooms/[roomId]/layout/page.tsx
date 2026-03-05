'use client';

/**
 * Layout Page — /production/jobs/[id]/rooms/[roomId]/layout
 *
 * Lets the user configure tile dimensions, pattern, and grout,
 * then previews the tile layout on a canvas and saves it.
 *
 * Calculation runs on the main thread (polygon-clipping, synchronous).
 * The optimizer tries 36 config combinations and picks the lowest-waste result.
 */

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Sparkles, Save } from 'lucide-react';
import { LayoutCanvas, LayoutControls, LayoutStats } from '@/components/layout';
import { useRoom } from '@/lib/hooks/useRoomScans';
import { useFlooringLayout, useSaveFlooringLayout, useOptimizeAndSaveLayout } from '@/lib/hooks/useFlooringLayout';
import { calculateLayout } from '@/lib/calculators/flooringLayout.calculator';
import type { TileDimensions, LayoutConfig } from '@/lib/types/flooringLayout.types';
import type { Point2D } from '@/lib/types/roomScan.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_TILE: TileDimensions = { width: 12, length: 12 };

const DEFAULT_CONFIG: LayoutConfig = {
  pattern: 'staggered',
  startCorner: 'top-left',
  rotation: 0,
  staggerOffset: 0.33,
  groutWidth: 0.125,
  wasteFactor: 0.10,
};

// Common tile sizes in inches
const COMMON_SIZES: { label: string; tile: TileDimensions }[] = [
  { label: '12×12', tile: { width: 12, length: 12 } },
  { label: '12×24', tile: { width: 12, length: 24 } },
  { label: '18×18', tile: { width: 18, length: 18 } },
  { label: '24×24', tile: { width: 24, length: 24 } },
  { label: '3×12', tile: { width: 3, length: 12 } },
  { label: '6×36', tile: { width: 6, length: 36 } },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mmToInchPolygon(polygon: Point2D[]): Point2D[] {
  return polygon.map((p) => ({ x: p.x / 25.4, y: p.y / 25.4 }));
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--text-3)',
        marginBottom: 10,
        marginTop: 20,
      }}
    >
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LayoutPage() {
  const params = useParams<{ id: string; roomId: string }>();
  const router = useRouter();
  const jobId = params.id;
  const roomId = params.roomId;
  const projectId = jobId;

  const { data: room, isLoading: roomLoading } = useRoom(roomId);
  const { data: savedLayout } = useFlooringLayout(roomId);

  const saveMutation = useSaveFlooringLayout();
  const optimizeMutation = useOptimizeAndSaveLayout();

  // ── Local state — tile dimensions + config ──────────────────────────────
  const [tile, setTile] = useState<TileDimensions>(
    savedLayout?.tileDimensions ?? DEFAULT_TILE,
  );
  const [config, setConfig] = useState<LayoutConfig>(
    savedLayout?.config ?? DEFAULT_CONFIG,
  );

  // Sync from saved layout when it first loads (only once)
  const [synced, setSynced] = useState(false);
  if (savedLayout && !synced) {
    setTile(savedLayout.tileDimensions);
    setConfig(savedLayout.config);
    setSynced(true);
  }

  // ── Live calculation (synchronous, runs on every state change) ──────────
  const layoutResult = useMemo(() => {
    if (!room || room.polygon.vertices.length < 3) return null;
    try {
      const polygon = mmToInchPolygon(room.polygon.vertices);
      return calculateLayout(polygon, tile, config);
    } catch {
      return null;
    }
  }, [room, tile, config]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    saveMutation.mutate({ projectId, jobId, roomId, tile, config });
  }, [saveMutation, projectId, jobId, roomId, tile, config]);

  const handleOptimize = useCallback(() => {
    optimizeMutation.mutate(
      { projectId, jobId, roomId, tile, baseConfig: { groutWidth: config.groutWidth, wasteFactor: config.wasteFactor } },
      {
        onSuccess: ({ layout }) => {
          setConfig(layout.config);
          setSynced(false); // Allow re-sync if needed
        },
      },
    );
  }, [optimizeMutation, projectId, jobId, roomId, tile, config]);

  const handleTileChange = useCallback(
    (field: keyof TileDimensions, raw: string) => {
      const val = parseFloat(raw);
      if (!isNaN(val) && val > 0) {
        setTile((prev) => ({ ...prev, [field]: val }));
      }
    },
    [],
  );

  // ── Loading / not found ──────────────────────────────────────────────────
  if (roomLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          color: 'var(--text-3)',
          fontSize: 14,
        }}
      >
        Loading room…
      </div>
    );
  }

  if (!room) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          color: 'var(--text-3)',
          fontSize: 14,
        }}
      >
        Room not found.
        <button
          onClick={() => router.back()}
          style={{ marginLeft: 8, background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: 14 }}
        >
          Go back
        </button>
      </div>
    );
  }

  const isBusy = saveMutation.isPending || optimizeMutation.isPending;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--surface-1)',
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-3)',
            display: 'flex',
            alignItems: 'center',
            padding: 4,
            borderRadius: 6,
          }}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-3)',
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            {room.name} / Layout
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Tile Layout</h1>
        </div>

        {/* Optimize */}
        <button
          onClick={handleOptimize}
          disabled={isBusy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: 'var(--surface-1)',
            color: isBusy ? 'var(--text-3)' : '#1E3A8A',
            border: '1px solid #1E3A8A',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: isBusy ? 'not-allowed' : 'pointer',
            opacity: isBusy ? 0.6 : 1,
            flexShrink: 0,
          }}
        >
          <Sparkles size={14} />
          {optimizeMutation.isPending ? 'Optimizing…' : 'Optimize'}
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isBusy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: '#1E3A8A',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: isBusy ? 'not-allowed' : 'pointer',
            opacity: isBusy ? 0.6 : 1,
            flexShrink: 0,
          }}
        >
          <Save size={14} />
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div style={{ padding: '20px 20px 60px' }}>
        {/* Canvas preview */}
        <LayoutCanvas
          roomPolygon={room.polygon.vertices}
          layoutResult={layoutResult}
          height={280}
        />

        {/* Stats */}
        <SectionHeader>Stats</SectionHeader>
        <LayoutStats
          result={layoutResult}
          optimizationScore={savedLayout?.optimizationScore}
          optimizedAt={savedLayout?.optimizedAt}
        />

        {/* Tile size */}
        <SectionHeader>Tile Size (inches)</SectionHeader>

        {/* Quick-pick common sizes */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {COMMON_SIZES.map((s) => {
            const active = tile.width === s.tile.width && tile.length === s.tile.length;
            return (
              <button
                key={s.label}
                onClick={() => setTile(s.tile)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: `2px solid ${active ? '#1E3A8A' : 'var(--border)'}`,
                  background: active ? 'rgba(30,58,138,0.1)' : 'var(--surface-1)',
                  color: active ? '#1E3A8A' : 'var(--text-3)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Custom width/length inputs */}
        <div style={{ display: 'flex', gap: 12 }}>
          {(['width', 'length'] as const).map((field) => (
            <div key={field} style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                  marginBottom: 4,
                }}
              >
                {field === 'width' ? 'Width' : 'Length'}
              </div>
              <input
                type="number"
                min={1}
                max={96}
                step={0.5}
                value={tile[field]}
                onChange={(e) => handleTileChange(field, e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text)',
                  fontSize: 14,
                  fontWeight: 600,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>
          ))}
        </div>

        {/* Layout controls */}
        <SectionHeader>Layout</SectionHeader>
        <LayoutControls config={config} onChange={setConfig} />

        {/* Waste factor */}
        <SectionHeader>Waste Factor</SectionHeader>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { value: 0.05, label: '5%' },
            { value: 0.10, label: '10%' },
            { value: 0.15, label: '15%' },
            { value: 0.20, label: '20%' },
          ].map((w) => (
            <button
              key={w.value}
              onClick={() => setConfig((c) => ({ ...c, wasteFactor: w.value }))}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: `2px solid ${config.wasteFactor === w.value ? '#1E3A8A' : 'var(--border)'}`,
                background:
                  config.wasteFactor === w.value ? 'rgba(30,58,138,0.1)' : 'var(--surface-1)',
                color: config.wasteFactor === w.value ? '#1E3A8A' : 'var(--text-3)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Save feedback */}
        {saveMutation.isSuccess && !saveMutation.isPending && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 14px',
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.4)',
              borderRadius: 8,
              fontSize: 13,
              color: '#10B981',
              fontWeight: 600,
            }}
          >
            Layout saved
          </div>
        )}
        {optimizeMutation.isSuccess && !optimizeMutation.isPending && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 14px',
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.4)',
              borderRadius: 8,
              fontSize: 13,
              color: '#10B981',
              fontWeight: 600,
            }}
          >
            Optimized — {optimizeMutation.data?.optimizationResult.iterations} configs tested
          </div>
        )}
      </div>
    </div>
  );
}
