/**
 * Completion Types
 * For project completion flow and homeowner manual generation
 */

import type { MaterialRecord } from './property-bridge.types';

export interface HomeownerManual {
  property_id: string;
  project_id: string;
  generated_at: string;

  sections: {
    materials_installed: MaterialRecord[];
    systems_installed: SystemRecord[];
    warranties: WarrantyRecord[];
    maintenance_schedules: MaintenanceScheduleRecord[];
    contractor_info: {
      company_name: string;
      contact_email?: string;
      contact_phone?: string;
    };
    completion_photos: string[];
  };
}

export interface SystemRecord {
  system_type: string;
  brand: string;
  model: string;
  serial_number?: string;
  installed_date: string;
  location: string;
  maintenance_schedule?: string;
  warranty_info?: {
    provider: string;
    duration_years: number;
    document_id?: string;
  };
}

export interface WarrantyRecord {
  item_name: string;
  provider: string;
  duration_years: number;
  start_date: string;
  end_date: string;
  document_id?: string;
  coverage_details?: string;
}

export interface MaintenanceScheduleRecord {
  item_name: string;
  task: string;
  frequency: string;
  next_due: string;
  instructions?: string;
}
