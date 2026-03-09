/**
 * Job Health Service
 *
 * Computes a weighted health score per project:
 *   Completion 50% + Budget 30% + Blockers 20%
 *
 * Returns a JobHealthResult with score, Three-Dot color, and breakdown.
 */

import type { Task } from '@hooomz/shared-contracts';
import type { Services } from './index';
import type { JobHealthResult } from '../constants/threeDot';
import { scoreToThreeDot, THREE_DOT_HEX, THREE_DOT_LABELS } from '../constants/threeDot';

// ============================================================================
// Service
// ============================================================================

export class JobHealthService {
  constructor(private services: Services) {}

  async getJobHealthStatus(projectId: string): Promise<JobHealthResult> {
    // --- Completion (50%) ---
    const tasks: Task[] = await this.services.scheduling.tasks.findByProjectId(projectId);
    const total = tasks.length;
    const completed = tasks.filter((t: Task) => t.status === 'complete').length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 100;

    // --- Budget (30%) ---
    const budgets = await this.services.budget.findByProject(projectId);
    let budgetPct = 100;
    if (budgets.length > 0) {
      const totalBudgeted = budgets.reduce((s, b) => s + b.budgetedHours, 0);
      const totalActual = budgets.reduce((s, b) => s + b.actualHours, 0);
      if (totalBudgeted > 0) {
        const ratio = totalActual / totalBudgeted;
        // Under budget = 100, at budget = 80, 20% over = 50, 50%+ over = 0
        if (ratio <= 1) budgetPct = 100;
        else if (ratio <= 1.2) budgetPct = Math.round(100 - (ratio - 1) * 250);
        else if (ratio <= 1.5) budgetPct = Math.round(50 - (ratio - 1.2) * 166.67);
        else budgetPct = 0;
      }
    }

    // --- Blockers (20%) ---
    const blockedTasks = tasks.filter((t: Task) => t.status === 'blocked');
    // Each blocked task deducts 25 points (capped at 100)
    const blockerPenalty = Math.min(blockedTasks.length * 25, 100);
    const blockerScore = 100 - blockerPenalty;

    // --- Weighted total ---
    const score = Math.round(
      completionPct * 0.5 + budgetPct * 0.3 + blockerScore * 0.2
    );

    const color = scoreToThreeDot(score);

    return {
      score,
      color,
      hex: THREE_DOT_HEX[color],
      label: THREE_DOT_LABELS[color],
      completionPct,
      budgetPct,
      blockerPenalty,
    };
  }
}
