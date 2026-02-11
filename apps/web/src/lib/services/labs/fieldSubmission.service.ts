/**
 * Field Submission Service — wraps repository with activity logging (Phase 2)
 */

import type { FieldSubmission, SubmissionStatus } from '@hooomz/shared-contracts';
import type { FieldSubmissionRepository } from '../../repositories/labs';
import type { NotificationRepository } from '../../repositories/labs';
import type { ActivityService } from '../../repositories/activity.repository';

export class FieldSubmissionService {
  constructor(
    private repo: FieldSubmissionRepository,
    private notifications: NotificationRepository,
    private activity: ActivityService
  ) {}

  async create(data: Omit<FieldSubmission, 'id' | 'metadata'>): Promise<FieldSubmission> {
    const submission = await this.repo.create(data);

    this.activity.logLabsEvent('labs.submission_created', submission.id, {
      entity_name: submission.category,
      project_id: submission.projectId,
    }).catch((err) => console.error('Failed to log labs.submission_created:', err));

    return submission;
  }

  async resolve(id: string, status: SubmissionStatus, labsNotes?: string, reviewedBy?: string): Promise<FieldSubmission | null> {
    const updated = await this.repo.update(id, {
      status,
      labsNotes,
      reviewedBy,
      reviewedAt: new Date().toISOString(),
    });

    if (updated) {
      this.activity.logLabsEvent('labs.submission_resolved', id, {
        entity_name: updated.category,
        project_id: updated.projectId,
        resolution: status,
      }).catch((err) => console.error('Failed to log labs.submission_resolved:', err));

      // Notify submitter
      await this.notifications.create({
        userId: updated.submittedBy,
        type: 'labs_submission_update',
        title: 'Submission Updated',
        body: `Your submission has been ${status.replace(/_/g, ' ')}`,
        actionUrl: `/labs/submissions`,
        isRead: false,
        timestamp: new Date().toISOString(),
      });
    }

    return updated;
  }

  async findById(id: string) { return this.repo.findById(id); }
  async findAll() { return this.repo.findAll(); }
  async findByStatus(status: string) { return this.repo.findByStatus(status); }
  async findBySubmitter(submittedBy: string) { return this.repo.findBySubmitter(submittedBy); }
  async findPending() { return this.repo.findPending(); }

  async update(id: string, data: Partial<Omit<FieldSubmission, 'id' | 'metadata'>>) {
    return this.repo.update(id, data);
  }

  async delete(id: string) { return this.repo.delete(id); }
}
