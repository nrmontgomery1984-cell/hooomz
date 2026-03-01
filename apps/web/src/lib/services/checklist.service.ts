/**
 * Checklist Service
 * Manages SOP checklist submissions — start, save draft, submit.
 */

import type { ChecklistSubmission } from '@hooomz/shared-contracts';
import type { ChecklistRepository } from '../repositories/checklist.repository';
import type { ActivityService } from '../repositories/activity.repository';

export class ChecklistService {
  constructor(
    private repo: ChecklistRepository,
    private activity: ActivityService,
  ) {}

  async getAll(): Promise<ChecklistSubmission[]> {
    return this.repo.getAll();
  }

  async getById(id: string): Promise<ChecklistSubmission | null> {
    return this.repo.getById(id);
  }

  async getBySopId(sopId: string): Promise<ChecklistSubmission[]> {
    return this.repo.getBySopId(sopId);
  }

  async getByProjectId(projectId: string): Promise<ChecklistSubmission[]> {
    return this.repo.getByProjectId(projectId);
  }

  async getByTechnicianId(technicianId: string): Promise<ChecklistSubmission[]> {
    return this.repo.getByTechnicianId(technicianId);
  }

  async saveDraft(submission: ChecklistSubmission): Promise<void> {
    await this.repo.save({ ...submission, status: 'draft' });
  }

  async submit(submission: ChecklistSubmission): Promise<void> {
    const final: ChecklistSubmission = {
      ...submission,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };
    await this.repo.save(final);

    this.activity.create({
      event_type: 'checklist_submitted',
      project_id: submission.projectId || 'system',
      entity_type: 'checklist_submission',
      entity_id: submission.id,
      summary: `Checklist submitted: ${submission.sopCode} by ${submission.technicianName}`,
    }).catch((err) => console.error('Failed to log checklist event:', err));
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.repo.getById(id);
    if (!existing) return false;
    await this.repo.delete(id);
    return true;
  }
}

export function createChecklistService(
  repo: ChecklistRepository,
  activity: ActivityService,
): ChecklistService {
  return new ChecklistService(repo, activity);
}
