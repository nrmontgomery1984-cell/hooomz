/**
 * Labs Vote Ballot Repository
 * IndexedDB storage for weekly partner research voting ballots
 */

import type { LabsVoteBallot, BallotStatus } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class LabsVoteBallotRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.LABS_VOTE_BALLOTS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  async create(data: Omit<LabsVoteBallot, 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<LabsVoteBallot> {
    const now = new Date().toISOString();
    const ballot: LabsVoteBallot = {
      ...data,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };
    await this.storage.set(this.storeName, ballot.id, ballot);
    await this.syncQueue.queueCreate(this.storeName, ballot.id, ballot);
    return ballot;
  }

  async createWithId(data: LabsVoteBallot): Promise<LabsVoteBallot> {
    await this.storage.set(this.storeName, data.id, data);
    await this.syncQueue.queueCreate(this.storeName, data.id, data);
    return data;
  }

  async findById(id: string): Promise<LabsVoteBallot | null> {
    return this.storage.get<LabsVoteBallot>(this.storeName, id);
  }

  async findAll(): Promise<LabsVoteBallot[]> {
    return this.storage.getAll<LabsVoteBallot>(this.storeName);
  }

  async update(id: string, data: Partial<LabsVoteBallot>): Promise<LabsVoteBallot | null> {
    const existing = await this.storage.get<LabsVoteBallot>(this.storeName, id);
    if (!existing) return null;

    const updated: LabsVoteBallot = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
    };
    await this.storage.set(this.storeName, id, updated);
    await this.syncQueue.queueUpdate(this.storeName, id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<LabsVoteBallot>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }

  async findByStatus(status: BallotStatus): Promise<LabsVoteBallot[]> {
    return this.storage.query<LabsVoteBallot>(
      this.storeName,
      (b) => b.status === status
    );
  }

  async findActive(): Promise<LabsVoteBallot | null> {
    const results = await this.findByStatus('active');
    return results[0] || null;
  }

  async findByWeek(weekStart: string): Promise<LabsVoteBallot | null> {
    const results = await this.storage.query<LabsVoteBallot>(
      this.storeName,
      (b) => b.weekStart === weekStart
    );
    return results[0] || null;
  }
}
