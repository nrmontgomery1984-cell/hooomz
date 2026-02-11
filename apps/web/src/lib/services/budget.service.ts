/**
 * Budget Service (Build 3c)
 *
 * Estimate → Budget conversion. Auto-creates TaskBudget when a blueprint deploys.
 * Auto-updates actuals from time clock entries.
 */

import type { TaskBudget, SopTaskBlueprint, DeployedTask } from '@hooomz/shared-contracts';
import type { TaskBudgetRepository } from '../repositories/taskBudget.repository';
import type { ActivityService } from '../repositories/activity.repository';

export class BudgetService {
  constructor(
    private budgetRepo: TaskBudgetRepository,
    private activity: ActivityService,
  ) {}

  /**
   * Auto-create a TaskBudget when a blueprint is deployed.
   * Called from the pipeline service after deploying a task.
   */
  async createFromDeployment(
    deployedTask: DeployedTask,
    blueprint: SopTaskBlueprint,
    projectId: string,
    crewWageRate: number,
    chargedRate: number,
  ): Promise<TaskBudget> {
    const budgetedHours = blueprint.estimatedHoursPerUnit * blueprint.totalUnits;

    const budget = await this.budgetRepo.create({
      taskId: deployedTask.taskId,
      blueprintId: blueprint.id,
      projectId,
      sopCode: blueprint.sopCode,
      budgetedHours,
      actualHours: 0,
      budgetedMaterialCost: 0,
      actualMaterialCost: 0,
      crewWageRate,
      chargedRate,
      efficiency: null,
      status: 'active',
    });

    this.activity.logBudgetEvent('budget.created', projectId, budget.id, {
      task_id: deployedTask.taskId,
      sop_code: blueprint.sopCode,
      budgeted_hours: budgetedHours,
      wage_rate: crewWageRate,
      charged_rate: chargedRate,
    }).catch((err) => console.error('Failed to log budget event:', err));

    return budget;
  }

  /**
   * Update actual hours from a time clock entry.
   * Called when time is logged against a task.
   */
  async updateActualHours(taskId: string, totalActualHours: number): Promise<TaskBudget | null> {
    const budget = await this.budgetRepo.findByTask(taskId);
    if (!budget) return null;

    const efficiency = budget.budgetedHours > 0
      ? Math.round((budget.budgetedHours / totalActualHours) * 100)
      : null;

    const status: TaskBudget['status'] = totalActualHours > budget.budgetedHours * 1.1
      ? 'over_budget'
      : budget.status === 'complete'
        ? 'complete'
        : 'active';

    const updated = await this.budgetRepo.update(budget.id, {
      actualHours: totalActualHours,
      efficiency,
      status,
    });

    if (updated && status === 'over_budget' && budget.status !== 'over_budget') {
      this.activity.logBudgetEvent('budget.over_budget', budget.projectId, budget.id, {
        task_id: taskId,
        sop_code: budget.sopCode,
        budgeted_hours: budget.budgetedHours,
        actual_hours: totalActualHours,
        efficiency,
      }).catch((err) => console.error('Failed to log budget event:', err));
    }

    return updated;
  }

  /**
   * Mark a task budget as complete.
   * Called when task status changes to 'complete'.
   */
  async complete(taskId: string): Promise<TaskBudget | null> {
    const budget = await this.budgetRepo.findByTask(taskId);
    if (!budget) return null;

    const updated = await this.budgetRepo.update(budget.id, {
      status: 'complete',
    });

    if (updated) {
      this.activity.logBudgetEvent('budget.completed', budget.projectId, budget.id, {
        task_id: taskId,
        sop_code: budget.sopCode,
        budgeted_hours: budget.budgetedHours,
        actual_hours: budget.actualHours,
        efficiency: budget.efficiency,
      }).catch((err) => console.error('Failed to log budget event:', err));
    }

    return updated;
  }

  /**
   * Get budget summary for a project.
   */
  async getProjectBudgetSummary(projectId: string): Promise<{
    totalBudgets: number;
    totalBudgetedHours: number;
    totalActualHours: number;
    overallEfficiency: number | null;
    overBudgetCount: number;
    completedCount: number;
    budgets: TaskBudget[];
  }> {
    const budgets = await this.budgetRepo.findByProject(projectId);
    const totalBudgetedHours = budgets.reduce((sum, b) => sum + b.budgetedHours, 0);
    const totalActualHours = budgets.reduce((sum, b) => sum + b.actualHours, 0);

    return {
      totalBudgets: budgets.length,
      totalBudgetedHours,
      totalActualHours,
      overallEfficiency: totalActualHours > 0
        ? Math.round((totalBudgetedHours / totalActualHours) * 100)
        : null,
      overBudgetCount: budgets.filter((b) => b.status === 'over_budget').length,
      completedCount: budgets.filter((b) => b.status === 'complete').length,
      budgets,
    };
  }

  // Passthrough reads
  async findAll(): Promise<TaskBudget[]> {
    return this.budgetRepo.findAll();
  }

  async findByTask(taskId: string): Promise<TaskBudget | null> {
    return this.budgetRepo.findByTask(taskId);
  }

  async findByProject(projectId: string): Promise<TaskBudget[]> {
    return this.budgetRepo.findByProject(projectId);
  }

  async findOverBudget(): Promise<TaskBudget[]> {
    return this.budgetRepo.findOverBudget();
  }
}

export function createBudgetService(
  budgetRepo: TaskBudgetRepository,
  activity: ActivityService,
): BudgetService {
  return new BudgetService(budgetRepo, activity);
}
