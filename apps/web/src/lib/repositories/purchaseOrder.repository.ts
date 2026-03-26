/**
 * Purchase Order Repository
 * IndexedDB storage for POs (supplier invoices — pre-authorized or retroactive).
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export interface POLineItem {
  description: string;
  qty: number;
  unit: string;
  unitCost: number;
}

export type POStatus = 'pre-authorized' | 'retroactive';
export type POApprovalStatus = 'pending' | 'approved' | 'flagged';

export interface PurchaseOrder {
  id: string;
  jobId: string;
  woId: string;
  vendorId: string;
  status: POStatus;
  approvalStatus: POApprovalStatus;
  lineItems: POLineItem[];
  total: number;
  receiptUploaded: boolean;
  receiptUrl?: string;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  approvedAt?: string;
}

export type CreatePurchaseOrder = Omit<PurchaseOrder, 'id' | 'createdAt' | 'approvalStatus'> & {
  approvalStatus?: POApprovalStatus;
};

let poSeq = 0;

export class PurchaseOrderRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.PURCHASE_ORDERS;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private async nextId(): Promise<string> {
    const all = await this.storage.getAll<PurchaseOrder>(this.storeName);
    const maxSeq = all.reduce((max, po) => {
      const match = po.id.match(/PO-\d{4}-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, poSeq);
    poSeq = maxSeq + 1;
    const year = new Date().getFullYear();
    return `PO-${year}-${String(poSeq).padStart(3, '0')}`;
  }

  async create(data: CreatePurchaseOrder): Promise<PurchaseOrder> {
    const id = await this.nextId();
    const po: PurchaseOrder = {
      ...data,
      id,
      approvalStatus: data.approvalStatus || (data.status === 'retroactive' ? 'pending' : 'approved'),
      createdAt: new Date().toISOString(),
    };
    await this.storage.set(this.storeName, po.id, po);
    return po;
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    return this.storage.get<PurchaseOrder>(this.storeName, id);
  }

  async findByJob(jobId: string): Promise<PurchaseOrder[]> {
    return this.storage.query<PurchaseOrder>(this.storeName, (po) => po.jobId === jobId);
  }

  async findByWO(woId: string): Promise<PurchaseOrder[]> {
    return this.storage.query<PurchaseOrder>(this.storeName, (po) => po.woId === woId);
  }

  async findRetroactivePending(): Promise<PurchaseOrder[]> {
    return this.storage.query<PurchaseOrder>(
      this.storeName,
      (po) => po.status === 'retroactive' && po.approvalStatus === 'pending',
    );
  }

  async findAll(): Promise<PurchaseOrder[]> {
    return this.storage.getAll<PurchaseOrder>(this.storeName);
  }

  async update(id: string, changes: Partial<Omit<PurchaseOrder, 'id' | 'createdAt'>>): Promise<PurchaseOrder | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: PurchaseOrder = { ...existing, ...changes, id: existing.id, createdAt: existing.createdAt };
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
