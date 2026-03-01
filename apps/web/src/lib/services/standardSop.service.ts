/**
 * Standard SOP Service
 * Lightweight wrapper around StandardSopRepository.
 * Activity logging on save/delete.
 */

import type { StandardSOP } from '@hooomz/shared-contracts';
import type { StandardSopRepository } from '../repositories/standardSop.repository';
import type { ActivityService } from '../repositories/activity.repository';

export class StandardSopService {
  constructor(
    private repo: StandardSopRepository,
    private activity: ActivityService,
  ) {}

  async getAll(): Promise<StandardSOP[]> {
    return this.repo.getAll();
  }

  async getById(id: string): Promise<StandardSOP | null> {
    return this.repo.getById(id);
  }

  async getByCode(code: string): Promise<StandardSOP | null> {
    return this.repo.getByCode(code);
  }

  async getByTrade(trade: string): Promise<StandardSOP[]> {
    return this.repo.getByTrade(trade);
  }

  async getByTgCode(tgCode: string): Promise<StandardSOP[]> {
    return this.repo.getByTgCode(tgCode);
  }

  /** Bulk save for seeding — single transaction, no per-item activity log. */
  async saveMany(sops: StandardSOP[]): Promise<void> {
    await this.repo.saveMany(sops);
  }

  async save(sop: StandardSOP): Promise<void> {
    await this.repo.save(sop);

    this.activity.create({
      event_type: 'standard_sop_saved',
      project_id: 'system',
      entity_type: 'standard_sop',
      entity_id: sop.id,
      summary: `SOP saved: ${sop.code} — ${sop.title}`,
    }).catch((err) => console.error('Failed to log SOP event:', err));
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.repo.getById(id);
    if (!existing) return false;

    const deleted = await this.repo.delete(id);

    if (deleted) {
      this.activity.create({
        event_type: 'standard_sop_deleted',
        project_id: 'system',
        entity_type: 'standard_sop',
        entity_id: id,
        summary: `SOP removed: ${existing.code} — ${existing.title}`,
      }).catch((err) => console.error('Failed to log SOP event:', err));
    }

    return deleted;
  }
}

export function createStandardSopService(
  repo: StandardSopRepository,
  activity: ActivityService,
): StandardSopService {
  return new StandardSopService(repo, activity);
}
