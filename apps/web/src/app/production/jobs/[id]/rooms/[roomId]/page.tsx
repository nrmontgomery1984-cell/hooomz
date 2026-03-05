'use client';

/**
 * Room Detail — /production/jobs/[id]/rooms/[roomId]
 *
 * Shows polygon dimensions, openings, and allows updating status, notes,
 * and casing sides for this room.
 */

import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { ArrowLeft, DoorOpen, AppWindowMac, Square, StickyNote, Layers, LayoutGrid, Ruler } from 'lucide-react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { FloorPlanCanvas } from '@/components/floorplan';
import { useRoom, useUpdateRoom } from '@/lib/hooks/useRoomScans';
import { mmToFractionalInches } from '@/lib/utils/units';
import type { Room, RoomStatus, OpeningType } from '@/lib/types/roomScan.types';

function sqmmToSqft(sqmm: number): number {
  return sqmm / 92903;
}

function mmToLf(mm: number): string {
  return (mm / 304.8).toFixed(1);
}

const STATUS_OPTIONS: { value: RoomStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: '#3B82F6' },
  { value: 'measured', label: 'Measured', color: '#F59E0B' },
  { value: 'complete', label: 'Complete', color: '#10B981' },
];

const OPENING_ICONS: Record<OpeningType, LucideIcon> = {
  door: DoorOpen,
  window: AppWindowMac,
  opening: Square,
  unknown: Square,
};

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

function RoomDetailContent({ room, jobId }: { room: Room; jobId: string }) {
  const router = useRouter();
  const updateRoom = useUpdateRoom();

  const [notes, setNotes] = useState(room.notes ?? '');
  const [status, setStatus] = useState<RoomStatus>(room.status);
  const [casingSides, setCasingSides] = useState<1 | 2 | 3 | null>(room.casingSides);
  const [isDirty, setIsDirty] = useState(false);

  const handleStatusChange = useCallback((s: RoomStatus) => {
    setStatus(s);
    setIsDirty(true);
  }, []);

  const handleCasingChange = useCallback((v: 1 | 2 | 3 | null) => {
    setCasingSides(v);
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    updateRoom.mutate(
      {
        id: room.id,
        jobId,
        scanId: room.scanId,
        changes: { status, notes: notes.trim() || null, casingSides },
      },
      {
        onSuccess: () => setIsDirty(false),
      },
    );
  }, [updateRoom, room.id, room.scanId, jobId, status, notes, casingSides]);

  const area = sqmmToSqft(room.polygon.area_sqmm);
  const perimeterLf = mmToLf(room.polygon.perimeter_mm);
  const doors = room.openings.filter((o) => o.type === 'door');
  const windows = room.openings.filter((o) => o.type === 'window');

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
            Rooms / Detail
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{room.name}</h1>
        </div>

        <Link
          href={`/production/jobs/${jobId}/rooms/${room.id}/layout`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: 'var(--surface-1)',
            color: '#1E3A8A',
            border: '1px solid #1E3A8A',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <LayoutGrid size={14} />
          Layout
        </Link>

        <Link
          href={`/production/jobs/${jobId}/rooms/${room.id}/trim`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: 'var(--surface-1)',
            color: '#1E3A8A',
            border: '1px solid #1E3A8A',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <Ruler size={14} />
          Trim
        </Link>

        <Link
          href={`/production/jobs/${jobId}/rooms/${room.id}/materials`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: '#1E3A8A',
            color: '#fff',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <Layers size={14} />
          Materials
        </Link>

        {isDirty && (
          <button
            onClick={handleSave}
            disabled={updateRoom.isPending}
            style={{
              padding: '8px 16px',
              background: 'var(--surface-1)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: updateRoom.isPending ? 'not-allowed' : 'pointer',
              opacity: updateRoom.isPending ? 0.7 : 1,
            }}
          >
            {updateRoom.isPending ? 'Saving…' : 'Save'}
          </button>
        )}
      </div>

      <div style={{ padding: '20px 20px 40px' }}>
        {/* Floor plan: single-room highlight */}
        <div style={{ marginBottom: 20 }}>
          <FloorPlanCanvas rooms={[room]} selectedRoomId={room.id} height={240} />
        </div>

        {/* Key stats */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
          {[
            { label: 'Area', value: `${area.toFixed(1)} ft²` },
            { label: 'Perimeter', value: `${perimeterLf} lf` },
            { label: 'Ceiling', value: mmToFractionalInches(room.ceilingHeight_mm) },
            { label: 'Doors', value: String(doors.length) },
            { label: 'Windows', value: String(windows.length) },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '10px 14px',
                minWidth: 70,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: 'var(--text-3)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 3,
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Status */}
        <SectionHeader>Status</SectionHeader>
        <div style={{ display: 'flex', gap: 8 }}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: `2px solid ${status === opt.value ? opt.color : 'var(--border)'}`,
                background: status === opt.value ? `${opt.color}18` : 'var(--surface-1)',
                color: status === opt.value ? opt.color : 'var(--text-3)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Casing sides */}
        <SectionHeader>Casing Sides</SectionHeader>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>
          How many sides of the opening are being cased?
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {([1, 2, 3] as const).map((n) => (
            <button
              key={n}
              onClick={() => handleCasingChange(casingSides === n ? null : n)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                border: `2px solid ${casingSides === n ? '#1E3A8A' : 'var(--border)'}`,
                background: casingSides === n ? 'rgba(30,58,138,0.1)' : 'var(--surface-1)',
                color: casingSides === n ? '#1E3A8A' : 'var(--text-3)',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Openings */}
        {room.openings.length > 0 && (
          <>
            <SectionHeader>Openings</SectionHeader>
            <div
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {room.openings.map((opening, i) => {
                const Icon = OPENING_ICONS[opening.type] ?? Square;
                return (
                  <div
                    key={opening.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderBottom: i < room.openings.length - 1 ? '1px solid var(--border)' : 'none',
                      gap: 12,
                    }}
                  >
                    <Icon size={18} color="var(--text-3)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>
                        {opening.label ?? opening.type}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                        {mmToFractionalInches(opening.width_mm)} wide
                        {' · '}
                        {mmToFractionalInches(opening.height_mm)} tall
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right' }}>
                      Wall {opening.wallIndex + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Notes */}
        <SectionHeader>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StickyNote size={12} />
            Notes
          </span>
        </SectionHeader>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setIsDirty(true);
          }}
          placeholder="Add notes for this room…"
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            color: 'var(--text)',
            fontSize: 14,
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
}

export default function RoomDetailPage() {
  const params = useParams<{ id: string; roomId: string }>();
  const router = useRouter();
  const { data: room, isLoading } = useRoom(params.roomId);

  if (isLoading) {
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
        Room not found.{' '}
        <button
          onClick={() => router.back()}
          style={{
            marginLeft: 8,
            background: 'none',
            border: 'none',
            color: '#3B82F6',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Go back
        </button>
      </div>
    );
  }

  return <RoomDetailContent room={room} jobId={params.id} />;
}
