/**
 * Task Repository - IndexedDB implementation for offline-first operation
 */

import type {
  Task,
  CreateTask,
} from '@hooomz/shared-contracts';
import { generateId, createMetadata, updateMetadata, TaskStatus, TaskPriority } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

type TaskSortField = 'title' | 'status' | 'priority' | 'dueDate' | 'createdAt' | 'updatedAt';

interface TaskFilters {
  projectId?: string;
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  assignedTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  overdue?: boolean;
}

interface QueryParams<S, F> {
  sortBy?: S;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  filters?: F;
}

interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  metadata: { createdAt: string; updatedAt: string; version: number };
}

/**
 * IndexedDB-backed Task Repository
 */
export class TaskRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.TASKS;
  private dependenciesStoreName = 'taskDependencies'; // Store dependencies separately
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  async findAll(
    params?: QueryParams<TaskSortField, TaskFilters>
  ): Promise<{ tasks: Task[]; total: number }> {
    let tasks = await this.storage.getAll<Task>(this.storeName);

    // Apply filters
    if (params?.filters) {
      const filters = params.filters;

      if (filters.projectId) {
        tasks = tasks.filter((task) => task.projectId === filters.projectId);
      }

      if (filters.status) {
        const statusArray = Array.isArray(filters.status)
          ? filters.status
          : [filters.status];
        tasks = tasks.filter((task) => statusArray.includes(task.status));
      }

      if (filters.priority) {
        const priorityArray = Array.isArray(filters.priority)
          ? filters.priority
          : [filters.priority];
        tasks = tasks.filter((task) => priorityArray.includes(task.priority));
      }

      if (filters.assignedTo) {
        tasks = tasks.filter((task) => task.assignedTo === filters.assignedTo);
      }

      if (filters.dueDateFrom) {
        const fromDate = new Date(filters.dueDateFrom);
        tasks = tasks.filter(
          (task) => task.dueDate && new Date(task.dueDate) >= fromDate
        );
      }

      if (filters.dueDateTo) {
        const toDate = new Date(filters.dueDateTo);
        tasks = tasks.filter(
          (task) => task.dueDate && new Date(task.dueDate) <= toDate
        );
      }

      if (filters.overdue !== undefined) {
        const now = new Date();
        tasks = tasks.filter((task) => {
          if (!task.dueDate) return false;
          const isOverdue =
            new Date(task.dueDate) < now && task.status !== TaskStatus.COMPLETE;
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
    return await this.storage.get<Task>(this.storeName, id);
  }

  async findByProjectId(projectId: string): Promise<Task[]> {
    const tasks = await this.storage.getAll<Task>(this.storeName);
    return tasks.filter((task) => task.projectId === projectId);
  }

  async findByAssignee(assigneeId: string): Promise<Task[]> {
    const tasks = await this.storage.getAll<Task>(this.storeName);
    return tasks.filter((task) => task.assignedTo === assigneeId);
  }

  async findOverdue(): Promise<Task[]> {
    const now = new Date();
    const tasks = await this.storage.getAll<Task>(this.storeName);
    return tasks.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) < now &&
        task.status !== TaskStatus.COMPLETE
    );
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    filters?: TaskFilters
  ): Promise<Task[]> {
    let tasks = await this.storage.getAll<Task>(this.storeName);

    tasks = tasks.filter((task) => {
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
        const statusArray = Array.isArray(filters.status)
          ? filters.status
          : [filters.status];
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

    await this.storage.set(this.storeName, task.id, task);
    await this.syncQueue.queueCreate(this.storeName, task.id, task);

    return task;
  }

  async update(
    id: string,
    data: Partial<Omit<Task, 'id' | 'metadata'>>
  ): Promise<Task | null> {
    const existing = await this.storage.get<Task>(this.storeName, id);
    if (!existing) return null;

    const updated: Task = {
      ...existing,
      ...data,
      id: existing.id,
      metadata: updateMetadata(existing.metadata),
    };

    await this.storage.set(this.storeName, id, updated);
    await this.syncQueue.queueUpdate(this.storeName, id, updated);

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<Task>(this.storeName, id);
    if (!existing) return false;

    // Delete all dependencies involving this task
    const allDeps = await this.storage.getAll<TaskDependency>(
      this.dependenciesStoreName
    );
    const depsToDelete = allDeps.filter(
      (dep) => dep.taskId === id || dep.dependsOnTaskId === id
    );

    for (const dep of depsToDelete) {
      await this.storage.delete(this.dependenciesStoreName, dep.id);
    }

    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);

    return true;
  }

  async exists(id: string): Promise<boolean> {
    const task = await this.storage.get<Task>(this.storeName, id);
    return task !== null;
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

    await this.storage.set(this.dependenciesStoreName, dependency.id, dependency);
    return dependency;
  }

  async removeDependency(taskId: string, dependsOnTaskId: string): Promise<boolean> {
    const allDeps = await this.storage.getAll<TaskDependency>(
      this.dependenciesStoreName
    );
    const dependency = allDeps.find(
      (dep) => dep.taskId === taskId && dep.dependsOnTaskId === dependsOnTaskId
    );

    if (dependency) {
      await this.storage.delete(this.dependenciesStoreName, dependency.id);
      return true;
    }

    return false;
  }

  async getDependencies(taskId: string): Promise<TaskDependency[]> {
    const allDeps = await this.storage.getAll<TaskDependency>(
      this.dependenciesStoreName
    );
    return allDeps.filter((dep) => dep.taskId === taskId);
  }

  async getDependents(taskId: string): Promise<TaskDependency[]> {
    const allDeps = await this.storage.getAll<TaskDependency>(
      this.dependenciesStoreName
    );
    return allDeps.filter((dep) => dep.dependsOnTaskId === taskId);
  }

  async hasCyclicDependency(
    taskId: string,
    dependsOnTaskId: string
  ): Promise<boolean> {
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
