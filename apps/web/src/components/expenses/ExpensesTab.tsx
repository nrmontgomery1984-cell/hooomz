'use client';

/**
 * ExpensesTab — Operator expense review tab.
 * Groups expenses by WO, shows category dropdown + approve/flag actions.
 * Matches hooomz-expense-tracker.html artifact (operator view, expenses panel).
 */

import { useMemo } from 'react';
import {
  useJobExpenses,
  useUpdateExpense,
  useVendors,
} from '@/lib/hooks/useExpenseTracker';
import { useServicesContext } from '@/lib/services/ServicesContext';
import type { JobExpense, ExpenseCategory } from '@/lib/repositories/jobExpense.repository';

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: 'materials-unplanned', label: 'Materials — Unplanned' },
  { value: 'consumables', label: 'Consumables' },
  { value: 'fasteners-hardware', label: 'Fasteners & Hardware' },
  { value: 'fuel-travel', label: 'Fuel / Travel' },
  { value: 'delivery-fee', label: 'Delivery Fee' },
  { value: 'dump-disposal', label: 'Dump / Disposal' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'equipment-rental', label: 'Equipment Rental' },
  { value: 'other', label: 'Other' },
];

function fmt(n: number) {
  return '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

interface ExpensesTabProps {
  jobId: string;
}

export function ExpensesTab({ jobId }: ExpensesTabProps) {
  const { data: expenses = [] } = useJobExpenses(jobId);
  const { data: vendors = [] } = useVendors();
  const updateExpense = useUpdateExpense();
  const { services } = useServicesContext();

  const vendorMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const v of vendors) m.set(v.id, v.name);
    return m;
  }, [vendors]);

  // Group by WO
  const woGroups = useMemo(() => {
    const map = new Map<string, JobExpense[]>();
    for (const e of expenses) {
      const key = e.woId || 'unassigned';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).map(([woId, items]) => ({
      woId,
      items: items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      total: items.reduce((s, e) => s + e.amount, 0),
    }));
  }, [expenses]);

  const handleCategoryChange = async (id: string, category: ExpenseCategory) => {
    await updateExpense.mutateAsync({ id, data: { category } });
  };

  const handleApprove = async (e: JobExpense) => {
    await updateExpense.mutateAsync({
      id: e.id,
      data: { status: 'approved', reviewedBy: 'nathan', reviewedAt: new Date().toISOString() },
    });
    // Labs activity event: fire when unplanned material expense is approved
    if (e.category === 'materials-unplanned' && services?.activity) {
      try {
        await services.activity.create({
          event_type: 'unplanned_expense.approved',
          entity_type: 'expense',
          entity_id: e.id,
          project_id: e.jobId,
          summary: `Unplanned material expense approved: $${e.amount.toFixed(2)}`,
          event_data: {
            trade: e.woId,
            vendorId: e.vendorId,
            amount: e.amount,
            crewMemberId: e.crewMemberId,
          },
        });
      } catch {
        // Non-blocking — don't fail the approval if event logging fails
      }
    }
  };

  const handleFlag = async (e: JobExpense) => {
    await updateExpense.mutateAsync({
      id: e.id,
      data: { status: 'flagged', reviewedBy: 'nathan', reviewedAt: new Date().toISOString() },
    });
  };

  if (woGroups.length === 0) {
    return (
      <div className="text-center py-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>No expenses logged for this job yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {woGroups.map((group) => (
        <div key={group.woId}>
          {/* WO Header */}
          <div
            className="flex items-center justify-between px-4 py-2.5 mb-0.5"
            style={{ background: 'var(--dark-nav)' }}
          >
            <div>
              <div className="text-[10px] tracking-[0.08em]" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)' }}>
                {group.woId}
              </div>
            </div>
            <div className="text-[13px]" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)' }}>
              {fmt(group.total)} expenses
            </div>
          </div>

          {/* Expense rows */}
          {group.items.map((exp) => {
            const isUnplanned = exp.category === 'materials-unplanned';
            const isPending = exp.status === 'pending';
            return (
              <div
                key={exp.id}
                className="px-4 py-3.5"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderTop: 'none',
                  borderLeft: isUnplanned ? '3px solid var(--amber)' : '1px solid var(--border)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 120px 100px 180px',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                {/* Col 1: Vendor + meta */}
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>
                    {vendorMap.get(exp.vendorId) || exp.vendorId}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                    {exp.paymentType.replace('-', ' ')} · {fmtDate(exp.createdAt)}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>{exp.crewMemberId}</div>
                </div>

                {/* Col 2: Receipt */}
                <div className="flex items-center gap-1 text-[9px] tracking-[0.06em]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: exp.receiptUploaded ? 'var(--green)' : 'var(--red)' }}
                  />
                  {exp.receiptUploaded ? 'Receipt uploaded' : 'No receipt'}
                </div>

                {/* Col 3: Amount + reimburse */}
                <div className="text-right">
                  <div className="text-[15px] font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}>
                    {fmt(exp.amount)}
                  </div>
                  {exp.reimbursementOwing && !exp.reimbursementPaidAt && (
                    <span
                      className="text-[9px] tracking-[0.06em] px-1.5 py-0.5 mt-0.5 inline-block"
                      style={{ fontFamily: 'var(--font-mono)', background: 'rgba(217,119,6,0.1)', color: 'var(--amber)', border: '1px solid rgba(217,119,6,0.2)' }}
                    >
                      Reimburse
                    </span>
                  )}
                </div>

                {/* Col 4: Actions */}
                <div className="flex flex-col gap-1.5">
                  {isPending ? (
                    <>
                      <select
                        value={exp.category || ''}
                        onChange={(e) => handleCategoryChange(exp.id, e.target.value as ExpenseCategory)}
                        className="w-full h-7 px-2 text-[10px]"
                        style={{ fontFamily: 'var(--font-mono)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--charcoal)', outline: 'none' }}
                      >
                        <option value="">Assign category...</option>
                        {CATEGORY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleApprove(exp)}
                          disabled={updateExpense.isPending}
                          className="flex-1 h-7 text-[9px] font-medium uppercase tracking-[0.06em]"
                          style={{ fontFamily: 'var(--font-mono)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)' }}
                          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--green)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--green)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleFlag(exp)}
                          disabled={updateExpense.isPending}
                          className="flex-1 h-7 text-[9px] font-medium uppercase tracking-[0.06em]"
                          style={{ fontFamily: 'var(--font-mono)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)' }}
                          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--red)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                          Flag
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px]" style={{ fontFamily: 'var(--font-mono)', color: exp.status === 'approved' ? 'var(--green)' : 'var(--red)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: exp.status === 'approved' ? 'var(--green)' : 'var(--red)' }} />
                      {exp.status === 'approved' ? 'Approved' : 'Flagged'}
                      {exp.category && (
                        <span className="ml-1 text-[9px] px-1.5 py-0.5" style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                          {CATEGORY_OPTIONS.find((o) => o.value === exp.category)?.label || exp.category}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
