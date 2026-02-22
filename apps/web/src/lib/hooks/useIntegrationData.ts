'use client';

/**
 * Integration Data Hooks — React Query hooks for Data Spine entities
 * Change orders, uncaptured work, observation links, project budget
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type {
  ChangeOrder,
  ChangeOrderLineItem,
  CallbackReason,
} from '@hooomz/shared-contracts';

// ============================================================================
// Query Keys
// ============================================================================

export const INTEGRATION_QUERY_KEYS = {
  changeOrders: {
    all: ['integration', 'changeOrders'] as const,
    byProject: (projectId: string) => ['integration', 'changeOrders', 'project', projectId] as const,
    detail: (id: string) => ['integration', 'changeOrders', 'detail', id] as const,
    lineItems: (coId: string) => ['integration', 'changeOrders', 'lineItems', coId] as const,
    budgetImpact: (projectId: string) => ['integration', 'budget', projectId] as const,
  },
  uncapturedWork: {
    byProject: (projectId: string) => ['integration', 'uncaptured', 'project', projectId] as const,
    allUnresolved: ['integration', 'uncaptured', 'unresolved'] as const,
  },
  observationLinks: {
    byObservation: (observationId: string) => ['integration', 'links', 'observation', observationId] as const,
    byKnowledgeItem: (knowledgeItemId: string) => ['integration', 'links', 'knowledgeItem', knowledgeItemId] as const,
  },
  callbacks: {
    byProject: (projectId: string) => ['integration', 'callbacks', 'project', projectId] as const,
  },
};

// ============================================================================
// Change Orders
// ============================================================================

export function useChangeOrders(projectId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: INTEGRATION_QUERY_KEYS.changeOrders.byProject(projectId),
    queryFn: () => services!.integration.changeOrders.getByProject(projectId),
    enabled: !isLoading && !!services && !!projectId,
  });
}

export function useChangeOrderWithLineItems(id: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: INTEGRATION_QUERY_KEYS.changeOrders.detail(id),
    queryFn: () => services!.integration.changeOrders.getWithLineItems(id),
    enabled: !isLoading && !!services && !!id,
  });
}

export function useChangeOrderLineItems(changeOrderId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: INTEGRATION_QUERY_KEYS.changeOrders.lineItems(changeOrderId),
    queryFn: () => services!.integration.changeOrders.getLineItems(changeOrderId),
    enabled: !isLoading && !!services && !!changeOrderId,
  });
}

export function useCreateChangeOrder() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      projectId: string;
      title: string;
      description: string;
      initiatorType: ChangeOrder['initiatorType'];
      initiatedBy: string;
      costImpact: number;
      scheduleImpactDays: number;
      createdBy: string;
    }) => services!.integration.changeOrders.createChangeOrder(data.projectId, {
      title: data.title,
      description: data.description,
      initiatorType: data.initiatorType,
      initiatedBy: data.initiatedBy,
      costImpact: data.costImpact,
      scheduleImpactDays: data.scheduleImpactDays,
      createdBy: data.createdBy,
    }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: INTEGRATION_QUERY_KEYS.changeOrders.byProject(result.projectId),
      });
    },
  });
}

export function useAddChangeOrderLineItem() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      changeOrderId: string;
      lineItem: Omit<ChangeOrderLineItem, 'id' | 'metadata' | 'changeOrderId' | 'taskTemplateIds'>;
    }) => services!.integration.changeOrders.addLineItem(data.changeOrderId, data.lineItem),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: INTEGRATION_QUERY_KEYS.changeOrders.lineItems(variables.changeOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: INTEGRATION_QUERY_KEYS.changeOrders.detail(variables.changeOrderId),
      });
    },
  });
}

export function useApproveChangeOrder() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; approvedBy: string }) =>
      services!.integration.changeOrders.approveChangeOrder(data.id, data.approvedBy),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: INTEGRATION_QUERY_KEYS.changeOrders.byProject(result.changeOrder.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: INTEGRATION_QUERY_KEYS.changeOrders.budgetImpact(result.changeOrder.projectId),
      });
    },
  });
}

export function useDeclineChangeOrder() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; reason: string }) =>
      services!.integration.changeOrders.declineChangeOrder(data.id, data.reason),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: INTEGRATION_QUERY_KEYS.changeOrders.byProject(result.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: INTEGRATION_QUERY_KEYS.changeOrders.budgetImpact(result.projectId),
      });
    },
  });
}

export function useSubmitForApproval() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      services!.integration.changeOrders.submitForApproval(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: INTEGRATION_QUERY_KEYS.changeOrders.byProject(result.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: INTEGRATION_QUERY_KEYS.changeOrders.detail(result.id),
      });
    },
  });
}

export function useCancelChangeOrder() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      services!.integration.changeOrders.cancelChangeOrder(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: INTEGRATION_QUERY_KEYS.changeOrders.byProject(result.projectId),
      });
    },
  });
}

export function useRemoveChangeOrderLineItem() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { changeOrderId: string; lineItemId: string }) =>
      services!.integration.changeOrders.removeLineItem(data.changeOrderId, data.lineItemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: INTEGRATION_QUERY_KEYS.changeOrders.lineItems(variables.changeOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: INTEGRATION_QUERY_KEYS.changeOrders.detail(variables.changeOrderId),
      });
    },
  });
}

// ============================================================================
// Project Budget (includes CO impact)
// ============================================================================

export function useProjectBudget(projectId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: INTEGRATION_QUERY_KEYS.changeOrders.budgetImpact(projectId),
    queryFn: () => services!.integration.changeOrders.getProjectBudgetImpact(projectId),
    enabled: !isLoading && !!services && !!projectId,
  });
}

// ============================================================================
// Uncaptured Work
// ============================================================================

export function useUncapturedWork(projectId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: INTEGRATION_QUERY_KEYS.uncapturedWork.byProject(projectId),
    queryFn: () => services!.integration.uncapturedWork.getUncapturedByProject(projectId),
    enabled: !isLoading && !!services && !!projectId,
  });
}

export function useAllUnresolvedUncaptured() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: INTEGRATION_QUERY_KEYS.uncapturedWork.allUnresolved,
    queryFn: () => services!.integration.uncapturedWork.getAllUnresolved(),
    enabled: !isLoading && !!services,
  });
}

export function useFlagUncaptured() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) =>
      services!.integration.uncapturedWork.flagAsUncaptured(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration', 'uncaptured'] });
    },
  });
}

export function useResolveUncaptured() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      taskId: string;
      resolution: 'converted_to_co' | 'absorbed' | 'deleted';
      resolvedBy: string;
    }) => services!.integration.uncapturedWork.resolveUncaptured(
      data.taskId, data.resolution, data.resolvedBy
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration', 'uncaptured'] });
    },
  });
}

// ============================================================================
// Observation Links (observation ↔ knowledge item)
// ============================================================================

export function useObservationLinks(observationId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: INTEGRATION_QUERY_KEYS.observationLinks.byObservation(observationId),
    queryFn: () => services!.labs.observationLinks.getObservationContext(observationId),
    enabled: !isLoading && !!services && !!observationId,
  });
}

export function useKnowledgeItemEvidence(knowledgeItemId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: INTEGRATION_QUERY_KEYS.observationLinks.byKnowledgeItem(knowledgeItemId),
    queryFn: () => services!.labs.observationLinks.getEvidenceForKnowledgeItem(knowledgeItemId),
    enabled: !isLoading && !!services && !!knowledgeItemId,
  });
}

export function useLinkObservation() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { observationId: string; knowledgeItemId: string; createdBy: string; notes?: string }) =>
      services!.labs.observationLinks.createManualLink(
        data.observationId, data.knowledgeItemId, data.createdBy, data.notes
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: INTEGRATION_QUERY_KEYS.observationLinks.byObservation(variables.observationId),
      });
      queryClient.invalidateQueries({
        queryKey: INTEGRATION_QUERY_KEYS.observationLinks.byKnowledgeItem(variables.knowledgeItemId),
      });
    },
  });
}

// ============================================================================
// Callback Projects
// ============================================================================

export function useCallbackProjects(originalProjectId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: INTEGRATION_QUERY_KEYS.callbacks.byProject(originalProjectId),
    queryFn: () => services!.integration.callbacks.getCallbacksForProject(originalProjectId),
    enabled: !isLoading && !!services && !!originalProjectId,
  });
}

export function useCreateCallbackProject() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      originalProjectId: string;
      reason: CallbackReason;
      name: string;
    }) => services!.integration.callbacks.createCallbackProject(
      data.originalProjectId, data.reason, data.name
    ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: INTEGRATION_QUERY_KEYS.callbacks.byProject(variables.originalProjectId),
      });
    },
  });
}
