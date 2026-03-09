'use client';

// ============================================================================
// Budget Panel — Hours burn + cost summary with expandable breakdown
// ============================================================================

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { TaskBudget, LineItem } from '@hooomz/shared-contracts';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { useBackfillLabourBudgets } from '@/lib/hooks/useQuotes';
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

const CATEGORY_LABELS: Record<string, string> = {
  'flooring': 'Flooring',
  'interior-trim': 'Trim',
  'painting': 'Paint',
  'labor': 'Labour',
  'materials': 'Materials',
  'site-work': 'Site Work',
  'drywall': 'Drywall',
  'cabinets-countertops': 'Cabinets',
  'fixtures': 'Fixtures',
  'permits-fees': 'Permits',
  'equipment-rental': 'Equipment',
  'subcontractors': 'Subs',
  'contingency': 'Contingency',
  'other': 'Other',
};

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface TrackBarProps {
  label: string;
  valueStr: string;
  pct: number;
  color: string;
  onClick?: () => void;
  expandIcon?: 'down' | 'right';
}

function TrackBar({ label, valueStr, pct, color, onClick, expandIcon }: TrackBarProps) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', cursor: onClick ? 'pointer' : undefined }}
      onClick={onClick}
    >
      {/* Expand icon */}
      {expandIcon && (
        <span style={{ flexShrink: 0, color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
          {expandIcon === 'down' ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </span>
      )}

      {/* Label */}
      <span
        style={{
          fontFamily: 'var(--font-cond)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--text-3)',
          width: expandIcon ? 32 : 40,
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
  labourQuoteTotal?: number;
}

export function BudgetPanel({
  projectId,
  budgetSummary,
  estimatedCost,
  actualCost,
  budgets,
  labourQuoteTotal,
}: BudgetPanelProps) {
  const [costExpanded, setCostExpanded] = useState(false);
  const [labourExpanded, setLabourExpanded] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const { services } = useServicesContext();

  // Fetch line items for cost breakdown when expanded
  const { data: lineItems = [] } = useQuery({
    queryKey: ['lineItems', projectId],
    queryFn: () => services!.estimating.lineItems.findByProjectId(projectId),
    enabled: !!services && costExpanded,
    staleTime: 30_000,
  });

  // Group line items by category — carries items for drill-down
  const categoryBreakdown = useMemo(() => {
    if (lineItems.length === 0) return [];
    const groups = new Map<string, { total: number; items: LineItem[] }>();
    for (const li of lineItems) {
      const cat = (li.category || 'other') as string;
      const existing = groups.get(cat);
      if (existing) {
        existing.total += li.totalCost || 0;
        existing.items.push(li);
      } else {
        groups.set(cat, { total: li.totalCost || 0, items: [li] });
      }
    }
    return Array.from(groups.entries())
      .map(([category, { total, items }]) => ({ category, label: getCategoryLabel(category), total, items }))
      .sort((a, b) => b.total - a.total);
  }, [lineItems]);

  const backfill = useBackfillLabourBudgets();

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
        <>
          <TrackBar label="Hours" valueStr={hoursValue} pct={hoursPct} color={hoursColor} />
          {/* Labour breakdown — per-task hours */}
          {budgets.length > 0 && (
            <>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setLabourExpanded(!labourExpanded)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLabourExpanded(!labourExpanded); } }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 12px', cursor: 'pointer' }}
              >
                <span style={{ flexShrink: 0, color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
                  {labourExpanded ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
                </span>
                <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'var(--text-3)' }}>
                  {budgets.length} task{budgets.length !== 1 ? 's' : ''} budgeted
                  {labourQuoteTotal ? ` · ${formatCurrency(labourQuoteTotal)} quoted` : ''}
                </span>
              </div>
              {labourExpanded && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 4, paddingBottom: 4 }}>
                  {budgets.map((b) => {
                    const taskRatio = b.budgetedHours > 0 ? b.actualHours / b.budgetedHours : 0;
                    const taskPct = Math.round(taskRatio * 100);
                    const remaining = Math.max(0, b.budgetedHours - b.actualHours);
                    return (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 12px 3px 24px' }}>
                        <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, color: 'var(--text-3)', width: 60, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {b.sopCode || b.taskId.slice(0, 8)}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-2)', width: 80, flexShrink: 0 }}>
                          {b.actualHours.toFixed(1)}h / {b.budgetedHours.toFixed(0)}h
                        </span>
                        <div style={{ flex: 1, height: 2, background: 'var(--border)', borderRadius: 1, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(taskPct, 100)}%`, height: '100%', background: getBudgetColor(taskRatio), borderRadius: 1 }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: remaining > 0 ? 'var(--text-2)' : 'var(--red)', width: 36, textAlign: 'right', flexShrink: 0 }}>
                          {remaining > 0 ? `${remaining.toFixed(1)}h` : 'done'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
      {/* Generate hours budget button — shown when cost data exists but no hours budgets */}
      {!hasBudgetData && hasCostData && (
        <div style={{ padding: '6px 12px' }}>
          <button
            onClick={() => backfill.mutate(projectId)}
            disabled={backfill.isPending}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              fontSize: 10,
              fontFamily: 'var(--font-cond)',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--blue)',
              background: 'none',
              border: '1px solid var(--blue)',
              borderRadius: 6,
              cursor: backfill.isPending ? 'wait' : 'pointer',
              opacity: backfill.isPending ? 0.6 : 1,
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <Clock size={11} />
            {backfill.isPending ? 'Generating...' : 'Generate Hours Budget'}
          </button>
        </div>
      )}
      {hasCostData && (
        <>
          <TrackBar
            label="Cost"
            valueStr={costValue}
            pct={costPct}
            color={costColor}
            onClick={() => setCostExpanded(!costExpanded)}
            expandIcon={costExpanded ? 'down' : 'right'}
          />
          {/* Expandable cost breakdown */}
          {costExpanded && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 4, paddingBottom: 4 }}>
              {categoryBreakdown.length === 0 ? (
                <div style={{ padding: '4px 12px 4px 34px' }}>
                  <span style={{ fontSize: 9, color: 'var(--text-3)' }}>No line items yet</span>
                </div>
              ) : (
                categoryBreakdown.map(({ category, label, total, items }) => {
                  const isOpen = expandedCategory === category;
                  return (
                    <div key={category}>
                      {/* Clickable category row */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setExpandedCategory(isOpen ? null : category)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedCategory(isOpen ? null : category); } }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px 4px 24px', cursor: 'pointer' }}
                      >
                        <span style={{ flexShrink: 0, color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
                          {isOpen ? <ChevronDown size={8} /> : <ChevronRight size={8} />}
                        </span>
                        <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, color: 'var(--text-3)', width: 56, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {label}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-2)', width: 48, flexShrink: 0, textAlign: 'right' }}>
                          {formatCurrency(total)}
                        </span>
                        <div style={{ flex: 1, height: 2, background: 'var(--border)', borderRadius: 1, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(estimatedCost > 0 ? Math.round((total / estimatedCost) * 100) : 0, 100)}%`, height: '100%', background: costColor, borderRadius: 1 }} />
                        </div>
                      </div>

                      {/* Expanded line items */}
                      {isOpen && (
                        <div style={{ marginLeft: 34, borderLeft: '1px solid var(--border)', paddingLeft: 8, paddingTop: 2, paddingBottom: 4 }}>
                          {items.map((item) => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6, padding: '2px 12px 2px 0' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-2)', lineHeight: 1.3 }}>
                                  {item.description}
                                </span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', marginLeft: 4 }}>
                                  {item.quantity} {item.unit} @ {formatCurrency(item.unitCost)}
                                </span>
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-2)', flexShrink: 0 }}>
                                {formatCurrency(item.totalCost)}
                              </span>
                            </div>
                          ))}
                          <Link
                            href={`/estimates/${projectId}`}
                            style={{ display: 'inline-block', marginTop: 4, fontFamily: 'var(--font)', fontSize: 9, color: 'var(--teal)', textDecoration: 'none' }}
                          >
                            Edit in Estimate →
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
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
