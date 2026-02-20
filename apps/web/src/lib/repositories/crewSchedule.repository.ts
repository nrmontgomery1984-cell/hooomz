/**
 * Crew Schedule Repository
 * IndexedDB storage for calendar schedule blocks
 */

import type { CrewScheduleBlock } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

export class CrewScheduleRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.CREW_SCHEDULE_BLOCKS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `csb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async create(data: Omit<CrewScheduleBlock, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<CrewScheduleBlock> {
    const now = new Date().toISOString();
    const block: CrewScheduleBlock = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };
    await this.storage.set(this.storeName, block.id, block);
    await this.syncQueue.queueCreate(this.storeName, block.id, block);
    return block;
  }

  async findById(id: string): Promise<CrewScheduleBlock | null> {
    return this.storage.get<CrewScheduleBlock>(this.storeName, id);
  }

  async findAll(): Promise<CrewScheduleBlock[]> {
    return this.storage.getAll<CrewScheduleBlock>(this.storeName);
  }

  async update(id: string, data: Partial<CrewScheduleBlock>): Promise<CrewScheduleBlock | null> {
    const existing = await this.storage.get<CrewScheduleBlock>(this.storeName, id);
    if (!existing) return null;

    const updated: CrewScheduleBlock = {
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
    const existing = await this.storage.get<CrewScheduleBlock>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }

  async findByCrewAndDateRange(crewId: string, startDate: string, endDate: string): Promise<CrewScheduleBlock[]> {
    return this.storage.query<CrewScheduleBlock>(
      this.storeName,
      (b) => b.crewMemberId === crewId && b.date >= startDate && b.date <= endDate
    );
  }

  async findByProjectAndDateRange(projectId: string, startDate: string, endDate: string): Promise<CrewScheduleBlock[]> {
    return this.storage.query<CrewScheduleBlock>(
      this.storeName,
      (b) => b.projectId === projectId && b.date >= startDate && b.date <= endDate
    );
  }

  async findByDateRange(startDate: string, endDate: string): Promise<CrewScheduleBlock[]> {
    return this.storage.query<CrewScheduleBlock>(
      this.storeName,
      (b) => b.date >= startDate && b.date <= endDate
    );
  }

  async findByDate(date: string): Promise<CrewScheduleBlock[]> {
    return this.storage.query<CrewScheduleBlock>(
      this.storeName,
      (b) => b.date === date
    );
  }

  async findByTaskId(taskId: string): Promise<CrewScheduleBlock[]> {
    return this.storage.query<CrewScheduleBlock>(
      this.storeName,
      (b) => b.taskId === taskId
    );
  }
}
