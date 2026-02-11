/**
 * Labs Product Repository
 * IndexedDB storage for product catalog items
 */

import type { LabsProduct } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class LabsProductRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.LABS_PRODUCTS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `lprod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<LabsProduct, 'id' | 'metadata'>): Promise<LabsProduct> {
    const product: LabsProduct = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, product.id, product);
    await this.syncQueue.queueCreate(this.storeName, product.id, product);
    return product;
  }

  async findById(id: string): Promise<LabsProduct | null> {
    return this.storage.get<LabsProduct>(this.storeName, id);
  }

  async findAll(): Promise<LabsProduct[]> {
    return this.storage.getAll<LabsProduct>(this.storeName);
  }

  async findByCategory(category: string): Promise<LabsProduct[]> {
    return this.storage.query<LabsProduct>(this.storeName, (p) => p.category === category);
  }

  async search(query: string): Promise<LabsProduct[]> {
    const q = query.toLowerCase();
    return this.storage.query<LabsProduct>(this.storeName, (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.brand?.toLowerCase().includes(q) ?? false) ||
      (p.tags?.some((t) => t.toLowerCase().includes(q)) ?? false)
    );
  }

  async findActive(): Promise<LabsProduct[]> {
    return this.storage.query<LabsProduct>(this.storeName, (p) => p.isActive);
  }

  async update(id: string, data: Partial<Omit<LabsProduct, 'id' | 'metadata'>>): Promise<LabsProduct | null> {
    const existing = await this.storage.get<LabsProduct>(this.storeName, id);
    if (!existing) return null;

    const updated: LabsProduct = {
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
    const existing = await this.storage.get<LabsProduct>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
