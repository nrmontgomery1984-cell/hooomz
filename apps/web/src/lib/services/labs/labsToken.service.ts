/**
 * Labs Token Service
 * Manages dynamic material reference tokens and their lifecycle
 */

import type { LabsToken, LabsTokenStatus } from '@hooomz/shared-contracts';
import type { LabsTokenRepository } from '../../repositories/labs/labsToken.repository';
import type { ActivityService } from '../../repositories/activity.repository';

export class LabsTokenService {
  constructor(
    private tokenRepo: LabsTokenRepository,
    private activity: ActivityService
  ) {}

  async createToken(data: Omit<LabsToken, 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<LabsToken> {
    const token = await this.tokenRepo.create(data);

    this.activity.logLabsEvent('labs.token_created', token.id, {
      entity_name: token.displayName,
      token_id: token.id,
      category: token.category,
      status: token.status,
    }).catch((err) => console.error('Failed to log labs.token_created:', err));

    return token;
  }

  async createWithId(data: LabsToken): Promise<LabsToken> {
    return this.tokenRepo.createWithId(data);
  }

  async updateToken(id: string, data: Partial<LabsToken>): Promise<LabsToken | null> {
    const updated = await this.tokenRepo.update(id, data);
    if (!updated) return null;

    this.activity.logLabsEvent('labs.token_updated', id, {
      entity_name: updated.displayName,
      token_id: id,
      changes: Object.keys(data),
    }).catch((err) => console.error('Failed to log labs.token_updated:', err));

    return updated;
  }

  async updateRecommendation(
    id: string,
    newRecommendation: string,
    testId: string,
    reason: string
  ): Promise<LabsToken | null> {
    const existing = await this.tokenRepo.findById(id);
    if (!existing) return null;

    const previousEntry = {
      product: existing.currentRecommendation,
      replacedDate: new Date().toISOString(),
      replacedByTestId: testId,
      reason,
    };

    return this.tokenRepo.update(id, {
      currentRecommendation: newRecommendation,
      previousRecommendations: [...existing.previousRecommendations, previousEntry],
      labsTestId: testId,
      status: 'validated',
    });
  }

  async findAll(): Promise<LabsToken[]> {
    return this.tokenRepo.findAll();
  }

  async findById(id: string): Promise<LabsToken | null> {
    return this.tokenRepo.findById(id);
  }

  async findByCategory(category: string): Promise<LabsToken[]> {
    return this.tokenRepo.findByCategory(category);
  }

  async findByStatus(status: LabsTokenStatus): Promise<LabsToken[]> {
    return this.tokenRepo.findByStatus(status);
  }

  async findValidated(): Promise<LabsToken[]> {
    return this.tokenRepo.findValidated();
  }

  /** Build a Map<string, LabsToken> for fast token resolution */
  async getTokenMap(): Promise<Map<string, LabsToken>> {
    const all = await this.tokenRepo.findAll();
    return new Map(all.map((t) => [t.id, t]));
  }
}
