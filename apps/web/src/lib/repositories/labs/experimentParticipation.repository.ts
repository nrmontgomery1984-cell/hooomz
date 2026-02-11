/**
 * Experiment Participation Repository
 * IndexedDB storage for experiment participations (Phase 3)
 */

import type { ExperimentParticipation } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class ExperimentParticipationRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.EXPERIMENT_PARTICIPATIONS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `epar_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<ExperimentParticipation, 'id' | 'metadata'>): Promise<ExperimentParticipation> {
    const participation: ExperimentParticipation = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, participation.id, participation);
    await this.syncQueue.queueCreate(this.storeName, participation.id, participation);
    return participation;
  }

  async findById(id: string): Promise<ExperimentParticipation | null> {
    return this.storage.get<ExperimentParticipation>(this.storeName, id);
  }

  async findAll(): Promise<ExperimentParticipation[]> {
    return this.storage.getAll<ExperimentParticipation>(this.storeName);
  }

  async findByExperiment(experimentId: string): Promise<ExperimentParticipation[]> {
    return this.storage.query<ExperimentParticipation>(this.storeName, (p) => p.experimentId === experimentId);
  }

  async findByProject(projectId: string): Promise<ExperimentParticipation[]> {
    return this.storage.query<ExperimentParticipation>(this.storeName, (p) => p.projectId === projectId);
  }

  async findByParticipant(participantId: string): Promise<ExperimentParticipation[]> {
    return this.storage.query<ExperimentParticipation>(this.storeName, (p) => p.participantId === participantId);
  }

  async findActiveForProject(projectId: string): Promise<ExperimentParticipation[]> {
    return this.storage.query<ExperimentParticipation>(this.storeName, (p) =>
      p.projectId === projectId && (p.status === 'accepted' || p.status === 'in_progress')
    );
  }

  async update(id: string, data: Partial<Omit<ExperimentParticipation, 'id' | 'metadata'>>): Promise<ExperimentParticipation | null> {
    const existing = await this.storage.get<ExperimentParticipation>(this.storeName, id);
    if (!existing) return null;

    const updated: ExperimentParticipation = {
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
    const existing = await this.storage.get<ExperimentParticipation>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
