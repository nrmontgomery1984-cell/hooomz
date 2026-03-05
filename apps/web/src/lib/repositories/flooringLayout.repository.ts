/**
 * FlooringLayoutRepository — stores computed layout configs per room.
 * Each room has at most one layout record (upsert pattern via upsertForRoom).
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import type { FlooringLayout, CreateFlooringLayout } from '../types/flooringLayout.types';

export class FlooringLayoutRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.FLOORING_LAYOUTS;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    return `layout_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private now(): string {
    return new Date().toISOString();
  }

  async create(data: CreateFlooringLayout): Promise<FlooringLayout> {
    const ts = this.now();
    const layout: FlooringLayout = {
      ...data,
      id: this.generateId(),
      createdAt: ts,
      updatedAt: ts,
    };
    await this.storage.set(this.storeName, layout.id, layout);
    return layout;
  }

  async findById(id: string): Promise<FlooringLayout | null> {
    return this.storage.get<FlooringLayout>(this.storeName, id);
  }

  async findByRoom(roomId: string): Promise<FlooringLayout | null> {
    const results = await this.storage.query<FlooringLayout>(
      this.storeName,
      (l) => l.roomId === roomId,
    );
    return results[0] ?? null;
  }

  async findByProject(projectId: string): Promise<FlooringLayout[]> {
    return this.storage.query<FlooringLayout>(
      this.storeName,
      (l) => l.projectId === projectId,
    );
  }

  async findByJob(jobId: string): Promise<FlooringLayout[]> {
    return this.storage.query<FlooringLayout>(
      this.storeName,
      (l) => l.jobId === jobId,
    );
  }

  async update(
    id: string,
    changes: Partial<Omit<FlooringLayout, 'id' | 'createdAt'>>,
  ): Promise<FlooringLayout | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: FlooringLayout = {
      ...existing,
      ...changes,
      id,
      updatedAt: this.now(),
    };
    await this.storage.set(this.storeName, id, updated);
    return updated;
  }

  async upsertForRoom(data: CreateFlooringLayout): Promise<FlooringLayout> {
    const existing = await this.findByRoom(data.roomId);
    if (existing) {
      const updated = await this.update(existing.id, data);
      return updated!;
    }
    return this.create(data);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }

  async deleteByRoom(roomId: string): Promise<boolean> {
    const existing = await this.findByRoom(roomId);
    if (!existing) return false;
    await this.storage.delete(this.storeName, existing.id);
    return true;
  }
}
