/**
 * Schedule Note Repository
 * IndexedDB storage for scoped manager notes on schedule blocks
 */

import type { ScheduleNote } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

export class ScheduleNoteRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.SCHEDULE_NOTES;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `snote_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async create(data: Omit<ScheduleNote, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<ScheduleNote> {
    const now = new Date().toISOString();
    const note: ScheduleNote = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };
    await this.storage.set(this.storeName, note.id, note);
    await this.syncQueue.queueCreate(this.storeName, note.id, note);
    return note;
  }

  async findById(id: string): Promise<ScheduleNote | null> {
    return this.storage.get<ScheduleNote>(this.storeName, id);
  }

  async findByBlock(blockId: string): Promise<ScheduleNote[]> {
    const notes = await this.storage.query<ScheduleNote>(
      this.storeName,
      (n) => n.blockId === blockId
    );
    return notes.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async findByProjectAndDate(projectId: string, date: string): Promise<ScheduleNote[]> {
    const notes = await this.storage.query<ScheduleNote>(
      this.storeName,
      (n) => n.projectId === projectId && n.date === date
    );
    return notes.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<ScheduleNote>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
