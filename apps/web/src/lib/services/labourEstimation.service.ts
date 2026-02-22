/**
 * Labour Estimation Service
 *
 * Pure calculation engine: given a task + quantity, computes sell budget,
 * cost budget, budgeted hours at optimal skill rate, and scheduling variance.
 *
 * Core formula:
 *   sellBudget    = quantity × catalogueSellRate
 *   costBudget    = sellBudget / (1 + margin)
 *   budgetedHours = costBudget / skillLevel.costRate
 *
 * Variance sign convention:
 *   positive = over budget = bad
 *   negative = under budget = good
 */

import type { DeployedTask } from '@hooomz/shared-contracts';
import type { SkillRateConfigRepository } from '../repositories/skillRateConfig.repository';
import type { DeployedTaskRepository } from '../repositories/deployedTask.repository';
import type { SopTaskBlueprintRepository } from '../repositories/sopTaskBlueprint.repository';
import type { CrewMemberRepository } from '../repositories/crewMember.repository';
import type { ActivityService } from '../repositories/activity.repository';
import type {
  EstimateParams,
  TaskLabourEstimate,
  ProjectVarianceSummary,
  CrewVarianceRecord,
} from '../types/labourEstimation.types';
import { round2 } from '../types/labourEstimation.types';

export class LabourEstimationService {
  constructor(
    private configRepo: SkillRateConfigRepository,
    private deployedTaskRepo: DeployedTaskRepository,
    private blueprintRepo: SopTaskBlueprintRepository,
    private crewRepo: CrewMemberRepository,
    private activity: ActivityService,
  ) {}

  /**
   * Core calculation. Returns the full estimate breakdown for a task.
   * Takes a snapshot of current rates — does NOT store anything.
   */
  async calculateTaskEstimate(params: EstimateParams): Promise<TaskLabourEstimate> {
    const config = await this.configRepo.get();
    const margin = this.configRepo.resolveMarginTarget(
      config,
      params.projectType,
      params.tradeCategory,
    );
    const skillLevel = this.configRepo.getSkillLevel(config, params.minSkillLevel);

    const sellBudget = params.quantity * params.catalogueSellRate;
    const costBudget = sellBudget / (1 + margin);
    const budgetedHours = costBudget / skillLevel.costRate;

    return {
      quantity: params.quantity,
      unit: params.unit,
      sellBudget: round2(sellBudget),
      costBudget: round2(costBudget),
      budgetedHours: round2(budgetedHours),
      optimalSkillLevel: params.minSkillLevel,
      optimalCostRate: skillLevel.costRate,
      marginApplied: margin,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate and SAVE the estimate onto a deployed task.
   * Logs a labour.estimate_applied activity event.
   */
  async applyEstimateToTask(
    deployedTaskId: string,
    params: EstimateParams,
  ): Promise<DeployedTask | null> {
    const estimate = await this.calculateTaskEstimate(params);

    const updated = await this.deployedTaskRepo.update(deployedTaskId, {
      labourEstimate: estimate,
    });

    if (updated) {
      this.activity.logLabourEvent(
        'labour.estimate_applied',
        'org_level',
        deployedTaskId,
        {
          sell_budget: estimate.sellBudget,
          cost_budget: estimate.costBudget,
          budgeted_hours: estimate.budgetedHours,
          skill_level: estimate.optimalSkillLevel,
          margin: estimate.marginApplied,
        },
      ).catch((err) => console.error('Failed to log labour estimate event:', err));
    }

    return updated;
  }

  /**
   * Record crew assignment. Snapshots the crew member's cost rate.
   * Does not calculate variance yet — actual hours aren't known.
   */
  async assignCrew(
    deployedTaskId: string,
    crewMemberId: string,
  ): Promise<DeployedTask | null> {
    const crewMember = await this.crewRepo.findById(crewMemberId);
    if (!crewMember) return null;

    const updated = await this.deployedTaskRepo.update(deployedTaskId, {
      labourActual: {
        assignedCrewMemberId: crewMemberId,
        assignedCostRate: crewMember.wageRate,
        actualHours: null,
        actualCost: null,
        schedulingVariance: null,
      },
    });

    if (updated) {
      // Check for overstaffing
      const estimate = updated.labourEstimate;
      let variantReason: string | undefined;
      if (estimate && crewMember.wageRate > estimate.optimalCostRate) {
        variantReason = `Assigned at $${crewMember.wageRate}/hr vs optimal $${estimate.optimalCostRate}/hr`;
        // Update with the variant reason
        await this.deployedTaskRepo.update(deployedTaskId, {
          labourActual: {
            ...updated.labourActual!,
            variantReason,
          },
        });
      }

      this.activity.logLabourEvent(
        'labour.crew_assigned',
        'org_level',
        deployedTaskId,
        {
          crew_member_id: crewMemberId,
          crew_name: crewMember.name,
          cost_rate: crewMember.wageRate,
          variant_reason: variantReason,
        },
      ).catch((err) => console.error('Failed to log crew assignment event:', err));
    }

    return updated;
  }

  /**
   * Record actual hours and calculate final variance.
   * Call when a task is marked complete.
   * Fires variance_warning if >15% over budget.
   */
  async recordActualHours(
    deployedTaskId: string,
    actualHours: number,
  ): Promise<DeployedTask | null> {
    const deployed = await this.deployedTaskRepo.findById(deployedTaskId);
    if (!deployed) return null;

    const estimate = deployed.labourEstimate;
    const actual = deployed.labourActual;
    if (!actual) return null;

    const actualCost = round2(actualHours * actual.assignedCostRate);
    const schedulingVariance = estimate
      ? round2(actualCost - estimate.costBudget)
      : null;

    const updated = await this.deployedTaskRepo.update(deployedTaskId, {
      labourActual: {
        ...actual,
        actualHours: round2(actualHours),
        actualCost,
        schedulingVariance,
      },
    });

    if (updated) {
      this.activity.logLabourEvent(
        'labour.hours_recorded',
        'org_level',
        deployedTaskId,
        {
          actual_hours: actualHours,
          actual_cost: actualCost,
          budgeted_hours: estimate?.budgetedHours,
          scheduling_variance: schedulingVariance ?? undefined,
        },
      ).catch((err) => console.error('Failed to log hours event:', err));

      // Fire variance warning if >15% over cost budget
      if (estimate && schedulingVariance !== null && estimate.costBudget > 0) {
        const overPct = (schedulingVariance / estimate.costBudget) * 100;
        if (overPct > 15) {
          this.activity.logLabourEvent(
            'labour.variance_warning',
            'org_level',
            deployedTaskId,
            {
              actual_cost: actualCost,
              cost_budget: estimate.costBudget,
              variance_pct: round2(overPct),
              scheduling_variance: schedulingVariance,
            },
          ).catch((err) => console.error('Failed to log variance warning:', err));
        }
      }
    }

    return updated;
  }

  /**
   * Recalculate all open task estimates for a project.
   * Use when margin targets or skill rates change.
   * Returns count of tasks updated.
   */
  async recalculateProjectEstimates(projectId: string): Promise<number> {
    const blueprints = await this.blueprintRepo.findByProject(projectId);
    const deployedBlueprintIds = blueprints
      .filter((b) => b.status === 'deployed')
      .map((b) => b.id);

    const deployedTasks = await this.deployedTaskRepo.findByProjectBlueprints(deployedBlueprintIds);
    let updated = 0;

    for (const dt of deployedTasks) {
      const estimate = dt.labourEstimate;
      if (!estimate) continue;

      // Re-read the blueprint to get current minSkillLevel
      const blueprint = blueprints.find((b) => b.id === dt.blueprintId);
      if (!blueprint) continue;

      const newEstimate = await this.calculateTaskEstimate({
        catalogueSellRate: estimate.sellBudget / estimate.quantity,
        quantity: estimate.quantity,
        unit: estimate.unit,
        minSkillLevel: blueprint.minSkillLevel ?? 0,
      });

      await this.deployedTaskRepo.update(dt.id, {
        labourEstimate: newEstimate,
      });

      updated++;
    }

    if (updated > 0) {
      this.activity.logLabourEvent(
        'labour.estimates_recalculated',
        projectId,
        projectId,
        { tasks_updated: updated },
      ).catch((err) => console.error('Failed to log recalculation event:', err));
    }

    return updated;
  }

  /**
   * Get labour data for a specific deployed task.
   * Used by hooks to read estimate/actual without accessing private fields.
   */
  async getDeployedTaskLabourData(deployedTaskId: string): Promise<{
    estimate: DeployedTask['labourEstimate'];
    actual: DeployedTask['labourActual'];
  } | null> {
    const dt = await this.deployedTaskRepo.findById(deployedTaskId);
    if (!dt) return null;
    return {
      estimate: dt.labourEstimate ?? null,
      actual: dt.labourActual ?? null,
    };
  }

  /**
   * Get scheduling variance summary for a project.
   * Used by the finance dashboard.
   */
  async getProjectVarianceSummary(projectId: string): Promise<ProjectVarianceSummary> {
    const blueprints = await this.blueprintRepo.findByProject(projectId);
    const deployedBlueprintIds = blueprints
      .filter((b) => b.status === 'deployed')
      .map((b) => b.id);

    const deployedTasks = await this.deployedTaskRepo.findByProjectBlueprints(deployedBlueprintIds);

    let totalSellBudget = 0;
    let totalCostBudget = 0;
    let totalActualCost = 0;
    let totalBudgetedHours = 0;
    let totalActualHours = 0;
    let hasIncomplete = false;
    const varianceByCrewMap = new Map<string, { name: string; variance: number; count: number }>();
    const tasksWithoutEstimate: string[] = [];

    for (const dt of deployedTasks) {
      const estimate = dt.labourEstimate;
      const actual = dt.labourActual;

      if (!estimate) {
        tasksWithoutEstimate.push(dt.taskId);
        continue;
      }

      totalSellBudget += estimate.sellBudget;
      totalCostBudget += estimate.costBudget;
      totalBudgetedHours += estimate.budgetedHours;

      if (actual?.actualCost !== null && actual?.actualCost !== undefined) {
        totalActualCost += actual.actualCost;
        totalActualHours += actual.actualHours ?? 0;

        if (actual.schedulingVariance !== null && actual.schedulingVariance !== undefined) {
          const existing = varianceByCrewMap.get(actual.assignedCrewMemberId);
          if (existing) {
            existing.variance += actual.schedulingVariance;
            existing.count++;
          } else {
            varianceByCrewMap.set(actual.assignedCrewMemberId, {
              name: actual.assignedCrewMemberId, // will be resolved below
              variance: actual.schedulingVariance,
              count: 1,
            });
          }
        }
      } else {
        hasIncomplete = true;
      }
    }

    // Resolve crew member names
    const varianceByCrewMember = [];
    for (const [crewId, data] of varianceByCrewMap) {
      const crew = await this.crewRepo.findById(crewId);
      varianceByCrewMember.push({
        crewMemberId: crewId,
        crewMemberName: crew?.name ?? crewId,
        totalVariance: round2(data.variance),
        taskCount: data.count,
      });
    }

    const completedActualCost = hasIncomplete ? null : round2(totalActualCost);
    const completedActualHours = hasIncomplete ? null : round2(totalActualHours);

    return {
      totalSellBudget: round2(totalSellBudget),
      totalCostBudget: round2(totalCostBudget),
      totalActualCost: completedActualCost,
      totalVariance: completedActualCost !== null
        ? round2(completedActualCost - totalCostBudget)
        : null,
      varianceByCrewMember,
      tasksWithoutEstimate,
      totalBudgetedHours: round2(totalBudgetedHours),
      totalActualHours: completedActualHours,
      overallEfficiency: completedActualHours && completedActualHours > 0
        ? round2((totalBudgetedHours / completedActualHours) * 100)
        : null,
    };
  }

  /**
   * Get crew performance data for variance analysis.
   */
  async getCrewVarianceHistory(crewMemberId: string): Promise<CrewVarianceRecord[]> {
    const allDeployed = await this.deployedTaskRepo.findAll();
    const records: CrewVarianceRecord[] = [];

    for (const dt of allDeployed) {
      const actual = dt.labourActual;
      const estimate = dt.labourEstimate;

      if (
        actual?.assignedCrewMemberId !== crewMemberId ||
        actual?.actualHours === null ||
        actual?.actualHours === undefined ||
        !estimate
      ) {
        continue;
      }

      // Find the blueprint to get projectId
      const blueprint = await this.blueprintRepo.findById(dt.blueprintId);
      if (!blueprint) continue;

      records.push({
        taskId: dt.taskId,
        deployedTaskId: dt.id,
        projectId: blueprint.projectId,
        taskName: blueprint.name,
        budgetedHours: estimate.budgetedHours,
        actualHours: actual.actualHours,
        hoursVariance: round2(actual.actualHours - estimate.budgetedHours),
        schedulingVariance: actual.schedulingVariance ?? 0,
        completedAt: estimate.calculatedAt,
      });
    }

    return records.sort((a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  }
}

export function createLabourEstimationService(
  configRepo: SkillRateConfigRepository,
  deployedTaskRepo: DeployedTaskRepository,
  blueprintRepo: SopTaskBlueprintRepository,
  crewRepo: CrewMemberRepository,
  activity: ActivityService,
): LabourEstimationService {
  return new LabourEstimationService(configRepo, deployedTaskRepo, blueprintRepo, crewRepo, activity);
}
