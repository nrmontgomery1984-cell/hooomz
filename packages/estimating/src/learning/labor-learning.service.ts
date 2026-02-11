/**
 * Labor Learning Service
 * Records how long tasks take and calculates baselines for Smart Estimating
 *
 * Learning Flow:
 * Time entry/Task completion → Record duration → Update labor baselines
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  LaborBaselineRecord,
  CreateLaborBaselineRecord,
  LaborBaseline,
  ConfidenceLevel,
} from './types';

export class LaborLearningService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Record a labor duration from a time entry or task completion
   */
  async recordLabor(
    orgId: string,
    data: CreateLaborBaselineRecord
  ): Promise<LaborBaselineRecord> {
    const { data: record, error } = await this.supabase
      .from('labor_baselines')
      .insert({
        organization_id: orgId,
        task_name: data.task_name,
        task_template_id: data.task_template_id,
        duration_hours: data.duration_hours,
        work_category: data.work_category,
        location_type: data.location_type,
        complexity: data.complexity,
        team_member_id: data.team_member_id,
        role: data.role,
        source_type: data.source_type,
        source_id: data.source_id,
        project_id: data.project_id,
        recorded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record labor: ${error.message}`);
    }

    return record;
  }

  /**
   * Record labor from a completed task
   * Convenience method that extracts duration from task timestamps
   */
  async recordFromTaskCompletion(
    orgId: string,
    taskId: string,
    taskName: string,
    durationHours: number,
    context: {
      projectId?: string;
      workCategory?: string;
      locationString?: string;
      teamMemberId?: string;
      role?: string;
    }
  ): Promise<LaborBaselineRecord> {
    return this.recordLabor(orgId, {
      task_name: taskName,
      duration_hours: durationHours,
      work_category: context.workCategory,
      location_type: context.locationString,
      team_member_id: context.teamMemberId,
      role: context.role,
      source_type: 'task_close',
      source_id: taskId,
      project_id: context.projectId,
    });
  }

  /**
   * Get the baseline duration for a task type
   * Uses the v_labor_baselines view for calculated averages
   */
  async getBaseline(
    orgId: string,
    taskName: string,
    workCategory?: string
  ): Promise<LaborBaseline | null> {
    let query = this.supabase
      .from('v_labor_baselines')
      .select('*')
      .eq('organization_id', orgId)
      .ilike('task_name', `%${taskName}%`);

    if (workCategory) {
      query = query.eq('work_category', workCategory);
    }

    const { data, error } = await query.limit(1).single();

    if (error) {
      // No baseline found is not an error
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get labor baseline: ${error.message}`);
    }

    return data;
  }

  /**
   * Search for labor baselines matching a query
   */
  async searchBaselines(
    orgId: string,
    query: string,
    limit = 10
  ): Promise<LaborBaseline[]> {
    const { data, error } = await this.supabase
      .from('v_labor_baselines')
      .select('*')
      .eq('organization_id', orgId)
      .ilike('task_name', `%${query}%`)
      .order('data_point_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search labor baselines: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Get labor baselines by work category
   */
  async getBaselinesByCategory(
    orgId: string,
    workCategory: string
  ): Promise<LaborBaseline[]> {
    const { data, error } = await this.supabase
      .from('v_labor_baselines')
      .select('*')
      .eq('organization_id', orgId)
      .eq('work_category', workCategory)
      .order('data_point_count', { ascending: false });

    if (error) {
      throw new Error(`Failed to get labor baselines by category: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Get recent labor records for a task type
   */
  async getLaborHistory(
    orgId: string,
    taskName: string,
    limit = 20
  ): Promise<LaborBaselineRecord[]> {
    const { data, error } = await this.supabase
      .from('labor_baselines')
      .select('*')
      .eq('organization_id', orgId)
      .ilike('task_name', `%${taskName}%`)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get labor history: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Get the confidence level based on data point count
   */
  getConfidenceLevel(dataPointCount: number): ConfidenceLevel {
    if (dataPointCount >= 3) return 'verified';
    if (dataPointCount >= 1) return 'limited';
    return 'estimate';
  }

  /**
   * Calculate a suggested duration for a task
   * Returns the baseline if available, or null if no data
   */
  async getSuggestedDuration(
    orgId: string,
    taskName: string,
    workCategory?: string
  ): Promise<{ hours: number; confidence: ConfidenceLevel; dataPoints: number } | null> {
    const baseline = await this.getBaseline(orgId, taskName, workCategory);

    if (!baseline) {
      return null;
    }

    return {
      hours: baseline.avg_hours,
      confidence: baseline.confidence,
      dataPoints: baseline.data_point_count,
    };
  }

  /**
   * Get labor baselines filtered by role (e.g., journeyman vs apprentice)
   */
  async getBaselineByRole(
    orgId: string,
    taskName: string,
    role: string
  ): Promise<LaborBaseline | null> {
    const { data, error } = await this.supabase
      .from('labor_baselines')
      .select('*')
      .eq('organization_id', orgId)
      .ilike('task_name', `%${taskName}%`)
      .eq('role', role)
      .order('recorded_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get labor baseline by role: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Calculate baseline from records
    const hours = data.map((d) => d.duration_hours);
    const avgHours = hours.reduce((a, b) => a + b, 0) / hours.length;

    return {
      task_name: taskName,
      work_category: data[0].work_category,
      avg_hours: avgHours,
      min_hours: Math.min(...hours),
      max_hours: Math.max(...hours),
      hours_stddev: this.calculateStdDev(hours),
      data_point_count: data.length,
      last_recorded: data[0].recorded_at,
      confidence: this.getConfidenceLevel(data.length),
    };
  }

  private calculateStdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
  }
}
