/**
 * Task Service - Wraps TaskRepository with Activity Logging
 *
 * THE ACTIVITY LOG IS THE SPINE - every action creates an event.
 * This service ensures all task operations are logged.
 */

import type { Task, CreateTask, TaskStatus } from '@hooomz/shared-contracts';
import type { Services } from './index';

/**
 * TaskService - Handles task operations with activity logging
 */
export class TaskService {
  private services: Services;

  constructor(services: Services) {
    this.services = services;
  }

  /**
   * Create a new task
   */
  async create(
    projectId: string,
    data: CreateTask,
    context?: {
      work_category_code?: string;
      trade?: string;
      stage_code?: string;
      location_id?: string;
    }
  ): Promise<Task> {
    const task = await this.services.scheduling.tasks.create(data);

    // Log to activity (non-blocking)
    this.services.activity.logTaskEvent('task.created', projectId, task.id, {
      task_title: task.title,
      work_category_code: context?.work_category_code,
      trade: context?.trade,
      stage_code: context?.stage_code,
      location_id: context?.location_id,
    }).catch((err) => console.error('Failed to log task.created:', err));

    return task;
  }

  /**
   * Update a task
   */
  async update(
    projectId: string,
    taskId: string,
    data: Partial<Omit<Task, 'id' | 'metadata'>>,
    context?: {
      task_title?: string;
      work_category_code?: string;
      trade?: string;
      stage_code?: string;
      location_id?: string;
    }
  ): Promise<Task | null> {
    const existing = await this.services.scheduling.tasks.findById(taskId);
    const updated = await this.services.scheduling.tasks.update(taskId, data);

    if (updated && existing) {
      // Check if status changed
      if (data.status && data.status !== existing.status) {
        await this.logStatusChange(projectId, taskId, existing.status, data.status, {
          task_title: context?.task_title || existing.title,
          ...context,
        });
      }
    }

    return updated;
  }

  /**
   * Update task status with proper event logging
   */
  async updateStatus(
    projectId: string,
    taskId: string,
    newStatus: TaskStatus,
    context?: {
      task_title?: string;
      reason?: string;
      work_category_code?: string;
      trade?: string;
      stage_code?: string;
      location_id?: string;
    }
  ): Promise<Task | null> {
    const existing = await this.services.scheduling.tasks.findById(taskId);
    if (!existing) return null;

    const updated = await this.services.scheduling.tasks.update(taskId, { status: newStatus });

    if (updated) {
      await this.logStatusChange(projectId, taskId, existing.status, newStatus, {
        task_title: context?.task_title || existing.title,
        ...context,
      });
    }

    return updated;
  }

  /**
   * Delete a task
   */
  async delete(
    projectId: string,
    taskId: string,
    context?: {
      task_title?: string;
      work_category_code?: string;
      trade?: string;
      stage_code?: string;
      location_id?: string;
    }
  ): Promise<boolean> {
    const existing = await this.services.scheduling.tasks.findById(taskId);
    const deleted = await this.services.scheduling.tasks.delete(taskId);

    if (deleted) {
      // Log deletion (non-blocking)
      this.services.activity.logTaskEvent('task.deleted', projectId, taskId, {
        task_title: context?.task_title || existing?.title || 'Unknown',
        work_category_code: context?.work_category_code,
        trade: context?.trade,
        stage_code: context?.stage_code,
        location_id: context?.location_id,
      }).catch((err) => console.error('Failed to log task.deleted:', err));
    }

    return deleted;
  }

  /**
   * Bulk update task status
   */
  async bulkUpdateStatus(
    projectId: string,
    taskIds: string[],
    newStatus: TaskStatus
  ): Promise<Task[]> {
    const updated: Task[] = [];

    for (const taskId of taskIds) {
      const result = await this.updateStatus(projectId, taskId, newStatus);
      if (result) {
        updated.push(result);
      }
    }

    return updated;
  }

  /**
   * Add task dependency
   */
  async addDependency(
    projectId: string,
    taskId: string,
    dependsOnTaskId: string,
    context?: {
      task_title?: string;
      depends_on_task_title?: string;
    }
  ): Promise<void> {
    await this.services.scheduling.tasks.addDependency(taskId, dependsOnTaskId);

    // Log dependency (non-blocking)
    this.services.activity.logDependencyEvent('dependency.added', projectId, taskId, {
      task_title: context?.task_title,
      depends_on_task_title: context?.depends_on_task_title,
      depends_on_task_id: dependsOnTaskId,
    }).catch((err) => console.error('Failed to log dependency.added:', err));
  }

  /**
   * Remove task dependency
   */
  async removeDependency(
    projectId: string,
    taskId: string,
    dependsOnTaskId: string,
    context?: {
      task_title?: string;
      depends_on_task_title?: string;
    }
  ): Promise<boolean> {
    const removed = await this.services.scheduling.tasks.removeDependency(taskId, dependsOnTaskId);

    if (removed) {
      // Log dependency removal (non-blocking)
      this.services.activity.logDependencyEvent('dependency.removed', projectId, taskId, {
        task_title: context?.task_title,
        depends_on_task_title: context?.depends_on_task_title,
        depends_on_task_id: dependsOnTaskId,
      }).catch((err) => console.error('Failed to log dependency.removed:', err));
    }

    return removed;
  }

  /**
   * Helper to log status changes with the appropriate event type
   */
  private async logStatusChange(
    projectId: string,
    taskId: string,
    oldStatus: TaskStatus,
    newStatus: TaskStatus,
    context: {
      task_title?: string;
      reason?: string;
      work_category_code?: string;
      trade?: string;
      stage_code?: string;
      location_id?: string;
    }
  ): Promise<void> {
    // Determine the specific event type based on the new status
    let eventType: 'task.started' | 'task.completed' | 'task.blocked' | 'task.status_changed';

    switch (newStatus) {
      case 'in-progress':
        eventType = 'task.started';
        break;
      case 'complete':
        eventType = 'task.completed';
        break;
      case 'blocked':
        eventType = 'task.blocked';
        break;
      default:
        eventType = 'task.status_changed';
    }

    // Log the event (non-blocking)
    this.services.activity.logTaskEvent(eventType, projectId, taskId, {
      task_title: context.task_title,
      old_status: oldStatus,
      new_status: newStatus,
      reason: context.reason,
      work_category_code: context.work_category_code,
      trade: context.trade,
      stage_code: context.stage_code,
      location_id: context.location_id,
    }).catch((err) => console.error(`Failed to log ${eventType}:`, err));
  }
}

/**
 * Create a TaskService instance
 */
export function createTaskService(services: Services): TaskService {
  return new TaskService(services);
}
