import type { Project, ProjectStatus, ProjectHealth } from '@hooomz/shared';

export interface CreateProjectInput {
  organization_id: string;
  property_id: string;
  customer_id: string;
  name: string;
  status?: ProjectStatus;
  start_date?: string;
  target_end_date?: string;
}

export interface UpdateProjectInput {
  name?: string;
  status?: ProjectStatus;
  health?: ProjectHealth;
  start_date?: string | null;
  target_end_date?: string | null;
  actual_end_date?: string | null;
}

export interface ProjectFilters {
  organization_id: string;
  status?: ProjectStatus | ProjectStatus[];
  health?: ProjectHealth;
  customer_id?: string;
  property_id?: string;
}

export interface ProjectWithRelations extends Project {
  property?: {
    address_line1: string;
    city: string;
    province: string;
  };
  customer?: {
    first_name: string;
    last_name: string;
  };
  loop_count?: number;
  task_counts?: {
    total: number;
    complete: number;
    blocked: number;
  };
}
