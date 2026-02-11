export interface TeamMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: TeamRole;
  hourly_rate: number | null;
  is_active: boolean;
  public_contact_allowed: boolean;
  certifications: string[];
  created_at: string;
}

export type TeamRole = 'owner' | 'admin' | 'project_manager' | 'foreman' | 'worker' | 'apprentice';

export interface TimeEntry {
  id: string;
  organization_id: string;
  project_id: string;
  team_member_id: string;
  task_instance_id: string | null;
  clock_in: string;
  clock_out: string | null;
  break_minutes: number;
  total_hours: number | null;
  hourly_rate: number;
  note: string | null;
  gps_clock_in: GpsCoordinate | null;
  gps_clock_out: GpsCoordinate | null;
  captured_offline: boolean;

  // Build 3a extensions (all optional for backward compatibility)
  entryType?: 'task' | 'break' | 'overhead';
  role?: 'primary' | 'supervisor';
  sopVersionId?: string;
  idlePrompts?: number;
}

export interface GpsCoordinate {
  latitude: number;
  longitude: number;
  accuracy: number;
}
