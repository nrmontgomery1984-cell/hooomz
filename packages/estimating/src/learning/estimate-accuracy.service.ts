/**
 * Estimate Accuracy Service
 * Tracks how well estimates predicted actual project costs
 * This is the ultimate feedback loop for Smart Estimating
 *
 * Learning Flow:
 * Project completed → Compare estimate vs actual → Record accuracy → Update confidence
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  EstimateAccuracyRecord,
  CreateEstimateAccuracyRecord,
  EstimateAccuracyTrend,
  CategoryBreakdown,
} from './types';

export class EstimateAccuracyService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Record the accuracy of an estimate when a project is completed
   */
  async recordAccuracy(
    orgId: string,
    data: CreateEstimateAccuracyRecord
  ): Promise<EstimateAccuracyRecord> {
    // Calculate variance
    const varianceAmount = data.actual_total - data.estimated_total;
    const variancePercent =
      data.estimated_total > 0
        ? ((varianceAmount / data.estimated_total) * 100)
        : 0;

    const { data: record, error } = await this.supabase
      .from('estimate_accuracy')
      .insert({
        organization_id: orgId,
        project_id: data.project_id,
        estimate_id: data.estimate_id,
        estimated_total: data.estimated_total,
        actual_total: data.actual_total,
        variance_amount: varianceAmount,
        variance_percent: variancePercent,
        category_breakdowns: data.category_breakdowns ?? [],
        project_type: data.project_type,
        project_size: data.project_size,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record estimate accuracy: ${error.message}`);
    }

    return record;
  }

  /**
   * Get accuracy record for a specific project
   */
  async getProjectAccuracy(
    orgId: string,
    projectId: string
  ): Promise<EstimateAccuracyRecord | null> {
    const { data, error } = await this.supabase
      .from('estimate_accuracy')
      .select('*')
      .eq('organization_id', orgId)
      .eq('project_id', projectId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get project accuracy: ${error.message}`);
    }

    return data;
  }

  /**
   * Get accuracy trend over time
   * Uses the v_estimate_accuracy_trend view
   */
  async getAccuracyTrend(
    orgId: string,
    months = 12
  ): Promise<EstimateAccuracyTrend[]> {
    const { data, error } = await this.supabase
      .from('v_estimate_accuracy_trend')
      .select('*')
      .eq('organization_id', orgId)
      .order('month', { ascending: false })
      .limit(months);

    if (error) {
      throw new Error(`Failed to get accuracy trend: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Get recent accuracy records
   */
  async getRecentAccuracy(
    orgId: string,
    limit = 20
  ): Promise<EstimateAccuracyRecord[]> {
    const { data, error } = await this.supabase
      .from('estimate_accuracy')
      .select('*')
      .eq('organization_id', orgId)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get recent accuracy: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Get overall accuracy statistics for an organization
   */
  async getOverallStats(orgId: string): Promise<{
    totalProjects: number;
    avgVariancePercent: number;
    avgAbsoluteVariancePercent: number;
    accuracyScore: number;
    trend: 'improving' | 'declining' | 'stable';
  }> {
    const { data, error } = await this.supabase
      .from('estimate_accuracy')
      .select('variance_percent')
      .eq('organization_id', orgId);

    if (error) {
      throw new Error(`Failed to get overall stats: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        totalProjects: 0,
        avgVariancePercent: 0,
        avgAbsoluteVariancePercent: 0,
        accuracyScore: 0,
        trend: 'stable',
      };
    }

    const variances = data.map((d) => d.variance_percent);
    const avgVariance = variances.reduce((a, b) => a + b, 0) / variances.length;
    const avgAbsVariance =
      variances.map(Math.abs).reduce((a, b) => a + b, 0) / variances.length;

    // Accuracy score: 100 = perfect, decreases with variance
    // A 10% average variance = 90 score, 20% = 80, etc.
    const accuracyScore = Math.max(0, Math.round(100 - avgAbsVariance));

    // Calculate trend (comparing recent 3 vs previous 3)
    const trend = this.calculateTrend(variances);

    return {
      totalProjects: data.length,
      avgVariancePercent: avgVariance,
      avgAbsoluteVariancePercent: avgAbsVariance,
      accuracyScore,
      trend,
    };
  }

  /**
   * Get accuracy by project type
   */
  async getAccuracyByProjectType(
    orgId: string
  ): Promise<Map<string, { count: number; avgVariance: number }>> {
    const { data, error } = await this.supabase
      .from('estimate_accuracy')
      .select('project_type, variance_percent')
      .eq('organization_id', orgId)
      .not('project_type', 'is', null);

    if (error) {
      throw new Error(`Failed to get accuracy by project type: ${error.message}`);
    }

    const byType = new Map<string, { count: number; avgVariance: number }>();

    if (data) {
      const grouped = new Map<string, number[]>();
      for (const record of data) {
        if (!record.project_type) continue;
        if (!grouped.has(record.project_type)) {
          grouped.set(record.project_type, []);
        }
        grouped.get(record.project_type)!.push(record.variance_percent);
      }

      for (const [type, variances] of grouped) {
        byType.set(type, {
          count: variances.length,
          avgVariance: variances.reduce((a, b) => a + b, 0) / variances.length,
        });
      }
    }

    return byType;
  }

  /**
   * Get category-level insights (which categories are we worst at estimating?)
   */
  async getCategoryInsights(
    orgId: string
  ): Promise<Map<string, { count: number; avgVariance: number }>> {
    const { data, error } = await this.supabase
      .from('estimate_accuracy')
      .select('category_breakdowns')
      .eq('organization_id', orgId);

    if (error) {
      throw new Error(`Failed to get category insights: ${error.message}`);
    }

    const byCategory = new Map<string, number[]>();

    if (data) {
      for (const record of data) {
        const breakdowns = record.category_breakdowns as CategoryBreakdown[];
        if (!breakdowns) continue;

        for (const breakdown of breakdowns) {
          if (!byCategory.has(breakdown.category)) {
            byCategory.set(breakdown.category, []);
          }
          byCategory.get(breakdown.category)!.push(breakdown.variance_percent);
        }
      }
    }

    const result = new Map<string, { count: number; avgVariance: number }>();
    for (const [category, variances] of byCategory) {
      result.set(category, {
        count: variances.length,
        avgVariance: variances.reduce((a, b) => a + b, 0) / variances.length,
      });
    }

    return result;
  }

  /**
   * Calculate suggested contingency based on historical accuracy
   */
  async getSuggestedContingency(
    orgId: string,
    _projectType?: string
  ): Promise<{ percent: number; confidence: 'high' | 'medium' | 'low' }> {
    const stats = await this.getOverallStats(orgId);

    if (stats.totalProjects < 3) {
      // Not enough data, suggest conservative contingency
      return { percent: 15, confidence: 'low' };
    }

    if (stats.totalProjects < 10) {
      // Some data, but still learning
      const suggested = Math.max(5, Math.ceil(stats.avgAbsoluteVariancePercent * 1.5));
      return { percent: suggested, confidence: 'medium' };
    }

    // Good amount of data
    const suggested = Math.max(5, Math.ceil(stats.avgAbsoluteVariancePercent * 1.2));
    return { percent: suggested, confidence: 'high' };
  }

  private calculateTrend(
    variances: number[]
  ): 'improving' | 'declining' | 'stable' {
    if (variances.length < 6) return 'stable';

    const recent = variances.slice(0, 3);
    const previous = variances.slice(3, 6);

    const recentAvg = Math.abs(recent.reduce((a, b) => a + b, 0) / recent.length);
    const previousAvg = Math.abs(previous.reduce((a, b) => a + b, 0) / previous.length);

    const change = recentAvg - previousAvg;

    if (change < -2) return 'improving'; // Variance decreased by 2%+
    if (change > 2) return 'declining'; // Variance increased by 2%+
    return 'stable';
  }
}
