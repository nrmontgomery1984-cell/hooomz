/**
 * Change Order Line Item Repository
 * IndexedDB storage for CO line items (Agreement B)
 */

import type { ChangeOrderLineItem } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from './SyncQueue';

export class ChangeOrderLineItemRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.CHANGE_ORDER_LINE_ITEMS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `coli_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<ChangeOrderLineItem, 'id' | 'metadata'>): Promise<ChangeOrderLineItem> {
    const lineItem: ChangeOrderLineItem = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, lineItem.id, lineItem);
    await this.syncQueue.queueCreate(this.storeName, lineItem.id, lineItem);
    return lineItem;
  }

  async findById(id: string): Promise<ChangeOrderLineItem | null> {
    return this.storage.get<ChangeOrderLineItem>(this.storeName, id);
  }

  async findAll(): Promise<ChangeOrderLineItem[]> {
    return this.storage.getAll<ChangeOrderLineItem>(this.storeName);
  }

  async findByChangeOrder(changeOrderId: string): Promise<ChangeOrderLineItem[]> {
    return this.storage.query<ChangeOrderLineItem>(
      this.storeName,
      (item) => item.changeOrderId === changeOrderId
    );
  }

  async findBySopCode(sopCode: string): Promise<ChangeOrderLineItem[]> {
    return this.storage.query<ChangeOrderLineItem>(
      this.storeName,
      (item) => item.sopCode === sopCode
    );
  }

  async update(id: string, data: Partial<Omit<ChangeOrderLineItem, 'id' | 'metadata'>>): Promise<ChangeOrderLineItem | null> {
    const existing = await this.storage.get<ChangeOrderLineItem>(this.storeName, id);
    if (!existing) return null;

    const updated: ChangeOrderLineItem = {
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
    const existing = await this.storage.get<ChangeOrderLineItem>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }

  async deleteByChangeOrder(changeOrderId: string): Promise<number> {
    const items = await this.findByChangeOrder(changeOrderId);
    for (const item of items) {
      await this.storage.delete(this.storeName, item.id);
      await this.syncQueue.queueDelete(this.storeName, item.id);
    }
    return items.length;
  }
}
