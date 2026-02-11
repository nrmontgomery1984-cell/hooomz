import type { ProjectStatus } from '@hooomz/shared';
import type { ProjectService } from './project.service';
import type { LoopService } from './loop.service';
import type { ProjectWithRelations, LoopTreeNode } from '../types';

export interface CompletionCheckResult {
  canComplete: boolean;
  blockers: string[];
  warnings: string[];
}

export interface ProjectCompletionRequirements {
  allTasksComplete: boolean;
  finalWalkthroughComplete: boolean;
  allChangeOrdersResolved: boolean;
  clientSignoffCaptured: boolean;
}

export interface ProjectCompletionWarnings {
  hasAfterPhotos: boolean;
  finalInvoiceSent: boolean;
  warrantyInfoEntered: boolean;
}

export interface ProjectSummary {
  project: ProjectWithRelations;
  loopTree: LoopTreeNode[];
  taskCounts: { total: number; complete: number; blocked: number };
  completionCheck: CompletionCheckResult;
}

// Placeholder interfaces for services that will be built later
interface TaskService {
  getTaskCountsByProject(projectId: string): Promise<{ total: number; complete: number; blocked: number; cancelled: number }>;
  hasIncompleteTasksExcludingCancelled(projectId: string): Promise<boolean>;
  isFinalWalkthroughComplete(projectId: string): Promise<boolean>;
}

interface ChangeOrderService {
  hasUnresolvedChangeOrders(projectId: string): Promise<boolean>;
}

interface InvoiceService {
  isFinalInvoiceSent(projectId: string): Promise<boolean>;
}

interface PhotoService {
  hasAfterPhotosForAllLocations(projectId: string): Promise<boolean>;
}

interface SignoffService {
  hasClientSignoff(projectId: string): Promise<boolean>;
}

interface WarrantyService {
  isWarrantyInfoComplete(projectId: string): Promise<boolean>;
}

export class ProjectLifecycleService {
  // Valid status transitions
  private readonly statusTransitions: Record<ProjectStatus, ProjectStatus[]> = {
    lead: ['estimate', 'cancelled'],
    estimate: ['quoted', 'cancelled'],
    quoted: ['approved', 'estimate', 'cancelled'],
    approved: ['in_progress', 'on_hold', 'cancelled'],
    in_progress: ['on_hold', 'complete', 'cancelled'],
    on_hold: ['in_progress', 'cancelled'],
    complete: [], // Terminal state
    cancelled: [], // Terminal state
  };

  constructor(
    private projectService: ProjectService,
    private loopService: LoopService,
    // These will be injected when those modules are built
    private taskService?: TaskService,
    private changeOrderService?: ChangeOrderService,
    private invoiceService?: InvoiceService,
    private photoService?: PhotoService,
    private signoffService?: SignoffService,
    private warrantyService?: WarrantyService
  ) {}

  canTransition(from: ProjectStatus, to: ProjectStatus): boolean {
    return this.statusTransitions[from]?.includes(to) ?? false;
  }

  getValidTransitions(from: ProjectStatus): ProjectStatus[] {
    return this.statusTransitions[from] ?? [];
  }

  async transitionStatus(
    projectId: string,
    newStatus: ProjectStatus,
    actorId: string
  ): Promise<{ success: boolean; error?: string }> {
    const project = await this.projectService.getProject(projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    if (!this.canTransition(project.status, newStatus)) {
      return {
        success: false,
        error: `Cannot transition from ${project.status} to ${newStatus}`,
      };
    }

    // Special handling for completion
    if (newStatus === 'complete') {
      const checkResult = await this.checkCompletionRequirements(projectId);
      if (!checkResult.canComplete) {
        return {
          success: false,
          error: `Cannot complete: ${checkResult.blockers.join(', ')}`,
        };
      }
    }

    await this.projectService.changeStatus(projectId, newStatus, actorId);
    return { success: true };
  }

  async checkCompletionRequirements(projectId: string): Promise<CompletionCheckResult> {
    const blockers: string[] = [];
    const warnings: string[] = [];

    // Check all tasks complete or cancelled
    const hasIncompleteTasks = await this.hasIncompleteTasks(projectId);
    if (hasIncompleteTasks) {
      blockers.push('All tasks must be complete or cancelled');
    }

    // Check final walkthrough complete
    const walkthroughComplete = await this.isFinalWalkthroughComplete(projectId);
    if (!walkthroughComplete) {
      blockers.push('Final walkthrough task must be complete');
    }

    // Check all change orders resolved
    const hasUnresolvedCOs = await this.hasUnresolvedChangeOrders(projectId);
    if (hasUnresolvedCOs) {
      blockers.push('All change orders must be approved or rejected');
    }

    // Check client signoff
    const hasSignoff = await this.hasClientSignoff(projectId);
    if (!hasSignoff) {
      blockers.push('Client sign-off must be captured');
    }

    // Warnings (don't block, but notify)
    const hasAfterPhotos = await this.hasAfterPhotosForAllLocations(projectId);
    if (!hasAfterPhotos) {
      warnings.push('Missing "after" photos for some locations');
    }

    const invoiceSent = await this.isFinalInvoiceSent(projectId);
    if (!invoiceSent) {
      warnings.push('Final invoice not yet sent');
    }

    const warrantyComplete = await this.isWarrantyInfoComplete(projectId);
    if (!warrantyComplete) {
      warnings.push('Warranty info not entered for all major materials');
    }

    return {
      canComplete: blockers.length === 0,
      blockers,
      warnings,
    };
  }

  // Placeholder methods - will delegate to respective services when available
  private async hasIncompleteTasks(projectId: string): Promise<boolean> {
    if (this.taskService) {
      return this.taskService.hasIncompleteTasksExcludingCancelled(projectId);
    }
    // Default to false (no blockers) until task service is available
    return false;
  }

  private async isFinalWalkthroughComplete(projectId: string): Promise<boolean> {
    if (this.taskService) {
      return this.taskService.isFinalWalkthroughComplete(projectId);
    }
    // Default to true (no blockers) until task service is available
    return true;
  }

  private async hasUnresolvedChangeOrders(projectId: string): Promise<boolean> {
    if (this.changeOrderService) {
      return this.changeOrderService.hasUnresolvedChangeOrders(projectId);
    }
    // Default to false (no blockers) until change order service is available
    return false;
  }

  private async hasClientSignoff(projectId: string): Promise<boolean> {
    if (this.signoffService) {
      return this.signoffService.hasClientSignoff(projectId);
    }
    // Default to true (no blockers) until signoff service is available
    return true;
  }

  private async hasAfterPhotosForAllLocations(projectId: string): Promise<boolean> {
    if (this.photoService) {
      return this.photoService.hasAfterPhotosForAllLocations(projectId);
    }
    // Default to true (no warnings) until photo service is available
    return true;
  }

  private async isFinalInvoiceSent(projectId: string): Promise<boolean> {
    if (this.invoiceService) {
      return this.invoiceService.isFinalInvoiceSent(projectId);
    }
    // Default to true (no warnings) until invoice service is available
    return true;
  }

  private async isWarrantyInfoComplete(projectId: string): Promise<boolean> {
    if (this.warrantyService) {
      return this.warrantyService.isWarrantyInfoComplete(projectId);
    }
    // Default to true (no warnings) until warranty service is available
    return true;
  }

  // Get project dashboard summary
  async getProjectSummary(projectId: string): Promise<ProjectSummary | null> {
    const project = await this.projectService.getProjectWithRelations(projectId);
    if (!project) return null;

    const loopTree = await this.loopService.getLoopTree(projectId);

    // Task counts from task service or default
    let taskCounts = { total: 0, complete: 0, blocked: 0 };
    if (this.taskService) {
      const counts = await this.taskService.getTaskCountsByProject(projectId);
      taskCounts = {
        total: counts.total,
        complete: counts.complete,
        blocked: counts.blocked,
      };
    }

    const completionCheck =
      project.status === 'in_progress'
        ? await this.checkCompletionRequirements(projectId)
        : { canComplete: false, blockers: [], warnings: [] };

    return {
      project,
      loopTree,
      taskCounts,
      completionCheck,
    };
  }
}
