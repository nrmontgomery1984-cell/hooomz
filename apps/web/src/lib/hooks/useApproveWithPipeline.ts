'use client';

/**
 * Approval + Pipeline Hooks (Build 3b)
 *
 * Wraps existing approval flows to trigger task pipeline generation:
 * - Estimate approval → generateFromEstimate → auto-deploy non-looped
 * - CO approval → generateFromChangeOrder → auto-deploy
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { PIPELINE_QUERY_KEYS } from './useTaskPipeline';

/**
 * Approve an estimate and trigger task pipeline generation.
 * 1. Logs estimate.approved activity event
 * 2. Fetches project line items with sopCodes
 * 3. Calls pipeline.generateFromEstimate() → creates blueprints + auto-deploys
 */
export function useApproveEstimateWithPipeline() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  const approveAndGenerate = useCallback(
    async (
      projectId: string,
      estimateId: string,
      data: { total_amount?: number } = {}
    ): Promise<{ blueprintsCreated: number; tasksDeployed: number }> => {
      if (!services) throw new Error('Services not initialized');

      // 1. Log estimate approval to activity spine
      await services.activity.logFinancialEvent(
        'estimate.approved',
        projectId,
        'estimate',
        estimateId,
        { amount: data.total_amount }
      );

      // 2. Fetch all line items for this project
      const lineItems = await services.estimating.lineItems.findByProjectId(projectId);

      // 3. Filter to items that have sopCodes (pipeline-eligible)
      const pipelineItems = lineItems.filter(
        (li) => li.sopCodes && li.sopCodes.length > 0
      );

      if (pipelineItems.length === 0) {
        return { blueprintsCreated: 0, tasksDeployed: 0 };
      }

      // 4. Generate blueprints + auto-deploy non-looped
      const result = await services.pipeline.generateFromEstimate(projectId, pipelineItems);

      // 5. Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.blueprints.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: ['local', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      return {
        blueprintsCreated: result.blueprints.length,
        tasksDeployed: result.deployed.length,
      };
    },
    [services, queryClient]
  );

  return { approveAndGenerate };
}

/**
 * Approve a change order and trigger task pipeline generation.
 * Wraps existing CO approval + calls pipeline.generateFromChangeOrder().
 */
export function useApproveChangeOrderWithPipeline() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  const approveAndGenerate = useCallback(
    async (
      changeOrderId: string,
      approvedBy: string
    ): Promise<{ blueprintsCreated: number; tasksDeployed: number }> => {
      if (!services) throw new Error('Services not initialized');

      // 1. Approve the change order (existing flow)
      const { changeOrder, lineItems } =
        await services.integration.changeOrders.approveChangeOrder(changeOrderId, approvedBy);

      // 2. Filter to items with sopCode
      const pipelineItems = lineItems.filter((li) => li.sopCode);

      if (pipelineItems.length === 0) {
        return { blueprintsCreated: 0, tasksDeployed: 0 };
      }

      // 3. Generate blueprints + auto-deploy
      const result = await services.pipeline.generateFromChangeOrder(
        changeOrder.projectId,
        changeOrderId,
        pipelineItems
      );

      // 4. Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.blueprints.byProject(changeOrder.projectId) });
      queryClient.invalidateQueries({ queryKey: ['local', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['integration', 'changeOrders'] });

      return {
        blueprintsCreated: result.blueprints.length,
        tasksDeployed: result.deployed.length,
      };
    },
    [services, queryClient]
  );

  return { approveAndGenerate };
}
