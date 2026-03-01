/**
 * Expense Service
 * Wraps ExpenseRepository with activity logging (spine rule).
 */

import type { ExpenseEntry, CreateExpenseEntry } from '@hooomz/shared-contracts';
import type { ExpenseRepository } from '../repositories/expense.repository';
import type { ActivityService } from '../repositories/activity.repository';

export class ExpenseService {
  constructor(
    private repo: ExpenseRepository,
    private activity: ActivityService,
  ) {}

  async create(data: CreateExpenseEntry): Promise<ExpenseEntry> {
    const entry = await this.repo.create(data);

    this.activity.create({
      event_type: 'expense_created',
      project_id: entry.projectId,
      entity_type: 'expense',
      entity_id: entry.id,
      summary: `Expense: $${entry.amount.toFixed(2)} — ${entry.description}`,
    }).catch((err) => console.error('Failed to log expense event:', err));

    return entry;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.repo.findById(id);
    if (!existing) return false;

    const deleted = await this.repo.delete(id);

    if (deleted) {
      this.activity.create({
        event_type: 'expense_deleted',
        project_id: existing.projectId,
        entity_type: 'expense',
        entity_id: id,
        summary: `Expense removed: $${existing.amount.toFixed(2)} — ${existing.description}`,
      }).catch((err) => console.error('Failed to log expense event:', err));
    }

    return deleted;
  }

  // Passthrough reads
  async findByProject(projectId: string): Promise<ExpenseEntry[]> {
    return this.repo.findByProject(projectId);
  }

  async findByTask(taskId: string): Promise<ExpenseEntry[]> {
    return this.repo.findByTask(taskId);
  }

  async findAll(): Promise<ExpenseEntry[]> {
    return this.repo.findAll();
  }

  async sumByProject(projectId: string): Promise<number> {
    return this.repo.sumByProject(projectId);
  }

  async sumByTask(taskId: string): Promise<number> {
    return this.repo.sumByTask(taskId);
  }
}

export function createExpenseService(
  repo: ExpenseRepository,
  activity: ActivityService,
): ExpenseService {
  return new ExpenseService(repo, activity);
}
