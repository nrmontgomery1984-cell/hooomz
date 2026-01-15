/**
 * Project Repository Interface
 *
 * Abstract data access layer - concrete implementations provided by app layer.
 * This allows swapping storage backends (PostgreSQL, MongoDB, in-memory, etc.)
 */

import type {
  Project,
  CreateProject,
  UpdateProject,
  QueryParams,
  ProjectFilters,
  ProjectSortField,
} from '@hooomz/shared-contracts';

/**
 * Repository interface for project data access
 * Implementations handle actual database operations
 */
export interface IProjectRepository {
  /**
   * Find all projects with optional filtering, sorting, and pagination
   */
  findAll(params?: QueryParams<ProjectSortField, ProjectFilters>): Promise<{
    projects: Project[];
    total: number;
  }>;

  /**
   * Find a project by ID
   * @returns Project if found, null if not found
   */
  findById(id: string): Promise<Project | null>;

  /**
   * Find projects by client ID
   */
  findByClientId(clientId: string): Promise<Project[]>;

  /**
   * Find projects by status
   */
  findByStatus(status: string | string[]): Promise<Project[]>;

  /**
   * Create a new project
   * @returns Created project with generated ID and metadata
   */
  create(data: CreateProject): Promise<Project>;

  /**
   * Update an existing project
   * @returns Updated project if found, null if not found
   */
  update(id: string, data: Partial<Omit<Project, 'id' | 'metadata'>>): Promise<Project | null>;

  /**
   * Delete a project
   * @returns true if deleted, false if not found
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if a project exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count projects with optional filters
   */
  count(filters?: ProjectFilters): Promise<number>;
}

/**
 * In-memory repository implementation for testing/development
 */
export class InMemoryProjectRepository implements IProjectRepository {
  private projects: Map<string, Project> = new Map();

  async findAll(params?: QueryParams<ProjectSortField, ProjectFilters>) {
    let projects = Array.from(this.projects.values());

    // Apply filters
    if (params?.filters) {
      const { filters } = params;

      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
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
        projects = projects.filter((p) => p.budget.estimatedCost >= filters.estimatedCostMin!);
      }

      if (filters.estimatedCostMax !== undefined) {
        projects = projects.filter((p) => p.budget.estimatedCost <= filters.estimatedCostMax!);
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

  async findById(id: string) {
    return this.projects.get(id) || null;
  }

  async findByClientId(clientId: string) {
    return Array.from(this.projects.values()).filter((p) => p.clientId === clientId);
  }

  async findByStatus(status: string | string[]) {
    const statuses = Array.isArray(status) ? status : [status];
    return Array.from(this.projects.values()).filter((p) => statuses.includes(p.status));
  }

  async create(data: CreateProject) {
    const { generateProjectId, createMetadata } = await import('@hooomz/shared-contracts');

    const project: Project = {
      ...data,
      id: generateProjectId(),
      metadata: createMetadata(),
    };

    this.projects.set(project.id, project);
    return project;
  }

  async update(id: string, data: Partial<Omit<Project, 'id' | 'metadata'>>) {
    const project = this.projects.get(id);
    if (!project) return null;

    const { updateMetadata } = await import('@hooomz/shared-contracts');

    const updated: Project = {
      ...project,
      ...data,
      id: project.id,
      metadata: updateMetadata(project.metadata),
    };

    this.projects.set(id, updated);
    return updated;
  }

  async delete(id: string) {
    return this.projects.delete(id);
  }

  async exists(id: string) {
    return this.projects.has(id);
  }

  async count(filters?: ProjectFilters) {
    const { projects } = await this.findAll({ filters });
    return projects.length;
  }
}
