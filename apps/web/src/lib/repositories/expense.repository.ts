/**
 * Expense Repository
 * IndexedDB storage for expense entries.
 * Write pattern: resolve on transaction.oncomplete (via storage.set).
 */

import type { ExpenseEntry, CreateExpenseEntry } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export class ExpenseRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.EXPENSES;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private now(): string {
    return new Date().toISOString();
  }

  async create(data: CreateExpenseEntry): Promise<ExpenseEntry> {
    const ts = this.now();
    const entry: ExpenseEntry = {
      ...data,
      id: this.generateId(),
      metadata: { createdAt: ts, updatedAt: ts, version: 1 },
    };
    await this.storage.set(this.storeName, entry.id, entry);
    return entry;
  }

  async findById(id: string): Promise<ExpenseEntry | null> {
    return this.storage.get<ExpenseEntry>(this.storeName, id);
  }

  async findByProject(projectId: string): Promise<ExpenseEntry[]> {
    return this.storage.query<ExpenseEntry>(
      this.storeName,
      (e) => e.projectId === projectId,
    );
  }

  async findByTask(taskId: string): Promise<ExpenseEntry[]> {
    return this.storage.query<ExpenseEntry>(
      this.storeName,
      (e) => e.taskId === taskId,
    );
  }

  async findAll(): Promise<ExpenseEntry[]> {
    return this.storage.getAll<ExpenseEntry>(this.storeName);
  }

  async update(id: string, changes: Partial<Omit<ExpenseEntry, 'id'>>): Promise<ExpenseEntry | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: ExpenseEntry = {
      ...existing,
      ...changes,
      id: existing.id,
      metadata: {
        ...existing.metadata,
        updatedAt: this.now(),
        version: existing.metadata.version + 1,
      },
    };
    await this.storage.set(this.storeName, id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }

  async sumByProject(projectId: string): Promise<number> {
    const expenses = await this.findByProject(projectId);
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }

  async sumByTask(taskId: string): Promise<number> {
    const expenses = await this.findByTask(taskId);
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }
}
