/**
 * Labs Test Service
 * Manages test lifecycle (PDCA methodology) and connections to tokens/knowledge
 */

import type { LabsTest, LabsTestStatus, LabsTestCategory } from '@hooomz/shared-contracts';
import type { LabsTestRepository } from '../../repositories/labs/labsTest.repository';
import type { ActivityService } from '../../repositories/activity.repository';

export class LabsTestService {
  constructor(
    private testRepo: LabsTestRepository,
    private activity: ActivityService
  ) {}

  async proposeTest(data: Omit<LabsTest, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'status' | 'voteCount' | 'votedBy'>): Promise<LabsTest> {
    const test = await this.testRepo.create({
      ...data,
      status: 'proposed',
      voteCount: 0,
      votedBy: [],
    });

    this.activity.logLabsEvent('labs.test_proposed', test.id, {
      entity_name: test.title,
      category: test.category,
    }).catch((err) => console.error('Failed to log labs.test_proposed:', err));

    return test;
  }

  async createWithId(data: LabsTest): Promise<LabsTest> {
    return this.testRepo.createWithId(data);
  }

  async advanceStatus(id: string, newStatus: LabsTestStatus): Promise<LabsTest | null> {
    const test = await this.testRepo.findById(id);
    if (!test) return null;

    const updated = await this.testRepo.update(id, { status: newStatus });
    if (!updated) return null;

    this.activity.logLabsEvent(`labs.test_status_changed`, id, {
      entity_name: test.title,
      old_status: test.status,
      new_status: newStatus,
    }).catch((err) => console.error('Failed to log test status change:', err));

    return updated;
  }

  async startTest(id: string): Promise<LabsTest | null> {
    return this.advanceStatus(id, 'in-progress');
  }

  async completeTest(id: string, checkResults: LabsTest['checkResults']): Promise<LabsTest | null> {
    const updated = await this.testRepo.update(id, {
      status: 'complete',
      checkResults,
    });
    if (!updated) return null;

    this.activity.logLabsEvent('labs.test_completed', id, {
      entity_name: updated.title,
      winner: checkResults?.winner,
    }).catch((err) => console.error('Failed to log labs.test_completed:', err));

    return updated;
  }

  async publishTest(id: string, actChanges: LabsTest['actChanges']): Promise<LabsTest | null> {
    const updated = await this.testRepo.update(id, {
      status: 'published',
      actChanges,
    });
    if (!updated) return null;

    this.activity.logLabsEvent('labs.test_published', id, {
      entity_name: updated.title,
      sop_updates: actChanges?.sopUpdates?.length || 0,
      content_published: actChanges?.contentPublished?.length || 0,
    }).catch((err) => console.error('Failed to log labs.test_published:', err));

    return updated;
  }

  async updateDoData(id: string, doData: LabsTest['doData']): Promise<LabsTest | null> {
    return this.testRepo.update(id, { doData });
  }

  async updatePlan(id: string, plan: LabsTest['plan']): Promise<LabsTest | null> {
    return this.testRepo.update(id, { plan });
  }

  async recordVote(id: string, partnerId: string): Promise<LabsTest | null> {
    const test = await this.testRepo.findById(id);
    if (!test) return null;

    if (test.votedBy.includes(partnerId)) return test;

    return this.testRepo.update(id, {
      voteCount: test.voteCount + 1,
      votedBy: [...test.votedBy, partnerId],
    });
  }

  async findAll(): Promise<LabsTest[]> {
    return this.testRepo.findAll();
  }

  async findById(id: string): Promise<LabsTest | null> {
    return this.testRepo.findById(id);
  }

  async findByStatus(status: LabsTestStatus): Promise<LabsTest[]> {
    return this.testRepo.findByStatus(status);
  }

  async findByCategory(category: LabsTestCategory): Promise<LabsTest[]> {
    return this.testRepo.findByCategory(category);
  }

  async findActive(): Promise<LabsTest[]> {
    return this.testRepo.findActive();
  }

  async findByTokenId(tokenId: string): Promise<LabsTest[]> {
    return this.testRepo.findByTokenId(tokenId);
  }

  /** Get tests grouped by status for pipeline view */
  async getPipeline(): Promise<Record<LabsTestStatus, LabsTest[]>> {
    const all = await this.testRepo.findAll();
    const pipeline: Record<LabsTestStatus, LabsTest[]> = {
      'proposed': [],
      'voting': [],
      'planned': [],
      'in-progress': [],
      'complete': [],
      'published': [],
    };
    for (const test of all) {
      pipeline[test.status]?.push(test);
    }
    // Sort each group by priority
    for (const status of Object.keys(pipeline) as LabsTestStatus[]) {
      pipeline[status].sort((a, b) => a.priority - b.priority);
    }
    return pipeline;
  }
}
