/**
 * Loop Management Service (Build 3d)
 *
 * IndexedDB-backed loop management for building structure definition.
 * LoopContext = a TYPE of repeating structure (Floors, Rooms)
 * LoopIteration = a SPECIFIC instance (1st Floor, Kitchen)
 *
 * Standard Residential template creates Floors + Rooms contexts with one tap.
 */

import type { LoopContext, LoopIteration, LoopType } from '@hooomz/shared';
import type { LoopContextRepository } from '../repositories/loopContext.repository';
import type { LoopIterationRepository } from '../repositories/loopIteration.repository';
import type { ActivityService } from '../repositories/activity.repository';

export interface StandardResidentialFloor {
  name: string;
  rooms: string[];
}

const STANDARD_RESIDENTIAL_TEMPLATE: StandardResidentialFloor[] = [
  { name: 'Main Floor', rooms: ['Living Room', 'Kitchen', 'Dining Room', 'Bathroom', 'Entry'] },
  { name: 'Upper Floor', rooms: ['Master Bedroom', 'Bedroom 2', 'Bedroom 3', 'Main Bath'] },
  { name: 'Basement', rooms: ['Rec Room', 'Laundry', 'Storage'] },
];

export class LoopManagementService {
  constructor(
    private contextRepo: LoopContextRepository,
    private iterationRepo: LoopIterationRepository,
    private activity: ActivityService,
  ) {}

  // ============================================================================
  // Context Management
  // ============================================================================

  async createContext(
    projectId: string,
    name: string,
    loopType: LoopType,
    options?: {
      parentContextId?: string;
      bindingKey?: string;
      displayOrder?: number;
    }
  ): Promise<LoopContext> {
    const existingContexts = await this.contextRepo.findByProject(projectId);
    const context = await this.contextRepo.create({
      project_id: projectId,
      name,
      loop_type: loopType,
      parent_context_id: options?.parentContextId ?? null,
      binding_key: options?.bindingKey ?? null,
      display_order: options?.displayOrder ?? existingContexts.length,
    });

    this.activity.logLoopEvent('loop.context_created', projectId, context.id, {
      loop_name: name,
      loop_type: loopType,
    }).catch((err) => console.error('Failed to log loop.context_created:', err));

    return context;
  }

  async getProjectContexts(projectId: string): Promise<LoopContext[]> {
    return this.contextRepo.findByProject(projectId);
  }

  async deleteContext(contextId: string): Promise<boolean> {
    const context = await this.contextRepo.findById(contextId);
    if (!context) return false;

    // Delete all iterations belonging to this context
    const iterations = await this.iterationRepo.findByContext(contextId);
    for (const iter of iterations) {
      await this.iterationRepo.delete(iter.id);
    }

    const deleted = await this.contextRepo.delete(contextId);

    this.activity.logLoopEvent('loop.deleted', context.project_id, contextId, {
      loop_name: context.name,
      loop_type: context.loop_type,
    }).catch((err) => console.error('Failed to log loop.deleted:', err));

    return deleted;
  }

  // ============================================================================
  // Iteration Management
  // ============================================================================

  async createIteration(
    contextId: string,
    projectId: string,
    name: string,
    options?: {
      parentIterationId?: string;
      displayOrder?: number;
    }
  ): Promise<LoopIteration> {
    const siblings = options?.parentIterationId
      ? await this.iterationRepo.findByParent(options.parentIterationId)
      : await this.iterationRepo.findByContext(contextId);
    const rootSiblings = siblings.filter((s) =>
      options?.parentIterationId
        ? s.parent_iteration_id === options.parentIterationId
        : s.parent_iteration_id === null
    );

    const iteration = await this.iterationRepo.create({
      context_id: contextId,
      project_id: projectId,
      name,
      parent_iteration_id: options?.parentIterationId ?? null,
      display_order: options?.displayOrder ?? rootSiblings.length,
      computed_status: 'not_started',
      child_counts: { total: 0, not_started: 0, in_progress: 0, blocked: 0, complete: 0 },
    });

    this.activity.logLoopEvent('loop.iteration_created', projectId, iteration.id, {
      loop_name: name,
      context_id: contextId,
    }).catch((err) => console.error('Failed to log loop.iteration_created:', err));

    return iteration;
  }

  async getProjectIterations(projectId: string): Promise<LoopIteration[]> {
    return this.iterationRepo.findByProject(projectId);
  }

  async getContextIterations(contextId: string): Promise<LoopIteration[]> {
    return this.iterationRepo.findByContext(contextId);
  }

  async getChildIterations(parentIterationId: string): Promise<LoopIteration[]> {
    return this.iterationRepo.findByParent(parentIterationId);
  }

  async getRootIterations(projectId: string): Promise<LoopIteration[]> {
    return this.iterationRepo.findRootIterations(projectId);
  }

  async updateIteration(
    iterationId: string,
    data: { name?: string; display_order?: number }
  ): Promise<LoopIteration | null> {
    const iteration = await this.iterationRepo.findById(iterationId);
    if (!iteration) return null;

    const updated = await this.iterationRepo.update(iterationId, data);

    if (updated) {
      this.activity.logLoopEvent('loop.iteration_updated', iteration.project_id, iterationId, {
        loop_name: updated.name,
        context_id: iteration.context_id,
      }).catch((err) => console.error('Failed to log loop.iteration_updated:', err));
    }

    return updated;
  }

  async deleteIteration(iterationId: string): Promise<boolean> {
    const iteration = await this.iterationRepo.findById(iterationId);
    if (!iteration) return false;

    // Delete all child iterations recursively
    const children = await this.iterationRepo.findByParent(iterationId);
    for (const child of children) {
      await this.deleteIteration(child.id);
    }

    return this.iterationRepo.delete(iterationId);
  }

  // ============================================================================
  // Tree Building
  // ============================================================================

  /**
   * Build a nested tree of all iterations for a project.
   * Returns floor-level iterations with rooms nested as children.
   */
  async buildProjectTree(projectId: string): Promise<{
    contexts: LoopContext[];
    tree: IterationTreeNode[];
  }> {
    const contexts = await this.contextRepo.findByProject(projectId);
    const allIterations = await this.iterationRepo.findByProject(projectId);

    // Build map for quick lookup
    const iterationMap = new Map<string, LoopIteration>();
    for (const iter of allIterations) {
      iterationMap.set(iter.id, iter);
    }

    // Context map for lookup
    const contextMap = new Map<string, LoopContext>();
    for (const ctx of contexts) {
      contextMap.set(ctx.id, ctx);
    }

    // Build tree from root iterations
    const rootIterations = allIterations
      .filter((i) => i.parent_iteration_id === null)
      .sort((a, b) => a.display_order - b.display_order);

    const buildNode = (iteration: LoopIteration, depth: number): IterationTreeNode => {
      const children = allIterations
        .filter((i) => i.parent_iteration_id === iteration.id)
        .sort((a, b) => a.display_order - b.display_order)
        .map((child) => buildNode(child, depth + 1));

      return {
        iteration,
        context: contextMap.get(iteration.context_id) ?? null,
        children,
        depth,
      };
    };

    const tree = rootIterations.map((root) => buildNode(root, 0));

    return { contexts, tree };
  }

  // ============================================================================
  // Standard Residential Template
  // ============================================================================

  /**
   * Apply the Standard Residential template to a project.
   * Creates Floors + Rooms contexts and populates with standard layout.
   */
  async applyStandardResidentialTemplate(
    projectId: string,
    floors?: StandardResidentialFloor[]
  ): Promise<{ contexts: LoopContext[]; iterations: LoopIteration[] }> {
    const template = floors ?? STANDARD_RESIDENTIAL_TEMPLATE;

    // Create floor context
    const floorContext = await this.createContext(projectId, 'Floors', 'floor', {
      bindingKey: 'floor',
      displayOrder: 0,
    });

    // Create room context (child of floor)
    const roomContext = await this.createContext(projectId, 'Rooms', 'location', {
      parentContextId: floorContext.id,
      bindingKey: 'room',
      displayOrder: 1,
    });

    const contexts = [floorContext, roomContext];
    const iterations: LoopIteration[] = [];

    for (let fi = 0; fi < template.length; fi++) {
      const floor = template[fi];
      const floorIteration = await this.createIteration(
        floorContext.id,
        projectId,
        floor.name,
        { displayOrder: fi }
      );
      iterations.push(floorIteration);

      for (let ri = 0; ri < floor.rooms.length; ri++) {
        const roomIteration = await this.createIteration(
          roomContext.id,
          projectId,
          floor.rooms[ri],
          { parentIterationId: floorIteration.id, displayOrder: ri }
        );
        iterations.push(roomIteration);
      }
    }

    this.activity.logLoopEvent('loop.structure_templated', projectId, floorContext.id, {
      loop_name: 'Standard Residential',
      template_floors: template.length,
      template_rooms: template.reduce((sum, f) => sum + f.rooms.length, 0),
    }).catch((err) => console.error('Failed to log loop.structure_templated:', err));

    return { contexts, iterations };
  }

  // ============================================================================
  // Passthrough Reads
  // ============================================================================

  async findContextById(id: string): Promise<LoopContext | null> {
    return this.contextRepo.findById(id);
  }

  async findIterationById(id: string): Promise<LoopIteration | null> {
    return this.iterationRepo.findById(id);
  }

  async clearAll(): Promise<void> {
    await this.contextRepo.clear();
    await this.iterationRepo.clear();
  }
}

export interface IterationTreeNode {
  iteration: LoopIteration;
  context: LoopContext | null;
  children: IterationTreeNode[];
  depth: number;
}

export function createLoopManagementService(
  contextRepo: LoopContextRepository,
  iterationRepo: LoopIterationRepository,
  activity: ActivityService,
): LoopManagementService {
  return new LoopManagementService(contextRepo, iterationRepo, activity);
}
