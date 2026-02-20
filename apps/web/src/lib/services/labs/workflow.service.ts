/**
 * Workflow Service
 * Manages construction sequencing workflows (Labs entity).
 * Key method: resolveSortOrder() — maps task attributes to a numeric sort position
 * based on the workflow's phase definitions.
 */

import type { Workflow } from '@hooomz/shared-contracts';
import type { WorkflowRepository } from '../../repositories/workflow.repository';
import type { ActivityService } from '../../repositories/activity.repository';
import { TRADE_CODES } from '../../types/intake.types';

// Trade code → sub-order offset within a phase
const TRADE_SUB_ORDER: Record<string, number> = {};
for (const [code, meta] of Object.entries(TRADE_CODES)) {
  TRADE_SUB_ORDER[code] = meta.order * 100;
}

export class WorkflowService {
  constructor(
    private repo: WorkflowRepository,
    private activity: ActivityService
  ) {}

  // ============================================================================
  // Sort Order Resolution
  // ============================================================================

  /**
   * Resolve a numeric sort order for a task based on workflow phases.
   *
   * Matching priority:
   * 1. sopCode match — task's sopCode appears in a phase's sopCodes array
   * 2. stageCode + tradeCode match — both match a phase
   * 3. stageCode-only match — fallback to first phase with matching stageCode
   * 4. No match — returns 99000 (sorts to end)
   *
   * Formula: phase.order * 1000 + tradeSubOrder
   */
  resolveSortOrder(
    task: { sopCode?: string; stageCode?: string; workCategoryCode?: string },
    workflow: Workflow
  ): number {
    const { sopCode, stageCode, workCategoryCode } = task;
    const tradeSubOrder = (workCategoryCode && TRADE_SUB_ORDER[workCategoryCode]) || 0;

    // Priority 1: Direct sopCode match
    if (sopCode) {
      for (const phase of workflow.phases) {
        if (phase.sopCodes.includes(sopCode)) {
          return phase.order * 1000 + tradeSubOrder;
        }
      }
    }

    // Priority 2: stageCode + tradeCode match
    if (stageCode && workCategoryCode) {
      for (const phase of workflow.phases) {
        if (phase.stageCode === stageCode && phase.tradeCodes.includes(workCategoryCode)) {
          return phase.order * 1000 + tradeSubOrder;
        }
      }
    }

    // Priority 3: stageCode-only match (first matching phase)
    if (stageCode) {
      for (const phase of workflow.phases) {
        if (phase.stageCode === stageCode) {
          return phase.order * 1000 + tradeSubOrder;
        }
      }
    }

    // No match
    return 99000;
  }

  // ============================================================================
  // CRUD
  // ============================================================================

  async getDefault(): Promise<Workflow | null> {
    return this.repo.findDefault();
  }

  async getAll(): Promise<Workflow[]> {
    return this.repo.findAll();
  }

  async getActive(): Promise<Workflow[]> {
    return this.repo.findActive();
  }

  async getById(id: string): Promise<Workflow | null> {
    return this.repo.findById(id);
  }

  async create(data: Omit<Workflow, 'id' | 'metadata'>): Promise<Workflow> {
    const workflow = await this.repo.create(data);

    this.activity.logLabsEvent('workflow.created', workflow.id, {
      entity_name: workflow.name,
    }).catch((err) => console.error('Failed to log workflow.created:', err));

    return workflow;
  }

  async createWithId(id: string, data: Omit<Workflow, 'id' | 'metadata'>): Promise<Workflow> {
    const workflow = await this.repo.createWithId(id, data);

    this.activity.logLabsEvent('workflow.created', workflow.id, {
      entity_name: workflow.name,
    }).catch((err) => console.error('Failed to log workflow.created:', err));

    return workflow;
  }

  async update(id: string, data: Partial<Omit<Workflow, 'id' | 'metadata'>>): Promise<Workflow | null> {
    const workflow = await this.repo.update(id, data);
    if (!workflow) return null;

    this.activity.logLabsEvent('workflow.updated', workflow.id, {
      entity_name: workflow.name,
    }).catch((err) => console.error('Failed to log workflow.updated:', err));

    return workflow;
  }

  async archive(id: string): Promise<Workflow | null> {
    const workflow = await this.repo.update(id, { status: 'archived' });
    if (!workflow) return null;

    this.activity.logLabsEvent('workflow.archived', workflow.id, {
      entity_name: workflow.name,
    }).catch((err) => console.error('Failed to log workflow.archived:', err));

    return workflow;
  }
}
