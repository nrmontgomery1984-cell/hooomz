'use client';

/**
 * Quote Hooks — query and mutate quote records.
 * Reads from quotes IndexedDB store.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type { QuoteRecord, QuoteStatus, LineItem } from '@hooomz/shared-contracts';

// ============================================================================
// Query Keys
// ============================================================================

export const QUOTE_KEYS = {
  all: ['quotes'] as const,
  list: (filter?: QuoteStatus) => ['quotes', 'list', filter] as const,
  detail: (id: string) => ['quotes', 'detail', id] as const,
  byProject: (projectId: string) => ['quotes', 'project', projectId] as const,
  byCustomer: (customerId: string) => ['quotes', 'customer', customerId] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export function useQuotes(filter?: QuoteStatus) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: QUOTE_KEYS.list(filter),
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');
      if (filter) {
        return services.quotes.findByStatus(filter);
      }
      return services.quotes.findAll();
    },
    enabled: !servicesLoading && !!services,
    staleTime: 5_000,
  });
}

export function useQuote(id: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: QUOTE_KEYS.detail(id || ''),
    queryFn: async () => {
      if (!services || !id) return null;
      return services.quotes.findById(id);
    },
    enabled: !servicesLoading && !!services && !!id,
    staleTime: 5_000,
  });
}

export function useQuotesByProject(projectId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: QUOTE_KEYS.byProject(projectId || ''),
    queryFn: async () => {
      if (!services || !projectId) return [];
      return services.quotes.findByProject(projectId);
    },
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 5_000,
  });
}

export function useQuotesByCustomer(customerId: string | undefined) {
  const { services, isLoading: servicesLoading } = useServicesContext();

  return useQuery({
    queryKey: QUOTE_KEYS.byCustomer(customerId || ''),
    queryFn: async () => {
      if (!services || !customerId) return [];
      return services.quotes.findByCustomer(customerId);
    },
    enabled: !servicesLoading && !!services && !!customerId,
    staleTime: 5_000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateQuote() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<QuoteRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!services) throw new Error('Services not initialized');
      const record = await services.quotes.create(data);
      await services.activity.create({
        event_type: 'quote_created',
        project_id: record.projectId,
        entity_type: 'quote',
        entity_id: record.id,
        summary: `Quote created for $${record.totalAmount.toLocaleString()}`,
      });
      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.all });
    },
  });
}

export function useUpdateQuote() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<QuoteRecord, 'id' | 'createdAt'>> }) => {
      if (!services) throw new Error('Services not initialized');
      const record = await services.quotes.update(id, data);
      if (record) {
        await services.activity.create({
          event_type: 'quote_updated',
          project_id: record.projectId,
          entity_type: 'quote',
          entity_id: record.id,
          summary: 'Quote updated',
        });
      }
      return record;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(id) });
    },
  });
}

export function useSendQuote() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!services) throw new Error('Services not initialized');
      const record = await services.quotes.send(id);
      if (record) {
        await services.activity.create({
          event_type: 'quote_sent',
          project_id: record.projectId,
          entity_type: 'quote',
          entity_id: record.id,
          summary: `Quote sent to customer ($${record.totalAmount.toLocaleString()})`,
        });
      }
      return record;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(id) });
    },
  });
}

export function useMarkQuoteViewed() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!services) throw new Error('Services not initialized');
      const record = await services.quotes.markViewed(id);
      if (record) {
        await services.activity.create({
          event_type: 'quote_viewed',
          project_id: record.projectId,
          entity_type: 'quote',
          entity_id: record.id,
          summary: 'Quote viewed by customer',
        });
      }
      return record;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(id) });
    },
  });
}

export function useAcceptQuote() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!services) throw new Error('Services not initialized');
      const record = await services.quotes.accept(id);
      if (record) {
        await services.activity.create({
          event_type: 'quote_accepted',
          project_id: record.projectId,
          entity_type: 'quote',
          entity_id: record.id,
          summary: `Quote accepted ($${record.totalAmount.toLocaleString()})`,
        });

        // Auto-generate labour hours budgets from quoted labour line items
        await generateLabourHoursBudgets(services, record.projectId);
      }
      return record;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['crew', 'budget'] });
      queryClient.invalidateQueries({ queryKey: ['taskBudgets'] });
    },
  });
}

/**
 * After quote acceptance, read labour line items, match to tasks by sopCode,
 * and create TaskBudget records with planned hours from the reverse formula.
 */
async function generateLabourHoursBudgets(
  services: NonNullable<ReturnType<typeof useServicesContext>['services']>,
  projectId: string,
): Promise<void> {
  try {
    // 1. Read labour line items for this project
    const lineItems = await services.estimating.lineItems.findByProjectId(projectId);

    // Primary: items explicitly flagged as labour
    let labourItems = lineItems.filter((li: LineItem) => li.isLabor && li.totalCost > 0);

    // Fallback: if no isLabor items, use items with sopCodes (task-producing lines)
    // or items with source='labour_estimation', or category='labor'
    if (labourItems.length === 0) {
      labourItems = lineItems.filter((li: LineItem) =>
        li.totalCost > 0 && (
          (li.sopCodes && li.sopCodes.length > 0) ||
          li.source === 'labour_estimation' ||
          li.category === 'labor'
        )
      );
    }

    // Last resort: if estimate has line items but none match labour criteria,
    // treat ALL items with sopCodes as labour (they were generated from trade SOPs)
    if (labourItems.length === 0) {
      labourItems = lineItems.filter((li: LineItem) => li.totalCost > 0);
    }

    if (labourItems.length === 0) return;

    // 2. Read tasks for this project
    const tasks = await services.scheduling.tasks.findByProjectId(projectId);
    if (tasks.length === 0) return;

    // 3. Try SOP-based matching first
    let anyMatched = false;
    for (const li of labourItems) {
      const sopCodes = li.sopCodes ?? [];

      const matchingTasks = sopCodes.length > 0
        ? tasks.filter((t) => sopCodes.includes(t.sopCode ?? ''))
        : [];

      if (matchingTasks.length > 0) {
        anyMatched = true;
        const amountPerTask = li.totalCost / matchingTasks.length;

        for (const task of matchingTasks) {
          const minSkillLevel = (task as Record<string, unknown>).minSkillLevel as number ?? 0;
          const hoursBudget = await services.labourEstimation.computeHoursBudgetFromQuote(
            amountPerTask,
            minSkillLevel,
            undefined,
            li.workCategoryCode ?? undefined,
          );

          await services.budget.createFromQuotedLabour(
            task.id,
            projectId,
            task.sopCode ?? '',
            hoursBudget,
          );
        }
      }
    }

    // 4. Fallback: if no SOP-based matching worked, distribute total labour evenly across all tasks
    if (!anyMatched) {
      const totalLabour = labourItems.reduce((sum, li) => sum + li.totalCost, 0);
      const amountPerTask = totalLabour / tasks.length;

      for (const task of tasks) {
        const minSkillLevel = (task as Record<string, unknown>).minSkillLevel as number ?? 0;
        const hoursBudget = await services.labourEstimation.computeHoursBudgetFromQuote(
          amountPerTask,
          minSkillLevel,
        );

        await services.budget.createFromQuotedLabour(
          task.id,
          projectId,
          task.sopCode ?? '',
          hoursBudget,
        );
      }
    }
  } catch (err) {
    console.error('Failed to generate labour hours budgets:', err);
  }
}

/**
 * Backfill labour hours budgets for an existing project.
 * Use when a project was approved before the auto-generation code was deployed.
 */
export function useBackfillLabourBudgets() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      if (!services) throw new Error('Services not initialized');
      console.log('[BackfillBudget] Starting for project:', projectId);
      await generateLabourHoursBudgets(services, projectId);
      console.log('[BackfillBudget] Complete');
    },
    onSuccess: () => {
      console.log('[BackfillBudget] Invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['crew', 'budget'] });
      queryClient.invalidateQueries({ queryKey: ['taskBudgets'] });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.all });
    },
    onError: (err) => {
      console.error('[BackfillBudget] Error:', err);
    },
  });
}

export function useDeclineQuote() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!services) throw new Error('Services not initialized');
      const record = await services.quotes.decline(id, reason);
      if (record) {
        await services.activity.create({
          event_type: 'quote_declined',
          project_id: record.projectId,
          entity_type: 'quote',
          entity_id: record.id,
          summary: `Quote declined${reason ? `: ${reason}` : ''}`,
        });
      }
      return record;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(id) });
    },
  });
}
