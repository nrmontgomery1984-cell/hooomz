'use client';

/**
 * Approval + Pipeline Hooks (Build 3b)
 *
 * Quote approval triggers task pipeline generation.
 * Estimate ≠ Quote: estimates are internal working docs, quotes are formal client-facing.
 * Only QUOTED → APPROVED triggers task generation.
 *
 * - Quote approval → generateFromEstimate → auto-deploy tasks
 * - CO approval → generateFromChangeOrder → auto-deploy
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { PIPELINE_QUERY_KEYS } from './useTaskPipeline';
import { ProjectStatus } from '@hooomz/shared-contracts';

/**
 * Work category code → default SOP codes.
 * Used as a fallback when labor line items are missing sopCodes
 * (e.g., items created manually on the estimates page via cost catalog).
 */
const WORK_CATEGORY_DEFAULT_SOP: Record<string, string[]> = {
  FL: ['HI-SOP-FL-004'],   // Flooring install
  PT: ['HI-SOP-PT-002'],   // Painting
  FC: ['HI-SOP-FC-003'],   // Trim / finish carpentry
  DR: ['HI-SOP-DR-001'],   // Doors
};

/**
 * CostCategory value → work category code.
 * Mirrors COST_CATEGORY_TO_TRADE from axisMapping.ts.
 * Used when line items have a category but no workCategoryCode.
 */
const CATEGORY_TO_WCC: Record<string, string> = {
  flooring: 'FL',
  painting: 'PT',
  'interior-trim': 'FC',
  drywall: 'DW',
  'windows-doors': 'FC',
  'cabinets-countertops': 'FC',
};

/**
 * Infer work category code from line item description.
 * Last-resort fallback when both workCategoryCode and category are generic ('labor').
 */
function inferWccFromDescription(desc: string): string | undefined {
  const d = desc.toLowerCase();
  if (/floor|lvp|lvt|hardwood|laminate|vinyl|carpet|underlay/.test(d)) return 'FL';
  if (/paint|prime|primer|coat|roll|brush/.test(d)) return 'PT';
  if (/trim|baseboard|crown|casing|molding|shoe|wainscot/.test(d)) return 'FC';
  if (/\bdoor\b/.test(d)) return 'DR';
  return undefined;
}

/**
 * Approve a QUOTE and trigger task pipeline generation.
 * Only works when project is in QUOTED status (formal quote sent to client).
 * 1. Logs quote.approved activity event
 * 2. Advances project QUOTED → APPROVED
 * 3. Fetches labor line items with sopCodes
 * 4. Calls pipeline.generateFromEstimate() → creates blueprints + auto-deploys
 */
export function useApproveEstimateWithPipeline() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  const approveAndGenerate = useCallback(
    async (
      projectId: string,
      estimateId: string,
      data: { total_amount?: number } = {}
    ): Promise<{
      blueprintsCreated: number;
      tasksDeployed: number;
      missingSopCodes: string[];
      loopedPending: number;
      totalLineItems: number;
      pipelineEligible: number;
    }> => {
      if (!services) throw new Error('Services not initialized');

      const project = await services.projects.findById(projectId);
      if (!project) throw new Error('Project not found');

      // Guard: only QUOTED → APPROVED triggers the pipeline
      if (project.status !== ProjectStatus.QUOTED) {
        throw new Error(`Quote approval requires QUOTED status (current: ${project.status})`);
      }

      // 1. Log quote approval to activity spine
      await services.activity.logFinancialEvent(
        'estimate.approved',
        projectId,
        'estimate',
        estimateId,
        { amount: data.total_amount }
      );

      // 2. Advance project to APPROVED
      await services.projects.update(projectId, { status: ProjectStatus.APPROVED });
      await services.activity.logProjectEvent('project.status_changed', projectId, {
        project_name: project.name,
        old_status: project.status,
        new_status: ProjectStatus.APPROVED,
      });

      // 3. Fetch labor line items with sopCodes (tasks come from labor, not material)
      const lineItems = await services.estimating.lineItems.findByProjectId(projectId);

      // Enrich labor items that are missing sopCodes — infer from workCategoryCode
      // or category. This handles items created via the estimates page cost catalog
      // which don't go through the intake service's deriveScopeItemsFromRooms().
      const enrichedItems = lineItems.map((li) => {
        if (li.isLabor !== false && (!li.sopCodes || li.sopCodes.length === 0)) {
          // Try workCategoryCode → category → description (in order of specificity)
          const wcc = li.workCategoryCode
            || CATEGORY_TO_WCC[li.category]
            || inferWccFromDescription(li.description)
            || '';
          const inferred = wcc ? WORK_CATEGORY_DEFAULT_SOP[wcc] : undefined;
          if (inferred) {
            return { ...li, sopCodes: inferred };
          }
        }
        return li;
      });

      const pipelineItems = enrichedItems.filter(
        (li) => li.sopCodes && li.sopCodes.length > 0 && li.isLabor !== false
      );

      if (pipelineItems.length === 0) {
        return {
          blueprintsCreated: 0,
          tasksDeployed: 0,
          missingSopCodes: [],
          loopedPending: 0,
          totalLineItems: lineItems.length,
          pipelineEligible: 0,
        };
      }

      // 4. Generate blueprints + auto-deploy
      const result = await services.pipeline.generateFromEstimate(projectId, pipelineItems);

      // 5. Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.blueprints.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: ['local', 'projects'] });
      queryClient.invalidateQueries({ queryKey: ['local', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      return {
        blueprintsCreated: result.blueprints.length,
        tasksDeployed: result.deployed.length,
        missingSopCodes: result.missingSopCodes,
        loopedPending: result.loopedPending,
        totalLineItems: lineItems.length,
        pipelineEligible: pipelineItems.length,
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

      // 4. Auto-create labour hours budgets for deployed tasks from CO labour costs
      for (const deployed of result.deployed) {
        // Find the CO line item that generated this task (match by sopCode)
        const matchingLi = lineItems.find((li) => li.sopCode === deployed.sopCode);
        if (matchingLi && matchingLi.estimatedLaborCost > 0) {
          try {
            const minSkillLevel = 0; // default — CO line items don't specify skill level
            const hoursBudget = await services.labourEstimation.computeHoursBudgetFromQuote(
              matchingLi.estimatedLaborCost,
              minSkillLevel,
            );
            await services.budget.createFromQuotedLabour(
              deployed.taskId,
              changeOrder.projectId,
              deployed.sopCode ?? '',
              hoursBudget,
            );
          } catch (err) {
            console.error('Failed to create budget from CO line item:', err);
          }
        }
      }

      // 5. Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: PIPELINE_QUERY_KEYS.blueprints.byProject(changeOrder.projectId) });
      queryClient.invalidateQueries({ queryKey: ['local', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['integration', 'changeOrders'] });
      queryClient.invalidateQueries({ queryKey: ['taskBudgets'] });

      return {
        blueprintsCreated: result.blueprints.length,
        tasksDeployed: result.deployed.length,
      };
    },
    [services, queryClient]
  );

  return { approveAndGenerate };
}
