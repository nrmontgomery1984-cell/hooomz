'use client';

/**
 * ExpenseSummaryPanel — Compact expense summary for project detail page.
 *
 * Shows total spend grouped by CostCategory with progress bars.
 * "Add Expense" button opens AddExpenseSheet.
 */

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { AddExpenseSheet } from './AddExpenseSheet';
import { PanelSection } from '@/components/ui/PanelSection';
import type { Task, ExpenseEntry } from '@hooomz/shared-contracts';

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
  'plumbing': 'Plumbing',
  'electrical': 'Electrical',
  'other': 'Other',
};

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface ExpenseSummaryPanelProps {
  projectId: string;
  tasks?: Task[];
}

export function ExpenseSummaryPanel({ projectId, tasks }: ExpenseSummaryPanelProps) {
  const { data: expenses = [] } = useExpenses(projectId);
  const [showAddSheet, setShowAddSheet] = useState(false);

  const totalSpend = useMemo(() => {
    return expenses.reduce((sum: number, e: ExpenseEntry) => sum + e.amount, 0);
  }, [expenses]);

  const categoryBreakdown = useMemo(() => {
    const groups = new Map<string, number>();
    for (const e of expenses) {
      const cat = e.category || 'other';
      groups.set(cat, (groups.get(cat) || 0) + e.amount);
    }
    return Array.from(groups.entries())
      .map(([category, total]) => ({ category, label: getCategoryLabel(category), total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const action = (
    <button
      onClick={() => setShowAddSheet(true)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        fontSize: 10,
        color: 'var(--teal)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 600,
        padding: 0,
      }}
    >
      <Plus size={9} /> Add
    </button>
  );

  return (
    <>
      <PanelSection label="Expenses" action={action}>
        {expenses.length === 0 ? (
          <div style={{ padding: '6px 12px' }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>No expenses recorded</span>
          </div>
        ) : (
          <>
            {/* Total */}
            <div style={{ padding: '4px 12px 6px', display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                {formatCurrency(totalSpend)}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
              </span>
            </div>

            {/* Category rows */}
            {categoryBreakdown.map(({ category, label, total }) => {
              const pct = totalSpend > 0 ? Math.round((total / totalSpend) * 100) : 0;
              return (
                <div key={category} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 12px' }}>
                  <span style={{
                    fontFamily: 'var(--font-cond)',
                    fontSize: 9,
                    color: 'var(--text-3)',
                    width: 56,
                    flexShrink: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--text-2)',
                    width: 48,
                    flexShrink: 0,
                    textAlign: 'right',
                  }}>
                    {formatCurrency(total)}
                  </span>
                  <div style={{ flex: 1, height: 2, background: 'var(--border)', borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(pct, 100)}%`,
                      height: '100%',
                      background: 'var(--teal)',
                      borderRadius: 1,
                    }} />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </PanelSection>

      <AddExpenseSheet
        projectId={projectId}
        tasks={tasks}
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
      />
    </>
  );
}
