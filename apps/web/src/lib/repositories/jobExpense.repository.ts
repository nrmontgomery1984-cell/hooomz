/**
 * Job Expense Repository
 * IndexedDB storage for field expenses (till receipts logged by crew).
 * Distinct from the legacy ExpenseRepository — this tracks per-job expenses
 * with vendor, payment type, receipt, category, and reimbursement status.
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export type ExpenseCategory =
  | 'materials-unplanned'
  | 'consumables'
  | 'fasteners-hardware'
  | 'fuel-travel'
  | 'delivery-fee'
  | 'dump-disposal'
  | 'subcontractor'
  | 'equipment-rental'
  | 'other';

export type ExpenseStatus = 'pending' | 'approved' | 'flagged';
export type PaymentType = 'company-card' | 'personal' | 'cash';

export interface JobExpense {
  id: string;
  jobId: string;
  woId: string;
  crewMemberId: string;
  amount: number;
  vendorId: string;
  paymentType: PaymentType;
  receiptUploaded: boolean;
  receiptUrl?: string;
  category?: ExpenseCategory;
  status: ExpenseStatus;
  reimbursementOwing: boolean;
  reimbursementPaidAt?: string;
  notes?: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type CreateJobExpense = Omit<JobExpense, 'id' | 'createdAt' | 'status' | 'reimbursementOwing'> & {
  status?: ExpenseStatus;
};

let expSeq = 0;

export class JobExpenseRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.JOB_EXPENSES;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private async nextId(): Promise<string> {
    const all = await this.storage.getAll<JobExpense>(this.storeName);
    const maxSeq = all.reduce((max, e) => {
      const match = e.id.match(/EXP-\d{4}-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, expSeq);
    expSeq = maxSeq + 1;
    const year = new Date().getFullYear();
    return `EXP-${year}-${String(expSeq).padStart(3, '0')}`;
  }

  async create(data: CreateJobExpense): Promise<JobExpense> {
    const id = await this.nextId();
    const expense: JobExpense = {
      ...data,
      id,
      status: data.status || 'pending',
      reimbursementOwing: data.paymentType === 'personal',
      createdAt: new Date().toISOString(),
    };
    await this.storage.set(this.storeName, expense.id, expense);
    return expense;
  }

  async findById(id: string): Promise<JobExpense | null> {
    return this.storage.get<JobExpense>(this.storeName, id);
  }

  async findByJob(jobId: string): Promise<JobExpense[]> {
    return this.storage.query<JobExpense>(this.storeName, (e) => e.jobId === jobId);
  }

  async findByWO(woId: string): Promise<JobExpense[]> {
    return this.storage.query<JobExpense>(this.storeName, (e) => e.woId === woId);
  }

  async findByCrewMember(crewMemberId: string): Promise<JobExpense[]> {
    return this.storage.query<JobExpense>(this.storeName, (e) => e.crewMemberId === crewMemberId);
  }

  async findByStatus(status: ExpenseStatus): Promise<JobExpense[]> {
    return this.storage.query<JobExpense>(this.storeName, (e) => e.status === status);
  }

  async findPendingReimbursements(): Promise<JobExpense[]> {
    return this.storage.query<JobExpense>(
      this.storeName,
      (e) => e.reimbursementOwing && !e.reimbursementPaidAt,
    );
  }

  async findAll(): Promise<JobExpense[]> {
    return this.storage.getAll<JobExpense>(this.storeName);
  }

  async update(id: string, changes: Partial<Omit<JobExpense, 'id' | 'createdAt'>>): Promise<JobExpense | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: JobExpense = { ...existing, ...changes, id: existing.id, createdAt: existing.createdAt };
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
