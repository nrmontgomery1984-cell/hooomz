import type { Project, ProjectStatus, ActivityEventType } from '@hooomz/shared';
import { EVENT_VISIBILITY_DEFAULTS } from '@hooomz/shared';
import type { ProjectRepository } from '../repositories';
import type { CreateProjectInput, UpdateProjectInput, ProjectFilters, ProjectWithRelations } from '../types';

// Activity service will be injected - interface for now
export interface ActivityService {
  log(event: {
    organization_id: string;
    project_id: string;
    property_id: string;
    event_type: ActivityEventType;
    actor_id: string;
    actor_type: 'team_member' | 'system' | 'customer';
    entity_type: string;
    entity_id: string;
    homeowner_visible: boolean;
    event_data: Record<string, unknown>;
  }): Promise<void>;
}

export class ProjectService {
  constructor(
    private projectRepo: ProjectRepository,
    private activityService?: ActivityService
  ) {}

  async createProject(input: CreateProjectInput, actorId: string): Promise<Project> {
    const project = await this.projectRepo.create(input);

    // Log activity event
    if (this.activityService) {
      await this.activityService.log({
        organization_id: input.organization_id,
        project_id: project.id,
        property_id: input.property_id,
        event_type: 'project.created',
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'project',
        entity_id: project.id,
        homeowner_visible: EVENT_VISIBILITY_DEFAULTS['project.created'],
        event_data: { name: project.name, status: project.status },
      });
    }

    return project;
  }

  async getProject(id: string): Promise<Project | null> {
    return this.projectRepo.findById(id);
  }

  async getProjectWithRelations(id: string): Promise<ProjectWithRelations | null> {
    return this.projectRepo.findByIdWithRelations(id);
  }

  async listProjects(filters: ProjectFilters): Promise<Project[]> {
    return this.projectRepo.findMany(filters);
  }

  async updateProject(id: string, input: UpdateProjectInput, actorId: string): Promise<Project> {
    const existing = await this.projectRepo.findById(id);
    if (!existing) throw new Error('Project not found');

    const updated = await this.projectRepo.update(id, input);

    // Log status change if status changed
    if (input.status && input.status !== existing.status && this.activityService) {
      await this.activityService.log({
        organization_id: existing.organization_id,
        project_id: id,
        property_id: existing.property_id,
        event_type: 'project.status_changed',
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'project',
        entity_id: id,
        homeowner_visible: EVENT_VISIBILITY_DEFAULTS['project.status_changed'],
        event_data: {
          previous_status: existing.status,
          new_status: input.status,
        },
      });
    }

    // Log health change if health changed
    if (input.health && input.health !== existing.health && this.activityService) {
      await this.activityService.log({
        organization_id: existing.organization_id,
        project_id: id,
        property_id: existing.property_id,
        event_type: 'project.health_changed',
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'project',
        entity_id: id,
        homeowner_visible: EVENT_VISIBILITY_DEFAULTS['project.health_changed'],
        event_data: {
          previous_health: existing.health,
          new_health: input.health,
        },
      });
    }

    return updated;
  }

  async changeStatus(id: string, status: ProjectStatus, actorId: string): Promise<Project> {
    return this.updateProject(id, { status }, actorId);
  }

  async deleteProject(id: string): Promise<void> {
    return this.projectRepo.delete(id);
  }

  // Status transition validation
  canTransitionTo(currentStatus: ProjectStatus, newStatus: ProjectStatus): boolean {
    const transitions: Record<ProjectStatus, ProjectStatus[]> = {
      lead: ['estimate', 'cancelled'],
      estimate: ['quoted', 'cancelled'],
      quoted: ['approved', 'estimate', 'cancelled'],
      approved: ['in_progress', 'on_hold', 'cancelled'],
      in_progress: ['on_hold', 'complete', 'cancelled'],
      on_hold: ['in_progress', 'cancelled'],
      complete: [], // Terminal state
      cancelled: [], // Terminal state
    };

    return transitions[currentStatus]?.includes(newStatus) ?? false;
  }
}
