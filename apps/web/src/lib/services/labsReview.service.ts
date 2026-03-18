/**
 * LabsReviewService — Read/write access to the labsReviews store.
 *
 * Phase 0: stubs only. Full implementation in Phase 2.
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import type { LabsReview, CreateLabsReview } from '../types/catalogue.types';

export class LabsReviewService {
  constructor(private storage: StorageAdapter) {}

  async getAll(): Promise<LabsReview[]> {
    return this.storage.getAll<LabsReview>(StoreNames.LABS_REVIEWS);
  }

  async getById(id: string): Promise<LabsReview | null> {
    return this.storage.get<LabsReview>(StoreNames.LABS_REVIEWS, id);
  }

  async getByMaterial(materialId: string): Promise<LabsReview[]> {
    return this.storage.query<LabsReview>(
      StoreNames.LABS_REVIEWS,
      (review) => review.material_id === materialId
    );
  }

  async create(review: CreateLabsReview): Promise<void> {
    const record: LabsReview = {
      ...review,
      createdAt: new Date().toISOString(),
    };
    await this.storage.set<LabsReview>(StoreNames.LABS_REVIEWS, record.id, record);
  }

  async delete(id: string): Promise<void> {
    await this.storage.delete(StoreNames.LABS_REVIEWS, id);
  }
}
