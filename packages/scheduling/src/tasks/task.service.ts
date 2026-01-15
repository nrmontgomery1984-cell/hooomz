/**
 * Task Service
 *
 * Business logic for task management and dependencies.
 */

import type {
  Task,
  CreateTask,
  UpdateTask,
  ApiResponse,
  PaginatedApiResponse,
  QueryParams,
  TaskFilters,
  TaskSortField,
  SchedulingOperations,
  TaskWithDependencies,
} from '@hooomz/shared-contracts';

import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  calculatePaginationMeta,
  validateCreateTask,
  validateUpdateTask,
} from '@hooomz/shared-contracts';

import type { ITaskRepository, TaskDependency } from './task.repository';

/**
 * Task Service Dependencies
 */
export interface TaskServiceDependencies {
  taskRepository: ITaskRepository;
}

/**
 * Task status transition rules
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  'not-started': ['in-progress', 'blocked', 'cancelled'],
  'in-progress': ['completed', 'blocked', 'cancelled'],
  blocked: ['not-started', 'in-progress', 'cancelled'],
  completed: ['in-progress'], // Can reopen
  cancelled: ['not-started'], // Can restart
};

/**
 * Critical path task
 */
export interface CriticalPathTask {
  task: Task;
  earliestStart: Date;
  earliestFinish: Date;
  latestStart: Date;
  latestFinish: Date;
  slack: number; // In days
  isCritical: boolean;
}

/**
 * Task Service
 */
export class TaskService implements SchedulingOperations {
  constructor(private deps: TaskServiceDependencies) {}

  /**
   * List tasks with filtering and pagination
   */
  async list(
    params?: QueryParams<TaskSortField, TaskFilters>
  ): Promise<PaginatedApiResponse<Task[]>> {
    try {
      const { tasks, total } = await this.deps.taskRepository.findAll(params);

      const page = params?.page || 1;
      const pageSize = params?.pageSize || 50;

      return createPaginatedResponse(
        tasks,
        calculatePaginationMeta(total, page, pageSize)
      );
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LIST_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list tasks',
        },
      };
    }
  }

  /**
   * Get task by ID
   */
  async getById(id: string): Promise<ApiResponse<Task>> {
    try {
      const task = await this.deps.taskRepository.findById(id);

      if (!task) {
        return createErrorResponse('TASK_NOT_FOUND', `Task ${id} not found`);
      }

      return createSuccessResponse(task);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch task'
      );
    }
  }

  /**
   * Create task
   */
  async create(data: CreateTask): Promise<ApiResponse<Task>> {
    try {
      // Validate input
      const validation = validateCreateTask(data);
      if (!validation.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid task data',
            details: validation.error.errors,
          },
        };
      }

      const task = await this.deps.taskRepository.create(validation.data);
      return createSuccessResponse(task);
    } catch (error) {
      return createErrorResponse(
        'CREATE_ERROR',
        error instanceof Error ? error.message : 'Failed to create task'
      );
    }
  }

  /**
   * Update task
   */
  async update(id: string, data: UpdateTask): Promise<ApiResponse<Task>> {
    try {
      // Validate input
      const validation = validateUpdateTask(data);
      if (!validation.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: validation.error.errors,
          },
        };
      }

      // Check if task exists
      const existing = await this.deps.taskRepository.findById(id);
      if (!existing) {
        return createErrorResponse('TASK_NOT_FOUND', `Task ${id} not found`);
      }

      const updated = await this.deps.taskRepository.update(id, {
        ...data,
        id: undefined,
        metadata: undefined,
      });

      if (!updated) {
        return createErrorResponse('UPDATE_ERROR', 'Failed to update task');
      }

      return createSuccessResponse(updated);
    } catch (error) {
      return createErrorResponse(
        'UPDATE_ERROR',
        error instanceof Error ? error.message : 'Failed to update task'
      );
    }
  }

  /**
   * Delete task
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const exists = await this.deps.taskRepository.exists(id);
      if (!exists) {
        return createErrorResponse('TASK_NOT_FOUND', `Task ${id} not found`);
      }

      // Check if other tasks depend on this one
      const dependents = await this.deps.taskRepository.getDependents(id);
      if (dependents.length > 0) {
        return createErrorResponse(
          'HAS_DEPENDENTS',
          `Cannot delete task: ${dependents.length} other task(s) depend on it`
        );
      }

      const deleted = await this.deps.taskRepository.delete(id);
      if (!deleted) {
        return createErrorResponse('DELETE_ERROR', 'Failed to delete task');
      }

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(
        'DELETE_ERROR',
        error instanceof Error ? error.message : 'Failed to delete task'
      );
    }
  }

  /**
   * Get tasks by project ID
   */
  async getTasksByProject(projectId: string): Promise<ApiResponse<Task[]>> {
    try {
      const tasks = await this.deps.taskRepository.findByProjectId(projectId);
      return createSuccessResponse(tasks);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch project tasks'
      );
    }
  }

  /**
   * Get tasks by assignee
   */
  async getTasksByAssignee(assigneeId: string): Promise<ApiResponse<Task[]>> {
    try {
      const tasks = await this.deps.taskRepository.findByAssignee(assigneeId);
      return createSuccessResponse(tasks);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch assignee tasks'
      );
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(params?: {
    projectId?: string;
    assignedTo?: string;
  }): Promise<ApiResponse<Task[]>> {
    try {
      let tasks = await this.deps.taskRepository.findOverdue();

      // Apply additional filters
      if (params?.projectId) {
        tasks = tasks.filter((task) => task.projectId === params.projectId);
      }

      if (params?.assignedTo) {
        tasks = tasks.filter((task) => task.assignedTo === params.assignedTo);
      }

      return createSuccessResponse(tasks);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch overdue tasks'
      );
    }
  }

  /**
   * Update task status with validation
   */
  async updateTaskStatus(taskId: string, status: string): Promise<ApiResponse<Task>> {
    try {
      const task = await this.deps.taskRepository.findById(taskId);
      if (!task) {
        return createErrorResponse('TASK_NOT_FOUND', `Task ${taskId} not found`);
      }

      // Validate status transition
      const validTransitions = VALID_TRANSITIONS[task.status] || [];
      if (!validTransitions.includes(status)) {
        return createErrorResponse(
          'INVALID_TRANSITION',
          `Cannot transition from ${task.status} to ${status}. Valid transitions: ${validTransitions.join(', ')}`
        );
      }

      // Check dependencies if moving to in-progress
      if (status === 'in-progress') {
        const canStart = await this.canStartTask(taskId);
        if (!canStart.success || !canStart.data) {
          return createErrorResponse(
            'DEPENDENCIES_NOT_MET',
            'Cannot start task: dependencies not completed'
          );
        }
      }

      const updated = await this.deps.taskRepository.update(taskId, { status });
      if (!updated) {
        return createErrorResponse('UPDATE_ERROR', 'Failed to update task status');
      }

      return createSuccessResponse(updated);
    } catch (error) {
      return createErrorResponse(
        'UPDATE_ERROR',
        error instanceof Error ? error.message : 'Failed to update task status'
      );
    }
  }

  /**
   * Reorder tasks within a project
   */
  async reorderTasks(projectId: string, taskIds: string[]): Promise<ApiResponse<Task[]>> {
    try {
      // Verify all tasks belong to the project
      const tasks = await this.deps.taskRepository.findByProjectId(projectId);
      const projectTaskIds = new Set(tasks.map((t) => t.id));

      for (const taskId of taskIds) {
        if (!projectTaskIds.has(taskId)) {
          return createErrorResponse(
            'INVALID_TASK',
            `Task ${taskId} does not belong to project ${projectId}`
          );
        }
      }

      // Update order field for each task
      const updated: Task[] = [];
      for (let i = 0; i < taskIds.length; i++) {
        const result = await this.deps.taskRepository.update(taskIds[i], { order: i });
        if (result) {
          updated.push(result);
        }
      }

      return createSuccessResponse(updated);
    } catch (error) {
      return createErrorResponse(
        'REORDER_ERROR',
        error instanceof Error ? error.message : 'Failed to reorder tasks'
      );
    }
  }

  /**
   * Bulk update task status
   */
  async bulkUpdateStatus(taskIds: string[], status: string): Promise<ApiResponse<Task[]>> {
    try {
      // Validate all tasks can transition to new status
      for (const taskId of taskIds) {
        const task = await this.deps.taskRepository.findById(taskId);
        if (!task) {
          return createErrorResponse('TASK_NOT_FOUND', `Task ${taskId} not found`);
        }

        const validTransitions = VALID_TRANSITIONS[task.status] || [];
        if (!validTransitions.includes(status)) {
          return createErrorResponse(
            'INVALID_TRANSITION',
            `Task ${taskId} cannot transition from ${task.status} to ${status}`
          );
        }
      }

      const updated = await this.deps.taskRepository.bulkUpdate(taskIds, { status });
      return createSuccessResponse(updated);
    } catch (error) {
      return createErrorResponse(
        'BULK_UPDATE_ERROR',
        error instanceof Error ? error.message : 'Failed to bulk update tasks'
      );
    }
  }

  /**
   * Add task dependency
   */
  async addDependency(taskId: string, dependsOnTaskId: string): Promise<ApiResponse<void>> {
    try {
      // Validate both tasks exist
      const task = await this.deps.taskRepository.findById(taskId);
      if (!task) {
        return createErrorResponse('TASK_NOT_FOUND', `Task ${taskId} not found`);
      }

      const dependsOn = await this.deps.taskRepository.findById(dependsOnTaskId);
      if (!dependsOn) {
        return createErrorResponse('TASK_NOT_FOUND', `Task ${dependsOnTaskId} not found`);
      }

      // Check for cyclic dependency
      const hasCycle = await this.deps.taskRepository.hasCyclicDependency(
        taskId,
        dependsOnTaskId
      );
      if (hasCycle) {
        return createErrorResponse(
          'CYCLIC_DEPENDENCY',
          'Adding this dependency would create a cycle'
        );
      }

      await this.deps.taskRepository.addDependency(taskId, dependsOnTaskId);
      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(
        'DEPENDENCY_ERROR',
        error instanceof Error ? error.message : 'Failed to add dependency'
      );
    }
  }

  /**
   * Remove task dependency
   */
  async removeDependency(taskId: string, dependsOnTaskId: string): Promise<ApiResponse<void>> {
    try {
      const removed = await this.deps.taskRepository.removeDependency(taskId, dependsOnTaskId);
      if (!removed) {
        return createErrorResponse('DEPENDENCY_NOT_FOUND', 'Dependency not found');
      }

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(
        'DEPENDENCY_ERROR',
        error instanceof Error ? error.message : 'Failed to remove dependency'
      );
    }
  }

  /**
   * Get dependency chain (all upstream dependencies)
   */
  async getDependencyChain(taskId: string): Promise<ApiResponse<string[]>> {
    try {
      const task = await this.deps.taskRepository.findById(taskId);
      if (!task) {
        return createErrorResponse('TASK_NOT_FOUND', `Task ${taskId} not found`);
      }

      const chain: string[] = [];
      const visited = new Set<string>();
      const stack = [taskId];

      while (stack.length > 0) {
        const current = stack.pop()!;

        if (visited.has(current)) {
          continue;
        }

        visited.add(current);

        if (current !== taskId) {
          chain.push(current);
        }

        // Get dependencies of current task
        const deps = await this.deps.taskRepository.getDependencies(current);
        for (const dep of deps) {
          stack.push(dep.dependsOnTaskId);
        }
      }

      return createSuccessResponse(chain);
    } catch (error) {
      return createErrorResponse(
        'DEPENDENCY_ERROR',
        error instanceof Error ? error.message : 'Failed to get dependency chain'
      );
    }
  }

  /**
   * Check if task can start (all dependencies completed)
   */
  async canStartTask(taskId: string): Promise<ApiResponse<boolean>> {
    try {
      const task = await this.deps.taskRepository.findById(taskId);
      if (!task) {
        return createErrorResponse('TASK_NOT_FOUND', `Task ${taskId} not found`);
      }

      const dependencies = await this.deps.taskRepository.getDependencies(taskId);

      for (const dep of dependencies) {
        const dependencyTask = await this.deps.taskRepository.findById(dep.dependsOnTaskId);
        if (!dependencyTask || dependencyTask.status !== 'completed') {
          return createSuccessResponse(false);
        }
      }

      return createSuccessResponse(true);
    } catch (error) {
      return createErrorResponse(
        'DEPENDENCY_ERROR',
        error instanceof Error ? error.message : 'Failed to check dependencies'
      );
    }
  }

  /**
   * Get critical path for a project
   */
  async getCriticalPath(projectId: string): Promise<ApiResponse<CriticalPathTask[]>> {
    try {
      const tasks = await this.deps.taskRepository.findByProjectId(projectId);

      if (tasks.length === 0) {
        return createSuccessResponse([]);
      }

      // Build dependency graph
      const taskMap = new Map<string, Task>();
      tasks.forEach((task) => taskMap.set(task.id, task));

      // Calculate earliest start/finish times (forward pass)
      const earliestStart = new Map<string, Date>();
      const earliestFinish = new Map<string, Date>();

      const processedForward = new Set<string>();
      const stackForward = tasks.filter((t) => t.dependencies?.length === 0 || !t.dependencies);

      stackForward.forEach((task) => {
        earliestStart.set(task.id, new Date(task.startDate || new Date()));
        const duration = this.estimateTaskDuration(task);
        const finish = new Date(earliestStart.get(task.id)!.getTime() + duration);
        earliestFinish.set(task.id, finish);
      });

      // Process remaining tasks
      while (stackForward.length > 0) {
        const current = stackForward.shift()!;
        if (processedForward.has(current.id)) continue;
        processedForward.add(current.id);

        // Find tasks that depend on current
        const dependents = await this.deps.taskRepository.getDependents(current.id);

        for (const dep of dependents) {
          const depTask = taskMap.get(dep.taskId);
          if (!depTask) continue;

          const currentFinish = earliestFinish.get(current.id)!;
          const existingStart = earliestStart.get(dep.taskId);

          if (!existingStart || currentFinish > existingStart) {
            earliestStart.set(dep.taskId, currentFinish);
            const duration = this.estimateTaskDuration(depTask);
            earliestFinish.set(dep.taskId, new Date(currentFinish.getTime() + duration));
          }

          if (!stackForward.includes(depTask)) {
            stackForward.push(depTask);
          }
        }
      }

      // Calculate latest start/finish times (backward pass)
      const latestFinish = new Map<string, Date>();
      const latestStart = new Map<string, Date>();

      // Find project end date (max earliest finish)
      let projectEnd = new Date(0);
      earliestFinish.forEach((finish) => {
        if (finish > projectEnd) projectEnd = finish;
      });

      // Initialize end tasks
      tasks.forEach((task) => {
        if (!earliestFinish.has(task.id)) return;

        const dependents = tasks.filter((t) =>
          t.dependencies?.includes(task.id)
        );

        if (dependents.length === 0) {
          latestFinish.set(task.id, projectEnd);
          const duration = this.estimateTaskDuration(task);
          latestStart.set(task.id, new Date(projectEnd.getTime() - duration));
        }
      });

      // Calculate critical path tasks
      const criticalPathTasks: CriticalPathTask[] = [];

      tasks.forEach((task) => {
        const es = earliestStart.get(task.id);
        const ef = earliestFinish.get(task.id);
        const lf = latestFinish.get(task.id) || projectEnd;
        const duration = this.estimateTaskDuration(task);
        const ls = new Date(lf.getTime() - duration);

        if (!es || !ef) return;

        const slack = Math.floor((ls.getTime() - es.getTime()) / (1000 * 60 * 60 * 24));
        const isCritical = slack === 0;

        criticalPathTasks.push({
          task,
          earliestStart: es,
          earliestFinish: ef,
          latestStart: ls,
          latestFinish: lf,
          slack,
          isCritical,
        });
      });

      // Sort by critical path (critical tasks first)
      criticalPathTasks.sort((a, b) => {
        if (a.isCritical && !b.isCritical) return -1;
        if (!a.isCritical && b.isCritical) return 1;
        return a.earliestStart.getTime() - b.earliestStart.getTime();
      });

      return createSuccessResponse(criticalPathTasks);
    } catch (error) {
      return createErrorResponse(
        'CRITICAL_PATH_ERROR',
        error instanceof Error ? error.message : 'Failed to calculate critical path'
      );
    }
  }

  /**
   * Get task with dependencies
   */
  async getTaskWithDependencies(id: string): Promise<ApiResponse<TaskWithDependencies>> {
    try {
      const task = await this.deps.taskRepository.findById(id);
      if (!task) {
        return createErrorResponse('TASK_NOT_FOUND', `Task ${id} not found`);
      }

      // Get dependency tasks
      const dependencies = await this.deps.taskRepository.getDependencies(id);
      const dependencyTasks: Task[] = [];

      for (const dep of dependencies) {
        const depTask = await this.deps.taskRepository.findById(dep.dependsOnTaskId);
        if (depTask) {
          dependencyTasks.push(depTask);
        }
      }

      // Get dependent tasks (tasks that depend on this one)
      const dependents = await this.deps.taskRepository.getDependents(id);
      const blockedBy: Task[] = [];

      for (const dep of dependents) {
        const depTask = await this.deps.taskRepository.findById(dep.taskId);
        if (depTask) {
          blockedBy.push(depTask);
        }
      }

      const taskWithDeps: TaskWithDependencies = {
        ...task,
        dependencyTasks,
        blockedBy,
      };

      return createSuccessResponse(taskWithDeps);
    } catch (error) {
      return createErrorResponse(
        'FETCH_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch task with dependencies'
      );
    }
  }

  /**
   * Update task dependencies
   */
  async updateTaskDependencies(
    taskId: string,
    dependencies: string[]
  ): Promise<ApiResponse<Task>> {
    try {
      const task = await this.deps.taskRepository.findById(taskId);
      if (!task) {
        return createErrorResponse('TASK_NOT_FOUND', `Task ${taskId} not found`);
      }

      // Remove existing dependencies
      const existingDeps = await this.deps.taskRepository.getDependencies(taskId);
      for (const dep of existingDeps) {
        await this.deps.taskRepository.removeDependency(taskId, dep.dependsOnTaskId);
      }

      // Add new dependencies
      for (const depId of dependencies) {
        // Check for cycles
        const hasCycle = await this.deps.taskRepository.hasCyclicDependency(taskId, depId);
        if (hasCycle) {
          return createErrorResponse(
            'CYCLIC_DEPENDENCY',
            `Adding dependency on ${depId} would create a cycle`
          );
        }

        await this.deps.taskRepository.addDependency(taskId, depId);
      }

      // Update task's dependencies array
      const updated = await this.deps.taskRepository.update(taskId, { dependencies });
      if (!updated) {
        return createErrorResponse('UPDATE_ERROR', 'Failed to update task');
      }

      return createSuccessResponse(updated);
    } catch (error) {
      return createErrorResponse(
        'UPDATE_ERROR',
        error instanceof Error ? error.message : 'Failed to update dependencies'
      );
    }
  }

  /**
   * Estimate task duration in milliseconds
   */
  private estimateTaskDuration(task: Task): number {
    // Default to 1 day if not specified
    const days = task.estimatedHours ? Math.ceil(task.estimatedHours / 8) : 1;
    return days * 24 * 60 * 60 * 1000;
  }
}
