'use client';

/**
 * useIntakeDraftAutoSave — shared auto-save hook for intake wizards
 *
 * Debounces field changes (1s), saves immediately on step transitions.
 * Creates a new draft on first save, updates existing on subsequent saves.
 * Uses isSaving ref guard to prevent concurrent writes.
 */

import { useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { LOCAL_QUERY_KEYS } from './useLocalData';
import type { IntakeDraftType } from '../types/intakeDraft.types';
import type { HomeownerIntakeData, ContractorIntakeData } from '../types/intake.types';

interface UseIntakeDraftAutoSaveOptions {
  draftId: string | null;
  type: IntakeDraftType;
  currentStep: number;
  data: HomeownerIntakeData | ContractorIntakeData;
  onDraftCreated: (id: string) => void;
}

interface UseIntakeDraftAutoSaveReturn {
  /** Call after field changes — saves after 1s debounce */
  debouncedSave: () => void;
  /** Call on step transitions — saves immediately, clears pending debounce */
  immediateSave: () => void;
}

/** Extract display labels from form data */
function deriveLabels(
  type: IntakeDraftType,
  data: HomeownerIntakeData | ContractorIntakeData,
): { customerName: string; projectSummary: string } {
  if (type === 'homeowner') {
    const d = data as HomeownerIntakeData;
    const first = d.contact.first_name?.trim() || '';
    const last = d.contact.last_name?.trim() || '';
    const customerName = [first, last].filter(Boolean).join(' ') || 'New Homeowner';
    const projectSummary = d.project.project_type
      ? d.project.project_type.replace(/_/g, ' ')
      : 'Homeowner intake';
    return { customerName, projectSummary };
  }

  // Contractor
  const d = data as ContractorIntakeData;
  const customerName = d.client?.name?.trim() || 'New Contractor';
  const roomCount = d.scope.room_scopes?.length ?? 0;
  const baseSummary = d.project.name?.trim() || d.project.project_type?.replace(/_/g, ' ') || 'Contractor intake';
  const projectSummary = roomCount > 0 ? `${baseSummary} (${roomCount} rooms)` : baseSummary;
  return { customerName, projectSummary };
}

export function useIntakeDraftAutoSave({
  draftId,
  type,
  currentStep,
  data,
  onDraftCreated,
}: UseIntakeDraftAutoSaveOptions): UseIntakeDraftAutoSaveReturn {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();
  const isSaving = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentDraftIdRef = useRef<string | null>(draftId);

  // Keep ref in sync with prop
  useEffect(() => {
    currentDraftIdRef.current = draftId;
  }, [draftId]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const save = useCallback(async () => {
    if (!services || isSaving.current) return;
    isSaving.current = true;

    try {
      const { customerName, projectSummary } = deriveLabels(type, data);
      const now = new Date().toISOString();

      if (currentDraftIdRef.current) {
        // Update existing draft
        await services.intakeDrafts.update(currentDraftIdRef.current, {
          currentStep,
          data,
          customerName,
          projectSummary,
          updatedAt: now,
        });
      } else {
        // Create new draft
        const draft = await services.intakeDrafts.create({
          type,
          currentStep,
          data,
          customerName,
          projectSummary,
          status: 'in_progress',
          createdAt: now,
          updatedAt: now,
        });
        currentDraftIdRef.current = draft.id;
        onDraftCreated(draft.id);
      }

      // Invalidate draft queries so lists stay fresh
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.intakeDrafts.all });
    } catch (err) {
      console.error('Draft auto-save failed:', err);
    } finally {
      isSaving.current = false;
    }
  }, [services, type, currentStep, data, onDraftCreated, queryClient]);

  const debouncedSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      save();
    }, 1000);
  }, [save]);

  const immediateSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    save();
  }, [save]);

  return { debouncedSave, immediateSave };
}
