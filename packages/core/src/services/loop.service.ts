import type { LoopContext, LoopIteration, LoopStatus } from '@hooomz/shared';
import type { LoopContextRepository, LoopIterationRepository } from '../repositories';
import type {
  CreateLoopContextInput,
  CreateLoopIterationInput,
  UpdateLoopIterationInput,
  LoopTreeNode,
} from '../types';
import { PROPERTY_TRANSFORMABLE_TYPES } from '../types';

interface ActivityService {
  log(event: {
    organization_id: string;
    project_id: string;
    property_id: string;
    event_type: string;
    actor_id: string;
    actor_type: 'team_member' | 'system' | 'customer';
    entity_type: string;
    entity_id: string;
    loop_iteration_id?: string;
    homeowner_visible: boolean;
    event_data: Record<string, unknown>;
  }): Promise<void>;
}

interface ProjectRepository {
  findById(id: string): Promise<{ organization_id: string; property_id: string } | null>;
}

export class LoopService {
  constructor(
    private contextRepo: LoopContextRepository,
    private iterationRepo: LoopIterationRepository,
    private projectRepo: ProjectRepository,
    private activityService?: ActivityService
  ) {}

  // Context operations
  async createContext(input: CreateLoopContextInput, actorId: string): Promise<LoopContext> {
    const context = await this.contextRepo.create(input);

    // Log if location type (visible to homeowner as scope change)
    if (this.activityService && PROPERTY_TRANSFORMABLE_TYPES.includes(input.loop_type)) {
      const project = await this.projectRepo.findById(input.project_id);
      if (project) {
        await this.activityService.log({
          organization_id: project.organization_id,
          project_id: input.project_id,
          property_id: project.property_id,
          event_type: 'loop.created',
          actor_id: actorId,
          actor_type: 'team_member',
          entity_type: 'loop_context',
          entity_id: context.id,
          homeowner_visible: true, // Location loops are visible
          event_data: { name: context.name, loop_type: context.loop_type },
        });
      }
    }

    return context;
  }

  async getContext(id: string): Promise<LoopContext | null> {
    return this.contextRepo.findById(id);
  }

  async getContextsByProject(projectId: string): Promise<LoopContext[]> {
    return this.contextRepo.findByProject(projectId);
  }

  async updateContext(id: string, input: Partial<CreateLoopContextInput>): Promise<LoopContext> {
    return this.contextRepo.update(id, input);
  }

  async deleteContext(id: string): Promise<void> {
    return this.contextRepo.delete(id);
  }

  // Iteration operations
  async createIteration(input: CreateLoopIterationInput, _actorId: string): Promise<LoopIteration> {
    const iteration = await this.iterationRepo.create(input);

    // Update parent's child counts if has parent
    if (input.parent_iteration_id) {
      await this.recalculateChildCounts(input.parent_iteration_id);
    }

    return iteration;
  }

  async getIteration(id: string): Promise<LoopIteration | null> {
    return this.iterationRepo.findById(id);
  }

  async getIterationsByProject(projectId: string): Promise<LoopIteration[]> {
    return this.iterationRepo.findByProject(projectId);
  }

  async getIterationsByContext(contextId: string): Promise<LoopIteration[]> {
    return this.iterationRepo.findByContext(contextId);
  }

  async updateIteration(id: string, input: UpdateLoopIterationInput, _actorId: string): Promise<LoopIteration> {
    const updated = await this.iterationRepo.update(id, input);

    // If status changed, bubble up to parent
    if (input.computed_status) {
      const iteration = await this.iterationRepo.findById(id);
      if (iteration?.parent_iteration_id) {
        await this.recalculateParentStatus(iteration.parent_iteration_id);
      }
    }

    return updated;
  }

  async deleteIteration(id: string): Promise<void> {
    const iteration = await this.iterationRepo.findById(id);
    await this.iterationRepo.delete(id);

    // Update parent's child counts if has parent
    if (iteration?.parent_iteration_id) {
      await this.recalculateChildCounts(iteration.parent_iteration_id);
      await this.recalculateParentStatus(iteration.parent_iteration_id);
    }
  }

  // Build hierarchical tree structure
  async getLoopTree(projectId: string): Promise<LoopTreeNode[]> {
    const contexts = await this.contextRepo.findByProject(projectId);
    const iterations = await this.iterationRepo.findByProject(projectId);

    const contextMap = new Map(contexts.map(c => [c.id, c]));

    // Build tree from root iterations
    const rootIterations = iterations.filter(i => !i.parent_iteration_id);

    const buildNode = (iteration: LoopIteration, depth: number): LoopTreeNode => {
      const children = iterations
        .filter(i => i.parent_iteration_id === iteration.id)
        .map(child => buildNode(child, depth + 1));

      return {
        iteration,
        context: contextMap.get(iteration.context_id)!,
        children,
        depth,
      };
    };

    return rootIterations.map(root => buildNode(root, 0));
  }

  // Status bubbling - recalculate parent status based on children
  async recalculateParentStatus(parentId: string): Promise<void> {
    const children = await this.iterationRepo.findChildren(parentId);

    if (children.length === 0) return;

    const counts = {
      total: children.length,
      not_started: children.filter(c => c.computed_status === 'not_started').length,
      in_progress: children.filter(c => c.computed_status === 'in_progress').length,
      blocked: children.filter(c => c.computed_status === 'blocked').length,
      complete: children.filter(c => c.computed_status === 'complete').length,
    };

    // Determine parent status
    let newStatus: LoopStatus;
    if (counts.blocked > 0) {
      newStatus = 'blocked';
    } else if (counts.complete === counts.total) {
      newStatus = 'complete';
    } else if (counts.not_started === counts.total) {
      newStatus = 'not_started';
    } else {
      newStatus = 'in_progress';
    }

    await this.iterationRepo.update(parentId, { computed_status: newStatus });
    await this.iterationRepo.updateChildCounts(parentId, counts);

    // Continue bubbling up
    const parent = await this.iterationRepo.findById(parentId);
    if (parent?.parent_iteration_id) {
      await this.recalculateParentStatus(parent.parent_iteration_id);
    }
  }

  // Recalculate child counts for a parent
  async recalculateChildCounts(parentId: string): Promise<void> {
    const children = await this.iterationRepo.findChildren(parentId);

    const counts = {
      total: children.length,
      not_started: children.filter(c => c.computed_status === 'not_started').length,
      in_progress: children.filter(c => c.computed_status === 'in_progress').length,
      blocked: children.filter(c => c.computed_status === 'blocked').length,
      complete: children.filter(c => c.computed_status === 'complete').length,
    };

    await this.iterationRepo.updateChildCounts(parentId, counts);
  }

  // Get iterations that will transform to property rooms
  async getPropertyTransformableIterations(projectId: string): Promise<LoopIteration[]> {
    const contexts = await this.contextRepo.findByProject(projectId);
    const transformableContextIds = contexts
      .filter(c => PROPERTY_TRANSFORMABLE_TYPES.includes(c.loop_type))
      .map(c => c.id);

    const iterations = await this.iterationRepo.findByProject(projectId);
    return iterations.filter(i => transformableContextIds.includes(i.context_id));
  }
}
