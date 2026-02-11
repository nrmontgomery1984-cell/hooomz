/**
 * Project Service - Wraps ProjectRepository with Activity Logging
 *
 * THE ACTIVITY LOG IS THE SPINE - every action creates an event.
 * This service ensures all project operations are logged.
 */

import type { CreateProject } from '@hooomz/shared-contracts';
import type { Services } from './index';

// Simplified project type for web app (exported for use in hooks)
export interface Project {
  id: string;
  name: string;
  status: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  clientId?: string;
  dates?: {
    startDate?: string;
    estimatedEndDate?: string;
  };
  budget?: {
    estimatedCost?: number;
    actualCost?: number;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}

/**
 * ProjectService - Handles project operations with activity logging
 */
export class ProjectService {
  private services: Services;

  constructor(services: Services) {
    this.services = services;
  }

  /**
   * Create a new project
   */
  async create(data: CreateProject): Promise<Project> {
    const project = await this.services.projects.create(data);

    // Log to activity (non-blocking)
    this.services.activity.logProjectEvent('project.created', project.id, {
      project_name: project.name,
      details: `Created at ${data.address.street}, ${data.address.city}`,
    }).catch((err) => console.error('Failed to log project.created:', err));

    return project;
  }

  /**
   * Update a project
   */
  async update(
    projectId: string,
    data: Partial<Omit<Project, 'id' | 'metadata'>>
  ): Promise<Project | null> {
    const existing = await this.services.projects.findById(projectId);
    if (!existing) return null;

    // Cast to any to handle the simplified Project type vs repository's full type
    const updated = await this.services.projects.update(projectId, data as any);

    if (updated) {
      // Check if status changed
      if (data.status && data.status !== existing.status) {
        // Log status change
        this.services.activity.logProjectEvent('project.status_changed', projectId, {
          project_name: updated.name,
          old_status: existing.status,
          new_status: data.status,
        }).catch((err) => console.error('Failed to log project.status_changed:', err));

        // Check for completion
        if (data.status === 'complete') {
          this.services.activity.logProjectEvent('project.completed', projectId, {
            project_name: updated.name,
          }).catch((err) => console.error('Failed to log project.completed:', err));
        }
      }
    }

    return updated;
  }

  /**
   * Change project status
   */
  async changeStatus(
    projectId: string,
    newStatus: string
  ): Promise<Project | null> {
    return this.update(projectId, { status: newStatus } as Partial<Project>);
  }

  /**
   * Delete a project
   */
  async delete(projectId: string): Promise<boolean> {
    const existing = await this.services.projects.findById(projectId);
    if (!existing) return false;

    const deleted = await this.services.projects.delete(projectId);

    if (deleted) {
      // Note: We don't have a 'project.deleted' event type in the current schema
      // but we could log it as a status change or add the event type
      console.log(`Project deleted: ${existing.name}`);
    }

    return deleted;
  }

  // Passthrough methods for read operations (no logging needed)
  async findById(id: string) {
    return this.services.projects.findById(id);
  }

  async findAll(filters?: { status?: string; clientId?: string }) {
    return this.services.projects.findAll(filters ? { filters } : undefined);
  }

  async findByClientId(clientId: string) {
    return this.services.projects.findByClientId(clientId);
  }
}

/**
 * Create a ProjectService instance
 */
export function createProjectService(services: Services): ProjectService {
  return new ProjectService(services);
}
