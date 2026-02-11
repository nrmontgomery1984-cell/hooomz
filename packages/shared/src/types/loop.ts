export interface LoopContext {
  id: string;
  project_id: string;
  name: string;
  parent_context_id: string | null;
  display_order: number;
  loop_type: LoopType;
  binding_key: string | null;
}

export type LoopType =
  | 'floor'
  | 'location'
  | 'zone'
  | 'work_category'
  | 'phase'
  | 'custom';

export interface LoopIteration {
  id: string;
  context_id: string;
  project_id: string;
  name: string;
  parent_iteration_id: string | null;
  display_order: number;
  computed_status: LoopStatus;
  child_counts: LoopChildCounts;
}

export type LoopStatus = 'not_started' | 'in_progress' | 'blocked' | 'complete';

export interface LoopChildCounts {
  total: number;
  not_started: number;
  in_progress: number;
  blocked: number;
  complete: number;
}

// Only these loop types transform to property structure
export const PROPERTY_LOOP_TYPES: LoopType[] = ['floor', 'location', 'zone'];
