'use client';

// ============================================================================
// Risk / Attention Panel — Blocked, overdue, over-budget, pending COs
// ============================================================================

import { AlertTriangle, Clock, DollarSign, FileText, GraduationCap, CheckCircle2 } from 'lucide-react';
import { PanelSection } from '@/components/ui/PanelSection';
import { FlagCard, type FlagType } from '@/components/ui/FlagCard';
import type { LucideIcon } from 'lucide-react';

interface AttentionItem {
  type: FlagType;
  label: string;
  detail: string;
  icon: LucideIcon;
}

interface RiskAttentionPanelProps {
  overBudgetTasks: Array<{ taskId: string; taskName: string; actualHours: number; budgetedHours: number }>;
  blockedTasks: Array<{ id: string; taskName: string; room: string }>;
  overdueTasks: Array<{ id: string; taskName: string; dueDate: string }>;
  pendingChangeOrders: Array<{ coNumber: string; title: string; costImpact: number }>;
  trainingGaps: Array<{ sopCode: string; crewName: string }>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function RiskAttentionPanel({
  overBudgetTasks,
  blockedTasks,
  overdueTasks,
  pendingChangeOrders,
  trainingGaps,
}: RiskAttentionPanelProps) {
  const items: AttentionItem[] = [];

  for (const t of blockedTasks) {
    items.push({ type: 'blocked', label: 'Blocked', detail: `${t.taskName} — ${t.room}`, icon: AlertTriangle });
  }
  for (const t of overBudgetTasks) {
    const pct = Math.round((t.actualHours / t.budgetedHours) * 100);
    items.push({ type: 'over_budget', label: 'Over Budget', detail: `${t.taskName}: ${t.actualHours.toFixed(1)}/${t.budgetedHours.toFixed(0)}h (${pct}%)`, icon: DollarSign });
  }
  for (const t of overdueTasks) {
    items.push({ type: 'overdue', label: 'Overdue', detail: `${t.taskName} (due ${formatDate(t.dueDate)})`, icon: Clock });
  }
  for (const co of pendingChangeOrders) {
    items.push({ type: 'pending_co', label: 'Pending CO', detail: `${co.coNumber}: ${co.title} (${formatCurrency(co.costImpact)})`, icon: FileText });
  }
  for (const g of trainingGaps) {
    items.push({ type: 'training_gap', label: 'Training Gap', detail: `${g.sopCode} (${g.crewName})`, icon: GraduationCap });
  }

  const displayItems = items.slice(0, 5);
  const hasMore = items.length > 5;

  return (
    <PanelSection
      label="Needs Attention"
      count={items.length > 0 ? items.length : undefined}
      countColor="var(--red)"
    >
      {items.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px' }}>
          <CheckCircle2 size={14} strokeWidth={1.5} style={{ color: 'var(--green)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--green)' }}>All clear</span>
        </div>
      ) : (
        <>
          {displayItems.map((item, i) => (
            <FlagCard key={i} type={item.type} label={item.label} detail={item.detail} icon={item.icon} />
          ))}
          {hasMore && (
            <div style={{ padding: '4px 12px' }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                +{items.length - 5} more
              </span>
            </div>
          )}
        </>
      )}
    </PanelSection>
  );
}
