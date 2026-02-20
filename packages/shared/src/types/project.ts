export interface Project {
  id: string;
  organization_id: string;
  property_id: string;
  customer_id: string;
  name: string;
  status: ProjectStatus;
  health: ProjectHealth;
  start_date: string | null;
  target_end_date: string | null;
  actual_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus =
  | 'lead'
  | 'discovery'
  | 'estimate'
  | 'quoted'
  | 'approved'
  | 'in_progress'
  | 'on_hold'
  | 'complete'
  | 'cancelled';

export type ProjectHealth = 'on_track' | 'at_risk' | 'behind';
