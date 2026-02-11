/**
 * Field Observation Repository
 * IndexedDB storage for passive field observations
 */

import type { FieldObservation } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class FieldObservationRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.FIELD_OBSERVATIONS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `fobs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<FieldObservation, 'id' | 'metadata'>): Promise<FieldObservation> {
    const observation: FieldObservation = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, observation.id, observation);
    await this.syncQueue.queueCreate(this.storeName, observation.id, observation);
    return observation;
  }

  async findById(id: string): Promise<FieldObservation | null> {
    return this.storage.get<FieldObservation>(this.storeName, id);
  }

  async findAll(): Promise<FieldObservation[]> {
    return this.storage.getAll<FieldObservation>(this.storeName);
  }

  async findByProject(projectId: string): Promise<FieldObservation[]> {
    return this.storage.query<FieldObservation>(this.storeName, (o) => o.projectId === projectId);
  }

  async findByTask(taskId: string): Promise<FieldObservation[]> {
    return this.storage.query<FieldObservation>(this.storeName, (o) => o.taskId === taskId);
  }

  async findByKnowledgeType(knowledgeType: string): Promise<FieldObservation[]> {
    return this.storage.query<FieldObservation>(this.storeName, (o) => o.knowledgeType === knowledgeType);
  }

  async update(id: string, data: Partial<Omit<FieldObservation, 'id' | 'metadata'>>): Promise<FieldObservation | null> {
    const existing = await this.storage.get<FieldObservation>(this.storeName, id);
    if (!existing) return null;

    const updated: FieldObservation = {
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
    const existing = await this.storage.get<FieldObservation>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
