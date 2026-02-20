'use client';

/**
 * Project Health Card — Compact bar version
 *
 * Single-line progress bar with stats. No donut.
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
  if (score >= 90) return 'var(--green)';
  if (score >= 70) return 'var(--blue)';
  if (score >= 50) return 'var(--amber)';
  if (score >= 30) return 'var(--amber)';
  return 'var(--red)';
}

export function ProjectHealthCard({
  healthScore,
  completedTasks,
  totalTasks,
  roomCount,
  budgetSummary,
}: ProjectHealthCardProps) {
  const scoreColor = getScoreColor(healthScore);

  const budgetPct = budgetSummary && budgetSummary.totalBudgetedHours > 0
    ? Math.round((budgetSummary.totalActualHours / budgetSummary.totalBudgetedHours) * 100)
    : null;
  const budgetColor = budgetPct !== null
    ? budgetPct > 100 ? 'var(--red)' : budgetPct > 85 ? 'var(--amber)' : 'var(--green)'
    : null;

  return (
    <div
      style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 12px', boxShadow: 'var(--shadow-card)' }}
    >
      {/* Top line: label + score + stats */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: scoreColor }}>
            {healthScore}%
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
            {completedTasks}/{totalTasks} tasks
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {roomCount} room{roomCount !== 1 ? 's' : ''}
          </span>
          {budgetSummary && budgetSummary.totalBudgetedHours > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: budgetColor || 'var(--text-3)' }}>
              {budgetSummary.totalActualHours.toFixed(1)}/{budgetSummary.totalBudgetedHours.toFixed(0)}h
            </span>
          )}
        </div>
      </div>

      {/* Task progress bar */}
      <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
            height: '100%',
            background: scoreColor,
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* Budget bar */}
      {budgetSummary && budgetSummary.totalBudgetedHours > 0 && (
        <div style={{ height: 2, borderRadius: 1, background: 'var(--border)', overflow: 'hidden', marginTop: 4 }}>
          <div
            style={{
              width: `${Math.min(budgetPct || 0, 100)}%`,
              height: '100%',
              background: budgetColor || 'var(--text-3)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      )}
    </div>
  );
}
