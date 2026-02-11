/**
 * Field Observation Service — wraps repository with activity logging
 */

import type { FieldObservation } from '@hooomz/shared-contracts';
import type { FieldObservationRepository } from '../../repositories/labs';
import type { ActivityService } from '../../repositories/activity.repository';

export class FieldObservationService {
  constructor(
    private repo: FieldObservationRepository,
    private activity: ActivityService
  ) {}

  async create(data: Omit<FieldObservation, 'id' | 'metadata'>): Promise<FieldObservation> {
    const observation = await this.repo.create(data);

    this.activity.logLabsEvent('labs.observation_captured', observation.id, {
      entity_name: `${observation.knowledgeType} observation`,
      project_id: observation.projectId,
      knowledge_type: observation.knowledgeType,
    }).catch((err) => console.error('Failed to log labs.observation_captured:', err));

    return observation;
  }

  async findById(id: string) { return this.repo.findById(id); }
  async findAll() { return this.repo.findAll(); }
  async findByProject(projectId: string) { return this.repo.findByProject(projectId); }
  async findByTask(taskId: string) { return this.repo.findByTask(taskId); }
  async findByKnowledgeType(type: string) { return this.repo.findByKnowledgeType(type); }

  async update(id: string, data: Partial<Omit<FieldObservation, 'id' | 'metadata'>>) {
    return this.repo.update(id, data);
  }

  async delete(id: string) { return this.repo.delete(id); }
}
