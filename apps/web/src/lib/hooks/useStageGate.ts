'use client';

/**
 * Stage Gate Hooks
 *
 * useCanAdvanceStage(projectId, currentStage) — check if stage can advance
 * useAdvanceStage() — mutation to advance project stage
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type { JobStage } from '@hooomz/shared-contracts';
import type { StageGateResult } from '../services/stageGate.service';

const STAGE_GATE_KEYS = {
  canAdvance: (projectId: string, stage: string) => ['stageGate', projectId, stage] as const,
};

export function useCanAdvanceStage(projectId: string | undefined, currentStage: JobStage | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery<StageGateResult>({
    queryKey: STAGE_GATE_KEYS.canAdvance(projectId ?? '', currentStage ?? ''),
    queryFn: () => services!.stageGate.canAdvanceStage(projectId!, currentStage!),
    enabled: !servicesLoading && !!services && !!projectId && !!currentStage,
    staleTime: 10_000,
  });
}

export function useAdvanceStage(projectId: string | undefined) {
  const { services } = useServicesContext();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (nextStage: JobStage) => {
      if (!services || !projectId) throw new Error('Not ready');
      const project = await services.projects.findById(projectId);
      if (!project) throw new Error('Project not found');

      // Update project jobStage
      await services.projects.update(projectId, {
        ...project,
        jobStage: nextStage,
      });

      // Log activity
      await services.activity.create({
        event_type: 'project.stage_advanced',
        entity_type: 'project',
        entity_id: projectId,
        project_id: projectId,
        summary: `Stage advanced to ${nextStage}`,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['stageGate'] });
    },
  });
}
