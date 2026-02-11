/**
 * AUTO-GENERATED — DO NOT EDIT
 * Generated from live Supabase schema on 2026-02-06
 * Run: node packages/database/generate-types.mjs
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      activity_events: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string | null;
          property_id: string | null;
          event_type: string;
          timestamp: string;
          actor_id: string;
          actor_type: Database['public']['Enums']['actor_type'];
          entity_type: string;
          entity_id: string;
          loop_iteration_id: string | null;
          homeowner_visible: boolean;
          event_data: Json;
          actor_name: string | null;
          work_category_code: string | null;
          stage_code: string | null;
          location_id: string | null;
          input_method: string | null;
          batch_id: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id?: string | null;
          property_id?: string | null;
          event_type: string;
          timestamp?: string;
          actor_id: string;
          actor_type: Database['public']['Enums']['actor_type'];
          entity_type: string;
          entity_id: string;
          loop_iteration_id?: string | null;
          homeowner_visible?: boolean;
          event_data?: Json;
          actor_name?: string | null;
          work_category_code?: string | null;
          stage_code?: string | null;
          location_id?: string | null;
          input_method?: string | null;
          batch_id?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string | null;
          property_id?: string | null;
          event_type?: string;
          timestamp?: string;
          actor_id?: string;
          actor_type?: Database['public']['Enums']['actor_type'];
          entity_type?: string;
          entity_id?: string;
          loop_iteration_id?: string | null;
          homeowner_visible?: boolean;
          event_data?: Json;
          actor_name?: string | null;
          work_category_code?: string | null;
          stage_code?: string | null;
          location_id?: string | null;
          input_method?: string | null;
          batch_id?: string | null;
        };
      };
      customer_interactions: {
        Row: {
          id: string;
          customer_id: string;
          organization_id: string;
          interaction_type: Database['public']['Enums']['interaction_type'];
          notes: string;
          project_id: string | null;
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          organization_id: string;
          interaction_type: Database['public']['Enums']['interaction_type'];
          notes: string;
          project_id?: string | null;
          created_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          organization_id?: string;
          interaction_type?: Database['public']['Enums']['interaction_type'];
          notes?: string;
          project_id?: string | null;
          created_at?: string;
          created_by?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          portal_access: boolean | null;
          portal_user_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          tags: string[] | null;
          source: Database['public']['Enums']['customer_source'] | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          portal_access?: boolean | null;
          portal_user_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          tags?: string[] | null;
          source?: Database['public']['Enums']['customer_source'] | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          portal_access?: boolean | null;
          portal_user_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          tags?: string[] | null;
          source?: Database['public']['Enums']['customer_source'] | null;
        };
      };
      documents: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string | null;
          property_id: string | null;
          name: string;
          category: Database['public']['Enums']['document_category'];
          storage_path: string;
          file_type: string;
          file_size: number;
          description: string | null;
          tags: string[] | null;
          uploaded_by: string;
          shared_to_portal: boolean;
          shared_at: string | null;
          version: number;
          previous_version_id: string | null;
          created_at: string;
          portal_explanation: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id?: string | null;
          property_id?: string | null;
          name: string;
          category: Database['public']['Enums']['document_category'];
          storage_path: string;
          file_type: string;
          file_size: number;
          description?: string | null;
          tags?: string[] | null;
          uploaded_by: string;
          shared_to_portal?: boolean;
          shared_at?: string | null;
          version?: number;
          previous_version_id?: string | null;
          created_at?: string;
          portal_explanation?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string | null;
          property_id?: string | null;
          name?: string;
          category?: Database['public']['Enums']['document_category'];
          storage_path?: string;
          file_type?: string;
          file_size?: number;
          description?: string | null;
          tags?: string[] | null;
          uploaded_by?: string;
          shared_to_portal?: boolean;
          shared_at?: string | null;
          version?: number;
          previous_version_id?: string | null;
          created_at?: string;
          portal_explanation?: string | null;
        };
      };
      estimate_accuracy: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string;
          estimate_id: string;
          estimated_total: number;
          actual_total: number;
          variance_amount: number;
          variance_percent: number;
          category_breakdowns: Json | null;
          project_type: string | null;
          project_size: string | null;
          completed_at: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id: string;
          estimate_id: string;
          estimated_total: number;
          actual_total: number;
          variance_amount: number;
          variance_percent: number;
          category_breakdowns?: Json | null;
          project_type?: string | null;
          project_size?: string | null;
          completed_at?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string;
          estimate_id?: string;
          estimated_total?: number;
          actual_total?: number;
          variance_amount?: number;
          variance_percent?: number;
          category_breakdowns?: Json | null;
          project_type?: string | null;
          project_size?: string | null;
          completed_at?: string;
          created_at?: string | null;
        };
      };
      estimate_line_items: {
        Row: {
          id: string;
          section_id: string;
          estimate_id: string;
          name: string;
          description: string | null;
          quantity: number;
          unit: string;
          unit_price: number;
          total_price: number;
          tier: Database['public']['Enums']['pricing_tier'];
          tier_relationship: Database['public']['Enums']['tier_relationship'];
          base_line_item_id: string | null;
          loop_binding_pattern: string | null;
          generated_template_id: string | null;
          display_order: number;
          markup_percent: number;
        };
        Insert: {
          id?: string;
          section_id: string;
          estimate_id: string;
          name: string;
          description?: string | null;
          quantity?: number;
          unit?: string;
          unit_price: number;
          total_price: number;
          tier?: Database['public']['Enums']['pricing_tier'];
          tier_relationship?: Database['public']['Enums']['tier_relationship'];
          base_line_item_id?: string | null;
          loop_binding_pattern?: string | null;
          generated_template_id?: string | null;
          display_order?: number;
          markup_percent?: number;
        };
        Update: {
          id?: string;
          section_id?: string;
          estimate_id?: string;
          name?: string;
          description?: string | null;
          quantity?: number;
          unit?: string;
          unit_price?: number;
          total_price?: number;
          tier?: Database['public']['Enums']['pricing_tier'];
          tier_relationship?: Database['public']['Enums']['tier_relationship'];
          base_line_item_id?: string | null;
          loop_binding_pattern?: string | null;
          generated_template_id?: string | null;
          display_order?: number;
          markup_percent?: number;
        };
      };
      estimate_line_materials: {
        Row: {
          id: string;
          line_item_id: string;
          material_id: string | null;
          name: string;
          quantity: number;
          unit: string;
          unit_cost: number;
          total_cost: number;
          warranty_years: number | null;
          expected_lifespan_years: number | null;
          manufacturer_warranty_url: string | null;
        };
        Insert: {
          id?: string;
          line_item_id: string;
          material_id?: string | null;
          name: string;
          quantity: number;
          unit?: string;
          unit_cost: number;
          total_cost: number;
          warranty_years?: number | null;
          expected_lifespan_years?: number | null;
          manufacturer_warranty_url?: string | null;
        };
        Update: {
          id?: string;
          line_item_id?: string;
          material_id?: string | null;
          name?: string;
          quantity?: number;
          unit?: string;
          unit_cost?: number;
          total_cost?: number;
          warranty_years?: number | null;
          expected_lifespan_years?: number | null;
          manufacturer_warranty_url?: string | null;
        };
      };
      estimate_payment_schedules: {
        Row: {
          id: string;
          estimate_id: string;
          milestone_name: string;
          percentage: number;
          amount: number;
          due_trigger: Database['public']['Enums']['payment_trigger'];
          display_order: number;
        };
        Insert: {
          id?: string;
          estimate_id: string;
          milestone_name: string;
          percentage: number;
          amount: number;
          due_trigger: Database['public']['Enums']['payment_trigger'];
          display_order?: number;
        };
        Update: {
          id?: string;
          estimate_id?: string;
          milestone_name?: string;
          percentage?: number;
          amount?: number;
          due_trigger?: Database['public']['Enums']['payment_trigger'];
          display_order?: number;
        };
      };
      estimate_sections: {
        Row: {
          id: string;
          estimate_id: string;
          name: string;
          description: string | null;
          display_order: number;
          selected_tier: Database['public']['Enums']['pricing_tier'];
        };
        Insert: {
          id?: string;
          estimate_id: string;
          name: string;
          description?: string | null;
          display_order?: number;
          selected_tier?: Database['public']['Enums']['pricing_tier'];
        };
        Update: {
          id?: string;
          estimate_id?: string;
          name?: string;
          description?: string | null;
          display_order?: number;
          selected_tier?: Database['public']['Enums']['pricing_tier'];
        };
      };
      estimates: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string | null;
          property_id: string;
          customer_id: string;
          name: string;
          status: Database['public']['Enums']['estimate_status'];
          version: number;
          parent_estimate_id: string | null;
          is_current_version: boolean;
          valid_until: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
          converted_project_id: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id?: string | null;
          property_id: string;
          customer_id: string;
          name: string;
          status?: Database['public']['Enums']['estimate_status'];
          version?: number;
          parent_estimate_id?: string | null;
          is_current_version?: boolean;
          valid_until?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          converted_project_id?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string | null;
          property_id?: string;
          customer_id?: string;
          name?: string;
          status?: Database['public']['Enums']['estimate_status'];
          version?: number;
          parent_estimate_id?: string | null;
          is_current_version?: boolean;
          valid_until?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          converted_project_id?: string | null;
        };
      };
      field_notes: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string;
          property_id: string;
          location_id: string | null;
          work_category_code: string | null;
          task_instance_id: string | null;
          note_type: Database['public']['Enums']['field_note_type'];
          content: string;
          input_method: Database['public']['Enums']['input_method'];
          voice_transcript: string | null;
          photo_ids: string[] | null;
          created_at: string;
          created_by: string;
          flagged_for_co: boolean;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id: string;
          property_id: string;
          location_id?: string | null;
          work_category_code?: string | null;
          task_instance_id?: string | null;
          note_type?: Database['public']['Enums']['field_note_type'];
          content: string;
          input_method?: Database['public']['Enums']['input_method'];
          voice_transcript?: string | null;
          photo_ids?: string[] | null;
          created_at?: string;
          created_by: string;
          flagged_for_co?: boolean;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string;
          property_id?: string;
          location_id?: string | null;
          work_category_code?: string | null;
          task_instance_id?: string | null;
          note_type?: Database['public']['Enums']['field_note_type'];
          content?: string;
          input_method?: Database['public']['Enums']['input_method'];
          voice_transcript?: string | null;
          photo_ids?: string[] | null;
          created_at?: string;
          created_by?: string;
          flagged_for_co?: boolean;
        };
      };
      home_scans: {
        Row: {
          id: string;
          property_id: string;
          project_id: string | null;
          organization_id: string;
          scan_date: string;
          stage: Database['public']['Enums']['scan_stage'];
          scan_provider: string | null;
          point_cloud_path: string | null;
          revit_model_path: string | null;
          deviation_report_path: string | null;
          deviation_count: number | null;
          deviations_resolved: boolean | null;
          notes: string | null;
          scanned_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          project_id?: string | null;
          organization_id: string;
          scan_date: string;
          stage: Database['public']['Enums']['scan_stage'];
          scan_provider?: string | null;
          point_cloud_path?: string | null;
          revit_model_path?: string | null;
          deviation_report_path?: string | null;
          deviation_count?: number | null;
          deviations_resolved?: boolean | null;
          notes?: string | null;
          scanned_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          project_id?: string | null;
          organization_id?: string;
          scan_date?: string;
          stage?: Database['public']['Enums']['scan_stage'];
          scan_provider?: string | null;
          point_cloud_path?: string | null;
          revit_model_path?: string | null;
          deviation_report_path?: string | null;
          deviation_count?: number | null;
          deviations_resolved?: boolean | null;
          notes?: string | null;
          scanned_by?: string | null;
          created_at?: string;
        };
      };
      homeowner_manuals: {
        Row: {
          id: string;
          property_id: string;
          project_id: string;
          content: Json;
          pdf_storage_path: string | null;
          generated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          project_id: string;
          content: Json;
          pdf_storage_path?: string | null;
          generated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          project_id?: string;
          content?: Json;
          pdf_storage_path?: string | null;
          generated_at?: string;
        };
      };
      inspections: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string;
          property_id: string;
          location_id: string | null;
          work_category_code: string | null;
          stage_code: string | null;
          inspection_type: Database['public']['Enums']['inspection_type'];
          inspector_name: string | null;
          inspector_phone: string | null;
          scheduled_date: string;
          scheduled_time: string | null;
          status: Database['public']['Enums']['inspection_status'];
          result_notes: string | null;
          completed_at: string | null;
          photo_ids: string[] | null;
          document_id: string | null;
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id: string;
          property_id: string;
          location_id?: string | null;
          work_category_code?: string | null;
          stage_code?: string | null;
          inspection_type: Database['public']['Enums']['inspection_type'];
          inspector_name?: string | null;
          inspector_phone?: string | null;
          scheduled_date: string;
          scheduled_time?: string | null;
          status?: Database['public']['Enums']['inspection_status'];
          result_notes?: string | null;
          completed_at?: string | null;
          photo_ids?: string[] | null;
          document_id?: string | null;
          created_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string;
          property_id?: string;
          location_id?: string | null;
          work_category_code?: string | null;
          stage_code?: string | null;
          inspection_type?: Database['public']['Enums']['inspection_type'];
          inspector_name?: string | null;
          inspector_phone?: string | null;
          scheduled_date?: string;
          scheduled_time?: string | null;
          status?: Database['public']['Enums']['inspection_status'];
          result_notes?: string | null;
          completed_at?: string | null;
          photo_ids?: string[] | null;
          document_id?: string | null;
          created_at?: string;
          created_by?: string;
        };
      };
      installed_products: {
        Row: {
          id: string;
          property_id: string;
          organization_id: string | null;
          project_id: string | null;
          category: Database['public']['Enums']['product_category'];
          product_type: string;
          manufacturer: string | null;
          model: string | null;
          serial_number: string | null;
          install_date: string | null;
          location: string | null;
          location_id: string | null;
          warranty_years: number | null;
          warranty_expires: string | null;
          warranty_document_id: string | null;
          maintenance_interval_months: number | null;
          last_serviced: string | null;
          next_service_due: string | null;
          notes: string | null;
          specifications: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          organization_id?: string | null;
          project_id?: string | null;
          category: Database['public']['Enums']['product_category'];
          product_type: string;
          manufacturer?: string | null;
          model?: string | null;
          serial_number?: string | null;
          install_date?: string | null;
          location?: string | null;
          location_id?: string | null;
          warranty_years?: number | null;
          warranty_expires?: string | null;
          warranty_document_id?: string | null;
          maintenance_interval_months?: number | null;
          last_serviced?: string | null;
          next_service_due?: string | null;
          notes?: string | null;
          specifications?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          organization_id?: string | null;
          project_id?: string | null;
          category?: Database['public']['Enums']['product_category'];
          product_type?: string;
          manufacturer?: string | null;
          model?: string | null;
          serial_number?: string | null;
          install_date?: string | null;
          location?: string | null;
          location_id?: string | null;
          warranty_years?: number | null;
          warranty_expires?: string | null;
          warranty_document_id?: string | null;
          maintenance_interval_months?: number | null;
          last_serviced?: string | null;
          next_service_due?: string | null;
          notes?: string | null;
          specifications?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      interiors_bundles: {
        Row: {
          code: string;
          name: string;
          description: string | null;
          work_categories: string[];
          base_price_cad: number | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          name: string;
          description?: string | null;
          work_categories?: string[];
          base_price_cad?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          name?: string;
          description?: string | null;
          work_categories?: string[];
          base_price_cad?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      labor_baselines: {
        Row: {
          id: string;
          organization_id: string;
          task_name: string;
          task_template_id: string | null;
          duration_hours: number;
          work_category: string | null;
          location_type: string | null;
          complexity: string | null;
          team_member_id: string | null;
          role: string | null;
          source_type: Database['public']['Enums']['labor_source_type'];
          source_id: string | null;
          project_id: string | null;
          recorded_at: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          task_name: string;
          task_template_id?: string | null;
          duration_hours: number;
          work_category?: string | null;
          location_type?: string | null;
          complexity?: string | null;
          team_member_id?: string | null;
          role?: string | null;
          source_type: Database['public']['Enums']['labor_source_type'];
          source_id?: string | null;
          project_id?: string | null;
          recorded_at?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          task_name?: string;
          task_template_id?: string | null;
          duration_hours?: number;
          work_category?: string | null;
          location_type?: string | null;
          complexity?: string | null;
          team_member_id?: string | null;
          role?: string | null;
          source_type?: Database['public']['Enums']['labor_source_type'];
          source_id?: string | null;
          project_id?: string | null;
          recorded_at?: string;
          created_at?: string | null;
        };
      };
      loop_contexts: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          parent_context_id: string | null;
          display_order: number;
          loop_type: Database['public']['Enums']['loop_type'];
          binding_key: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          parent_context_id?: string | null;
          display_order?: number;
          loop_type: Database['public']['Enums']['loop_type'];
          binding_key?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          parent_context_id?: string | null;
          display_order?: number;
          loop_type?: Database['public']['Enums']['loop_type'];
          binding_key?: string | null;
        };
      };
      loop_iterations: {
        Row: {
          id: string;
          context_id: string;
          project_id: string;
          name: string;
          parent_iteration_id: string | null;
          display_order: number;
          computed_status: Database['public']['Enums']['loop_status'];
          child_counts: Json;
        };
        Insert: {
          id?: string;
          context_id: string;
          project_id: string;
          name: string;
          parent_iteration_id?: string | null;
          display_order?: number;
          computed_status?: Database['public']['Enums']['loop_status'];
          child_counts?: Json;
        };
        Update: {
          id?: string;
          context_id?: string;
          project_id?: string;
          name?: string;
          parent_iteration_id?: string | null;
          display_order?: number;
          computed_status?: Database['public']['Enums']['loop_status'];
          child_counts?: Json;
        };
      };
      maintenance_records: {
        Row: {
          id: string;
          property_id: string;
          product_id: string | null;
          organization_id: string | null;
          maintenance_type: Database['public']['Enums']['maintenance_type'];
          description: string;
          performed_date: string;
          performed_by: string | null;
          cost: number | null;
          invoice_id: string | null;
          outcome: string | null;
          next_recommended: string | null;
          photo_ids: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          product_id?: string | null;
          organization_id?: string | null;
          maintenance_type: Database['public']['Enums']['maintenance_type'];
          description: string;
          performed_date: string;
          performed_by?: string | null;
          cost?: number | null;
          invoice_id?: string | null;
          outcome?: string | null;
          next_recommended?: string | null;
          photo_ids?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          product_id?: string | null;
          organization_id?: string | null;
          maintenance_type?: Database['public']['Enums']['maintenance_type'];
          description?: string;
          performed_date?: string;
          performed_by?: string | null;
          cost?: number | null;
          invoice_id?: string | null;
          outcome?: string | null;
          next_recommended?: string | null;
          photo_ids?: string[] | null;
          created_at?: string;
        };
      };
      material_baselines: {
        Row: {
          id: string;
          organization_id: string;
          assembly_name: string;
          material_name: string;
          quantity_per_unit: number;
          unit: string;
          waste_factor: number | null;
          source_project_id: string | null;
          data_point_count: number;
          last_updated_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          assembly_name: string;
          material_name: string;
          quantity_per_unit: number;
          unit: string;
          waste_factor?: number | null;
          source_project_id?: string | null;
          data_point_count?: number;
          last_updated_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          assembly_name?: string;
          material_name?: string;
          quantity_per_unit?: number;
          unit?: string;
          waste_factor?: number | null;
          source_project_id?: string | null;
          data_point_count?: number;
          last_updated_at?: string | null;
          created_at?: string | null;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      ownership_history: {
        Row: {
          id: string;
          property_id: string;
          customer_id: string | null;
          start_date: string;
          end_date: string | null;
          transfer_type: Database['public']['Enums']['ownership_transfer_type'];
          transfer_notes: string | null;
          profile_access_granted: boolean | null;
          profile_access_granted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          customer_id?: string | null;
          start_date: string;
          end_date?: string | null;
          transfer_type: Database['public']['Enums']['ownership_transfer_type'];
          transfer_notes?: string | null;
          profile_access_granted?: boolean | null;
          profile_access_granted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          customer_id?: string | null;
          start_date?: string;
          end_date?: string | null;
          transfer_type?: Database['public']['Enums']['ownership_transfer_type'];
          transfer_notes?: string | null;
          profile_access_granted?: boolean | null;
          profile_access_granted_at?: string | null;
          created_at?: string;
        };
      };
      photos: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string;
          loop_iteration_id: string | null;
          task_instance_id: string | null;
          url: string;
          thumbnail_url: string | null;
          caption: string | null;
          photo_category: Database['public']['Enums']['photo_category'];
          homeowner_visible: boolean;
          taken_at: string;
          uploaded_at: string;
          uploaded_by: string;
          captured_offline: boolean;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id: string;
          loop_iteration_id?: string | null;
          task_instance_id?: string | null;
          url: string;
          thumbnail_url?: string | null;
          caption?: string | null;
          photo_category?: Database['public']['Enums']['photo_category'];
          homeowner_visible?: boolean;
          taken_at?: string;
          uploaded_at?: string;
          uploaded_by: string;
          captured_offline?: boolean;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string;
          loop_iteration_id?: string | null;
          task_instance_id?: string | null;
          url?: string;
          thumbnail_url?: string | null;
          caption?: string | null;
          photo_category?: Database['public']['Enums']['photo_category'];
          homeowner_visible?: boolean;
          taken_at?: string;
          uploaded_at?: string;
          uploaded_by?: string;
          captured_offline?: boolean;
        };
      };
      price_history: {
        Row: {
          id: string;
          organization_id: string;
          item_name: string;
          sku: string | null;
          catalog_item_id: string | null;
          unit_price: number;
          unit: string;
          quantity: number | null;
          vendor: string | null;
          source_type: Database['public']['Enums']['price_source_type'];
          source_id: string | null;
          source_url: string | null;
          project_id: string | null;
          work_category: string | null;
          recorded_at: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          item_name: string;
          sku?: string | null;
          catalog_item_id?: string | null;
          unit_price: number;
          unit: string;
          quantity?: number | null;
          vendor?: string | null;
          source_type: Database['public']['Enums']['price_source_type'];
          source_id?: string | null;
          source_url?: string | null;
          project_id?: string | null;
          work_category?: string | null;
          recorded_at?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          item_name?: string;
          sku?: string | null;
          catalog_item_id?: string | null;
          unit_price?: number;
          unit?: string;
          quantity?: number | null;
          vendor?: string | null;
          source_type?: Database['public']['Enums']['price_source_type'];
          source_id?: string | null;
          source_url?: string | null;
          project_id?: string | null;
          work_category?: string | null;
          recorded_at?: string;
          created_at?: string | null;
        };
      };
      project_completion_checklists: {
        Row: {
          id: string;
          project_id: string;
          final_walkthrough_complete: boolean;
          final_walkthrough_date: string | null;
          punch_list_resolved: boolean;
          final_invoice_paid: boolean;
          warranty_documents_shared: boolean;
          homeowner_manual_generated: boolean;
          property_profile_synced: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          final_walkthrough_complete?: boolean;
          final_walkthrough_date?: string | null;
          punch_list_resolved?: boolean;
          final_invoice_paid?: boolean;
          warranty_documents_shared?: boolean;
          homeowner_manual_generated?: boolean;
          property_profile_synced?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          final_walkthrough_complete?: boolean;
          final_walkthrough_date?: string | null;
          punch_list_resolved?: boolean;
          final_invoice_paid?: boolean;
          warranty_documents_shared?: boolean;
          homeowner_manual_generated?: boolean;
          property_profile_synced?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_stages: {
        Row: {
          code: string;
          name: string;
          display_order: number | null;
          divisions: Database['public']['Enums']['division'][];
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          name: string;
          display_order?: number | null;
          divisions?: Database['public']['Enums']['division'][];
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          name?: string;
          display_order?: number | null;
          divisions?: Database['public']['Enums']['division'][];
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      projects: {
        Row: {
          id: string;
          organization_id: string;
          property_id: string;
          customer_id: string;
          name: string;
          status: Database['public']['Enums']['project_status'];
          health: Database['public']['Enums']['project_health'];
          start_date: string | null;
          target_end_date: string | null;
          actual_end_date: string | null;
          created_at: string | null;
          updated_at: string | null;
          division: Database['public']['Enums']['division'] | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          property_id: string;
          customer_id: string;
          name: string;
          status?: Database['public']['Enums']['project_status'];
          health?: Database['public']['Enums']['project_health'];
          start_date?: string | null;
          target_end_date?: string | null;
          actual_end_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          division?: Database['public']['Enums']['division'] | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          property_id?: string;
          customer_id?: string;
          name?: string;
          status?: Database['public']['Enums']['project_status'];
          health?: Database['public']['Enums']['project_health'];
          start_date?: string | null;
          target_end_date?: string | null;
          actual_end_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          division?: Database['public']['Enums']['division'] | null;
        };
      };
      properties: {
        Row: {
          id: string;
          address_line1: string;
          address_line2: string | null;
          city: string;
          province: string;
          postal_code: string;
          country: string;
          current_owner_id: string | null;
          ownership_transferred_at: string | null;
          created_at: string | null;
          created_by_org_id: string;
          year_built: number | null;
          property_type: Database['public']['Enums']['property_type'] | null;
          square_footage: number | null;
          lot_size_sf: number | null;
          stories: number | null;
          bedrooms: number | null;
          bathrooms: number | null;
          construction_type: string | null;
          scan_verified: boolean | null;
          original_project_id: string | null;
        };
        Insert: {
          id?: string;
          address_line1: string;
          address_line2?: string | null;
          city: string;
          province: string;
          postal_code: string;
          country?: string;
          current_owner_id?: string | null;
          ownership_transferred_at?: string | null;
          created_at?: string | null;
          created_by_org_id: string;
          year_built?: number | null;
          property_type?: Database['public']['Enums']['property_type'] | null;
          square_footage?: number | null;
          lot_size_sf?: number | null;
          stories?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          construction_type?: string | null;
          scan_verified?: boolean | null;
          original_project_id?: string | null;
        };
        Update: {
          id?: string;
          address_line1?: string;
          address_line2?: string | null;
          city?: string;
          province?: string;
          postal_code?: string;
          country?: string;
          current_owner_id?: string | null;
          ownership_transferred_at?: string | null;
          created_at?: string | null;
          created_by_org_id?: string;
          year_built?: number | null;
          property_type?: Database['public']['Enums']['property_type'] | null;
          square_footage?: number | null;
          lot_size_sf?: number | null;
          stories?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          construction_type?: string | null;
          scan_verified?: boolean | null;
          original_project_id?: string | null;
        };
      };
      property_ownership_history: {
        Row: {
          id: string;
          property_id: string;
          owner_id: string;
          started_at: string;
          ended_at: string | null;
          transfer_type: Database['public']['Enums']['ownership_transfer_type'];
        };
        Insert: {
          id?: string;
          property_id: string;
          owner_id: string;
          started_at?: string;
          ended_at?: string | null;
          transfer_type: Database['public']['Enums']['ownership_transfer_type'];
        };
        Update: {
          id?: string;
          property_id?: string;
          owner_id?: string;
          started_at?: string;
          ended_at?: string | null;
          transfer_type?: Database['public']['Enums']['ownership_transfer_type'];
        };
      };
      property_pending_data: {
        Row: {
          id: string;
          property_id: string;
          project_id: string;
          data_type: Database['public']['Enums']['pending_data_type'];
          source_entity_type: string;
          source_entity_id: string;
          data_snapshot: Json;
          created_at: string | null;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          property_id: string;
          project_id: string;
          data_type: Database['public']['Enums']['pending_data_type'];
          source_entity_type: string;
          source_entity_id: string;
          data_snapshot: Json;
          created_at?: string | null;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          property_id?: string;
          project_id?: string;
          data_type?: Database['public']['Enums']['pending_data_type'];
          source_entity_type?: string;
          source_entity_id?: string;
          data_snapshot?: Json;
          created_at?: string | null;
          processed_at?: string | null;
        };
      };
      task_blocked_info: {
        Row: {
          id: string;
          task_id: string;
          reason: Database['public']['Enums']['blocked_reason'];
          note: string | null;
          customer_visible: boolean;
          customer_note: string | null;
          blocked_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          task_id: string;
          reason: Database['public']['Enums']['blocked_reason'];
          note?: string | null;
          customer_visible?: boolean;
          customer_note?: string | null;
          blocked_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          task_id?: string;
          reason?: Database['public']['Enums']['blocked_reason'];
          note?: string | null;
          customer_visible?: boolean;
          customer_note?: string | null;
          blocked_at?: string;
          resolved_at?: string | null;
        };
      };
      task_instances: {
        Row: {
          id: string;
          project_id: string;
          template_id: string | null;
          loop_iteration_id: string;
          name: string;
          description: string | null;
          status: Database['public']['Enums']['task_status'];
          assigned_to: string | null;
          scheduled_start: string | null;
          scheduled_end: string | null;
          actual_start: string | null;
          completed_at: string | null;
          display_order: number;
        };
        Insert: {
          id?: string;
          project_id: string;
          template_id?: string | null;
          loop_iteration_id: string;
          name: string;
          description?: string | null;
          status?: Database['public']['Enums']['task_status'];
          assigned_to?: string | null;
          scheduled_start?: string | null;
          scheduled_end?: string | null;
          actual_start?: string | null;
          completed_at?: string | null;
          display_order?: number;
        };
        Update: {
          id?: string;
          project_id?: string;
          template_id?: string | null;
          loop_iteration_id?: string;
          name?: string;
          description?: string | null;
          status?: Database['public']['Enums']['task_status'];
          assigned_to?: string | null;
          scheduled_start?: string | null;
          scheduled_end?: string | null;
          actual_start?: string | null;
          completed_at?: string | null;
          display_order?: number;
        };
      };
      task_templates: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          category_code: string | null;
          estimated_hours: number | null;
          binding_pattern: Database['public']['Enums']['binding_pattern'] | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          category_code?: string | null;
          estimated_hours?: number | null;
          binding_pattern?: Database['public']['Enums']['binding_pattern'] | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          category_code?: string | null;
          estimated_hours?: number | null;
          binding_pattern?: Database['public']['Enums']['binding_pattern'] | null;
          is_active?: boolean;
        };
      };
      team_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: Database['public']['Enums']['team_role'];
          hourly_rate: number | null;
          is_active: boolean;
          public_contact_allowed: boolean;
          certifications: string[] | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: Database['public']['Enums']['team_role'];
          hourly_rate?: number | null;
          is_active?: boolean;
          public_contact_allowed?: boolean;
          certifications?: string[] | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: Database['public']['Enums']['team_role'];
          hourly_rate?: number | null;
          is_active?: boolean;
          public_contact_allowed?: boolean;
          certifications?: string[] | null;
          created_at?: string | null;
        };
      };
      time_entries: {
        Row: {
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
          gps_clock_in: Json | null;
          gps_clock_out: Json | null;
          captured_offline: boolean;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id: string;
          team_member_id: string;
          task_instance_id?: string | null;
          clock_in: string;
          clock_out?: string | null;
          break_minutes?: number;
          total_hours?: number | null;
          hourly_rate: number;
          note?: string | null;
          gps_clock_in?: Json | null;
          gps_clock_out?: Json | null;
          captured_offline?: boolean;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string;
          team_member_id?: string;
          task_instance_id?: string | null;
          clock_in?: string;
          clock_out?: string | null;
          break_minutes?: number;
          total_hours?: number | null;
          hourly_rate?: number;
          note?: string | null;
          gps_clock_in?: Json | null;
          gps_clock_out?: Json | null;
          captured_offline?: boolean;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
        };
      };
      work_categories: {
        Row: {
          code: string;
          name: string;
          icon: string | null;
          display_order: number | null;
          divisions: Database['public']['Enums']['division'][];
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          name: string;
          icon?: string | null;
          display_order?: number | null;
          divisions?: Database['public']['Enums']['division'][];
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          name?: string;
          icon?: string | null;
          display_order?: number | null;
          divisions?: Database['public']['Enums']['division'][];
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      actor_type:
        | 'team_member'
        | 'system'
        | 'customer';
      binding_pattern:
        | 'per_project'
        | 'per_floor'
        | 'per_room'
        | 'per_zone';
      blocked_reason:
        | 'material_delay'
        | 'weather'
        | 'waiting_on_trade'
        | 'waiting_on_customer'
        | 'issue_discovered'
        | 'other';
      customer_source:
        | 'referral'
        | 'website'
        | 'social'
        | 'repeat'
        | 'other';
      division:
        | 'interiors'
        | 'exteriors'
        | 'diy'
        | 'maintenance';
      document_category:
        | 'permit'
        | 'contract'
        | 'change_order'
        | 'invoice'
        | 'receipt'
        | 'warranty'
        | 'manual'
        | 'drawing'
        | 'spec_sheet'
        | 'other';
      estimate_status:
        | 'draft'
        | 'sent'
        | 'viewed'
        | 'approved'
        | 'rejected'
        | 'expired'
        | 'converted';
      field_note_type:
        | 'observation'
        | 'issue'
        | 'client_request'
        | 'material_delivery'
        | 'weather'
        | 'safety'
        | 'general';
      input_method:
        | 'typed'
        | 'voice';
      inspection_status:
        | 'scheduled'
        | 'passed'
        | 'failed'
        | 'cancelled';
      inspection_type:
        | 'building_permit'
        | 'electrical'
        | 'plumbing'
        | 'hvac'
        | 'framing'
        | 'insulation'
        | 'fire'
        | 'final'
        | 'other';
      interaction_type:
        | 'call'
        | 'email'
        | 'meeting'
        | 'site_visit'
        | 'estimate_sent'
        | 'contract_signed'
        | 'note';
      labor_source_type:
        | 'time_entry'
        | 'task_close'
        | 'manual';
      loop_status:
        | 'not_started'
        | 'in_progress'
        | 'blocked'
        | 'complete';
      loop_type:
        | 'floor'
        | 'location'
        | 'zone'
        | 'work_category'
        | 'phase'
        | 'custom';
      maintenance_type:
        | 'scheduled'
        | 'repair'
        | 'replacement'
        | 'inspection'
        | 'emergency'
        | 'upgrade';
      ownership_transfer_type:
        | 'initial'
        | 'sale'
        | 'inheritance'
        | 'other';
      payment_trigger:
        | 'on_signature'
        | 'on_start'
        | 'on_milestone'
        | 'on_completion'
        | 'custom_date';
      pending_data_type:
        | 'material'
        | 'photo'
        | 'contractor'
        | 'loop_structure'
        | 'document';
      photo_category:
        | 'before'
        | 'progress'
        | 'after'
        | 'issue'
        | 'documentation'
        | 'internal';
      price_source_type:
        | 'receipt'
        | 'invoice'
        | 'quote'
        | 'manual'
        | 'catalog';
      pricing_tier:
        | 'good'
        | 'better'
        | 'best';
      product_category:
        | 'hvac'
        | 'plumbing'
        | 'electrical'
        | 'roofing'
        | 'windows_doors'
        | 'appliances'
        | 'flooring'
        | 'siding'
        | 'insulation'
        | 'finishes'
        | 'structural'
        | 'other';
      project_health:
        | 'on_track'
        | 'at_risk'
        | 'behind';
      project_status:
        | 'lead'
        | 'estimate'
        | 'quoted'
        | 'approved'
        | 'in_progress'
        | 'on_hold'
        | 'complete'
        | 'cancelled';
      property_type:
        | 'single_family'
        | 'semi_detached'
        | 'townhouse'
        | 'condo'
        | 'multi_unit'
        | 'other';
      scan_stage:
        | 'existing_conditions'
        | 'framing'
        | 'rough_in'
        | 'final'
        | 'other';
      task_status:
        | 'not_started'
        | 'in_progress'
        | 'blocked'
        | 'complete'
        | 'cancelled';
      team_role:
        | 'owner'
        | 'admin'
        | 'project_manager'
        | 'foreman'
        | 'worker'
        | 'apprentice';
      tier_relationship:
        | 'base'
        | 'downgrade'
        | 'upgrade';
    };
  };
};
