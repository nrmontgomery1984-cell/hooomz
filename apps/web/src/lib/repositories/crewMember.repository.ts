/**
 * Crew Member Repository
 * IndexedDB storage for crew member records (Build 3c)
 */

import type { CrewMember } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

export class CrewMemberRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.CREW_MEMBERS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `crew_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<CrewMember, 'id' | 'metadata'>): Promise<CrewMember> {
    const member: CrewMember = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, member.id, member);
    await this.syncQueue.queueCreate(this.storeName, member.id, member);
    return member;
  }

  /**
   * Create with a specific ID (for seeding with stable IDs like 'crew_nathan')
   */
  async createWithId(id: string, data: Omit<CrewMember, 'id' | 'metadata'>): Promise<CrewMember> {
    const member: CrewMember = {
      ...data,
      id,
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, member.id, member);
    await this.syncQueue.queueCreate(this.storeName, member.id, member);
    return member;
  }

  async findById(id: string): Promise<CrewMember | null> {
    return this.storage.get<CrewMember>(this.storeName, id);
  }

  async findAll(): Promise<CrewMember[]> {
    return this.storage.getAll<CrewMember>(this.storeName);
  }

  async findActive(): Promise<CrewMember[]> {
    return this.storage.query<CrewMember>(this.storeName, (m) => m.isActive);
  }

  async update(id: string, data: Partial<Omit<CrewMember, 'id' | 'metadata'>>): Promise<CrewMember | null> {
    const existing = await this.storage.get<CrewMember>(this.storeName, id);
    if (!existing) return null;

    const updated: CrewMember = {
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
    const existing = await this.storage.get<CrewMember>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }

  async clear(): Promise<void> {
    await this.storage.clear(this.storeName);
  }
}
