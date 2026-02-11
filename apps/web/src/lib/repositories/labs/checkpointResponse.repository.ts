/**
 * Checkpoint Response Repository
 * IndexedDB storage for experiment checkpoint responses (Phase 3)
 */

import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';
import type { Metadata } from '@hooomz/shared-contracts';

export interface CheckpointResponse {
  id: string;
  participationId: string;
  checkpointId: string;
  photoIds?: string[];
  rating?: number;
  notes?: string;
  completedAt: string;
  metadata: Metadata;
}

export class CheckpointResponseRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.CHECKPOINT_RESPONSES;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `cpres_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  async create(data: Omit<CheckpointResponse, 'id' | 'metadata'>): Promise<CheckpointResponse> {
    const response: CheckpointResponse = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, response.id, response);
    await this.syncQueue.queueCreate(this.storeName, response.id, response);
    return response;
  }

  async findById(id: string): Promise<CheckpointResponse | null> {
    return this.storage.get<CheckpointResponse>(this.storeName, id);
  }

  async findAll(): Promise<CheckpointResponse[]> {
    return this.storage.getAll<CheckpointResponse>(this.storeName);
  }

  async findByParticipation(participationId: string): Promise<CheckpointResponse[]> {
    return this.storage.query<CheckpointResponse>(this.storeName, (r) => r.participationId === participationId);
  }

  async findByCheckpoint(checkpointId: string): Promise<CheckpointResponse[]> {
    return this.storage.query<CheckpointResponse>(this.storeName, (r) => r.checkpointId === checkpointId);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<CheckpointResponse>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
