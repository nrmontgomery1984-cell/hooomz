'use client';

/**
 * Trim Cut Calculator — /production/jobs/[id]/rooms/[roomId]/trim
 *
 * Lets the user configure casing width, reveal, and room openings,
 * then produces a live cut list with piece dimensions and linear-foot totals.
 *
 * Pre-populates openings from the room scan. User can add / edit / remove.
 */

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, Save, Plus, Trash2, DoorOpen, AppWindowMac } from 'lucide-react';
import { useRoom } from '@/lib/hooks/useRoomScans';
import { useTrimCalculation, useSaveTrimCalculation, useDefaultMillworkConfig } from '@/lib/hooks/useTrimCalculation';
import { calculateTrimCutList } from '@/lib/calculators/trim.calculator';
import type { TrimOpening, OpeningKind, CutPieceCategory } from '@/lib/types/trim.types';
import { mmToFractionalInches } from '@/lib/utils/units';
import { TrimRoomCanvas } from '@/components/trim/TrimRoomCanvas';
import { useRevealGauges } from '@/lib/hooks/useRevealGauges';

const DownloadTrimCutListPDF = dynamic(
  () => import('@/components/trim/TrimCutListPDF').then((mod) => mod.DownloadTrimCutListPDF),
  { ssr: false },
);

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<CutPieceCategory, string> = {
  jamb:      'Jambs',
  stop:      'Doorstop',
  sill:      'Sill',
  casing:    'Casing',
  apron:     'Apron',
  baseboard: 'Baseboard',
};

const CATEGORY_ORDER: CutPieceCategory[] = ['jamb', 'stop', 'sill', 'casing', 'apron', 'baseboard'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inToMm(inch: number): number { return inch * 25.4; }
function mmToIn(mm: number): number   { return mm / 25.4; }
function mmToLf(mm: number): number   { return mm / 304.8; }

/** Format mm as feet-inches string, e.g. 2083 → 6'10⅛" */
function fmtPiece(mm: number): string {
  return mmToFractionalInches(mm);
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: 'var(--muted)',
      marginBottom: 10, marginTop: 20,
    }}>
      {children}
    </div>
  );
}

function InlineInput({
  label, value, onChange, min = 0, step = 0.125, unit = '"',
}: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; step?: number; unit?: string;
}) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v) && v >= min) onChange(v);
          }}
          style={{
            width: '100%', padding: '8px 26px 8px 10px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--charcoal)', fontSize: 14,
            fontWeight: 600, boxSizing: 'border-box', outline: 'none',
          }}
        />
        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--muted)', pointerEvents: 'none' }}>
          {unit}
        </span>
      </div>
    </div>
  );
}

function OpeningCard({
  opening,
  onChange,
  onRemove,
}: {
  opening: TrimOpening;
  onChange: (o: TrimOpening) => void;
  onRemove: () => void;
}) {
  const KindIcon = opening.kind === 'door' ? DoorOpen : AppWindowMac;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '12px 14px', marginBottom: 8,
    }}>
      {/* Kind toggle + label + remove */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <KindIcon size={15} style={{ color: opening.kind === 'door' ? 'var(--blue)' : 'var(--accent)', flexShrink: 0 }} />
        <input
          type="text"
          value={opening.label}
          onChange={(e) => onChange({ ...opening, label: e.target.value })}
          placeholder="Label (e.g. Front Door)"
          style={{
            flex: 1, border: 'none', background: 'transparent',
            color: 'var(--charcoal)', fontSize: 13, fontWeight: 600, outline: 'none',
          }}
        />
        {/* Kind toggle */}
        <button
          onClick={() => onChange({
            ...opening,
            kind: opening.kind === 'door' ? 'window' : 'door',
            has_stool: opening.kind === 'door',   // default stool on for windows
            has_apron: opening.kind === 'door',
          })}
          style={{
            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--muted)', cursor: 'pointer',
          }}
        >
          {opening.kind === 'door' ? '↔ Window' : '↔ Door'}
        </button>
        <button
          onClick={onRemove}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 2, display: 'flex' }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Dimensions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <InlineInput
          label="Width"
          value={Math.round(mmToIn(opening.width_mm) * 8) / 8}
          onChange={(v) => onChange({ ...opening, width_mm: inToMm(v) })}
        />
        <InlineInput
          label="Height"
          value={Math.round(mmToIn(opening.height_mm) * 8) / 8}
          onChange={(v) => onChange({ ...opening, height_mm: inToMm(v) })}
        />
      </div>

      {/* Window-only toggles */}
      {opening.kind === 'window' && (
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          {(['has_stool', 'has_apron'] as const).map((key) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--mid)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={opening[key]}
                onChange={(e) => onChange({ ...opening, [key]: e.target.checked })}
                style={{ accentColor: 'var(--blue)', width: 14, height: 14 }}
              />
              {key === 'has_stool' ? 'Sill' : 'Apron'}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrimPage() {
  const params  = useParams<{ id: string; roomId: string }>();
  const router  = useRouter();
  const jobId   = params.id;
  const roomId  = params.roomId;

  const { data: room, isLoading: roomLoading } = useRoom(roomId);
  const { data: saved }                        = useTrimCalculation(roomId);
  const { data: defaultConfig }                = useDefaultMillworkConfig();
  const saveMutation                           = useSaveTrimCalculation();
  const { gauges, activeGauge, setActiveGauge } = useRevealGauges();

  // ── Config state ───────────────────────────────────────────────────────────
  const [casingIn, setCasingIn]   = useState(saved?.casing_width_mm ? mmToIn(saved.casing_width_mm) : 2.5);
  const [revealIn, setRevealIn]   = useState(saved?.reveal_mm       ? mmToIn(saved.reveal_mm)       : activeGauge.value);
  const [joint, setJoint]         = useState<'miter' | 'butt'>(
    saved?.config?.casing_joint ?? defaultConfig?.casing_joint ?? 'miter',
  );
  const [wastePct, setWastePct]   = useState(saved?.config?.trim_waste_factor ?? defaultConfig?.trim_waste_factor ?? 0.10);
  const [stoolNoseIn, setStoolNoseIn] = useState(
    saved?.config?.stool_nose_mm  ? mmToIn(saved.config.stool_nose_mm)  :
    defaultConfig?.stool_nose_mm  ? mmToIn(defaultConfig.stool_nose_mm) : 1,
  );
  const [synced, setSynced] = useState(false);

  // Sync from saved record on first load
  if (saved && !synced) {
    setCasingIn(mmToIn(saved.casing_width_mm));
    setRevealIn(mmToIn(saved.reveal_mm));
    setJoint(saved.config.casing_joint);
    setWastePct(saved.config.trim_waste_factor);
    setStoolNoseIn(mmToIn(saved.config.stool_nose_mm));
    setSynced(true);
  }

  // ── Openings state ─────────────────────────────────────────────────────────
  // Pre-populate from room scan openings on first render, then user-editable
  const [openings, setOpenings] = useState<TrimOpening[]>(() => {
    if (saved?.openings?.length) return saved.openings;
    return [];   // will be set after room loads if still empty
  });
  const [openingsSynced, setOpeningsSynced] = useState(false);

  if (room && !openingsSynced && openings.length === 0 && room.openings.length > 0) {
    setOpenings(
      room.openings
        .filter((o) => o.type === 'door' || o.type === 'window')
        .map((o, i) => ({
          id: `scan-${i}`,
          kind: (o.type as OpeningKind),
          label: o.label ?? (o.type === 'door' ? `Door ${i + 1}` : `Window ${i + 1}`),
          width_mm:  o.width_mm  ?? inToMm(36),
          height_mm: o.height_mm ?? inToMm(o.type === 'door' ? 80 : 48),
          has_stool: o.type === 'window',
          has_apron: o.type === 'window' && (defaultConfig?.include_apron ?? true),
        })),
    );
    setOpeningsSynced(true);
  }

  const perimeter_mm = room?.polygon?.perimeter_mm ?? 0;

  // ── Live calculation ───────────────────────────────────────────────────────
  const result = useMemo(() => {
    if (!perimeter_mm && openings.length === 0) return null;
    return calculateTrimCutList({
      roomId,
      projectId: jobId,
      jobId,
      casing_width_mm: inToMm(casingIn),
      reveal_mm:       inToMm(revealIn),
      openings,
      perimeter_override_mm: perimeter_mm,
      config: {
        casing_joint:      joint,
        stool_nose_mm:     inToMm(stoolNoseIn),
        trim_waste_factor: wastePct,
      },
    });
  }, [casingIn, revealIn, joint, stoolNoseIn, wastePct, openings, perimeter_mm, roomId, jobId]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const addOpening = useCallback((kind: OpeningKind) => {
    setOpenings((prev) => [
      ...prev,
      {
        id: uid(),
        kind,
        label: kind === 'door' ? `Door ${prev.filter(o => o.kind === 'door').length + 1}` : `Window ${prev.filter(o => o.kind === 'window').length + 1}`,
        width_mm:  inToMm(kind === 'door' ? 36 : 36),
        height_mm: inToMm(kind === 'door' ? 80 : 48),
        has_stool: kind === 'window',
        has_apron: kind === 'window',
      },
    ]);
  }, []);

  const handleSave = useCallback(() => {
    if (!result) return;
    saveMutation.mutate({
      roomId,
      projectId: jobId,
      jobId,
      casing_width_mm: inToMm(casingIn),
      reveal_mm:       inToMm(revealIn),
      openings,
      perimeter_mm,
      config: {
        casing_joint:      joint,
        stool_nose_mm:     inToMm(stoolNoseIn),
        trim_waste_factor: wastePct,
      },
    });
  }, [saveMutation, roomId, jobId, casingIn, revealIn, openings, perimeter_mm, joint, stoolNoseIn, wastePct, result]);

  // ── Loading states ─────────────────────────────────────────────────────────
  if (roomLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)', fontSize: 14 }}>
        Loading room…
      </div>
    );
  }
  if (!room) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)', fontSize: 14 }}>
        Room not found.
        <button onClick={() => router.back()} style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: 14 }}>
          Go back
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--charcoal)', paddingBottom: 64 }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>
            {room.name} / Trim
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Trim Cut List</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending || !result}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', background: 'var(--blue)', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: saveMutation.isPending || !result ? 'not-allowed' : 'pointer',
            opacity: saveMutation.isPending || !result ? 0.6 : 1, flexShrink: 0,
          }}
        >
          <Save size={14} />
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Room canvas */}
      {room?.polygon?.vertices && room.polygon.vertices.length > 2 && (
        <div style={{ padding: '12px 20px 0', background: 'var(--bg)' }}>
          <TrimRoomCanvas
            vertices={room.polygon.vertices}
            openings={room.openings ?? []}
            height={220}
          />
        </div>
      )}

      <div style={{ padding: '0 20px' }}>

        {/* Casing Settings */}
        <SectionHeader>Casing Settings</SectionHeader>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <InlineInput label="Casing Width" value={casingIn} onChange={setCasingIn} step={0.125} min={1} />
          <InlineInput label="Stool Nose" value={stoolNoseIn} onChange={setStoolNoseIn} step={0.125} min={0} />
        </div>

        {/* Reveal gauge selector */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
            Reveal
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            {gauges.map((g) => {
              const isActive = activeGauge.id === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => {
                    setActiveGauge(g);
                    setRevealIn(g.value);
                  }}
                  style={{
                    flex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    padding: '7px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `2px solid ${isActive ? g.color : 'var(--border)'}`,
                    background: isActive ? `${g.color}26` : 'var(--surface)',
                    color: isActive ? g.color : 'var(--muted)',
                  }}
                >
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: g.color, flexShrink: 0,
                  }} />
                  {g.label}
                </button>
              );
            })}
          </div>
          <div style={{
            padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, fontSize: 11, color: 'var(--muted)',
          }}>
            Reveal: <span style={{ fontWeight: 700, color: 'var(--charcoal)' }}>{inToMm(revealIn).toFixed(1)} mm</span>
            <span style={{ marginLeft: 6 }}>({revealIn}&quot;)</span>
          </div>
        </div>

        {/* Joint type */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {(['miter', 'butt'] as const).map((j) => (
            <button
              key={j}
              onClick={() => setJoint(j)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `2px solid ${joint === j ? 'var(--blue)' : 'var(--border)'}`,
                background: joint === j ? 'var(--blue-bg)' : 'var(--surface)',
                color: joint === j ? 'var(--blue)' : 'var(--muted)',
              }}
            >
              {j === 'miter' ? 'Miter Joint' : 'Butt Joint'}
            </button>
          ))}
        </div>

        {/* Waste factor */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          {[0.05, 0.10, 0.15, 0.20].map((w) => (
            <button
              key={w}
              onClick={() => setWastePct(w)}
              style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: `2px solid ${wastePct === w ? 'var(--blue)' : 'var(--border)'}`,
                background: wastePct === w ? 'var(--blue-bg)' : 'var(--surface)',
                color: wastePct === w ? 'var(--blue)' : 'var(--muted)',
              }}
            >
              {(w * 100).toFixed(0)}% waste
            </button>
          ))}
        </div>

        {/* Room perimeter */}
        {perimeter_mm > 0 && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Room perimeter (from scan): </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--charcoal)' }}>{mmToLf(perimeter_mm).toFixed(1)} lf</span>
          </div>
        )}

        {/* Openings */}
        <SectionHeader>Openings ({openings.length})</SectionHeader>
        {openings.map((o) => (
          <OpeningCard
            key={o.id}
            opening={o}
            onChange={(updated) => setOpenings((prev) => prev.map((x) => x.id === updated.id ? updated : x))}
            onRemove={() => setOpenings((prev) => prev.filter((x) => x.id !== o.id))}
          />
        ))}

        {/* Add opening buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <button
            onClick={() => addOpening('door')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 0', borderRadius: 8, border: '1.5px dashed var(--border)',
              background: 'transparent', color: 'var(--muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={13} /> Add Door
          </button>
          <button
            onClick={() => addOpening('window')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 0', borderRadius: 8, border: '1.5px dashed var(--border)',
              background: 'transparent', color: 'var(--muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={13} /> Add Window
          </button>
        </div>

        {/* Cut List */}
        {result && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Cut List
              </div>
              <DownloadTrimCutListPDF
                room={room}
                result={result}
                activeGauge={activeGauge}
                casingIn={casingIn}
                revealIn={revealIn}
                joint={joint}
                wastePct={wastePct}
                jobId={jobId}
              />
            </div>

            {/* Summary cards */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {[
                { label: 'Casing', value: `${result.casing_lf.toFixed(1)} lf` },
                { label: 'Baseboard', value: `${result.baseboard_lf.toFixed(1)} lf` },
                { label: 'Stock Needed', value: `${result.stock_lf.toFixed(1)} lf`, accent: true },
              ].map(({ label, value, accent }) => (
                <div
                  key={label}
                  style={{
                    flex: '1 1 80px', padding: '10px 14px',
                    background: 'var(--surface)', border: `1px solid ${accent ? 'var(--blue)' : 'var(--border)'}`,
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 3 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: accent ? 'var(--blue)' : 'var(--charcoal)' }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Piece-by-piece table — grouped by opening, then by category */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              {(() => {
                // Build opening groups preserving insertion order
                const groups = new Map<string, typeof result.pieces>();
                for (const p of result.pieces) {
                  const g = groups.get(p.opening_label) ?? [];
                  g.push(p);
                  groups.set(p.opening_label, g);
                }
                return Array.from(groups.entries()).map(([groupLabel, pieces], gi) => {
                  // Sub-group by category in canonical order
                  const byCategory = new Map<CutPieceCategory, typeof pieces>();
                  for (const p of pieces) {
                    const c = byCategory.get(p.category) ?? [];
                    c.push(p);
                    byCategory.set(p.category, c);
                  }
                  const cats = CATEGORY_ORDER.filter((c) => byCategory.has(c));

                  return (
                    <div key={groupLabel}>
                      {/* Opening header */}
                      <div style={{
                        padding: '7px 14px',
                        background: 'var(--bg)',
                        borderTop: gi > 0 ? '1px solid var(--border)' : 'none',
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: 'var(--mid)',
                      }}>
                        {groupLabel}
                      </div>

                      {cats.map((cat) => (
                        <div key={cat}>
                          {/* Category sub-header */}
                          <div style={{
                            padding: '4px 14px',
                            borderTop: '1px solid var(--border)',
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                            textTransform: 'uppercase', color: 'var(--muted)',
                            background: 'transparent',
                          }}>
                            {CATEGORY_LABELS[cat]}
                          </div>
                          {byCategory.get(cat)!.map((piece, pi) => (
                            <div
                              key={`${groupLabel}-${cat}-${pi}`}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 14px 8px 20px', borderTop: '1px solid var(--border)',
                                borderLeft: `3px solid ${activeGauge.color}`,
                              }}
                            >
                              <div style={{ minWidth: 0 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--charcoal)' }}>
                                  {piece.qty > 1 ? `${piece.qty}× ` : ''}{piece.label}
                                </span>
                                {piece.note && (
                                  <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 6 }}>
                                    — {piece.note}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeGauge.color }} />
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', fontVariantNumeric: 'tabular-nums' }}>
                                  {cat === 'baseboard'
                                    ? `${mmToLf(piece.length_mm).toFixed(1)} lf`
                                    : fmtPiece(piece.length_mm)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                });
              })()}
            </div>
          </>
        )}

        {/* Save feedback */}
        {saveMutation.isSuccess && !saveMutation.isPending && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--green-bg)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 8, fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
            Cut list saved
          </div>
        )}
      </div>
    </div>
  );
}
