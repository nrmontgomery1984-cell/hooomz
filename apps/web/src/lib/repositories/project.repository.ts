/**
 * Project Repository - IndexedDB implementation
 * Offline-first storage using IndexedDB
 */

import type {
  Project,
  CreateProject,
} from '@hooomz/shared-contracts';
import {
  generateProjectId,
  createMetadata,
  updateMetadata,
} from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

type ProjectSortField = 'name' | 'status' | 'createdAt' | 'updatedAt' | 'startDate' | 'estimatedCost';

interface ProjectFilters {
  status?: string | string[];
  projectType?: string | string[];
  clientId?: string;
  estimatedCostMin?: number;
  estimatedCostMax?: number;
  search?: string;
}

interface QueryParams<S, F> {
  sortBy?: S;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  filters?: F;
}

export class ProjectRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.PROJECTS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  async findAll(params?: QueryParams<ProjectSortField, ProjectFilters>) {
    let projects = await this.storage.getAll<Project>(this.storeName);

    // Apply filters
    if (params?.filters) {
      const { filters } = params;

      if (filters.status) {
        const statuses = Array.isArray(filters.status)
          ? filters.status
          : [filters.status];
        projects = projects.filter((p) => statuses.includes(p.status));
      }

      if (filters.projectType) {
        const types = Array.isArray(filters.projectType)
          ? filters.projectType
          : [filters.projectType];
        projects = projects.filter((p) => types.includes(p.projectType));
      }

      if (filters.clientId) {
        projects = projects.filter((p) => p.clientId === filters.clientId);
      }

      if (filters.estimatedCostMin !== undefined) {
        projects = projects.filter(
          (p) => p.budget.estimatedCost >= filters.estimatedCostMin!
        );
      }

      if (filters.estimatedCostMax !== undefined) {
        projects = projects.filter(
          (p) => p.budget.estimatedCost <= filters.estimatedCostMax!
        );
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        projects = projects.filter(
          (p) =>
            p.name.toLowerCase().includes(search) ||
            p.address.street.toLowerCase().includes(search)
        );
      }
    }

    // Apply sorting
    if (params?.sortBy) {
      const { sortBy, sortOrder = 'asc' } = params;
      projects.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (sortBy) {
          case 'name':
            aVal = a.name;
            bVal = b.name;
            break;
          case 'status':
            aVal = a.status;
            bVal = b.status;
            break;
          case 'createdAt':
            aVal = a.metadata.createdAt;
            bVal = b.metadata.createdAt;
            break;
          case 'updatedAt':
            aVal = a.metadata.updatedAt;
            bVal = b.metadata.updatedAt;
            break;
          case 'startDate':
            aVal = a.dates.startDate || '';
            bVal = b.dates.startDate || '';
            break;
          case 'estimatedCost':
            aVal = a.budget.estimatedCost;
            bVal = b.budget.estimatedCost;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = projects.length;

    // Apply pagination
    if (params?.page && params?.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      projects = projects.slice(start, end);
    }

    return { projects, total };
  }

  async findById(id: string): Promise<Project | null> {
    return await this.storage.get<Project>(this.storeName, id);
  }

  async findByClientId(clientId: string): Promise<Project[]> {
    const projects = await this.storage.getAll<Project>(this.storeName);
    return projects.filter((p) => p.clientId === clientId);
  }

  async findByStatus(status: string | string[]): Promise<Project[]> {
    const statuses = Array.isArray(status) ? status : [status];
    const projects = await this.storage.getAll<Project>(this.storeName);
    return projects.filter((p) => statuses.includes(p.status));
  }

  async create(data: CreateProject): Promise<Project> {
    const project: Project = {
      ...data,
      id: generateProjectId(),
      metadata: createMetadata(),
    };

    await this.storage.set(this.storeName, project.id, project);
    await this.syncQueue.queueCreate(this.storeName, project.id, project);

    return project;
  }

  async update(
    id: string,
    data: Partial<Omit<Project, 'id' | 'metadata'>>
  ): Promise<Project | null> {
    const project = await this.storage.get<Project>(this.storeName, id);
    if (!project) return null;

    const updated: Project = {
      ...project,
      ...data,
      id: project.id,
      metadata: updateMetadata(project.metadata),
    };

    await this.storage.set(this.storeName, id, updated);
    await this.syncQueue.queueUpdate(this.storeName, id, updated);

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const exists = await this.storage.get<Project>(this.storeName, id);
    if (!exists) return false;

    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);

    return true;
  }

  async exists(id: string): Promise<boolean> {
    const project = await this.storage.get<Project>(this.storeName, id);
    return project !== null;
  }

  async count(filters?: ProjectFilters): Promise<number> {
    const { projects } = await this.findAll({ filters });
    return projects.length;
  }
}
