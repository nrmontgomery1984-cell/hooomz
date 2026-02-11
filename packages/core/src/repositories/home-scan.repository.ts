import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  HomeScan,
  CreateHomeScanInput,
  UpdateHomeScanInput,
  ScanStage,
} from '../types';

export class HomeScanRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(input: CreateHomeScanInput): Promise<HomeScan> {
    const { data, error } = await this.supabase
      .from('home_scans')
      .insert({
        property_id: input.property_id,
        project_id: input.project_id,
        organization_id: input.organization_id,
        scan_date: input.scan_date,
        stage: input.stage,
        scan_provider: input.scan_provider,
        point_cloud_path: input.point_cloud_path,
        revit_model_path: input.revit_model_path,
        deviation_report_path: input.deviation_report_path,
        deviation_count: input.deviation_count,
        notes: input.notes,
        scanned_by: input.scanned_by,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findById(id: string): Promise<HomeScan | null> {
    const { data, error } = await this.supabase
      .from('home_scans')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByProperty(propertyId: string): Promise<HomeScan[]> {
    const { data, error } = await this.supabase
      .from('home_scans')
      .select('*')
      .eq('property_id', propertyId)
      .order('scan_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByProject(projectId: string): Promise<HomeScan[]> {
    const { data, error } = await this.supabase
      .from('home_scans')
      .select('*')
      .eq('project_id', projectId)
      .order('scan_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async findByStage(propertyId: string, stage: ScanStage): Promise<HomeScan | null> {
    const { data, error } = await this.supabase
      .from('home_scans')
      .select('*')
      .eq('property_id', propertyId)
      .eq('stage', stage)
      .order('scan_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async update(id: string, input: UpdateHomeScanInput): Promise<HomeScan> {
    const { data, error } = await this.supabase
      .from('home_scans')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async resolveDeviations(id: string): Promise<HomeScan> {
    return this.update(id, { deviations_resolved: true });
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('home_scans')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Check if property has any scans
   */
  async hasScan(propertyId: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from('home_scans')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId);

    if (error) throw error;
    return (count || 0) > 0;
  }

  /**
   * Get scan count by stage for a property
   */
  async getScanCounts(propertyId: string): Promise<Record<ScanStage, number>> {
    const { data, error } = await this.supabase
      .from('home_scans')
      .select('stage')
      .eq('property_id', propertyId);

    if (error) throw error;

    const counts: Record<ScanStage, number> = {
      existing_conditions: 0,
      framing: 0,
      rough_in: 0,
      final: 0,
      other: 0,
    };

    for (const scan of data || []) {
      counts[scan.stage as ScanStage]++;
    }

    return counts;
  }
}
