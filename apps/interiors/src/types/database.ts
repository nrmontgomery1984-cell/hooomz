/**
 * Core type definitions for Hooomz database entities
 * Based on docs/CLAUDE_CONTEXT.md Section 4: Data Models
 * Must match database schema in supabase/migrations/001_initial_schema.sql
 */

// ============================================================================
// LOOP TYPES
// ============================================================================

export type LoopType =
  | 'portfolio'
  | 'project'
  | 'floor'
  | 'room'
  | 'zone'
  | 'trade'
  | 'phase'
  | 'task'
  | 'checklist_item';

export type LoopStatus =
  | 'not_started'    // Grey sphere
  | 'in_progress'    // Blue sphere
  | 'blocked'        // Red sphere
  | 'complete';      // Green sphere

export interface Loop {
  id: string;
  parent_id: string | null;
  project_id: string | null;
  company_id: string | null;

  name: string;
  type: LoopType;
  cost_code: string | null;

  status: LoopStatus;
  health_score: number;

  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;

  metadata: Record<string, unknown>;

  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// ============================================================================
// ACTIVITY EVENT TYPES
// ============================================================================

export type EventType =
  // Status changes
  | 'loop.created'
  | 'loop.status_changed'
  | 'loop.completed'
  | 'loop.blocked'
  | 'loop.unblocked'
  // Field actions
  | 'task.started'
  | 'task.progress_logged'
  | 'task.completed'
  | 'task.blocked'
  | 'task.note_added'
  | 'task.photo_added'
  // Time tracking
  | 'time.clock_in'
  | 'time.clock_out'
  | 'time.entry_logged'
  // Communication
  | 'comment.added'
  | 'comment.reply'
  | 'notification.sent'
  // Floor plan
  | 'floorplan.element_tapped'
  | 'floorplan.status_updated'
  // Project lifecycle
  | 'project.imported'
  | 'project.estimate_generated'
  | 'project.scope_approved'
  | 'change_order.created';

export interface ActivityEvent {
  id: string;
  timestamp: string;
  actor_id: string | null;
  actor_type: 'user' | 'system';

  event_type: EventType;
  loop_id: string | null;
  project_id: string | null;

  payload: Record<string, unknown>;
  client_visible: boolean;
  related_event_id: string | null;
}

// ============================================================================
// FLOOR PLAN TYPES
// ============================================================================

export type ElementType =
  | 'wall'
  | 'window'
  | 'door'
  | 'beam'
  | 'room'
  | 'zone'
  | 'fixture'
  | 'outlet'
  | 'switch';

export interface FloorPlan {
  id: string;
  project_id: string;
  floor_id: string | null;

  name: string;
  svg_content: string;
  viewbox: string | null;
  background_image_url: string | null;

  created_at: string;
  updated_at: string;
}

export interface FloorPlanElement {
  id: string;
  floor_plan_id: string;

  svg_element_id: string;
  element_type: ElementType;
  loop_id: string;

  label: string | null;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  revit_id: string | null;
  cost_code: string | null;
}

// ============================================================================
// PROFILE & COMPANY TYPES
// ============================================================================

export type UserRole = 'admin' | 'contractor' | 'crew' | 'client';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  company_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  owner_id: string | null;
  created_at: string;
}

// ============================================================================
// PHOTO TYPES
// ============================================================================

export interface Photo {
  id: string;
  loop_id: string | null;
  activity_event_id: string | null;
  storage_path: string;
  thumbnail_path: string | null;
  caption: string | null;
  taken_at: string;
  uploaded_by: string | null;
  floor_plan_id: string | null;
  pin_x: number | null;
  pin_y: number | null;
}

// ============================================================================
// CLIENT COMMENT TYPES
// ============================================================================

export interface ClientComment {
  id: string;
  project_id: string;
  loop_id: string | null;
  author_id: string;
  content: string;
  floor_plan_id: string | null;
  pin_x: number | null;
  pin_y: number | null;
  created_at: string;
  response_content: string | null;
  response_author_id: string | null;
  response_at: string | null;
}

// ============================================================================
// SUPABASE DATABASE TYPE
// ============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, 'id'>>;
        Relationships: [];
      };
      companies: {
        Row: Company;
        Insert: Omit<Company, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Company, 'id'>>;
        Relationships: [];
      };
      loops: {
        Row: Loop;
        Insert: Omit<Loop, 'id' | 'created_at' | 'updated_at' | 'health_score'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          health_score?: number;
        };
        Update: Partial<Omit<Loop, 'id'>>;
        Relationships: [];
      };
      activity_events: {
        Row: ActivityEvent;
        Insert: Omit<ActivityEvent, 'id' | 'timestamp' | 'related_event_id'> & {
          id?: string;
          timestamp?: string;
          related_event_id?: string | null;
        };
        Update: Partial<Omit<ActivityEvent, 'id'>>;
        Relationships: [];
      };
      floor_plans: {
        Row: FloorPlan;
        Insert: Omit<FloorPlan, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<FloorPlan, 'id'>>;
        Relationships: [];
      };
      floor_plan_elements: {
        Row: FloorPlanElement;
        Insert: Omit<FloorPlanElement, 'id'> & {
          id?: string;
        };
        Update: Partial<Omit<FloorPlanElement, 'id'>>;
        Relationships: [];
      };
      photos: {
        Row: Photo;
        Insert: Omit<Photo, 'id' | 'taken_at'> & {
          id?: string;
          taken_at?: string;
        };
        Update: Partial<Omit<Photo, 'id'>>;
        Relationships: [];
      };
      client_comments: {
        Row: ClientComment;
        Insert: Omit<ClientComment, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ClientComment, 'id'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      calculate_loop_health: {
        Args: { loop_uuid: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ============================================================================
// FLOORING TYPES
// ============================================================================

export interface FlooringType {
  id: string;
  code: string;                           // e.g., 'LVT', 'TILE', 'ENGINEERED', 'SOLID'
  name: string;
  category: string;                       // 'vinyl', 'tile', 'hardwood'

  // Acclimation requirements
  acclimation_hours: number;
  acclimation_temp_min_f: number;
  acclimation_temp_max_f: number;
  acclimation_rh_min: number | null;
  acclimation_rh_max: number | null;

  // Waste factors
  waste_factor_standard: number;
  waste_factor_diagonal: number;
  waste_factor_herringbone: number | null;

  // Installation rates
  install_rate_sqft_per_hour: number | null;

  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  project_id: string;
  location_id: string | null;

  // Product identification
  product_name: string;
  manufacturer: string | null;
  sku: string | null;
  lot_number: string | null;

  // Flooring type link
  flooring_type_id: string | null;

  // Quantity tracking
  quantity: number;
  unit: string;
  coverage_per_unit: number | null;

  // Receiving & acclimation
  received_at: string | null;
  acclimation_start: string | null;
  acclimation_required_hours: number | null;

  // Documentation
  photo_url: string | null;
  notes: string | null;

  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type SubstrateType = 'wood' | 'concrete' | 'osb' | 'plywood';
export type TestMethod = 'pin_meter' | 'calcium_chloride' | 'rh_probe';

export interface MoistureReading {
  id: string;
  project_id: string;
  loop_id: string | null;
  floor_plan_id: string | null;

  // Location
  pin_x: number | null;
  pin_y: number | null;
  location_description: string | null;

  // Reading details
  substrate_type: SubstrateType;
  test_method: TestMethod;
  reading_value: number;
  reading_unit: string;

  // Threshold evaluation
  threshold_value: number | null;
  passed: boolean;

  // Equipment
  meter_model: string | null;
  calibration_date: string | null;

  // Documentation
  photo_url: string | null;
  notes: string | null;

  taken_at: string;
  taken_by: string | null;
  created_at: string;
}

export interface MoistureThreshold {
  id: string;
  substrate_type: SubstrateType;
  test_method: TestMethod;
  pass_max: number;
  warning_max: number | null;
  unit: string;
  mitigation_max: number | null;
  sop_reference: string | null;
  notes: string | null;
}

export type TaskCategory = 'prep' | 'install' | 'finish' | 'qc';

export interface ChecklistItem {
  id?: string;
  text: string;
  required?: boolean;
  help_text?: string;
  critical?: boolean;
  requires_photo?: boolean;
  requires_value?: boolean;
}

export interface TaskTemplate {
  id: string;
  code: string;
  name: string;
  description: string | null;

  flooring_type_id: string | null;
  category: TaskCategory;
  sequence_order: number;

  checklist_items: ChecklistItem[];

  estimated_hours_base: number | null;
  estimated_hours_per_100sqft: number | null;

  sop_reference: string | null;
  notes: string | null;
  is_active: boolean;

  created_at: string;
  updated_at: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

// For creating new records (omits auto-generated fields)
export type NewLoop = Database['public']['Tables']['loops']['Insert'];
export type NewActivityEvent = Database['public']['Tables']['activity_events']['Insert'];
export type NewFloorPlan = Database['public']['Tables']['floor_plans']['Insert'];
export type NewFloorPlanElement = Database['public']['Tables']['floor_plan_elements']['Insert'];
export type NewMaterial = Omit<Material, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type NewMoistureReading = Omit<MoistureReading, 'id' | 'created_at' | 'taken_at'> & {
  id?: string;
  created_at?: string;
  taken_at?: string;
};
