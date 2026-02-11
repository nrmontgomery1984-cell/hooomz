'use client';

/**
 * Project Health Card
 *
 * SVG donut chart showing project completion percentage,
 * task stats, and optional budget summary.
 */

interface ProjectHealthCardProps {
  healthScore: number;
  completedTasks: number;
  totalTasks: number;
  roomCount: number;
  budgetSummary?: {
    totalBudgetedHours: number;
    totalActualHours: number;
  } | null;
}

function getScoreColor(score: number) {
  if (score >= 90) return '#10B981';
  if (score >= 70) return '#14B8A6';
  if (score >= 50) return '#F59E0B';
  if (score >= 30) return '#F97316';
  return '#EF4444';
}

export function ProjectHealthCard({
  healthScore,
  completedTasks,
  totalTasks,
  roomCount,
  budgetSummary,
}: ProjectHealthCardProps) {
  const scoreColor = getScoreColor(healthScore);
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  const budgetPct = budgetSummary && budgetSummary.totalBudgetedHours > 0
    ? Math.round((budgetSummary.totalActualHours / budgetSummary.totalBudgetedHours) * 100)
    : null;
  const budgetColor = budgetPct !== null
    ? budgetPct > 100 ? '#EF4444' : budgetPct > 85 ? '#F59E0B' : '#10B981'
    : null;

  return (
    <div
      className="mt-4 rounded-2xl p-5 flex items-center gap-5"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
    >
      {/* Donut */}
      <div className="relative flex-shrink-0">
        <svg width="104" height="104" viewBox="0 0 104 104">
          <circle cx="52" cy="52" r="42" fill="none" stroke="#E5E7EB" strokeWidth="8" />
          <circle
            cx="52" cy="52" r="42" fill="none"
            stroke={scoreColor} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 52 52)"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold" style={{ color: scoreColor }}>{healthScore}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold mb-1" style={{ color: '#111827' }}>Project Health</p>
        <p className="text-xs mb-2.5" style={{ color: '#6B7280' }}>
          {completedTasks} of {totalTasks} tasks complete
        </p>

        {/* Task progress bar */}
        <div className="w-full h-1.5 rounded-full" style={{ background: '#E5E7EB' }}>
          <div
            className="h-1.5 rounded-full"
            style={{
              width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
              background: scoreColor,
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
            {roomCount} room{roomCount !== 1 ? 's' : ''}
          </p>

          {/* Budget summary */}
          {budgetSummary && budgetSummary.totalBudgetedHours > 0 && (
            <p className="text-[11px] font-medium" style={{ color: budgetColor || '#9CA3AF' }}>
              {budgetSummary.totalActualHours.toFixed(1)}/{budgetSummary.totalBudgetedHours.toFixed(0)}h
            </p>
          )}
        </div>

        {/* Budget utilization bar */}
        {budgetSummary && budgetSummary.totalBudgetedHours > 0 && (
          <div className="w-full h-1 rounded-full mt-1" style={{ background: '#E5E7EB' }}>
            <div
              className="h-1 rounded-full"
              style={{
                width: `${Math.min(budgetPct || 0, 100)}%`,
                background: budgetColor || '#9CA3AF',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
