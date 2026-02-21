/**
 * Financial Actuals Service
 * Reads from existing stores and derives financial summaries.
 * Never writes to source stores.
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import type { FinancialActuals, ProjectFinancialSummary } from '../types/forecast.types';

// Lightweight interfaces for the data we read (avoids importing heavy schemas)
interface ProjectRecord {
  id: string;
  name: string;
  status: string;
  actual_end_date: string | null;
  start_date: string | null;
  created_at: string;
}

interface LineItemRecord {
  id: string;
  projectId: string;
  totalCost: number;
  isLabor: boolean;
}

interface TimeEntryRecord {
  id: string;
  project_id: string;
  team_member_id: string;
  clock_in: string;
  clock_out: string | null;
  total_hours: number | null;
  hourly_rate: number;
}

interface ChangeOrderRecord {
  id: string;
  projectId: string;
  status: string;
  costImpact: number;
  metadata?: { createdAt?: string };
}

interface TaskBudgetRecord {
  id: string;
  projectId: string;
  actualMaterialCost: number;
}

interface CrewMemberRecord {
  id: string;
  name: string;
  tier: string;
}

export class FinancialActualsService {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  async computeActuals(dateRange: { from: string; to: string }): Promise<FinancialActuals> {
    // Load all data in parallel
    const [projects, lineItems, timeEntries, changeOrders, taskBudgets, crewMembers] = await Promise.all([
      this.storage.getAll<ProjectRecord>(StoreNames.PROJECTS),
      this.storage.getAll<LineItemRecord>(StoreNames.LINE_ITEMS),
      this.storage.getAll<TimeEntryRecord>(StoreNames.TIME_ENTRIES),
      this.storage.getAll<ChangeOrderRecord>(StoreNames.CHANGE_ORDERS),
      this.storage.getAll<TaskBudgetRecord>(StoreNames.TASK_BUDGETS),
      this.storage.getAll<CrewMemberRecord>(StoreNames.CREW_MEMBERS),
    ]);

    const from = dateRange.from;
    const to = dateRange.to;

    // Identify Nathan and Nishant from crew members
    const { nathanId, nishantId } = this.identifyCrew(crewMembers);

    // Build line item lookup by project
    const lineItemsByProject = new Map<string, LineItemRecord[]>();
    for (const li of lineItems) {
      if (!lineItemsByProject.has(li.projectId)) {
        lineItemsByProject.set(li.projectId, []);
      }
      lineItemsByProject.get(li.projectId)!.push(li);
    }

    // Calculate revenue per project
    const projectRevenue = new Map<string, number>();
    for (const [projectId, items] of lineItemsByProject) {
      projectRevenue.set(projectId, items.reduce((sum, li) => sum + li.totalCost, 0));
    }

    // Filter projects by date range and status
    const completedInRange = projects.filter((p) =>
      p.status === 'complete' && this.isInRange(p.actual_end_date || p.created_at, from, to)
    );
    const inProgressProjects = projects.filter((p) => p.status === 'in_progress');
    const pipelineProjects = projects.filter((p) =>
      p.status === 'quoted' || p.status === 'approved'
    );

    // Revenue calculations
    const completedProjectRevenue = completedInRange.reduce(
      (sum, p) => sum + (projectRevenue.get(p.id) || 0), 0
    );
    const inProgressRevenue = inProgressProjects.reduce(
      (sum, p) => sum + (projectRevenue.get(p.id) || 0), 0
    );

    // Approved change orders in range
    const approvedCOs = changeOrders.filter(
      (co) => co.status === 'approved' && this.isInRange(co.metadata?.createdAt || '', from, to)
    );
    const changeOrderRevenue = approvedCOs.reduce((sum, co) => sum + co.costImpact, 0);

    const totalRevenue = completedProjectRevenue + changeOrderRevenue;

    // Pipeline
    const pipelineValue = pipelineProjects.reduce(
      (sum, p) => sum + (projectRevenue.get(p.id) || 0), 0
    );

    // Time entries in range
    const entriesInRange = timeEntries.filter((te) => this.isInRange(te.clock_in, from, to));

    const nathanEntries = entriesInRange.filter((te) => te.team_member_id === nathanId);
    const nishantEntries = entriesInRange.filter((te) => te.team_member_id === nishantId);

    const nathanHours = nathanEntries.reduce((sum, te) => sum + (te.total_hours || 0), 0);
    const nishantHours = nishantEntries.reduce((sum, te) => sum + (te.total_hours || 0), 0);
    const nathanLaborCost = nathanEntries.reduce(
      (sum, te) => sum + (te.total_hours || 0) * te.hourly_rate, 0
    );
    const nishantLaborCost = nishantEntries.reduce(
      (sum, te) => sum + (te.total_hours || 0) * te.hourly_rate, 0
    );
    const totalLaborCost = nathanLaborCost + nishantLaborCost;

    // Material costs from task budgets
    const completedProjectIds = new Set(completedInRange.map((p) => p.id));
    const relevantBudgets = taskBudgets.filter((tb) => completedProjectIds.has(tb.projectId));
    const materialCost = relevantBudgets.reduce(
      (sum, tb) => sum + (tb.actualMaterialCost || 0), 0
    );

    const grossProfit = totalRevenue - totalLaborCost - materialCost;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const completedProjectCount = completedInRange.length;
    const avgJobValue = completedProjectCount > 0 ? totalRevenue / completedProjectCount : 0;

    // Check for projects with no line items (data quality)
    const unresolvedProjectCount = completedInRange.filter(
      (p) => !lineItemsByProject.has(p.id) || lineItemsByProject.get(p.id)!.length === 0
    ).length;

    // Project breakdown
    const allRelevantProjects = [...completedInRange, ...inProgressProjects];
    const projectBreakdown: ProjectFinancialSummary[] = allRelevantProjects.map((p) => {
      const rev = projectRevenue.get(p.id) || 0;
      const pEntries = entriesInRange.filter((te) => te.project_id === p.id);
      const pNathanHrs = pEntries.filter((te) => te.team_member_id === nathanId)
        .reduce((s, te) => s + (te.total_hours || 0), 0);
      const pNishantHrs = pEntries.filter((te) => te.team_member_id === nishantId)
        .reduce((s, te) => s + (te.total_hours || 0), 0);
      const pLabor = pEntries.reduce((s, te) => s + (te.total_hours || 0) * te.hourly_rate, 0);
      const pMaterial = taskBudgets
        .filter((tb) => tb.projectId === p.id)
        .reduce((s, tb) => s + (tb.actualMaterialCost || 0), 0);
      const pGross = rev - pLabor - pMaterial;
      return {
        projectId: p.id,
        projectName: p.name,
        status: p.status,
        completedDate: p.actual_end_date,
        revenue: rev,
        laborCost: pLabor,
        materialCost: pMaterial,
        grossProfit: pGross,
        marginPct: rev > 0 ? (pGross / rev) * 100 : 0,
        nathanHours: pNathanHrs,
        nishantHours: pNishantHrs,
      };
    });

    return {
      period: dateRange,
      completedProjectRevenue,
      inProgressRevenue,
      changeOrderRevenue,
      totalRevenue,
      pipelineValue,
      pipelineCount: pipelineProjects.length,
      nathanLaborCost,
      nishantLaborCost,
      totalLaborCost,
      nathanHours,
      nishantHours,
      totalHours: nathanHours + nishantHours,
      materialCost,
      grossProfit,
      grossMarginPct,
      avgJobValue,
      completedProjectCount,
      projectBreakdown,
      unresolvedProjectCount,
    };
  }

  private identifyCrew(members: CrewMemberRecord[]): { nathanId: string; nishantId: string } {
    // Primary match: by name (most reliable)
    const nathan = members.find((m) => m.name.toLowerCase().includes('nathan'));
    const nishant = members.find((m) => m.name.toLowerCase().includes('nishant'));

    // Fallback: by tier
    const masterFallback = members.find((m) => m.tier === 'master');
    const learnerFallback = members.find((m) => m.tier === 'learner');

    // Stable fallback IDs for seeded crew
    return {
      nathanId: nathan?.id || masterFallback?.id || 'crew_nathan',
      nishantId: nishant?.id || learnerFallback?.id || 'crew_nishant',
    };
  }

  private isInRange(dateStr: string, from: string, to: string): boolean {
    if (!dateStr) return false;
    const d = dateStr.substring(0, 10); // YYYY-MM-DD
    return d >= from.substring(0, 10) && d <= to.substring(0, 10);
  }
}
