/**
 * Property Bridge Service
 * Handles data transfer from projects to property profile on completion
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PropertyPendingDataType,
  MaterialRecord,
} from '@hooomz/shared';

export interface PropertyPendingData {
  id: string;
  property_id: string;
  source_project_id: string;
  data_type: PropertyPendingDataType;
  source_entity_type: string;
  source_entity_id: string;
  data_snapshot: Record<string, unknown>;
  status: 'pending' | 'transferred' | 'rejected';
  transferred_at?: string;
  created_at: string;
}

export class PropertyBridgeService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Queue data for transfer to property profile on project completion
   */
  async queueForTransfer(input: {
    property_id: string;
    source_project_id: string;
    data_type: PropertyPendingDataType;
    source_entity_type: string;
    source_entity_id: string;
    data_snapshot: Record<string, unknown>;
  }): Promise<PropertyPendingData> {
    const { data, error } = await this.supabase
      .from('property_pending_data')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Queue material for property profile when task completed
   */
  async queueMaterial(input: {
    property_id: string;
    project_id: string;
    task_instance_id: string;
    material: MaterialRecord;
  }): Promise<void> {
    await this.queueForTransfer({
      property_id: input.property_id,
      source_project_id: input.project_id,
      data_type: 'material',
      source_entity_type: 'task_instance',
      source_entity_id: input.task_instance_id,
      data_snapshot: input.material as unknown as Record<string, unknown>,
    });
  }

  /**
   * Queue document for property profile when shared to portal
   */
  async queueDocument(input: {
    property_id: string;
    project_id: string;
    document_id: string;
    document_data: Record<string, unknown>;
  }): Promise<void> {
    await this.queueForTransfer({
      property_id: input.property_id,
      source_project_id: input.project_id,
      data_type: 'document',
      source_entity_type: 'document',
      source_entity_id: input.document_id,
      data_snapshot: input.document_data,
    });
  }

  /**
   * Queue warranty for property profile
   */
  async queueWarranty(input: {
    property_id: string;
    project_id: string;
    source_entity_type: string;
    source_entity_id: string;
    warranty_data: Record<string, unknown>;
  }): Promise<void> {
    await this.queueForTransfer({
      property_id: input.property_id,
      source_project_id: input.project_id,
      data_type: 'warranty',
      source_entity_type: input.source_entity_type,
      source_entity_id: input.source_entity_id,
      data_snapshot: input.warranty_data,
    });
  }

  /**
   * Queue system record for property profile
   */
  async queueSystem(input: {
    property_id: string;
    project_id: string;
    source_entity_type: string;
    source_entity_id: string;
    system_data: Record<string, unknown>;
  }): Promise<void> {
    await this.queueForTransfer({
      property_id: input.property_id,
      source_project_id: input.project_id,
      data_type: 'system',
      source_entity_type: input.source_entity_type,
      source_entity_id: input.source_entity_id,
      data_snapshot: input.system_data,
    });
  }

  /**
   * Get all pending data for a project
   */
  async getPendingForProject(projectId: string): Promise<PropertyPendingData[]> {
    const { data, error } = await this.supabase
      .from('property_pending_data')
      .select('*')
      .eq('source_project_id', projectId)
      .eq('status', 'pending');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all pending data for a property
   */
  async getPendingForProperty(propertyId: string): Promise<PropertyPendingData[]> {
    const { data, error } = await this.supabase
      .from('property_pending_data')
      .select('*')
      .eq('property_id', propertyId)
      .eq('status', 'pending');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get pending data by type
   */
  async getPendingByType(
    projectId: string,
    dataType: PropertyPendingDataType
  ): Promise<PropertyPendingData[]> {
    const { data, error } = await this.supabase
      .from('property_pending_data')
      .select('*')
      .eq('source_project_id', projectId)
      .eq('data_type', dataType)
      .eq('status', 'pending');

    if (error) throw error;
    return data || [];
  }

  /**
   * Mark data as transferred
   */
  async markTransferred(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const { error } = await this.supabase
      .from('property_pending_data')
      .update({
        status: 'transferred',
        transferred_at: new Date().toISOString(),
      })
      .in('id', ids);

    if (error) throw error;
  }

  /**
   * Mark data as rejected
   */
  async markRejected(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const { error } = await this.supabase
      .from('property_pending_data')
      .update({ status: 'rejected' })
      .in('id', ids);

    if (error) throw error;
  }
}
