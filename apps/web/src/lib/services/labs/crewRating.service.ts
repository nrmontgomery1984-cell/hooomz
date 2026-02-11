/**
 * Crew Rating Service — wraps repository with activity logging
 */

import type { CrewRating } from '@hooomz/shared-contracts';
import type { CrewRatingRepository } from '../../repositories/labs';
import type { ActivityService } from '../../repositories/activity.repository';

export class CrewRatingService {
  constructor(
    private repo: CrewRatingRepository,
    private activity: ActivityService
  ) {}

  async create(data: Omit<CrewRating, 'id' | 'metadata'>): Promise<CrewRating> {
    const rating = await this.repo.create(data);

    this.activity.logLabsEvent('labs.crew_rating_submitted', rating.id, {
      entity_name: `Crew rating for project`,
      project_id: rating.projectId,
    }).catch((err) => console.error('Failed to log labs.crew_rating_submitted:', err));

    return rating;
  }

  async findById(id: string) { return this.repo.findById(id); }
  async findAll() { return this.repo.findAll(); }
  async findByProject(projectId: string) { return this.repo.findByProject(projectId); }
  async findBySubmitter(submittedBy: string) { return this.repo.findBySubmitter(submittedBy); }

  async update(id: string, data: Partial<Omit<CrewRating, 'id' | 'metadata'>>) {
    return this.repo.update(id, data);
  }

  async delete(id: string) { return this.repo.delete(id); }
}
