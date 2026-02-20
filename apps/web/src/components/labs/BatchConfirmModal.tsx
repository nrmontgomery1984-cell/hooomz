'use client';

/**
 * Batch Confirm Modal (Build 2)
 *
 * Shows at task completion when pending batch observation items exist.
 * Scrollable list of ObservationConfirmCards with "Confirm All" option.
 */

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ObservationConfirmCard } from './ObservationConfirmCard';
import type { PendingBatchObservation, ConditionAssessment } from '@hooomz/shared-contracts';

interface BatchConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingItems: PendingBatchObservation[];
  onConfirmItem: (pendingBatchId: string, overrides?: {
    deviated?: boolean;
    deviationFields?: string[];
    deviationReason?: string;
    notes?: string;
    photoIds?: string[];
    conditionAssessment?: ConditionAssessment;
  }) => Promise<void>;
  onSkipItem: (pendingBatchId: string) => Promise<void>;
  onConfirmAll: () => Promise<void>;
  isProcessing?: boolean;
}

export function BatchConfirmModal({
  isOpen,
  onClose,
  pendingItems,
  onConfirmItem,
  onSkipItem,
  onConfirmAll,
  isProcessing = false,
}: BatchConfirmModalProps) {
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  const remaining = pendingItems.filter((item) => !processedIds.has(item.id));
  const processedCount = processedIds.size;
  const totalCount = pendingItems.length;

  const handleConfirmItem = async (
    itemId: string,
    params: {
      deviated: boolean;
      deviationFields?: string[];
      deviationReason?: string;
      notes?: string;
      photoIds?: string[];
      conditionAssessment?: ConditionAssessment;
    }
  ) => {
    await onConfirmItem(itemId, {
      deviated: params.deviated,
      deviationFields: params.deviationFields,
      deviationReason: params.deviationReason,
      notes: params.notes,
      photoIds: params.photoIds,
      conditionAssessment: params.conditionAssessment,
    });
    setProcessedIds((prev) => new Set(prev).add(itemId));
  };

  const handleSkipItem = async (itemId: string) => {
    await onSkipItem(itemId);
    setProcessedIds((prev) => new Set(prev).add(itemId));
  };

  const handleConfirmAll = async () => {
    await onConfirmAll();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pending Observations" size="lg">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {processedCount} of {totalCount} processed
        </p>
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${totalCount > 0 ? (processedCount / totalCount) * 100 : 0}%`,
              background: 'var(--blue)',
            }}
          />
        </div>
      </div>

      {/* Remaining items */}
      {remaining.length > 0 ? (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {remaining.map((item) => (
            <ObservationConfirmCard
              key={item.id}
              draft={item.draft}
              onConfirm={(params) => handleConfirmItem(item.id, params)}
              onSkip={() => handleSkipItem(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">All items processed</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
        {remaining.length > 0 && (
          <button
            onClick={handleConfirmAll}
            disabled={isProcessing}
            className="flex-1 py-3 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
            style={{ background: 'var(--blue)', minHeight: '48px' }}
          >
            {isProcessing ? 'Processing...' : `Confirm All (${remaining.length})`}
          </button>
        )}
        <button
          onClick={onClose}
          className="px-4 py-3 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
          style={{ minHeight: '48px' }}
        >
          {remaining.length === 0 ? 'Done' : 'Close'}
        </button>
      </div>
    </Modal>
  );
}
