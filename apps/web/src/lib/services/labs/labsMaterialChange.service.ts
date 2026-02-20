/**
 * Labs Material Change Service
 * Manages the append-only audit trail for material recommendation changes
 */

import type { LabsMaterialChange } from '@hooomz/shared-contracts';
import type { LabsMaterialChangeRepository } from '../../repositories/labs/labsMaterialChange.repository';
import type { ActivityService } from '../../repositories/activity.repository';

export class LabsMaterialChangeService {
  constructor(
    private changeRepo: LabsMaterialChangeRepository,
    private activity: ActivityService
  ) {}

  /** Record a material recommendation change (append-only) */
  async recordChange(data: Omit<LabsMaterialChange, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<LabsMaterialChange> {
    const change = await this.changeRepo.create(data);

    this.activity.logLabsEvent('labs.material_change', change.id, {
      token_id: data.tokenId,
      test_id: data.testId,
      old_recommendation: data.oldRecommendation,
      new_recommendation: data.newRecommendation,
      sops_affected: data.sopIds.length,
      vote_count: data.voteCount,
    }).catch((err) => console.error('Failed to log labs.material_change:', err));

    return change;
  }

  async findAll(): Promise<LabsMaterialChange[]> {
    return this.changeRepo.findAll();
  }

  async findById(id: string): Promise<LabsMaterialChange | null> {
    return this.changeRepo.findById(id);
  }

  async findByTokenId(tokenId: string): Promise<LabsMaterialChange[]> {
    return this.changeRepo.findByTokenId(tokenId);
  }

  async findByTestId(testId: string): Promise<LabsMaterialChange[]> {
    return this.changeRepo.findByTestId(testId);
  }

  async findRecent(limit: number = 5): Promise<LabsMaterialChange[]> {
    return this.changeRepo.findRecent(limit);
  }
}
