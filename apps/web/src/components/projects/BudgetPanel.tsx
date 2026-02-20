'use client';

// ============================================================================
// Budget Panel — Hours burn + cost summary
// ============================================================================

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { TaskBudget } from '@hooomz/shared-contracts';
import { PanelSection } from '@/components/ui/PanelSection';

function getBudgetColor(ratio: number): string {
  if (ratio > 1.0) return 'var(--red)';
  if (ratio > 0.85) return 'var(--amber)';
  return 'var(--green)';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface TrackBarProps {
  label: string;
  valueStr: string;
  pct: number;
  color: string;
}

function TrackBar({ label, valueStr, pct, color }: TrackBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px' }}>
      {/* Label */}
      <span
        style={{
          fontFamily: 'var(--font-cond)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--text-3)',
          width: 40,
          flexShrink: 0,
        }}
      >
        {label}
      </span>

      {/* Value */}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-2)',
          width: 100,
          flexShrink: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {valueStr}
      </span>

      {/* Bar + pct */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(pct, 100)}%`,
              height: '100%',
              background: color,
              borderRadius: 2,
              transition: 'width 0.3s',
            }}
          />
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            color,
            width: 32,
            textAlign: 'right',
            flexShrink: 0,
          }}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
}

interface BudgetPanelProps {
  projectId: string;
  budgetSummary: {
    totalBudgetedHours: number;
    totalActualHours: number;
    overallEfficiency: number | null;
    overBudgetCount: number;
    completedCount: number;
    totalBudgets: number;
  } | null;
  estimatedCost: number;
  actualCost: number;
  budgets: TaskBudget[];
}

export function BudgetPanel({
  projectId,
  budgetSummary,
  estimatedCost,
  actualCost,
  budgets,
}: BudgetPanelProps) {
  const hasBudgetData = budgetSummary && budgetSummary.totalBudgetedHours > 0;
  const hasCostData = estimatedCost > 0;

  const action = estimatedCost > 0 ? (
    <Link
      href={`/estimates/${projectId}`}
      style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--blue)', textDecoration: 'none' }}
    >
      Estimate <ArrowRight size={9} />
    </Link>
  ) : undefined;

  if (!hasBudgetData && !hasCostData) {
    return (
      <PanelSection label="Budget" action={action}>
        <div style={{ padding: '6px 12px' }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>No budget data yet</span>
        </div>
      </PanelSection>
    );
  }

  const hoursRatio = hasBudgetData
    ? budgetSummary.totalActualHours / budgetSummary.totalBudgetedHours
    : 0;
  const hoursPct = Math.round(hoursRatio * 100);
  const hoursColor = hasBudgetData ? getBudgetColor(hoursRatio) : 'var(--text-3)';
  const hoursValue = hasBudgetData
    ? `${budgetSummary.totalActualHours.toFixed(1)}h / ${budgetSummary.totalBudgetedHours.toFixed(0)}h`
    : '—';

  const costRatio = hasCostData ? actualCost / estimatedCost : 0;
  const costPct = Math.round(costRatio * 100);
  const costColor = hasCostData ? getBudgetColor(costRatio) : 'var(--text-3)';
  const costValue = hasCostData
    ? `${formatCurrency(actualCost)} / ${formatCurrency(estimatedCost)}`
    : '—';

  const overBudgetCount = budgets.filter((b) => b.status === 'over_budget').length;
  const onTrackCount = budgets.filter((b) => b.status === 'active').length;
  const completeCount = budgets.filter((b) => b.status === 'complete').length;

  return (
    <PanelSection label="Budget" action={action}>
      {hasBudgetData && (
        <TrackBar label="Hours" valueStr={hoursValue} pct={hoursPct} color={hoursColor} />
      )}
      {hasCostData && (
        <TrackBar label="Cost" valueStr={costValue} pct={costPct} color={costColor} />
      )}

      {/* Status dots */}
      {budgets.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px 2px', flexWrap: 'wrap' }}>
          {overBudgetCount > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--red)' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
              {overBudgetCount} over
            </span>
          )}
          {onTrackCount > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-2)' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
              {onTrackCount} on track
            </span>
          )}
          {completeCount > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-2)' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text-3)', flexShrink: 0 }} />
              {completeCount} done
            </span>
          )}
        </div>
      )}
    </PanelSection>
  );
}
