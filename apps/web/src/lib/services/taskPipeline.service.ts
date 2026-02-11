/**
 * Task Pipeline Service (Build 3b)
 *
 * Manages the flow: Estimate/CO line items → SopTaskBlueprint → Task + DeployedTask
 *
 * Pipeline:
 * 1. generateFromEstimate() — creates blueprints from approved estimate line items
 * 2. generateFromChangeOrder() — creates blueprints from approved CO line items
 * 3. deployBlueprint() — creates a Task + DeployedTask sidecar from a blueprint
 *
 * Non-looped blueprints auto-deploy. Looped blueprints stay pending until loop binding.
 */

import type {
  SopTaskBlueprint,
  DeployedTask,
  WorkSource,
  LineItem,
  ChangeOrderLineItem,
  CreateTask,
  Task,
} from '@hooomz/shared-contracts';
import { TaskStatus, TaskPriority } from '@hooomz/shared-contracts';
import type { SopTaskBlueprintRepository } from '../repositories/sopTaskBlueprint.repository';
import type { DeployedTaskRepository } from '../repositories/deployedTask.repository';
import type { TaskRepository } from '../repositories/task.repository';
import type { ActivityService } from '../repositories/activity.repository';
import type { SopRepository } from '../repositories/labs/sop.repository';
import type { BudgetService } from './budget.service';

export interface TaskPipelineServiceDeps {
  blueprintRepo: SopTaskBlueprintRepository;
  deployedTaskRepo: DeployedTaskRepository;
  taskRepo: TaskRepository;
  sopRepo: SopRepository;
  activity: ActivityService;
  budget?: BudgetService;
}

export class TaskPipelineService {
  private blueprintRepo: SopTaskBlueprintRepository;
  private deployedTaskRepo: DeployedTaskRepository;
  private taskRepo: TaskRepository;
  private sopRepo: SopRepository;
  private activity: ActivityService;
  private budget?: BudgetService;

  constructor(deps: TaskPipelineServiceDeps) {
    this.blueprintRepo = deps.blueprintRepo;
    this.deployedTaskRepo = deps.deployedTaskRepo;
    this.taskRepo = deps.taskRepo;
    this.sopRepo = deps.sopRepo;
    this.activity = deps.activity;
    this.budget = deps.budget;
  }

  // ============================================================================
  // Blueprint Generation
  // ============================================================================

  /**
   * Generate blueprints from approved estimate line items.
   * Only processes line items that have sopCodes defined.
   * Non-looped blueprints are auto-deployed.
   */
  async generateFromEstimate(
    projectId: string,
    lineItems: LineItem[]
  ): Promise<{ blueprints: SopTaskBlueprint[]; deployed: DeployedTask[] }> {
    const blueprints: SopTaskBlueprint[] = [];
    const deployed: DeployedTask[] = [];

    for (const li of lineItems) {
      if (!li.sopCodes || li.sopCodes.length === 0) continue;

      for (const sopCode of li.sopCodes) {
        const sop = await this.sopRepo.getCurrentBySopCode(sopCode);
        if (!sop) continue;

        const blueprint = await this.blueprintRepo.create({
          projectId,
          name: `${sop.title} — ${li.description}`,
          sopId: sop.id,
          sopCode: sop.sopCode,
          sopVersion: sop.version,
          workSource: 'estimate' as WorkSource,
          workSourceId: li.id,
          estimatedHoursPerUnit: li.estimatedHoursPerUnit ?? 0,
          totalUnits: li.quantity,
          loopContextLabel: li.loopContextLabel,
          isLooped: li.isLooped ?? false,
          status: 'pending',
        });
        blueprints.push(blueprint);

        // Auto-deploy non-looped blueprints
        if (!blueprint.isLooped) {
          const result = await this.deployBlueprint(blueprint.id);
          if (result) deployed.push(result.deployedTask);
        }
      }
    }

    this.activity.logLabsEvent('pipeline.estimate_generated', projectId, {
      entity_name: `${blueprints.length} blueprints from estimate`,
      project_id: projectId,
      blueprints_created: blueprints.length,
      auto_deployed: deployed.length,
    }).catch((err) => console.error('Failed to log pipeline.estimate_generated:', err));

    return { blueprints, deployed };
  }

  /**
   * Generate blueprints from approved change order line items.
   * CO line items use sopCode field directly (single code per line item).
   * Non-looped blueprints are auto-deployed.
   */
  async generateFromChangeOrder(
    projectId: string,
    changeOrderId: string,
    coLineItems: ChangeOrderLineItem[]
  ): Promise<{ blueprints: SopTaskBlueprint[]; deployed: DeployedTask[] }> {
    const blueprints: SopTaskBlueprint[] = [];
    const deployed: DeployedTask[] = [];

    for (const coLi of coLineItems) {
      if (!coLi.sopCode) continue;

      const sop = await this.sopRepo.getCurrentBySopCode(coLi.sopCode);
      if (!sop) continue;

      const blueprint = await this.blueprintRepo.create({
        projectId,
        name: `${sop.title} — ${coLi.description}`,
        sopId: sop.id,
        sopCode: sop.sopCode,
        sopVersion: sop.version,
        workSource: 'change_order' as WorkSource,
        workSourceId: coLi.id,
        estimatedHoursPerUnit: coLi.estimatedHours,
        totalUnits: 1,
        isLooped: false,
        status: 'pending',
      });
      blueprints.push(blueprint);

      // Auto-deploy CO blueprints (COs are never looped at launch)
      const result = await this.deployBlueprint(blueprint.id);
      if (result) deployed.push(result.deployedTask);
    }

    this.activity.logLabsEvent('pipeline.co_generated', changeOrderId, {
      entity_name: `${blueprints.length} blueprints from CO`,
      project_id: projectId,
      change_order_id: changeOrderId,
      blueprints_created: blueprints.length,
      auto_deployed: deployed.length,
    }).catch((err) => console.error('Failed to log pipeline.co_generated:', err));

    return { blueprints, deployed };
  }

  // ============================================================================
  // Blueprint Deployment
  // ============================================================================

  /**
   * Deploy a blueprint: creates a Task + DeployedTask sidecar.
   * Sets blueprint status to 'deployed'.
   */
  async deployBlueprint(
    blueprintId: string,
    loopBindingLabel?: string,
    loopIterationId?: string
  ): Promise<{ task: Task; deployedTask: DeployedTask } | null> {
    const blueprint = await this.blueprintRepo.findById(blueprintId);
    if (!blueprint) return null;
    if (blueprint.status === 'deployed') return null;

    // Create the task
    const taskData: CreateTask = {
      projectId: blueprint.projectId,
      title: blueprint.name,
      description: `SOP: ${blueprint.sopCode} v${blueprint.sopVersion}`,
      status: TaskStatus.NOT_STARTED,
      priority: TaskPriority.MEDIUM,
      dependencies: [],
      workSource: blueprint.workSource,
      workSourceId: blueprint.workSourceId,
      sopId: blueprint.sopId,
      sopCode: blueprint.sopCode,
      sopVersionId: blueprint.sopId,
      sopVersionNumber: blueprint.sopVersion,
      estimateLineItemId: blueprint.workSource === 'estimate' ? blueprint.workSourceId : undefined,
      blueprintId: blueprint.id,
      loopIterationId,
    };

    const task = await this.taskRepo.create(taskData);

    // Create the deployed task sidecar
    const deployedTask = await this.deployedTaskRepo.create({
      taskId: task.id,
      blueprintId: blueprint.id,
      sopId: blueprint.sopId,
      sopCode: blueprint.sopCode,
      sopVersion: blueprint.sopVersion,
      loopBindingLabel,
      loopIterationId,
    });

    // Mark blueprint as deployed
    await this.blueprintRepo.update(blueprintId, { status: 'deployed' });

    // Create TaskBudget if budget service available and blueprint has hours
    if (this.budget && blueprint.estimatedHoursPerUnit > 0) {
      this.budget.createFromDeployment(
        deployedTask,
        blueprint,
        blueprint.projectId,
        0, // crewWageRate — populated when crew is assigned
        0, // chargedRate — populated when crew is assigned
      ).catch((err) => console.error('Failed to create task budget:', err));
    }

    this.activity.logLabsEvent('pipeline.task_deployed', task.id, {
      entity_name: blueprint.name,
      project_id: blueprint.projectId,
      blueprint_id: blueprint.id,
      sop_code: blueprint.sopCode,
    }).catch((err) => console.error('Failed to log pipeline.task_deployed:', err));

    return { task, deployedTask };
  }

  /**
   * Cancel a blueprint (sets status to 'cancelled')
   */
  async cancelBlueprint(blueprintId: string): Promise<SopTaskBlueprint | null> {
    return this.blueprintRepo.update(blueprintId, { status: 'cancelled' });
  }

  // ============================================================================
  // Queries
  // ============================================================================

  async getBlueprintsByProject(projectId: string): Promise<SopTaskBlueprint[]> {
    return this.blueprintRepo.findByProject(projectId);
  }

  async getPendingBlueprints(projectId: string): Promise<SopTaskBlueprint[]> {
    return this.blueprintRepo.findByProjectAndStatus(projectId, 'pending');
  }

  async getDeployedTaskByTaskId(taskId: string): Promise<DeployedTask | null> {
    return this.deployedTaskRepo.findByTaskId(taskId);
  }

  async getDeployedTasksByBlueprint(blueprintId: string): Promise<DeployedTask[]> {
    return this.deployedTaskRepo.findByBlueprintId(blueprintId);
  }
}

export function createTaskPipelineService(deps: TaskPipelineServiceDeps): TaskPipelineService {
  return new TaskPipelineService(deps);
}
