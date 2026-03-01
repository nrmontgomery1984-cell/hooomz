'use client';

/**
 * ExpenseListPanel — Full expense list for the Finance page.
 *
 * Shows all expenses for a project with date, description, vendor,
 * category pill, amount, and delete action.
 */

import { useState } from 'react';
import { Plus, Trash2, Receipt } from 'lucide-react';
import { useExpenses, useDeleteExpense } from '@/lib/hooks/useExpenses';
import { AddExpenseSheet } from './AddExpenseSheet';
import type { Task, ExpenseEntry } from '@hooomz/shared-contracts';

const CATEGORY_LABELS: Record<string, string> = {
  'flooring': 'Flooring', 'interior-trim': 'Trim', 'painting': 'Paint',
  'labor': 'Labour', 'materials': 'Materials', 'site-work': 'Site Work',
  'drywall': 'Drywall', 'cabinets-countertops': 'Cabinets', 'fixtures': 'Fixtures',
  'permits-fees': 'Permits', 'equipment-rental': 'Equipment', 'subcontractors': 'Subs',
  'plumbing': 'Plumbing', 'electrical': 'Electrical', 'other': 'Other',
};

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface ExpenseListPanelProps {
  projectId: string;
  tasks?: Task[];
}

export function ExpenseListPanel({ projectId, tasks }: ExpenseListPanelProps) {
  const { data: expenses = [], isLoading } = useExpenses(projectId);
  const deleteExpense = useDeleteExpense();
  const [showAddSheet, setShowAddSheet] = useState(false);

  const totalSpend = expenses.reduce((sum: number, e: ExpenseEntry) => sum + e.amount, 0);

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

  const handleDelete = (expense: ExpenseEntry) => {
    deleteExpense.mutate({ id: expense.id, projectId: expense.projectId });
  };

  return (
    <>
      <div style={{
        borderRadius: 'var(--radius)',
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Receipt size={14} style={{ color: 'var(--text-3)' }} />
            <span style={{
              fontFamily: 'var(--font-cond)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-3)',
            }}>
              Expenses
            </span>
            {expenses.length > 0 && (
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text)',
              }}>
                ${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowAddSheet(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              minHeight: 32,
              padding: '0 10px',
              borderRadius: 'var(--radius)',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'var(--font-cond)',
              letterSpacing: '0.04em',
              color: '#FFFFFF',
              background: 'var(--teal)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={12} /> ADD
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{
              width: 24, height: 24,
              border: '2px solid var(--border)',
              borderTopColor: 'var(--teal)',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
              margin: '0 auto 8px',
            }} />
            <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Loading expenses...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && expenses.length === 0 && (
          <div style={{ padding: '32px 14px', textAlign: 'center' }}>
            <Receipt size={24} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>No expenses yet</p>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              Track material purchases, tool rentals, and other project costs.
            </p>
          </div>
        )}

        {/* Expense rows */}
        {!isLoading && sorted.length > 0 && (
          <div>
            {sorted.map((expense) => (
              <div
                key={expense.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {/* Date */}
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-3)',
                  width: 52,
                  flexShrink: 0,
                }}>
                  {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>

                {/* Description + vendor */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 12,
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {expense.description}
                  </p>
                  {expense.vendor && (
                    <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
                      {expense.vendor}
                    </p>
                  )}
                </div>

                {/* Category pill */}
                <span style={{
                  fontSize: 8,
                  fontWeight: 700,
                  fontFamily: 'var(--font-cond)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'var(--bg)',
                  color: 'var(--text-3)',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}>
                  {getCategoryLabel(expense.category)}
                </span>

                {/* Amount */}
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text)',
                  flexShrink: 0,
                  width: 64,
                  textAlign: 'right',
                }}>
                  ${expense.amount.toFixed(2)}
                </span>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(expense)}
                  disabled={deleteExpense.isPending}
                  style={{
                    minWidth: 32,
                    minHeight: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-3)',
                    flexShrink: 0,
                    opacity: deleteExpense.isPending ? 0.4 : 1,
                  }}
                  title="Delete expense"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddExpenseSheet
        projectId={projectId}
        tasks={tasks}
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
      />
    </>
  );
}
