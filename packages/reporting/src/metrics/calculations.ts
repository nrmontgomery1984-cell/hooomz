/**
 * Metrics Calculations
 * Business intelligence calculations for project analytics
 */

import type { ApiResponse } from '@hooomz/shared-contracts';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@hooomz/shared-contracts';

/**
 * Project data for metrics calculation
 */
export interface ProjectMetricsData {
  id: string;
  name: string;
  startDate: string;
  estimatedEndDate?: string;
  actualEndDate?: string;
  status: string;
  estimatedCost: number;
  actualCost: number;
  estimatedRevenue: number;
  actualRevenue?: number;
  completedOnTime?: boolean;
}

/**
 * Time period for trend analysis
 */
export type TimePeriod = 'week' | 'month' | 'quarter' | 'year';

/**
 * Average project duration result
 */
export interface AverageProjectDuration {
  averageDays: number;
  totalProjects: number;
  completedProjects: number;
  breakdown: {
    fastest: {
      projectId: string;
      projectName: string;
      days: number;
    };
    slowest: {
      projectId: string;
      projectName: string;
      days: number;
    };
    median: number;
  };
  byStatus: {
    completed: number;
    inProgress: number;
  };
}

/**
 * Profit margin trend result
 */
export interface ProfitMarginTrend {
  period: TimePeriod;
  dataPoints: Array<{
    date: string;
    profitMargin: number;
    revenue: number;
    profit: number;
    projectCount: number;
  }>;
  summary: {
    averageMargin: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    percentageChange: number;
  };
}

/**
 * On-time delivery rate result
 */
export interface OnTimeDeliveryRate {
  totalProjects: number;
  completedProjects: number;
  onTimeProjects: number;
  lateProjects: number;
  onTimeRate: number;
  averageDaysLate: number;
  breakdown: {
    onTime: Array<{
      projectId: string;
      projectName: string;
      completedDate: string;
    }>;
    late: Array<{
      projectId: string;
      projectName: string;
      daysLate: number;
      completedDate: string;
    }>;
  };
}

/**
 * Cost overrun data
 */
export interface CostOverrun {
  projectId: string;
  projectName: string;
  estimatedCost: number;
  actualCost: number;
  overrun: number;
  overrunPercentage: number;
  status: string;
  categories?: Array<{
    category: string;
    overrun: number;
  }>;
}

/**
 * Calculate average project duration
 */
export async function calculateAverageProjectDuration(
  projects: ProjectMetricsData[]
): Promise<ApiResponse<AverageProjectDuration>> {
  try {
    if (!Array.isArray(projects) || projects.length === 0) {
      return createErrorResponse(
        'INVALID_INPUT',
        'Projects array is required and must not be empty'
      );
    }

    // Filter to projects with date information
    const projectsWithDates = projects.filter(
      (p) => p.startDate && (p.actualEndDate || p.estimatedEndDate)
    );

    if (projectsWithDates.length === 0) {
      return createErrorResponse(
        'INVALID_INPUT',
        'No projects with valid date information'
      );
    }

    // Calculate duration for each project
    const durations = projectsWithDates.map((project) => {
      const startDate = new Date(project.startDate);
      const endDate = new Date(
        project.actualEndDate || project.estimatedEndDate!
      );
      const days = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        projectId: project.id,
        projectName: project.name,
        days,
        isComplete: !!project.actualEndDate,
      };
    });

    // Calculate average
    const totalDays = durations.reduce((sum, d) => sum + d.days, 0);
    const averageDays = totalDays / durations.length;

    // Find fastest and slowest
    const sorted = [...durations].sort((a, b) => a.days - b.days);
    const fastest = sorted[0];
    const slowest = sorted[sorted.length - 1];

    // Calculate median
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0
        ? (sorted[mid - 1].days + sorted[mid].days) / 2
        : sorted[mid].days;

    // Count by status
    const completedProjects = durations.filter((d) => d.isComplete);
    const inProgressProjects = durations.filter((d) => !d.isComplete);

    const result: AverageProjectDuration = {
      averageDays: Math.round(averageDays * 10) / 10,
      totalProjects: projects.length,
      completedProjects: completedProjects.length,
      breakdown: {
        fastest: {
          projectId: fastest.projectId,
          projectName: fastest.projectName,
          days: fastest.days,
        },
        slowest: {
          projectId: slowest.projectId,
          projectName: slowest.projectName,
          days: slowest.days,
        },
        median: Math.round(median * 10) / 10,
      },
      byStatus: {
        completed:
          completedProjects.length > 0
            ? Math.round(
                (completedProjects.reduce((sum, d) => sum + d.days, 0) /
                  completedProjects.length) *
                  10
              ) / 10
            : 0,
        inProgress:
          inProgressProjects.length > 0
            ? Math.round(
                (inProgressProjects.reduce((sum, d) => sum + d.days, 0) /
                  inProgressProjects.length) *
                  10
              ) / 10
            : 0,
      },
    };

    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to calculate average project duration',
      { error }
    );
  }
}

/**
 * Calculate profit margin trend over time
 */
export async function calculateProfitMarginTrend(
  projects: ProjectMetricsData[],
  period: TimePeriod = 'month'
): Promise<ApiResponse<ProfitMarginTrend>> {
  try {
    if (!Array.isArray(projects) || projects.length === 0) {
      return createErrorResponse(
        'INVALID_INPUT',
        'Projects array is required and must not be empty'
      );
    }

    // Filter to completed projects with revenue data
    const completedProjects = projects.filter(
      (p) => p.actualEndDate && p.actualRevenue && p.actualCost
    );

    if (completedProjects.length === 0) {
      return createErrorResponse(
        'INVALID_INPUT',
        'No completed projects with financial data'
      );
    }

    // Group projects by period
    const groupedByPeriod = new Map<
      string,
      Array<{
        revenue: number;
        profit: number;
        margin: number;
      }>
    >();

    completedProjects.forEach((project) => {
      const date = new Date(project.actualEndDate!);
      const periodKey = this.getPeriodKey(date, period);

      const revenue = project.actualRevenue!;
      const profit = revenue - project.actualCost;
      const margin = (profit / revenue) * 100;

      if (!groupedByPeriod.has(periodKey)) {
        groupedByPeriod.set(periodKey, []);
      }

      groupedByPeriod.get(periodKey)!.push({ revenue, profit, margin });
    });

    // Calculate data points
    const dataPoints = Array.from(groupedByPeriod.entries())
      .map(([date, projects]) => {
        const totalRevenue = projects.reduce((sum, p) => sum + p.revenue, 0);
        const totalProfit = projects.reduce((sum, p) => sum + p.profit, 0);
        const profitMargin = (totalProfit / totalRevenue) * 100;

        return {
          date,
          profitMargin: Math.round(profitMargin * 100) / 100,
          revenue: totalRevenue,
          profit: totalProfit,
          projectCount: projects.length,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate summary
    const margins = dataPoints.map((dp) => dp.profitMargin);
    const averageMargin =
      margins.reduce((sum, m) => sum + m, 0) / margins.length;

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let percentageChange = 0;

    if (dataPoints.length >= 2) {
      const firstMargin = dataPoints[0].profitMargin;
      const lastMargin = dataPoints[dataPoints.length - 1].profitMargin;
      percentageChange = lastMargin - firstMargin;

      if (Math.abs(percentageChange) < 2) {
        trend = 'stable';
      } else if (percentageChange > 0) {
        trend = 'increasing';
      } else {
        trend = 'decreasing';
      }
    }

    const result: ProfitMarginTrend = {
      period,
      dataPoints,
      summary: {
        averageMargin: Math.round(averageMargin * 100) / 100,
        trend,
        percentageChange: Math.round(percentageChange * 100) / 100,
      },
    };

    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to calculate profit margin trend',
      { error }
    );
  }
}

/**
 * Calculate on-time delivery rate
 */
export async function calculateOnTimeDeliveryRate(
  projects: ProjectMetricsData[]
): Promise<ApiResponse<OnTimeDeliveryRate>> {
  try {
    if (!Array.isArray(projects) || projects.length === 0) {
      return createErrorResponse(
        'INVALID_INPUT',
        'Projects array is required and must not be empty'
      );
    }

    // Filter to completed projects with date information
    const completedProjects = projects.filter(
      (p) => p.actualEndDate && p.estimatedEndDate
    );

    if (completedProjects.length === 0) {
      return createErrorResponse(
        'INVALID_INPUT',
        'No completed projects with estimated and actual end dates'
      );
    }

    // Categorize projects
    const onTime: Array<{
      projectId: string;
      projectName: string;
      completedDate: string;
    }> = [];

    const late: Array<{
      projectId: string;
      projectName: string;
      daysLate: number;
      completedDate: string;
    }> = [];

    let totalDaysLate = 0;

    completedProjects.forEach((project) => {
      const estimatedDate = new Date(project.estimatedEndDate!);
      const actualDate = new Date(project.actualEndDate!);

      const diffTime = actualDate.getTime() - estimatedDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        // On time or early
        onTime.push({
          projectId: project.id,
          projectName: project.name,
          completedDate: project.actualEndDate!,
        });
      } else {
        // Late
        late.push({
          projectId: project.id,
          projectName: project.name,
          daysLate: diffDays,
          completedDate: project.actualEndDate!,
        });
        totalDaysLate += diffDays;
      }
    });

    const onTimeRate = (onTime.length / completedProjects.length) * 100;
    const averageDaysLate = late.length > 0 ? totalDaysLate / late.length : 0;

    const result: OnTimeDeliveryRate = {
      totalProjects: projects.length,
      completedProjects: completedProjects.length,
      onTimeProjects: onTime.length,
      lateProjects: late.length,
      onTimeRate: Math.round(onTimeRate * 100) / 100,
      averageDaysLate: Math.round(averageDaysLate * 10) / 10,
      breakdown: {
        onTime: onTime.slice(0, 10), // Limit to top 10
        late: late
          .sort((a, b) => b.daysLate - a.daysLate)
          .slice(0, 10), // Top 10 most late
      },
    };

    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to calculate on-time delivery rate',
      { error }
    );
  }
}

/**
 * Identify top cost overruns
 */
export async function identifyTopCostOverruns(
  projects: ProjectMetricsData[],
  limit: number = 10
): Promise<ApiResponse<CostOverrun[]>> {
  try {
    if (!Array.isArray(projects) || projects.length === 0) {
      return createErrorResponse(
        'INVALID_INPUT',
        'Projects array is required and must not be empty'
      );
    }

    // Calculate overruns for each project
    const overruns: CostOverrun[] = projects
      .filter((p) => p.estimatedCost > 0 && p.actualCost > 0)
      .map((project) => {
        const overrun = project.actualCost - project.estimatedCost;
        const overrunPercentage =
          (overrun / project.estimatedCost) * 100;

        return {
          projectId: project.id,
          projectName: project.name,
          estimatedCost: project.estimatedCost,
          actualCost: project.actualCost,
          overrun,
          overrunPercentage: Math.round(overrunPercentage * 100) / 100,
          status: project.status,
        };
      })
      .filter((o) => o.overrun > 0) // Only overruns, not under-budget
      .sort((a, b) => b.overrun - a.overrun) // Sort by absolute overrun amount
      .slice(0, limit);

    return createSuccessResponse(overruns);
  } catch (error) {
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to identify top cost overruns',
      { error }
    );
  }
}

/**
 * Helper: Get period key for grouping
 */
function getPeriodKey(date: Date, period: TimePeriod): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  switch (period) {
    case 'week': {
      const weekNum = getWeekNumber(date);
      return `${year}-W${String(weekNum).padStart(2, '0')}`;
    }
    case 'month':
      return `${year}-${String(month).padStart(2, '0')}`;
    case 'quarter': {
      const quarter = Math.ceil(month / 3);
      return `${year}-Q${quarter}`;
    }
    case 'year':
      return String(year);
    default:
      return `${year}-${String(month).padStart(2, '0')}`;
  }
}

/**
 * Helper: Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
