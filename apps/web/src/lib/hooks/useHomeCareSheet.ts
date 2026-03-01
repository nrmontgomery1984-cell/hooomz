'use client';

/**
 * useHomeCareSheet — Assembles HomeCareSheetData from existing project data.
 *
 * Derived view (no new store): merges tasks, line items, customer record,
 * and config-based care instructions into a single care sheet object.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocalProject, useLocalCustomer, useLocalTasks } from './useLocalData';
import { useServicesContext } from '../services/ServicesContext';
import { getCareConfigForTrades } from '../config/careInstructions';
import { enrichTask } from '../utils/taskParsing';
import { WorkCategory } from '@hooomz/shared-contracts';
import type { LineItem } from '@hooomz/shared-contracts';
import type { HomeCareSheetData, CareTradeSection, MaterialEntry } from '../types/homeCareSheet.types';

// ============================================================================
// Constants
// ============================================================================

const BUSINESS_INFO = {
  businessName: 'Hooomz Interiors',
  businessPhone: '(506) 555-0123',
  businessEmail: 'hello@hooomz.ca',
};

// ============================================================================
// Hook
// ============================================================================

export function useHomeCareSheet(projectId: string, customerId: string | undefined) {
  const { data: project } = useLocalProject(projectId);
  const { data: taskData } = useLocalTasks(projectId);
  const { data: customer } = useLocalCustomer(customerId);
  const { services, isLoading: servicesLoading } = useServicesContext();

  // Fetch line items via services (not a dedicated hook — matches existing patterns)
  const { data: lineItems } = useQuery({
    queryKey: ['local', 'lineItems', 'project', projectId],
    queryFn: async () => {
      if (!services) return [];
      return services.estimating.lineItems.findByProjectId(projectId);
    },
    enabled: !servicesLoading && !!services && !!projectId,
    staleTime: 5_000,
  });

  const careSheet = useMemo<HomeCareSheetData | null>(() => {
    if (!project || !taskData) return null;

    const tasks = taskData.tasks ?? [];
    const items: LineItem[] = lineItems ?? [];

    // -----------------------------------------------------------------------
    // 1. Detect trades from tasks (enrichTask parses tradeCode from description)
    // -----------------------------------------------------------------------
    const tradeCodesFromTasks = new Set<string>();
    for (const task of tasks) {
      const enriched = enrichTask(task);
      if (enriched.tradeCode) {
        tradeCodesFromTasks.add(enriched.tradeCode);
      }
    }

    // Also detect trades from line items
    for (const item of items) {
      if (item.workCategoryCode) {
        tradeCodesFromTasks.add(item.workCategoryCode);
      }
    }

    const tradeCodes = [...tradeCodesFromTasks] as WorkCategory[];

    // -----------------------------------------------------------------------
    // 2. Group line items by trade + collect locations
    // -----------------------------------------------------------------------
    const tradeItems = new Map<string, LineItem[]>();
    const tradeLocations = new Map<string, Set<string>>();

    for (const item of items) {
      const code = item.workCategoryCode;
      if (!code) continue;

      if (!tradeItems.has(code)) tradeItems.set(code, []);
      tradeItems.get(code)!.push(item);

      if (item.locationLabel) {
        if (!tradeLocations.has(code)) tradeLocations.set(code, new Set());
        tradeLocations.get(code)!.add(item.locationLabel);
      }
    }

    // Also collect locations from task room parsing
    for (const task of tasks) {
      const enriched = enrichTask(task);
      if (enriched.tradeCode && enriched.room) {
        if (!tradeLocations.has(enriched.tradeCode)) tradeLocations.set(enriched.tradeCode, new Set());
        tradeLocations.get(enriched.tradeCode)!.add(enriched.room);
      }
    }

    // -----------------------------------------------------------------------
    // 3. Get care config and build trade sections
    // -----------------------------------------------------------------------
    const careConfigs = getCareConfigForTrades(tradeCodes);

    const tradeSections: CareTradeSection[] = careConfigs.map(({ code, config }) => {
      const lineItemsForTrade = tradeItems.get(code) ?? [];
      const materialItems = lineItemsForTrade.filter((li) => !li.isLabor);

      const materialsInstalled: MaterialEntry[] = materialItems.map((li) => ({
        description: li.description,
        location: li.locationLabel,
        quantity: li.quantity,
        unit: li.unit,
      }));

      const locations = tradeLocations.get(code);

      return {
        tradeCode: code,
        tradeName: config.tradeName,
        locationsWorked: locations ? [...locations].sort() : [],
        materialsInstalled,
        careInstructions: config.careInstructions,
        thingsToAvoid: config.thingsToAvoid,
        warrantyNotes: config.warrantyNotes,
      };
    });

    // -----------------------------------------------------------------------
    // 4. Compute totals
    // -----------------------------------------------------------------------
    let totalMaterialsCost = 0;
    let totalLabourCost = 0;
    for (const item of items) {
      if (item.isLabor) {
        totalLabourCost += item.totalCost;
      } else {
        totalMaterialsCost += item.totalCost;
      }
    }

    // -----------------------------------------------------------------------
    // 5. Dates
    // -----------------------------------------------------------------------
    const completionDate = project.dates?.estimatedEndDate || new Date().toISOString().split('T')[0];
    const warrantyExpiry = new Date(completionDate);
    warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + 1);
    const warrantyExpiryDate = warrantyExpiry.toISOString().split('T')[0];

    // -----------------------------------------------------------------------
    // 6. Assemble
    // -----------------------------------------------------------------------
    return {
      projectId,
      projectName: project.name || 'Untitled Project',
      propertyAddress: customer && 'address' in customer
        ? `${(customer as unknown as { address: { street: string; city: string } }).address.street}, ${(customer as unknown as { address: { street: string; city: string } }).address.city}`
        : project.address
          ? `${project.address.street}, ${project.address.city}`
          : '',
      customerName: customer ? `${customer.firstName} ${customer.lastName}` : '',
      customerPhone: customer?.phone || '',
      customerEmail: customer?.email || '',
      completionDate,
      warrantyExpiryDate,
      tradeSections,
      totalMaterialsCost,
      totalLabourCost,
      ...BUSINESS_INFO,
    };
  }, [project, taskData, lineItems, customer, projectId]);

  return careSheet;
}
