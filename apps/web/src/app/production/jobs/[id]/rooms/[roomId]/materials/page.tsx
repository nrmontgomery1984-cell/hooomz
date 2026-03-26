'use client';

/**
 * Room Materials Page — /production/jobs/[id]/rooms/[roomId]/materials
 *
 * Shows Good/Better/Best tier comparison for each trade in the room.
 * Selections are saved to IndexedDB and shown in a sticky summary sidebar.
 *
 * Trade panels are ordered by relevance for a typical renovation job.
 * jobId is used as projectId (same entity in current data model).
 */

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Layers } from 'lucide-react';
import { TradeSelectionPanel } from '@/components/materials/TradeSelectionPanel';
import { RoomMaterialsSummary } from '@/components/materials/RoomMaterialsSummary';
import { useRoom } from '@/lib/hooks/useRoomScans';
import { useRoomSelections } from '@/lib/hooks/useMaterialSelections';
import type { ProductTrade } from '@/lib/types/catalogProduct.types';
import type { ProjectMaterialSelection } from '@/lib/types/materialSelection.types';

// Trades offered for selection, in display order
const AVAILABLE_TRADES: ProductTrade[] = ['flooring', 'paint', 'trim', 'tile'];

function sqmmToSqft(sqmm: number): string {
  return (sqmm / 92_903).toFixed(0);
}

export default function RoomMaterialsPage() {
  const params = useParams<{ id: string; roomId: string }>();
  const router = useRouter();
  const jobId = params.id;
  const roomId = params.roomId;

  // jobId === projectId in the current data model
  const projectId = jobId;

  const { data: room, isLoading: roomLoading } = useRoom(roomId);
  const { data: selections = [] } = useRoomSelections(roomId);

  const getSelectionForTrade = (trade: ProductTrade): ProjectMaterialSelection | null =>
    selections.find((s) => s.trade === trade) ?? null;

  if (roomLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          color: 'var(--muted)',
          fontSize: 14,
        }}
      >
        Loading…
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
          color: 'var(--muted)',
          fontSize: 14,
        }}
      >
        Room not found.
      </div>
    );
  }

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
            <Layers size={13} />
            Materials
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
            {room.name}
          </h1>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {sqmmToSqft(room.polygon.area_sqmm)} ft²
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 280px',
          gap: 20,
          alignItems: 'start',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        {/* Trade panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {AVAILABLE_TRADES.map((trade) => (
            <TradeSelectionPanel
              key={trade}
              trade={trade}
              roomId={roomId}
              projectId={projectId}
              jobId={jobId}
              existingSelection={getSelectionForTrade(trade)}
            />
          ))}
        </div>

        {/* Sticky summary sidebar */}
        <div style={{ position: 'sticky', top: 20 }}>
          <RoomMaterialsSummary
            roomId={roomId}
            projectId={projectId}
            jobId={jobId}
          />
        </div>
      </div>
    </div>
  );
}
