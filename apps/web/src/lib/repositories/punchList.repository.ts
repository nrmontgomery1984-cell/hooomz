/**
 * Punch List Repository
 * IndexedDB storage for punch list items.
 */

import type { PunchListItem, CreatePunchListItem } from '../types/punchList.types';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export class PunchListRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.PUNCH_LIST_ITEMS;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    return `punch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private now(): string {
    return new Date().toISOString();
  }

  async create(data: CreatePunchListItem): Promise<PunchListItem> {
    const ts = this.now();
    const item: PunchListItem = {
      ...data,
      id: this.generateId(),
      assignedTo: data.assignedTo ?? null,
      photos: data.photos ?? [],
      status: 'open',
      metadata: { createdAt: ts, updatedAt: ts, version: 1 },
    };
    await this.storage.set(this.storeName, item.id, item);
    return item;
  }

  async findById(id: string): Promise<PunchListItem | null> {
    return this.storage.get<PunchListItem>(this.storeName, id);
  }

  async findByProject(projectId: string): Promise<PunchListItem[]> {
    return this.storage.query<PunchListItem>(
      this.storeName,
      (item) => item.projectId === projectId,
    );
  }

  async findOpenByProject(projectId: string): Promise<PunchListItem[]> {
    return this.storage.query<PunchListItem>(
      this.storeName,
      (item) => item.projectId === projectId && item.status !== 'resolved' && item.status !== 'verified',
    );
  }

  async countOpenByProject(projectId: string): Promise<number> {
    const open = await this.findOpenByProject(projectId);
    return open.length;
  }

  async update(id: string, updates: Partial<PunchListItem>): Promise<PunchListItem> {
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Punch list item ${id} not found`);
    const updated: PunchListItem = {
      ...existing,
      ...updates,
      id: existing.id,
      metadata: {
        ...existing.metadata,
        updatedAt: this.now(),
        version: existing.metadata.version + 1,
      },
    };
    await this.storage.set(this.storeName, updated.id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.storage.delete(this.storeName, id);
  }
}
