/**
 * Labs Vote Repository
 * IndexedDB storage for individual partner votes
 */

import type { LabsVote } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class LabsVoteRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.LABS_VOTES;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `lv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async create(data: Omit<LabsVote, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<LabsVote> {
    const now = new Date().toISOString();
    const vote: LabsVote = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };
    await this.storage.set(this.storeName, vote.id, vote);
    await this.syncQueue.queueCreate(this.storeName, vote.id, vote);
    return vote;
  }

  async findById(id: string): Promise<LabsVote | null> {
    return this.storage.get<LabsVote>(this.storeName, id);
  }

  async findAll(): Promise<LabsVote[]> {
    return this.storage.getAll<LabsVote>(this.storeName);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<LabsVote>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }

  async findByBallotId(ballotId: string): Promise<LabsVote[]> {
    return this.storage.query<LabsVote>(
      this.storeName,
      (v) => v.ballotId === ballotId
    );
  }

  async findByVoterId(partnerId: string): Promise<LabsVote[]> {
    return this.storage.query<LabsVote>(
      this.storeName,
      (v) => v.partnerId === partnerId
    );
  }

  /** Check if a partner has already voted on a ballot */
  async findByBallotAndVoter(ballotId: string, partnerId: string): Promise<LabsVote | null> {
    const results = await this.storage.query<LabsVote>(
      this.storeName,
      (v) => v.ballotId === ballotId && v.partnerId === partnerId
    );
    return results[0] || null;
  }
}
