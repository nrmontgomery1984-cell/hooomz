'use client';

/**
 * Room List — /production/jobs/[id]/rooms
 *
 * Shows all rooms imported from RoomScan Pro for a job.
 * Allows XML file upload to import a new scan.
 * Clicking a room navigates to the room detail page.
 */

import { useParams, useRouter } from 'next/navigation';
import { useRef, useCallback } from 'react';
import { ArrowLeft, Upload, ScanLine, ChevronRight } from 'lucide-react';
import { FloorPlanCanvas } from '@/components/floorplan';
import { useRooms, useRoomScans, useImportRoomScan, useSeedDemoRooms } from '@/lib/hooks/useRoomScans';
import { mmToFractionalInches } from '@/lib/utils/units';

// Area: mm² → ft²
function sqmmToSqft(sqmm: number): string {
  return (sqmm / 92903).toFixed(1);
}

// Status badge
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'var(--blue-bg)', text: 'var(--blue)' },
    measured: { bg: 'var(--yellow-bg)', text: 'var(--yellow)' },
    complete: { bg: 'var(--green-bg)', text: 'var(--green)' },
  };
  const c = colors[status] ?? colors.pending;
  const labels: Record<string, string> = {
    pending: 'Pending',
    measured: 'Measured',
    complete: 'Complete',
  };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        color: c.text,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {labels[status] ?? status}
    </span>
  );
}

export default function RoomsPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const router = useRouter();

  const { data: rooms = [], isLoading: roomsLoading } = useRooms(jobId);
  const { data: scans = [] } = useRoomScans(jobId);
  const importMutation = useImportRoomScan();
  const seedMutation = useSeedDemoRooms();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const xmlString = await file.text();
      importMutation.mutate({
        jobId,
        filename: file.name,
        xmlString,
      });

      // Reset input so same file can be re-uploaded if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [jobId, importMutation],
  );

  const activeScan = scans.find((s) => s.status === 'ready');
  const hasError = scans.some((s) => s.status === 'error');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--charcoal)' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--surface)',
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
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
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'var(--muted)',
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            <ScanLine size={13} />
            Production / Rooms
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Floor Plan</h1>
        </div>

        {/* Upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importMutation.isPending}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: 'var(--blue)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: importMutation.isPending ? 'not-allowed' : 'pointer',
            opacity: importMutation.isPending ? 0.7 : 1,
          }}
        >
          <Upload size={15} />
          {importMutation.isPending ? 'Importing…' : 'Import Scan'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      <div style={{ padding: '20px 20px 40px' }}>
        {/* Import error banner */}
        {(importMutation.isError || hasError) && (
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--red-bg)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              marginBottom: 16,
              fontSize: 13,
              color: 'var(--red)',
            }}
          >
            {importMutation.isError
              ? `Import failed: ${(importMutation.error as Error).message}`
              : 'One or more scans failed to parse. Check the XML file and try again.'}
          </div>
        )}

        {/* Floor plan canvas */}
        {rooms.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <FloorPlanCanvas rooms={rooms} height={340} />
          </div>
        )}

        {/* Scan meta */}
        {activeScan && (
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: 'File', value: activeScan.filename },
              { label: 'Rooms', value: String(activeScan.roomCount) },
              {
                label: 'Total Area',
                value: `${sqmmToSqft(activeScan.totalArea_sqmm)} ft²`,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 14px',
                }}
              >
                <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  {label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Room list */}
        {roomsLoading ? (
          <div style={{ color: 'var(--muted)', fontSize: 14, paddingTop: 40, textAlign: 'center' }}>
            Loading rooms…
          </div>
        ) : rooms.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              paddingTop: 60,
              color: 'var(--muted)',
            }}
          >
            <ScanLine size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No rooms yet</div>
            <div style={{ fontSize: 13, marginBottom: 24 }}>Import a RoomScan Pro XML file to get started.</div>
            <button
              onClick={() => seedMutation.mutate(jobId)}
              disabled={seedMutation.isPending}
              style={{
                padding: '9px 18px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--mid)',
                cursor: seedMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: seedMutation.isPending ? 0.7 : 1,
              }}
            >
              {seedMutation.isPending ? 'Loading…' : 'Load Demo Rooms'}
            </button>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {rooms.map((room, i) => (
              <div
                key={room.id}
                onClick={() => router.push(`/production/jobs/${jobId}/rooms/${room.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderBottom: i < rooms.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>
                    {room.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {sqmmToSqft(room.polygon.area_sqmm)} ft²
                    {' · '}
                    {room.openings.length} opening{room.openings.length !== 1 ? 's' : ''}
                    {' · '}
                    {mmToFractionalInches(room.ceilingHeight_mm)} ceiling
                  </div>
                </div>
                <StatusBadge status={room.status} />
                <ChevronRight size={16} color="var(--muted)" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
