/**
 * MaterialSelectionRepository — per-room material product selections.
 * Stores ProjectMaterialSelection records in PROJECT_MATERIAL_SELECTIONS.
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import type { ProjectMaterialSelection } from '../types/materialSelection.types';

export class MaterialSelectionRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.PROJECT_MATERIAL_SELECTIONS;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    return `matsel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private now(): string {
    return new Date().toISOString();
  }

  async create(data: Omit<ProjectMaterialSelection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectMaterialSelection> {
    const ts = this.now();
    const record: ProjectMaterialSelection = {
      ...data,
      id: this.generateId(),
      createdAt: ts,
      updatedAt: ts,
    };
    await this.storage.set(this.storeName, record.id, record);
    return record;
  }

  async findById(id: string): Promise<ProjectMaterialSelection | null> {
    return this.storage.get<ProjectMaterialSelection>(this.storeName, id);
  }

  async findAll(): Promise<ProjectMaterialSelection[]> {
    return this.storage.getAll<ProjectMaterialSelection>(this.storeName);
  }

  async findByProject(projectId: string): Promise<ProjectMaterialSelection[]> {
    return this.storage.query<ProjectMaterialSelection>(
      this.storeName,
      (s) => s.projectId === projectId,
    );
  }

  async findByRoom(roomId: string): Promise<ProjectMaterialSelection[]> {
    return this.storage.query<ProjectMaterialSelection>(
      this.storeName,
      (s) => s.roomId === roomId,
    );
  }

  async findByRoomAndTrade(
    roomId: string,
    trade: string,
  ): Promise<ProjectMaterialSelection | null> {
    const results = await this.storage.query<ProjectMaterialSelection>(
      this.storeName,
      (s) => s.roomId === roomId && s.trade === trade,
    );
    return results[0] ?? null;
  }

  async update(
    id: string,
    changes: Partial<Omit<ProjectMaterialSelection, 'id' | 'createdAt'>>,
  ): Promise<ProjectMaterialSelection | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: ProjectMaterialSelection = {
      ...existing,
      ...changes,
      id,
      updatedAt: this.now(),
    };
    await this.storage.set(this.storeName, id, updated);
    return updated;
  }

  async upsertForRoomTrade(
    data: Omit<ProjectMaterialSelection, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ProjectMaterialSelection> {
    const existing = await this.findByRoomAndTrade(data.roomId, data.trade);
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

  async deleteByRoom(roomId: string): Promise<number> {
    const records = await this.findByRoom(roomId);
    await Promise.all(records.map((r) => this.storage.delete(this.storeName, r.id)));
    return records.length;
  }
}
