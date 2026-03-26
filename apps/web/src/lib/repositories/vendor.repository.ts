/**
 * Vendor Repository
 * IndexedDB storage for vendor records (suppliers, retailers, subs).
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export interface Vendor {
  id: string;
  name: string;
  type: 'supplier' | 'retailer' | 'subcontractor' | 'other';
  createdBy: string;
  createdAt: string;
}

export type CreateVendor = Omit<Vendor, 'id' | 'createdAt'>;

let vendorSeq = 0;

export class VendorRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.VENDORS;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    vendorSeq += 1;
    return `VND-${String(vendorSeq).padStart(3, '0')}`;
  }

  async create(data: CreateVendor): Promise<Vendor> {
    // Generate a sequential-ish ID
    const all = await this.findAll();
    const maxSeq = all.reduce((max, v) => {
      const n = parseInt(v.id.replace('VND-', ''), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    vendorSeq = maxSeq;

    const vendor: Vendor = {
      ...data,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };
    await this.storage.set(this.storeName, vendor.id, vendor);
    return vendor;
  }

  async findById(id: string): Promise<Vendor | null> {
    return this.storage.get<Vendor>(this.storeName, id);
  }

  async findAll(): Promise<Vendor[]> {
    return this.storage.getAll<Vendor>(this.storeName);
  }

  async search(query: string): Promise<Vendor[]> {
    const q = query.toLowerCase();
    return this.storage.query<Vendor>(
      this.storeName,
      (v) => v.name.toLowerCase().includes(q),
    );
  }

  async update(id: string, changes: Partial<Omit<Vendor, 'id' | 'createdAt'>>): Promise<Vendor | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: Vendor = { ...existing, ...changes };
    await this.storage.set(this.storeName, id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }
}
