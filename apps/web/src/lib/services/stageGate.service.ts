/**
 * Stage Gate Service
 *
 * canAdvanceStage(projectId, currentStage) → { allowed, blockers[], nextStage }
 *
 * Soft gate: shows blocker warnings but allows override.
 *
 * Gate checks per stage:
 *  Shield: site protection checklist submitted
 *  Clear:  at least 1 before-condition photo on project
 *  Ready:  material selections exist and confirmed
 *  Install: no tasks with status 'blocked'
 *  Punch:  punch list acknowledged (created, even if empty)
 *  Turnover: all punch items resolved + at least 1 invoice issued
 */

import { JobStage, SCRIPT_STAGES } from '@hooomz/shared-contracts';
import type { Services } from './index';

export interface StageGateResult {
  allowed: boolean;
  blockers: string[];
  nextStage: JobStage | null;
}

export class StageGateService {
  constructor(private services: Services) {}

  async canAdvanceStage(projectId: string, currentStage: JobStage | undefined): Promise<StageGateResult> {
    if (!currentStage) {
      return { allowed: false, blockers: ['No current stage set'], nextStage: null };
    }

    const stageIndex = SCRIPT_STAGES.indexOf(currentStage);
    if (stageIndex === -1 || stageIndex >= SCRIPT_STAGES.length - 1) {
      return { allowed: false, blockers: ['Already at final stage'], nextStage: null };
    }

    const nextStage = SCRIPT_STAGES[stageIndex + 1];
    const blockers: string[] = [];

    switch (currentStage) {
      case JobStage.SHIELD: {
        // Check: site protection checklist submitted
        const checklists = await this.services.checklists.getByProjectId(projectId);
        const hasSiteProtection = checklists.some(
          (c) => c.sopCode?.toLowerCase().includes('site-protection') || c.sopCode?.toLowerCase().includes('shield'),
        );
        if (!hasSiteProtection) {
          blockers.push('Site protection checklist not submitted');
        }
        break;
      }

      case JobStage.CLEAR: {
        // Check: at least 1 before-condition photo
        const photos = await this.services.fieldDocs.photos.findByProjectId(projectId);
        if (photos.length === 0) {
          blockers.push('No before-condition photos uploaded');
        }
        break;
      }

      case JobStage.READY: {
        // Check: material selections exist and confirmed
        const selections = await this.services.materialSelection.findByProject(projectId);
        if (selections.length === 0) {
          blockers.push('No material selections created');
        } else {
          const unconfirmed = selections.filter((s) => s.status !== 'confirmed' && s.status !== 'ordered');
          if (unconfirmed.length > 0) {
            blockers.push(`${unconfirmed.length} material selection(s) not confirmed`);
          }
        }
        break;
      }

      case JobStage.INSTALL: {
        // Check: no blocked tasks
        const tasks = await this.services.scheduling.tasks.findByProjectId(projectId);
        const blocked = tasks.filter((t) => t.status === 'blocked');
        if (blocked.length > 0) {
          blockers.push(`${blocked.length} task(s) are blocked`);
        }
        break;
      }

      case JobStage.PUNCH: {
        // Check: punch list acknowledged (at least queried — we check if any exist)
        const punchItems = await this.services.punchList.findByProject(projectId);
        const openItems = punchItems.filter((p) => p.status !== 'resolved' && p.status !== 'verified');
        if (openItems.length > 0) {
          blockers.push(`${openItems.length} punch list item(s) still open`);
        }
        // Check: at least 1 invoice issued
        const invoices = await this.services.invoices.findByProjectId(projectId);
        if (invoices.length === 0) {
          blockers.push('No invoices issued');
        }
        break;
      }

      default:
        break;
    }

    return {
      allowed: blockers.length === 0,
      blockers,
      nextStage,
    };
  }
}
