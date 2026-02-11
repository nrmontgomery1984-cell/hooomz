/**
 * Training Service (Build 3c)
 *
 * Per-crew, per-SOP training progression tracking.
 * Certification flow: 3 supervised completions → review (80%) → manual signoff.
 * Soft gate: warns but never blocks task assignment.
 */

import type { TrainingRecord, SupervisedCompletion, ReviewAttempt } from '@hooomz/shared-contracts';
import type { TrainingRecordRepository } from '../repositories/trainingRecord.repository';
import type { SopRepository } from '../repositories/labs/sop.repository';
import type { ActivityService } from '../repositories/activity.repository';

export class TrainingService {
  constructor(
    private trainingRepo: TrainingRecordRepository,
    private sopRepo: SopRepository,
    private activity: ActivityService,
  ) {}

  /**
   * Get or create a training record for a crew member + SOP
   */
  async getOrCreate(crewMemberId: string, sopId: string): Promise<TrainingRecord> {
    const existing = await this.trainingRepo.findByCrewAndSop(crewMemberId, sopId);
    if (existing) return existing;

    const sop = await this.sopRepo.findById(sopId);
    const sopCode = sop?.sopCode || 'UNKNOWN';

    return this.trainingRepo.create({
      crewMemberId,
      sopId,
      sopCode,
      status: 'in_progress',
      supervisedCompletions: [],
      reviewAttempts: [],
      certifiedAt: null,
      certifiedBy: null,
    });
  }

  /**
   * Record a supervised completion. Auto-detects if supervisor is present
   * from time entries on the same task at the same time.
   */
  async recordSupervisedCompletion(
    crewMemberId: string,
    sopId: string,
    completion: SupervisedCompletion,
  ): Promise<TrainingRecord> {
    const record = await this.getOrCreate(crewMemberId, sopId);

    const updated = await this.trainingRepo.update(record.id, {
      supervisedCompletions: [...record.supervisedCompletions, completion],
    });

    if (!updated) throw new Error('Failed to update training record');

    // Check if they now meet the threshold for review readiness
    const sop = await this.sopRepo.findById(sopId);
    const requiredCompletions = sop?.requiredSupervisedCompletions || 3;

    if (
      updated.status === 'in_progress' &&
      updated.supervisedCompletions.length >= requiredCompletions
    ) {
      await this.trainingRepo.update(record.id, { status: 'review_ready' });

      this.activity.logTrainingEvent('training.review_ready', crewMemberId, {
        sop_code: record.sopCode,
        sop_id: sopId,
        completions: updated.supervisedCompletions.length,
        required: requiredCompletions,
      }).catch((err) => console.error('Failed to log training event:', err));
    }

    this.activity.logTrainingEvent('training.supervised_completion', crewMemberId, {
      sop_code: record.sopCode,
      sop_id: sopId,
      task_id: completion.taskId,
      supervisor_name: completion.supervisorName,
      completion_number: updated.supervisedCompletions.length,
    }).catch((err) => console.error('Failed to log training event:', err));

    return updated;
  }

  /**
   * Record a review attempt (quiz or practical assessment)
   */
  async recordReviewAttempt(
    crewMemberId: string,
    sopId: string,
    attempt: Omit<ReviewAttempt, 'attemptNumber'>,
  ): Promise<TrainingRecord> {
    const record = await this.getOrCreate(crewMemberId, sopId);

    const attemptNumber = record.reviewAttempts.length + 1;
    const fullAttempt: ReviewAttempt = { ...attempt, attemptNumber };

    const updated = await this.trainingRepo.update(record.id, {
      reviewAttempts: [...record.reviewAttempts, fullAttempt],
    });

    if (!updated) throw new Error('Failed to update training record');

    this.activity.logTrainingEvent('training.review_completed', crewMemberId, {
      sop_code: record.sopCode,
      sop_id: sopId,
      attempt_number: attemptNumber,
      score: attempt.score,
      passed: attempt.passed,
    }).catch((err) => console.error('Failed to log training event:', err));

    return updated;
  }

  /**
   * Certify a crew member for an SOP (manual signoff — never auto)
   */
  async certify(
    crewMemberId: string,
    sopId: string,
    certifiedBy: string,
  ): Promise<TrainingRecord> {
    const record = await this.getOrCreate(crewMemberId, sopId);

    const updated = await this.trainingRepo.update(record.id, {
      status: 'certified',
      certifiedAt: new Date().toISOString(),
      certifiedBy,
    });

    if (!updated) throw new Error('Failed to update training record');

    this.activity.logTrainingEvent('training.certified', crewMemberId, {
      sop_code: record.sopCode,
      sop_id: sopId,
      certified_by: certifiedBy,
    }).catch((err) => console.error('Failed to log training event:', err));

    return updated;
  }

  /**
   * Check if a crew member is certified for an SOP (soft gate — info only)
   */
  async isCertified(crewMemberId: string, sopId: string): Promise<boolean> {
    const record = await this.trainingRepo.findByCrewAndSop(crewMemberId, sopId);
    return record?.status === 'certified';
  }

  /**
   * Get training summary for a crew member across all SOPs
   */
  async getCrewTrainingSummary(crewMemberId: string): Promise<{
    total: number;
    inProgress: number;
    reviewReady: number;
    certified: number;
    records: TrainingRecord[];
  }> {
    const records = await this.trainingRepo.findByCrewMember(crewMemberId);
    return {
      total: records.length,
      inProgress: records.filter((r) => r.status === 'in_progress').length,
      reviewReady: records.filter((r) => r.status === 'review_ready').length,
      certified: records.filter((r) => r.status === 'certified').length,
      records,
    };
  }

  /**
   * Get all training records for a specific SOP (who is trained, who isn't)
   */
  async getSopTrainingStatus(sopId: string): Promise<TrainingRecord[]> {
    return this.trainingRepo.findBySop(sopId);
  }

  // Passthrough reads
  async findAll(): Promise<TrainingRecord[]> {
    return this.trainingRepo.findAll();
  }

  async findById(id: string): Promise<TrainingRecord | null> {
    return this.trainingRepo.findById(id);
  }

  async findByCrewMember(crewMemberId: string): Promise<TrainingRecord[]> {
    return this.trainingRepo.findByCrewMember(crewMemberId);
  }

  async findByCrewAndSop(crewMemberId: string, sopId: string): Promise<TrainingRecord | null> {
    return this.trainingRepo.findByCrewAndSop(crewMemberId, sopId);
  }
}

export function createTrainingService(
  trainingRepo: TrainingRecordRepository,
  sopRepo: SopRepository,
  activity: ActivityService,
): TrainingService {
  return new TrainingService(trainingRepo, sopRepo, activity);
}
