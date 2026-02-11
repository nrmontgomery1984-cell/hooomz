/**
 * Experiment Service — wraps repository with activity logging (Phase 3)
 */

import type { Experiment, ExperimentParticipation } from '@hooomz/shared-contracts';
import type { ExperimentRepository, ExperimentParticipationRepository } from '../../repositories/labs';
import type { NotificationRepository } from '../../repositories/labs';
import type { ActivityService } from '../../repositories/activity.repository';

export class ExperimentService {
  constructor(
    private experiments: ExperimentRepository,
    private participations: ExperimentParticipationRepository,
    private notifications: NotificationRepository,
    private activity: ActivityService
  ) {}

  // Experiments
  async createExperiment(data: Omit<Experiment, 'id' | 'metadata'>): Promise<Experiment> {
    const experiment = await this.experiments.create(data);

    this.activity.logLabsEvent('labs.experiment_created', experiment.id, {
      entity_name: experiment.title,
      knowledge_type: experiment.knowledgeType,
    }).catch((err) => console.error('Failed to log labs.experiment_created:', err));

    return experiment;
  }

  async findExperimentById(id: string) { return this.experiments.findById(id); }
  async findAllExperiments() { return this.experiments.findAll(); }
  async findActiveExperiments() { return this.experiments.findActive(); }
  async findExperimentsByStatus(status: string) { return this.experiments.findByStatus(status); }
  async findExperimentsByKnowledgeType(type: string) { return this.experiments.findByKnowledgeType(type); }

  async updateExperiment(id: string, data: Partial<Omit<Experiment, 'id' | 'metadata'>>) {
    return this.experiments.update(id, data);
  }

  async deleteExperiment(id: string) { return this.experiments.delete(id); }

  // Participations
  async createParticipation(data: Omit<ExperimentParticipation, 'id' | 'metadata'>): Promise<ExperimentParticipation> {
    const participation = await this.participations.create(data);

    // Notify participant
    await this.notifications.create({
      userId: participation.participantId,
      type: 'experiment_invitation',
      title: 'Experiment Invitation',
      body: 'You have been invited to participate in an experiment',
      actionUrl: `/labs/experiments/${participation.experimentId}`,
      isRead: false,
      timestamp: new Date().toISOString(),
    });

    return participation;
  }

  async acceptParticipation(id: string): Promise<ExperimentParticipation | null> {
    const updated = await this.participations.update(id, {
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
    });

    if (updated) {
      this.activity.logLabsEvent('labs.participation_accepted', id, {
        entity_name: `Participation in experiment`,
        project_id: updated.projectId,
      }).catch((err) => console.error('Failed to log labs.participation_accepted:', err));
    }

    return updated;
  }

  async findParticipationById(id: string) { return this.participations.findById(id); }
  async findParticipationsByExperiment(experimentId: string) { return this.participations.findByExperiment(experimentId); }
  async findParticipationsByProject(projectId: string) { return this.participations.findByProject(projectId); }
  async findActiveParticipationsForProject(projectId: string) { return this.participations.findActiveForProject(projectId); }

  async updateParticipation(id: string, data: Partial<Omit<ExperimentParticipation, 'id' | 'metadata'>>) {
    return this.participations.update(id, data);
  }

  async deleteParticipation(id: string) { return this.participations.delete(id); }
}
