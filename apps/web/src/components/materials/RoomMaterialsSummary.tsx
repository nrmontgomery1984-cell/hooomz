'use client';

/**
 * RoomMaterialsSummary — sticky sidebar card showing totals, confirm button,
 * and "Push to Quote" / "Re-sync" button.
 */

import { Check, AlertCircle, ArrowUpRight, RefreshCw } from 'lucide-react';
import {
  useRoomSelectionSummary,
  useConfirmSelection,
  useSyncSelectionsToQuote,
  useMaterialLineItemCount,
} from '@/lib/hooks/useMaterialSelections';
import { useToast } from '@/components/ui/Toast';

interface RoomMaterialsSummaryProps {
  roomId: string;
  projectId: string;
  jobId: string;
}

export function RoomMaterialsSummary({ roomId, projectId }: RoomMaterialsSummaryProps) {
  const { data: summary, isLoading } = useRoomSelectionSummary(roomId);
  const confirmMutation = useConfirmSelection();
  const syncMutation = useSyncSelectionsToQuote();
  const { data: existingCount = 0 } = useMaterialLineItemCount(projectId);
  const { showToast } = useToast();

  const handleConfirmAll = async () => {
    if (!summary) return;
    const pending = summary.trades.filter(
      (t) => t.selection && t.selection.status === 'pending',
    );
    for (const row of pending) {
      await confirmMutation.mutateAsync({
        selectionId: row.selection!.id,
        roomId,
        projectId,
        confirmedBy: 'manager',
      });
    }
  };

  const handleSyncToQuote = async () => {
    try {
      const result = await syncMutation.mutateAsync({ projectId });
      showToast({ message: `${result.length} line item${result.length === 1 ? '' : 's'} synced to quote`, variant: 'success' });
    } catch {
      showToast({ message: 'Failed to sync selections to quote', variant: 'error' });
    }
  };

  if (isLoading || !summary) {
    return (
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20,
          minHeight: 120,
        }}
      >
        <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading summary…</div>
      </div>
    );
  }

  const hasSelections = summary.trades.some((t) => t.isComplete);
  const pendingCount = summary.trades.filter(
    (t) => t.selection && t.selection.status === 'pending',
  ).length;
  const confirmedCount = summary.confirmedCount;
  const isConfirming = confirmMutation.isPending;
  const isSyncing = syncMutation.isPending;
  const hasExisting = existingCount > 0;

  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          Room Total
        </div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>
          ${summary.totalPrice.toFixed(0)}
        </div>
      </div>

      {/* Trade breakdown */}
      <div style={{ padding: '12px 16px' }}>
        {summary.trades
          .filter((t) => t.isComplete)
          .map(({ trade, selection }) => (
            <div
              key={trade}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: 8,
                marginBottom: 8,
                borderBottom: '1px solid var(--border)',
                fontSize: 13,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{trade}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  {selection!.productName}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>${selection!.totalPrice.toFixed(0)}</div>
                {selection!.status === 'confirmed' && (
                  <div style={{ fontSize: 10, color: '#10B981', display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                    <Check size={9} /> Confirmed
                  </div>
                )}
              </div>
            </div>
          ))}

        {!hasSelections && (
          <div style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>
            No materials selected yet
          </div>
        )}
      </div>

      {/* Status / confirm / sync buttons */}
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {summary.allConfirmed && hasSelections ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px',
              background: 'rgba(16,185,129,0.1)',
              borderRadius: 8,
              color: '#10B981',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <Check size={14} />
            All confirmed
          </div>
        ) : pendingCount > 0 ? (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: '#F59E0B',
                marginBottom: 10,
              }}
            >
              <AlertCircle size={13} />
              {pendingCount} selection{pendingCount > 1 ? 's' : ''} awaiting confirmation
            </div>
            <button
              onClick={handleConfirmAll}
              disabled={isConfirming}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px',
                background: '#1E3A8A',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: isConfirming ? 'not-allowed' : 'pointer',
                opacity: isConfirming ? 0.7 : 1,
              }}
            >
              {isConfirming ? 'Confirming…' : `Confirm ${pendingCount} Selection${pendingCount > 1 ? 's' : ''}`}
            </button>
          </div>
        ) : null}

        {/* Push / Re-sync to Quote — only show when at least 1 selection is confirmed */}
        {confirmedCount > 0 && (
          <button
            onClick={handleSyncToQuote}
            disabled={isSyncing}
            style={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px',
              background: hasExisting ? 'var(--surface-1)' : '#0F766E',
              color: hasExisting ? '#0F766E' : '#fff',
              border: hasExisting ? '2px solid #0F766E' : 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              opacity: isSyncing ? 0.7 : 1,
            }}
          >
            {hasExisting ? <RefreshCw size={14} /> : <ArrowUpRight size={14} />}
            {isSyncing
              ? 'Syncing…'
              : hasExisting
                ? 'Re-sync selections to quote'
                : 'Push selections to quote'}
          </button>
        )}
      </div>
    </div>
  );
}
