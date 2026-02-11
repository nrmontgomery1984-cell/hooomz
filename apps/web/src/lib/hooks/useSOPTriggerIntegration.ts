'use client';

/**
 * SOP Trigger Integration Hook (Build 2)
 *
 * Wraps useToggleSOPStep to fire observation triggers when steps are checked.
 * Gracefully degrades when no database SOP matches the hardcoded sopId.
 *
 * Usage: Pass projectId + crewMemberId to enable trigger behavior.
 * Without those props, behaves identically to useToggleSOPStep.
 */

import { useState, useCallback } from 'react';
import { useToggleSOPStep, isStepCompleted } from './useLocalData';
import { useHandleChecklistItemComplete, useSopByCode, useSopChecklistItems } from './useLabsData';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import type { TriggerResult, ObservationDraft } from '@hooomz/shared-contracts';

interface TriggerIntegrationOptions {
  taskId: string;
  sopId: string;
  projectId?: string;
}

interface TriggerIntegrationReturn {
  toggleStep: (stepOrder: number) => void;
  triggerResult: TriggerResult | null;
  activeDraft: ObservationDraft | null;
  clearTriggerResult: () => void;
  isToggling: boolean;
}

export function useSOPTriggerIntegration({
  taskId,
  sopId,
  projectId,
}: TriggerIntegrationOptions): TriggerIntegrationReturn {
  const baseToggle = useToggleSOPStep();
  const handleComplete = useHandleChecklistItemComplete();
  const { crewMemberId } = useActiveCrew();

  // Look up database SOP by code (graceful: returns undefined if not found)
  const { data: dbSop } = useSopByCode(sopId);
  const { data: checklistItems = [] } = useSopChecklistItems(dbSop?.id ?? '');

  const [triggerResult, setTriggerResult] = useState<TriggerResult | null>(null);
  const [activeDraft, setActiveDraft] = useState<ObservationDraft | null>(null);

  const toggleStep = useCallback((stepOrder: number) => {
    // Always toggle the step in the existing system
    baseToggle.mutate({ taskId, sopId, stepOrder, crewMemberId: crewMemberId || 'unknown' }, {
      onSuccess: async (progress) => {
        // Determine if this was a CHECK (not uncheck)
        const isNowChecked = isStepCompleted(progress.completedSteps, stepOrder);

        // Only trigger on CHECK, and only if we have trigger context
        if (!isNowChecked || !projectId || !crewMemberId || !dbSop) return;

        // Find matching checklist item template by step number
        const matchingItem = checklistItems.find(
          (item) => item.stepNumber === stepOrder
        );
        if (!matchingItem || !matchingItem.generatesObservation) return;

        // Fire the trigger
        try {
          const result = await handleComplete.mutateAsync({
            checklistItemId: matchingItem.id,
            taskId,
            sopId: dbSop.id,
            projectId,
            crewMemberId,
          });

          setTriggerResult(result);
          if (result.draft) {
            setActiveDraft(result.draft);
          }
        } catch (err) {
          console.error('Trigger failed (non-blocking):', err);
        }
      },
    });
  }, [taskId, sopId, projectId, crewMemberId, dbSop, checklistItems, baseToggle, handleComplete]);

  const clearTriggerResult = useCallback(() => {
    setTriggerResult(null);
    setActiveDraft(null);
  }, []);

  return {
    toggleStep,
    triggerResult,
    activeDraft,
    clearTriggerResult,
    isToggling: baseToggle.isPending,
  };
}
