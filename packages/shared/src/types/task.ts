export interface TaskTemplate {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category_code: string;
  estimated_hours: number | null;
  binding_pattern: BindingPattern | null;
  is_active: boolean;
}

export type BindingPattern = 'per_project' | 'per_floor' | 'per_room' | 'per_zone';

export interface TaskInstance {
  id: string;
  project_id: string;
  template_id: string | null;
  loop_iteration_id: string;
  name: string;
  description: string | null;
  status: TaskStatus;
  assigned_to: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  completed_at: string | null;
  display_order: number;
}

export type TaskStatus = 'not_started' | 'in_progress' | 'blocked' | 'complete' | 'cancelled';

export interface TaskBlockedInfo {
  task_id: string;
  reason: BlockedReason;
  note: string | null;
  customer_visible: boolean;
  customer_note: string | null;
  blocked_at: string;
  resolved_at: string | null;
}

export type BlockedReason =
  | 'material_delay'
  | 'weather'
  | 'waiting_on_trade'
  | 'waiting_on_customer'
  | 'issue_discovered'
  | 'other';
