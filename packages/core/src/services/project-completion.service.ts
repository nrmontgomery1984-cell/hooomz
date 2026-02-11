/**
 * Project Completion Service
 * Handles project completion flow with handoff to property profile
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ProjectCompletionChecklist,
  HomeownerManual,
  MaterialRecord,
  ActivityEventType,
} from '@hooomz/shared';
import { EVENT_VISIBILITY_DEFAULTS } from '@hooomz/shared';
import { PropertyBridgeService } from './property-bridge.service';

// Activity service interface
export interface ActivityService {
  log(event: {
    organization_id: string;
    project_id: string;
    property_id: string;
    event_type: ActivityEventType;
    actor_id: string;
    actor_type: 'team_member' | 'system' | 'customer';
    entity_type: string;
    entity_id: string;
    homeowner_visible: boolean;
    event_data: Record<string, unknown>;
  }): Promise<void>;
}

type ChecklistUpdateableField =
  | 'final_walkthrough_complete'
  | 'final_walkthrough_date'
  | 'punch_list_resolved'
  | 'final_invoice_paid'
  | 'warranty_documents_shared'
  | 'homeowner_manual_generated'
  | 'property_profile_synced';

export class ProjectCompletionService {
  private bridgeService: PropertyBridgeService;

  constructor(private supabase: SupabaseClient) {
    this.bridgeService = new PropertyBridgeService(supabase);
  }

  /**
   * Get completion checklist for project
   */
  async getChecklist(projectId: string): Promise<ProjectCompletionChecklist | null> {
    const { data, error } = await this.supabase
      .from('project_completion_checklists')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Update checklist item
   */
  async updateChecklistItem(
    projectId: string,
    item: ChecklistUpdateableField,
    value: boolean | string
  ): Promise<ProjectCompletionChecklist> {
    const { data, error } = await this.supabase
      .from('project_completion_checklists')
      .update({
        [item]: value,
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mark final walkthrough complete
   */
  async completeFinalWalkthrough(projectId: string, date?: string): Promise<ProjectCompletionChecklist> {
    const { data, error } = await this.supabase
      .from('project_completion_checklists')
      .update({
        final_walkthrough_complete: true,
        final_walkthrough_date: date || new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Check if project can be completed
   */
  async canComplete(projectId: string): Promise<{
    canComplete: boolean;
    missingItems: string[];
  }> {
    const checklist = await this.getChecklist(projectId);
    if (!checklist) {
      return { canComplete: false, missingItems: ['Checklist not found'] };
    }

    const required: Array<{ key: keyof ProjectCompletionChecklist; label: string }> = [
      { key: 'final_walkthrough_complete', label: 'Final walkthrough' },
      { key: 'punch_list_resolved', label: 'Punch list resolution' },
      { key: 'final_invoice_paid', label: 'Final invoice payment' },
    ];

    const missing = required
      .filter(r => !checklist[r.key])
      .map(r => r.label);

    return {
      canComplete: missing.length === 0,
      missingItems: missing,
    };
  }

  /**
   * Complete project with full handoff flow
   */
  async completeProject(
    projectId: string,
    actorId: string,
    activityService?: ActivityService
  ): Promise<void> {
    // 1. Verify can complete
    const { canComplete, missingItems } = await this.canComplete(projectId);
    if (!canComplete) {
      throw new Error(`Cannot complete project. Missing: ${missingItems.join(', ')}`);
    }

    // 2. Get project details
    const { data: project, error: projectError } = await this.supabase
      .from('projects')
      .select('*, properties(*)')
      .eq('id', projectId)
      .single();

    if (projectError || !project) throw new Error('Project not found');

    // 3. Generate homeowner manual
    await this.generateHomeownerManual(projectId, project.property_id);

    // 4. Update checklist
    await this.supabase
      .from('project_completion_checklists')
      .update({
        homeowner_manual_generated: true,
        property_profile_synced: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId);

    // 5. Update project status
    await this.supabase
      .from('projects')
      .update({
        status: 'complete',
        actual_end_date: new Date().toISOString(),
      })
      .eq('id', projectId);

    // 6. Log activity
    if (activityService) {
      await activityService.log({
        organization_id: project.organization_id,
        project_id: projectId,
        property_id: project.property_id,
        event_type: 'project.completed',
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'project',
        entity_id: projectId,
        homeowner_visible: EVENT_VISIBILITY_DEFAULTS['project.completed'],
        event_data: {
          completion_date: new Date().toISOString(),
          homeowner_manual_generated: true,
          data_synced_to_property: true,
        },
      });
    }
  }

  /**
   * Generate homeowner manual from project data
   */
  async generateHomeownerManual(projectId: string, propertyId: string): Promise<HomeownerManual> {
    // Gather all materials from completed tasks
    const { data: materials } = await this.supabase
      .from('property_pending_data')
      .select('id, data_snapshot')
      .eq('source_project_id', projectId)
      .eq('data_type', 'material')
      .eq('status', 'pending');

    // Gather shared documents with explanations (for future use in manual)
    const { data: _documents } = await this.supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('shared_to_portal', true);

    // Gather warranties
    const { data: warranties } = await this.supabase
      .from('property_pending_data')
      .select('id, data_snapshot')
      .eq('source_project_id', projectId)
      .eq('data_type', 'warranty')
      .eq('status', 'pending');

    // Gather systems
    const { data: systems } = await this.supabase
      .from('property_pending_data')
      .select('id, data_snapshot')
      .eq('source_project_id', projectId)
      .eq('data_type', 'system')
      .eq('status', 'pending');

    // Gather completion photos
    const { data: photos } = await this.supabase
      .from('photos')
      .select('storage_path')
      .eq('project_id', projectId)
      .eq('shared_to_portal', true)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get organization info
    const { data: project } = await this.supabase
      .from('projects')
      .select('organization_id, organizations(name, email, phone)')
      .eq('id', projectId)
      .single();

    const org = project?.organizations as { name?: string; email?: string; phone?: string } | null;

    const manual: HomeownerManual = {
      property_id: propertyId,
      project_id: projectId,
      generated_at: new Date().toISOString(),
      sections: {
        materials_installed: (materials || []).map(m => m.data_snapshot as unknown as MaterialRecord),
        systems_installed: (systems || []).map(s => s.data_snapshot as HomeownerManual['sections']['systems_installed'][0]),
        warranties: (warranties || []).map(w => w.data_snapshot as HomeownerManual['sections']['warranties'][0]),
        maintenance_schedules: [], // Generated from materials/systems
        contractor_info: {
          company_name: org?.name || '',
          contact_email: org?.email,
          contact_phone: org?.phone,
        },
        completion_photos: (photos || []).map(p => p.storage_path),
      },
    };

    // Generate maintenance schedules from materials and systems
    manual.sections.maintenance_schedules = this.generateMaintenanceSchedules(
      manual.sections.materials_installed,
      manual.sections.systems_installed
    );

    // Save manual
    await this.supabase
      .from('homeowner_manuals')
      .upsert({
        property_id: propertyId,
        project_id: projectId,
        content: manual,
        generated_at: manual.generated_at,
      });

    // Mark all pending data as transferred
    const pendingIds = [
      ...(materials || []).map(m => m.id),
      ...(warranties || []).map(w => w.id),
      ...(systems || []).map(s => s.id),
    ].filter(Boolean);

    if (pendingIds.length > 0) {
      await this.bridgeService.markTransferred(pendingIds);
    }

    return manual;
  }

  /**
   * Generate maintenance schedules from materials and systems
   */
  private generateMaintenanceSchedules(
    materials: MaterialRecord[],
    systems: HomeownerManual['sections']['systems_installed']
  ): HomeownerManual['sections']['maintenance_schedules'] {
    const schedules: HomeownerManual['sections']['maintenance_schedules'] = [];

    // Add maintenance schedules from materials that have notes
    for (const material of materials) {
      if (material.maintenance_notes) {
        schedules.push({
          item_name: material.name,
          task: material.maintenance_notes,
          frequency: 'As needed',
          next_due: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          instructions: material.maintenance_notes,
        });
      }
    }

    // Add maintenance schedules from systems
    for (const system of systems) {
      if (system.maintenance_schedule) {
        schedules.push({
          item_name: `${system.system_type} - ${system.brand} ${system.model}`,
          task: system.maintenance_schedule,
          frequency: 'Per manufacturer recommendation',
          next_due: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          instructions: system.maintenance_schedule,
        });
      }
    }

    return schedules;
  }

  /**
   * Get homeowner manual for a project
   */
  async getManual(projectId: string): Promise<HomeownerManual | null> {
    const { data, error } = await this.supabase
      .from('homeowner_manuals')
      .select('content')
      .eq('project_id', projectId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.content || null;
  }

  /**
   * Get all manuals for a property
   */
  async getManualsForProperty(propertyId: string): Promise<HomeownerManual[]> {
    const { data, error } = await this.supabase
      .from('homeowner_manuals')
      .select('content')
      .eq('property_id', propertyId)
      .order('generated_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(d => d.content);
  }
}
