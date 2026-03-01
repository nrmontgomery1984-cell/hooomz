'use client';

/**
 * useSalesChecklist — Toggle checklist items on consultation/quote records.
 *
 * Reads templates from config, persists completions via existing
 * useUpdateConsultation / useUpdateQuote mutations.
 */

import { useCallback } from 'react';
import { useUpdateConsultation } from './useConsultations';
import { useUpdateQuote } from './useQuotes';
import {
  getTemplatesForEntity,
  getChecklistProgress,
  type ChecklistCompletions,
  type SalesChecklistTemplate,
} from '../config/salesChecklists';

interface UseSalesChecklistReturn {
  templates: SalesChecklistTemplate[];
  toggle: (itemKey: string) => void;
  getProgress: (templateId: string) => { checked: number; total: number };
  isPending: boolean;
}

export function useSalesChecklist(
  entityType: 'consultation' | 'quote',
  entityId: string,
  currentCompletions: ChecklistCompletions | undefined,
): UseSalesChecklistReturn {
  const updateConsultation = useUpdateConsultation();
  const updateQuote = useUpdateQuote();

  const templates = getTemplatesForEntity(entityType);

  const toggle = useCallback(
    (itemKey: string) => {
      const current = currentCompletions || {};
      const existing = current[itemKey];
      const updated: ChecklistCompletions = {
        ...current,
        [itemKey]: existing?.checked
          ? { checked: false }
          : { checked: true, checkedAt: new Date().toISOString() },
      };

      if (entityType === 'consultation') {
        updateConsultation.mutate({
          id: entityId,
          data: { checklistCompletions: updated },
        });
      } else {
        updateQuote.mutate({
          id: entityId,
          data: { checklistCompletions: updated },
        });
      }
    },
    [entityType, entityId, currentCompletions, updateConsultation, updateQuote],
  );

  const getProgress = useCallback(
    (templateId: string) => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) return { checked: 0, total: 0 };
      return getChecklistProgress(template, currentCompletions);
    },
    [templates, currentCompletions],
  );

  return {
    templates,
    toggle,
    getProgress,
    isPending: updateConsultation.isPending || updateQuote.isPending,
  };
}
