'use client';

/**
 * Complete Task with Batch Check Hook (Build 3a)
 *
 * Wraps useCompleteTask to check for pending batch observations
 * before completing. Returns batch metadata so the caller can
 * show the BatchConfirmModal when needed.
 */

import { useCallback, useState } from 'react';
import { useCompleteTask } from './useLocalData';
import { usePendingBatchCount } from './useLabsData';

interface CompleteWithBatchResult {
  completeTask: (projectId: string, taskId: string) => Promise<void>;
  isPending: boolean;
  hasPendingBatch: boolean;
  batchTaskId: string | null;
  clearBatch: () => void;
}

export function useCompleteTaskWithBatchCheck(): CompleteWithBatchResult {
  const baseComplete = useCompleteTask();
  const [batchTaskId, setBatchTaskId] = useState<string | null>(null);
  const { data: batchCount = 0 } = usePendingBatchCount(batchTaskId ?? undefined);

  const hasPendingBatch = batchCount > 0 && batchTaskId !== null;

  const completeTask = useCallback(async (projectId: string, taskId: string) => {
    await baseComplete.mutateAsync({ projectId, taskId });
    // After completing, set batchTaskId to trigger count check
    setBatchTaskId(taskId);
  }, [baseComplete]);

  const clearBatch = useCallback(() => {
    setBatchTaskId(null);
  }, []);

  return {
    completeTask,
    isPending: baseComplete.isPending,
    hasPendingBatch,
    batchTaskId,
    clearBatch,
  };
}
