/**
 * Uncaptured Work Service
 * Manages tasks that lack work authorization (no estimate or CO backing)
 * Implements Agreement B from the Master Integration Spec
 *
 * Uses canonical Task type from Zod schemas (Build 1.5 alignment).
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import type { ActivityService } from '../repositories/activity.repository';
import type { Task, UncapturedResolution } from '@hooomz/shared-contracts';

export class UncapturedWorkService {
  constructor(
    private storage: StorageAdapter,
    private activity: ActivityService
  ) {}

  /**
   * Flag a task as uncaptured work (no estimate or CO backing)
   */
  async flagAsUncaptured(taskId: string): Promise<void> {
    const task = await this.storage.get<Task>(StoreNames.TASKS, taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    const updated: Task = {
      ...task,
      workSource: 'uncaptured',
      isUncaptured: true,
      uncapturedResolution: null,
      uncapturedResolvedAt: null,
      uncapturedResolvedBy: null,
    };

    await this.storage.set(StoreNames.TASKS, taskId, updated);

    this.activity.logLabsEvent('task.flagged_uncaptured', taskId, {
      entity_name: task.title,
      project_id: task.projectId,
    }).catch((err) => console.error('Failed to log task.flagged_uncaptured:', err));
  }

  /**
   * Resolve uncaptured work with a resolution
   * Options: 'converted_to_co' | 'absorbed' | 'deleted'
   */
  async resolveUncaptured(
    taskId: string,
    resolution: UncapturedResolution,
    resolvedBy: string
  ): Promise<void> {
    const task = await this.storage.get<Task>(StoreNames.TASKS, taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    if (resolution === 'deleted') {
      await this.storage.delete(StoreNames.TASKS, taskId);
    } else {
      const updated: Task = {
        ...task,
        uncapturedResolution: resolution,
        uncapturedResolvedAt: new Date().toISOString(),
        uncapturedResolvedBy: resolvedBy,
      };
      await this.storage.set(StoreNames.TASKS, taskId, updated);
    }

    this.activity.logLabsEvent('task.uncaptured_resolved', taskId, {
      entity_name: task.title,
      project_id: task.projectId,
      resolution,
    }).catch((err) => console.error('Failed to log task.uncaptured_resolved:', err));
  }

  /**
   * Get all uncaptured tasks for a project
   */
  async getUncapturedByProject(projectId: string): Promise<Task[]> {
    return this.storage.query<Task>(
      StoreNames.TASKS,
      (task) => task.projectId === projectId && task.isUncaptured === true && !task.uncapturedResolution
    );
  }

  /**
   * Get all unresolved uncaptured tasks across all projects
   */
  async getAllUnresolved(): Promise<Task[]> {
    return this.storage.query<Task>(
      StoreNames.TASKS,
      (task) => task.isUncaptured === true && !task.uncapturedResolution
    );
  }
}
