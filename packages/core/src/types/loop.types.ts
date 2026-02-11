import type { LoopContext, LoopIteration, LoopType, LoopStatus } from '@hooomz/shared';

export interface CreateLoopContextInput {
  project_id: string;
  name: string;
  parent_context_id?: string;
  loop_type: LoopType;
  binding_key?: string;
  display_order?: number;
}

export interface CreateLoopIterationInput {
  context_id: string;
  project_id: string;
  name: string;
  parent_iteration_id?: string;
  display_order?: number;
}

export interface UpdateLoopIterationInput {
  name?: string;
  display_order?: number;
  computed_status?: LoopStatus;
}

export interface LoopIterationWithChildren extends LoopIteration {
  children?: LoopIterationWithChildren[];
  tasks?: {
    total: number;
    complete: number;
    blocked: number;
  };
}

export interface LoopTreeNode {
  iteration: LoopIteration;
  context: LoopContext;
  children: LoopTreeNode[];
  depth: number;
}

// Only these transform to property structure on completion
export const PROPERTY_TRANSFORMABLE_TYPES: LoopType[] = ['floor', 'location', 'zone'];
