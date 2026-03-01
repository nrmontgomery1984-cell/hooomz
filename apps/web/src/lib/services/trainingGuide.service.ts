/**
 * Training Guide Service
 * Lightweight wrapper around TrainingGuideRepository.
 * Activity logging on save/delete — TGs are source-of-truth documents.
 */

import type { TrainingGuide } from '@hooomz/shared-contracts';
import type { TrainingGuideRepository } from '../repositories/trainingGuide.repository';
import type { ActivityService } from '../repositories/activity.repository';

export class TrainingGuideService {
  constructor(
    private repo: TrainingGuideRepository,
    private activity: ActivityService,
  ) {}

  async getAll(): Promise<TrainingGuide[]> {
    return this.repo.getAll();
  }

  async getById(id: string): Promise<TrainingGuide | null> {
    return this.repo.getById(id);
  }

  async getByCode(code: string): Promise<TrainingGuide | null> {
    return this.repo.getByCode(code);
  }

  async getByTrade(trade: string): Promise<TrainingGuide[]> {
    return this.repo.getByTrade(trade);
  }

  /** Bulk save for seeding — single transaction, no per-item activity log. */
  async saveMany(tgs: TrainingGuide[]): Promise<void> {
    await this.repo.saveMany(tgs);
  }

  async save(tg: TrainingGuide): Promise<void> {
    await this.repo.save(tg);

    this.activity.create({
      event_type: 'training_guide_saved',
      project_id: 'system',
      entity_type: 'training_guide',
      entity_id: tg.id,
      summary: `Training Guide saved: ${tg.code} — ${tg.title}`,
    }).catch((err) => console.error('Failed to log TG event:', err));
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.repo.getById(id);
    if (!existing) return false;

    const deleted = await this.repo.delete(id);

    if (deleted) {
      this.activity.create({
        event_type: 'training_guide_deleted',
        project_id: 'system',
        entity_type: 'training_guide',
        entity_id: id,
        summary: `Training Guide removed: ${existing.code} — ${existing.title}`,
      }).catch((err) => console.error('Failed to log TG event:', err));
    }

    return deleted;
  }
}

export function createTrainingGuideService(
  repo: TrainingGuideRepository,
  activity: ActivityService,
): TrainingGuideService {
  return new TrainingGuideService(repo, activity);
}
