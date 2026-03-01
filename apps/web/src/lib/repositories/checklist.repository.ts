/**
 * Checklist Submission Repository
 * IndexedDB storage for completed SOP checklist submissions.
 */

import type { ChecklistSubmission } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export class ChecklistRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.CHECKLIST_SUBMISSIONS;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  async getAll(): Promise<ChecklistSubmission[]> {
    return this.storage.getAll<ChecklistSubmission>(this.storeName);
  }

  async getById(id: string): Promise<ChecklistSubmission | null> {
    return this.storage.get<ChecklistSubmission>(this.storeName, id);
  }

  async getBySopId(sopId: string): Promise<ChecklistSubmission[]> {
    return this.storage.query<ChecklistSubmission>(
      this.storeName,
      (s) => s.sopId === sopId,
    );
  }

  async getByProjectId(projectId: string): Promise<ChecklistSubmission[]> {
    return this.storage.query<ChecklistSubmission>(
      this.storeName,
      (s) => s.projectId === projectId,
    );
  }

  async getByTechnicianId(technicianId: string): Promise<ChecklistSubmission[]> {
    return this.storage.query<ChecklistSubmission>(
      this.storeName,
      (s) => s.technicianId === technicianId,
    );
  }

  async save(submission: ChecklistSubmission): Promise<void> {
    await this.storage.set(this.storeName, submission.id, submission);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }
}
