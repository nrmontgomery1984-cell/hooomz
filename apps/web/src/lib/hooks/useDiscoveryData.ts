'use client';

/**
 * useDiscoveryData — React Query hooks for the Discovery flow (Prompt 2)
 *
 * Provides:
 * - useDiscoveryDraft(projectId) — load draft by project
 * - useCreateDiscoveryDraft() — create new draft
 * - useUpdateDiscoveryDraft() — mutation for saves
 * - useCompleteDiscovery() — mark complete, update project status, fire activity events
 * - useDiscoveryAutoSave() — 500ms debounce auto-save (same pattern as useIntakeDraftAutoSave)
 */

import { useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { getLoggedServices } from '../services';
import { LOCAL_QUERY_KEYS } from './useLocalData';
import { ProjectStatus } from '@hooomz/shared-contracts';
import type { PropertyData, DesignPreferences } from '../types/discovery.types';

// ============================================================================
// Query: Load discovery draft by projectId
// ============================================================================

export function useDiscoveryDraft(projectId: string | null) {
  const { services } = useServicesContext();

  return useQuery({
    queryKey: LOCAL_QUERY_KEYS.discoveryDrafts.byProject(projectId || ''),
    queryFn: async () => {
      if (!services || !projectId) return null;
      return services.discoveryDrafts.findByProjectId(projectId);
    },
    enabled: !!services && !!projectId,
  });
}

// ============================================================================
// Mutation: Create discovery draft
// ============================================================================

interface CreateDiscoveryDraftInput {
  projectId: string;
  customerName: string;
  initialProperty?: Partial<PropertyData>;
}

export function useCreateDiscoveryDraft() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDiscoveryDraftInput) => {
      if (!services) throw new Error('Services not initialized');

      const now = new Date().toISOString();
      return services.discoveryDrafts.create({
        projectId: input.projectId,
        currentStep: 1,
        property: input.initialProperty || {},
        preferences: {},
        status: 'in_progress',
        customerName: input.customerName,
        createdAt: now,
        updatedAt: now,
      });
    },
    onSuccess: (_draft, input) => {
      queryClient.invalidateQueries({
        queryKey: LOCAL_QUERY_KEYS.discoveryDrafts.byProject(input.projectId),
      });

      // Log discovery started
      services?.activity.create({
        event_type: 'project.discovery_started',
        project_id: input.projectId,
        entity_type: 'project',
        entity_id: input.projectId,
        summary: `Discovery started for ${input.customerName}`,
        event_data: {},
      }).catch((err) => console.error('Failed to log discovery_started:', err));
    },
  });
}

// ============================================================================
// Mutation: Update discovery draft (used by auto-save)
// ============================================================================

interface UpdateDiscoveryDraftInput {
  draftId: string;
  projectId: string;
  currentStep: number;
  property: Partial<PropertyData>;
  preferences: Partial<DesignPreferences>;
}

export function useUpdateDiscoveryDraft() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateDiscoveryDraftInput) => {
      if (!services) throw new Error('Services not initialized');

      return services.discoveryDrafts.update(input.draftId, {
        currentStep: input.currentStep,
        property: input.property,
        preferences: input.preferences,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: (_draft, input) => {
      queryClient.invalidateQueries({
        queryKey: LOCAL_QUERY_KEYS.discoveryDrafts.byProject(input.projectId),
      });
    },
  });
}

// ============================================================================
// Mutation: Complete discovery
// ============================================================================

interface CompleteDiscoveryInput {
  draftId: string;
  projectId: string;
  customerName: string;
  property: Partial<PropertyData>;
  preferences: Partial<DesignPreferences>;
}

export function useCompleteDiscovery() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteDiscoveryInput) => {
      if (!services) throw new Error('Services not initialized');

      // 1. Mark draft complete
      await services.discoveryDrafts.markComplete(input.draftId);

      // 2. Update project status to DISCOVERY
      const loggedServices = getLoggedServices();
      await loggedServices.projects.changeStatus(
        input.projectId,
        ProjectStatus.DISCOVERY
      );

      return true;
    },
    onSuccess: async (_result, input) => {
      // Fire activity events (non-blocking)
      services?.activity.create({
        event_type: 'discovery.property_captured',
        project_id: input.projectId,
        entity_type: 'project',
        entity_id: input.projectId,
        summary: `Property details captured for ${input.customerName}`,
        event_data: { property: input.property },
      }).catch((err) => console.error('Failed to log property_captured:', err));

      services?.activity.create({
        event_type: 'discovery.preferences_captured',
        project_id: input.projectId,
        entity_type: 'project',
        entity_id: input.projectId,
        summary: `Design preferences captured for ${input.customerName}`,
        event_data: { preferences: input.preferences },
      }).catch((err) => console.error('Failed to log preferences_captured:', err));

      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: LOCAL_QUERY_KEYS.discoveryDrafts.byProject(input.projectId),
      });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.projects.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

// ============================================================================
// Auto-save hook (500ms debounce)
// ============================================================================

interface UseDiscoveryAutoSaveOptions {
  draftId: string | null;
  projectId: string;
  currentStep: number;
  property: Partial<PropertyData>;
  preferences: Partial<DesignPreferences>;
}

interface UseDiscoveryAutoSaveReturn {
  debouncedSave: () => void;
  immediateSave: () => void;
  isSaving: boolean;
}

export function useDiscoveryAutoSave({
  draftId,
  projectId,
  currentStep,
  property,
  preferences,
}: UseDiscoveryAutoSaveOptions): UseDiscoveryAutoSaveReturn {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();
  const isSaving = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentDraftIdRef = useRef<string | null>(draftId);

  useEffect(() => {
    currentDraftIdRef.current = draftId;
  }, [draftId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const save = useCallback(async () => {
    if (!services || isSaving.current || !currentDraftIdRef.current) return;
    isSaving.current = true;

    try {
      await services.discoveryDrafts.update(currentDraftIdRef.current, {
        currentStep,
        property,
        preferences,
        updatedAt: new Date().toISOString(),
      });

      queryClient.invalidateQueries({
        queryKey: LOCAL_QUERY_KEYS.discoveryDrafts.byProject(projectId),
      });
    } catch (err) {
      console.error('Discovery auto-save failed:', err);
    } finally {
      isSaving.current = false;
    }
  }, [services, currentStep, property, preferences, projectId, queryClient]);

  const debouncedSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      save();
    }, 500);
  }, [save]);

  const immediateSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    save();
  }, [save]);

  return { debouncedSave, immediateSave, isSaving: isSaving.current };
}
