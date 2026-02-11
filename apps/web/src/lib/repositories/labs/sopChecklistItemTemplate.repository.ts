/**
 * SOP Checklist Item Template Repository
 * IndexedDB storage for checklist item templates that belong to SOPs
 */

import type { SopChecklistItemTemplate } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class SopChecklistItemTemplateRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.SOP_CHECKLIST_ITEM_TEMPLATES;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `scit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<SopChecklistItemTemplate, 'id' | 'metadata'>): Promise<SopChecklistItemTemplate> {
    const item: SopChecklistItemTemplate = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, item.id, item);
    await this.syncQueue.queueCreate(this.storeName, item.id, item);
    return item;
  }

  async findById(id: string): Promise<SopChecklistItemTemplate | null> {
    return this.storage.get<SopChecklistItemTemplate>(this.storeName, id);
  }

  async update(id: string, data: Partial<Omit<SopChecklistItemTemplate, 'id' | 'metadata'>>): Promise<SopChecklistItemTemplate | null> {
    const existing = await this.storage.get<SopChecklistItemTemplate>(this.storeName, id);
    if (!existing) return null;

    const updated: SopChecklistItemTemplate = {
      ...existing,
      ...data,
      id: existing.id,
      metadata: this.updateMetadata(existing.metadata),
    };
    await this.storage.set(this.storeName, id, updated);
    await this.syncQueue.queueUpdate(this.storeName, id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<SopChecklistItemTemplate>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }

  /**
   * Get all checklist items for an SOP, ordered by stepNumber
   */
  async getBySopId(sopId: string): Promise<SopChecklistItemTemplate[]> {
    const results = await this.storage.query<SopChecklistItemTemplate>(
      this.storeName,
      (item) => item.sopId === sopId
    );
    return results.sort((a, b) => a.stepNumber - b.stepNumber);
  }

  /**
   * Get checklist items for an SOP filtered by type (activity, daily, qc)
   */
  async getBySopIdAndType(sopId: string, checklistType: string): Promise<SopChecklistItemTemplate[]> {
    const results = await this.storage.query<SopChecklistItemTemplate>(
      this.storeName,
      (item) => item.sopId === sopId && item.checklistType === checklistType
    );
    return results.sort((a, b) => a.stepNumber - b.stepNumber);
  }

  /**
   * Get items where generatesObservation = true for an SOP
   */
  async getObservationGeneratingItems(sopId: string): Promise<SopChecklistItemTemplate[]> {
    const results = await this.storage.query<SopChecklistItemTemplate>(
      this.storeName,
      (item) => item.sopId === sopId && item.generatesObservation === true
    );
    return results.sort((a, b) => a.stepNumber - b.stepNumber);
  }

  /**
   * Find all checklist items across all SOPs that generate a specific knowledge type
   */
  async getByKnowledgeType(knowledgeType: string): Promise<SopChecklistItemTemplate[]> {
    return this.storage.query<SopChecklistItemTemplate>(
      this.storeName,
      (item) => item.observationKnowledgeType === knowledgeType
    );
  }

  /**
   * Reorder step numbers based on the provided ID order
   */
  async reorderItems(sopId: string, itemIds: string[]): Promise<void> {
    for (let i = 0; i < itemIds.length; i++) {
      const item = await this.storage.get<SopChecklistItemTemplate>(this.storeName, itemIds[i]);
      if (item && item.sopId === sopId) {
        const updated: SopChecklistItemTemplate = {
          ...item,
          stepNumber: i + 1,
          metadata: this.updateMetadata(item.metadata),
        };
        await this.storage.set(this.storeName, item.id, updated);
        await this.syncQueue.queueUpdate(this.storeName, item.id, updated);
      }
    }
  }

  /**
   * Delete all checklist items for an SOP (used when deleting/replacing an SOP version)
   */
  async deleteAllBySopId(sopId: string): Promise<number> {
    const items = await this.getBySopId(sopId);
    for (const item of items) {
      await this.storage.delete(this.storeName, item.id);
      await this.syncQueue.queueDelete(this.storeName, item.id);
    }
    return items.length;
  }
}
