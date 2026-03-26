'use client';

/**
 * LayoutStats — displays tile count, waste, coverage, stock needed,
 * and perimeter cut piece dimensions.
 */

import type { LayoutResult, PlacedTile } from '@/lib/types/flooringLayout.types';

interface Props {
  result: LayoutResult | null;
  optimizationScore?: number | null;
  optimizedAt?: string | null;
}

// ─── Cut size computation ─────────────────────────────────────────────────────

interface CutSize {
  w: number;   // inches, rounded to 1/8"
  h: number;   // inches, rounded to 1/8"
  count: number;
}

/** Round to nearest 1/8" (0.125") */
function roundEighth(n: number): number {
  return Math.round(n * 8) / 8;
}

/** Format inches as fractional string, e.g. 4.5 → "4½"" */
function fmtIn(n: number): string {
  const whole = Math.floor(n);
  const frac = n - whole;
  const fracStr =
    frac === 0     ? ''     :
    frac === 0.125 ? '⅛'  :
    frac === 0.25  ? '¼'  :
    frac === 0.375 ? '⅜'  :
    frac === 0.5   ? '½'  :
    frac === 0.625 ? '⅝'  :
    frac === 0.75  ? '¾'  :
    frac === 0.875 ? '⅞'  :
    `.${Math.round(frac * 8) / 8}`;
  return whole > 0 ? `${whole}${fracStr}"` : `${fracStr}"`;
}

function computeCutSizes(tiles: PlacedTile[]): CutSize[] {
  const cuts = tiles.filter((t) => t.isCut);
  if (cuts.length === 0) return [];

  const sizeMap = new Map<string, CutSize>();
  for (const tile of cuts) {
    const xs = tile.vertices.map((v) => v.x);
    const ys = tile.vertices.map((v) => v.y);
    const w = roundEighth(Math.max(...xs) - Math.min(...xs));
    const h = roundEighth(Math.max(...ys) - Math.min(...ys));
    const key = `${w}×${h}`;
    const existing = sizeMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      sizeMap.set(key, { w, h, count: 1 });
    }
  }

  // Sort by count descending, then by size
  return Array.from(sizeMap.values()).sort((a, b) => b.count - a.count);
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `1px solid ${accent ? 'var(--blue)' : 'var(--border)'}`,
        borderRadius: 10,
        padding: '10px 14px',
        flex: '1 1 80px',
        minWidth: 80,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: accent ? 'var(--blue)' : 'var(--charcoal)' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{sub}</div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LayoutStats({ result, optimizationScore, optimizedAt }: Props) {
  if (!result) {
    return (
      <div
        style={{
          padding: '12px 16px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          fontSize: 13,
          color: 'var(--muted)',
          textAlign: 'center',
        }}
      >
        Adjust tile size and config to see stats
      </div>
    );
  }

  const wastePct = (result.wastePercentage * 100).toFixed(1);
  const wasteColor =
    result.wastePercentage < 0.08
      ? 'var(--green)'
      : result.wastePercentage < 0.15
      ? 'var(--yellow)'
      : 'var(--red)';

  const cutSizes = computeCutSizes(result.tiles);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <StatCard label="Stock Tiles" value={String(result.stockTilesNeeded)} accent />
        <StatCard label="Total Tiles" value={String(result.totalTileCount)} />
        <StatCard
          label="Full"
          value={String(result.fullTileCount)}
          sub={`${result.cutTileCount} cut`}
        />
        <StatCard label="Coverage" value={`${result.coverageArea.toFixed(1)} ft²`} />
      </div>

      {/* Waste bar */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '10px 14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Waste
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: wasteColor }}>{wastePct}%</span>
        </div>
        <div
          style={{
            height: 6,
            background: 'var(--border)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(result.wastePercentage * 100, 100)}%`,
              background: wasteColor,
              borderRadius: 3,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        {optimizedAt && optimizationScore != null && (
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>
            Optimized · best config ({(optimizationScore * 100).toFixed(1)}% waste)
          </div>
        )}
      </div>

      {/* Cut piece dimensions */}
      {cutSizes.length > 0 && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 14px',
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 8,
            }}
          >
            Perimeter Cut Sizes
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px' }}>
            {cutSizes.slice(0, 8).map((s) => (
              <div
                key={`${s.w}×${s.h}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 8px',
                  background: 'var(--yellow-bg)',
                  border: '1px solid rgba(245,158,11,0.35)',
                  borderRadius: 6,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--charcoal)' }}>
                  {fmtIn(s.w)} × {fmtIn(s.h)}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--muted)',
                    background: 'var(--border)',
                    borderRadius: 4,
                    padding: '1px 5px',
                  }}
                >
                  ×{s.count}
                </span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>
            Pieces ≥50% of tile paired from one tile · pieces &lt;50% need a new tile each
          </div>
        </div>
      )}
    </div>
  );
}
