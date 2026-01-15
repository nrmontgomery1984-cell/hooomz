/**
 * Task Repository
 *
 * Data access layer for tasks with dependency management.
 */

import {
  generateId,
  createMetadata,
  updateMetadata,
  type Metadata,
  type Task,
  type CreateTask,
  type UpdateTask,
  type QueryParams,
  type TaskFilters,
  type TaskSortField,
} from '@hooomz/shared-contracts';

/**
 * Task dependency
 */
export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  metadata: Metadata;
}

/**
 * Task Repository Interface
 */
export interface ITaskRepository {
  findAll(params?: QueryParams<TaskSortField, TaskFilters>): Promise<{
    tasks: Task[];
    total: number;
  }>;
  findById(id: string): Promise<Task | null>;
  findByProjectId(projectId: string): Promise<Task[]>;
  findByAssignee(assigneeId: string): Promise<Task[]>;
  findOverdue(): Promise<Task[]>;
  findByDateRange(startDate: Date, endDate: Date, filters?: TaskFilters): Promise<Task[]>;
  create(data: CreateTask): Promise<Task>;
  update(id: string, data: Partial<Omit<Task, 'id' | 'metadata'>>): Promise<Task | null>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  bulkUpdate(ids: string[], data: Partial<Omit<Task, 'id' | 'metadata'>>): Promise<Task[]>;

  // Dependency management
  addDependency(taskId: string, dependsOnTaskId: string): Promise<TaskDependency>;
  removeDependency(taskId: string, dependsOnTaskId: string): Promise<boolean>;
  getDependencies(taskId: string): Promise<TaskDependency[]>;
  getDependents(taskId: string): Promise<TaskDependency[]>;
  hasCyclicDependency(taskId: string, dependsOnTaskId: string): Promise<boolean>;
}

/**
 * In-Memory Task Repository
 */
export class InMemoryTaskRepository implements ITaskRepository {
  private tasks: Map<string, Task> = new Map();
  private dependencies: Map<string, TaskDependency> = new Map();

  async findAll(
    params?: QueryParams<TaskSortField, TaskFilters>
  ): Promise<{ tasks: Task[]; total: number }> {
    let tasks = Array.from(this.tasks.values());

    // Apply filters
    if (params?.filters) {
      const filters = params.filters;

      if (filters.projectId) {
        tasks = tasks.filter((task) => task.projectId === filters.projectId);
      }

      if (filters.status) {
        const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
        tasks = tasks.filter((task) => statusArray.includes(task.status));
      }

      if (filters.priority) {
        const priorityArray = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
        tasks = tasks.filter((task) => priorityArray.includes(task.priority));
      }

      if (filters.assignedTo) {
        tasks = tasks.filter((task) => task.assignedTo === filters.assignedTo);
      }

      if (filters.dueDateFrom) {
        const fromDate = new Date(filters.dueDateFrom);
        tasks = tasks.filter((task) => task.dueDate && new Date(task.dueDate) >= fromDate);
      }

      if (filters.dueDateTo) {
        const toDate = new Date(filters.dueDateTo);
        tasks = tasks.filter((task) => task.dueDate && new Date(task.dueDate) <= toDate);
      }

      if (filters.overdue !== undefined) {
        const now = new Date();
        tasks = tasks.filter((task) => {
          if (!task.dueDate) return false;
          const isOverdue = new Date(task.dueDate) < now && task.status !== 'completed';
          return filters.overdue ? isOverdue : !isOverdue;
        });
      }
    }

    const total = tasks.length;

    // Apply sorting
    if (params?.sortBy) {
      const { sortBy, sortOrder = 'asc' } = params;
      tasks.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (sortBy) {
          case 'title':
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
            break;
          case 'status':
            aVal = a.status;
            bVal = b.status;
            break;
          case 'priority':
            aVal = a.priority;
            bVal = b.priority;
            break;
          case 'dueDate':
            aVal = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
            bVal = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            break;
          case 'createdAt':
            aVal = new Date(a.metadata.createdAt).getTime();
            bVal = new Date(b.metadata.createdAt).getTime();
            break;
          case 'updatedAt':
            aVal = new Date(a.metadata.updatedAt).getTime();
            bVal = new Date(b.metadata.updatedAt).getTime();
            break;
          default:
            aVal = a.metadata.createdAt;
            bVal = b.metadata.createdAt;
        }

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    if (params?.page && params?.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      tasks = tasks.slice(start, end);
    }

    return { tasks, total };
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  async findByProjectId(projectId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter((task) => task.projectId === projectId);
  }

  async findByAssignee(assigneeId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter((task) => task.assignedTo === assigneeId);
  }

  async findOverdue(): Promise<Task[]> {
    const now = new Date();
    return Array.from(this.tasks.values()).filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) < now &&
        task.status !== 'completed'
    );
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    filters?: TaskFilters
  ): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values()).filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= startDate && dueDate <= endDate;
    });

    // Apply additional filters
    if (filters) {
      if (filters.projectId) {
        tasks = tasks.filter((task) => task.projectId === filters.projectId);
      }

      if (filters.assignedTo) {
        tasks = tasks.filter((task) => task.assignedTo === filters.assignedTo);
      }

      if (filters.status) {
        const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
        tasks = tasks.filter((task) => statusArray.includes(task.status));
      }
    }

    return tasks;
  }

  async create(data: CreateTask): Promise<Task> {
    const task: Task = {
      ...data,
      id: generateId('task'),
      metadata: createMetadata(),
    };

    this.tasks.set(task.id, task);
    return task;
  }

  async update(
    id: string,
    data: Partial<Omit<Task, 'id' | 'metadata'>>
  ): Promise<Task | null> {
    const existing = this.tasks.get(id);
    if (!existing) return null;

    const updated: Task = {
      ...existing,
      ...data,
      id: existing.id,
      metadata: updateMetadata(existing.metadata),
    };

    this.tasks.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    // Also delete all dependencies involving this task
    const dependencies = Array.from(this.dependencies.values()).filter(
      (dep) => dep.taskId === id || dep.dependsOnTaskId === id
    );

    dependencies.forEach((dep) => {
      this.dependencies.delete(dep.id);
    });

    return this.tasks.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.tasks.has(id);
  }

  async bulkUpdate(
    ids: string[],
    data: Partial<Omit<Task, 'id' | 'metadata'>>
  ): Promise<Task[]> {
    const updated: Task[] = [];

    for (const id of ids) {
      const result = await this.update(id, data);
      if (result) {
        updated.push(result);
      }
    }

    return updated;
  }

  // Dependency management
  async addDependency(taskId: string, dependsOnTaskId: string): Promise<TaskDependency> {
    const dependency: TaskDependency = {
      id: generateId('dep'),
      taskId,
      dependsOnTaskId,
      metadata: createMetadata(),
    };

    this.dependencies.set(dependency.id, dependency);
    return dependency;
  }

  async removeDependency(taskId: string, dependsOnTaskId: string): Promise<boolean> {
    const dependency = Array.from(this.dependencies.values()).find(
      (dep) => dep.taskId === taskId && dep.dependsOnTaskId === dependsOnTaskId
    );

    if (dependency) {
      return this.dependencies.delete(dependency.id);
    }

    return false;
  }

  async getDependencies(taskId: string): Promise<TaskDependency[]> {
    return Array.from(this.dependencies.values()).filter((dep) => dep.taskId === taskId);
  }

  async getDependents(taskId: string): Promise<TaskDependency[]> {
    return Array.from(this.dependencies.values()).filter(
      (dep) => dep.dependsOnTaskId === taskId
    );
  }

  async hasCyclicDependency(taskId: string, dependsOnTaskId: string): Promise<boolean> {
    // Check if adding this dependency would create a cycle
    const visited = new Set<string>();
    const stack = [dependsOnTaskId];

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (current === taskId) {
        return true; // Cycle detected
      }

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      // Get dependencies of current task
      const deps = await this.getDependencies(current);
      for (const dep of deps) {
        stack.push(dep.dependsOnTaskId);
      }
    }

    return false;
  }
}
