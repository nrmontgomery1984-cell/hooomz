'use client';

/**
 * ExpensesTab — Operator expense review tab.
 * Groups expenses by WO, shows category dropdown + approve/flag actions.
 * Matches hooomz-expense-tracker.html artifact (operator view, expenses panel).
 */

import { useMemo, useState } from 'react';
import {
  useJobExpenses,
  useUpdateExpense,
  useCreateExpense,
  useVendors,
} from '@/lib/hooks/useExpenseTracker';
import { useServicesContext } from '@/lib/services/ServicesContext';
import type { JobExpense, ExpenseCategory, PaymentType } from '@/lib/repositories/jobExpense.repository';

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
  const createExpense = useCreateExpense();
  const { services } = useServicesContext();

  // Log Expense form state
  const [showCreate, setShowCreate] = useState(false);
  const [newVendorId, setNewVendorId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newPaymentType, setNewPaymentType] = useState<PaymentType>('company-card');
  const [newCategory, setNewCategory] = useState<ExpenseCategory | ''>('');
  const [newReceipt, setNewReceipt] = useState(false);
  const [newCrewMemberId, setNewCrewMemberId] = useState('');
  const [newWoId, setNewWoId] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const resetForm = () => {
    setNewVendorId('');
    setNewAmount('');
    setNewPaymentType('company-card');
    setNewCategory('');
    setNewReceipt(false);
    setNewCrewMemberId('');
    setNewWoId('');
    setNewNotes('');
  };

  const handleCreate = async () => {
    if (!newVendorId || !newAmount) return;
    await createExpense.mutateAsync({
      jobId,
      woId: newWoId,
      vendorId: newVendorId,
      amount: parseFloat(newAmount),
      paymentType: newPaymentType,
      receiptUploaded: newReceipt,
      crewMemberId: newCrewMemberId,
      ...(newCategory ? { category: newCategory } : {}),
      ...(newNotes ? { notes: newNotes } : {}),
    });
    resetForm();
    setShowCreate(false);
  };

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
      <div className="space-y-4">
        <div className="text-center py-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>No expenses logged for this job yet.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-2 text-[10px] font-medium uppercase tracking-[0.08em] px-4 py-2"
            style={{ fontFamily: 'var(--font-mono)', border: '1px dashed var(--border)', background: 'transparent', color: 'var(--muted)' }}
          >
            + Log Expense
          </button>
        </div>
        {showCreate && <LogExpenseModal />}
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

      {/* Log Expense Button */}
      <button
        onClick={() => setShowCreate(true)}
        className="w-full flex items-center gap-2 px-4 py-3 text-[10px] font-medium uppercase tracking-[0.08em]"
        style={{ fontFamily: 'var(--font-mono)', border: '1px dashed var(--border)', background: 'transparent', color: 'var(--muted)' }}
      >
        + Log Expense
      </button>

      {showCreate && <LogExpenseModal />}
    </div>
  );

  function LogExpenseModal() {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
      >
        <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto p-5" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold" style={{ color: 'var(--charcoal)' }}>Log Expense</span>
            <button onClick={() => setShowCreate(false)} className="text-sm" style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>✕</button>
          </div>
          <div className="space-y-3">
            {/* Vendor */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-[0.08em] mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Vendor</label>
              <select value={newVendorId} onChange={(e) => setNewVendorId(e.target.value)} className="w-full h-10 px-3 text-sm" style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--charcoal)', outline: 'none' }}>
                <option value="">Select vendor...</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-[0.08em] mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Amount (CAD)</label>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full h-10 px-3 text-sm text-right"
                style={{ fontFamily: 'var(--font-mono)', background: '#fff', border: '1px solid var(--border)', color: 'var(--charcoal)', outline: 'none' }}
              />
            </div>

            {/* Payment Type */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-[0.08em] mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Payment Type</label>
              <div className="flex gap-2">
                {([
                  { value: 'company-card' as const, label: 'Company Card' },
                  { value: 'personal' as const, label: 'Personal' },
                  { value: 'cash' as const, label: 'Cash' },
                ]).map((pt) => (
                  <button
                    key={pt.value}
                    onClick={() => setNewPaymentType(pt.value)}
                    className="flex-1 h-10 text-[10px] font-medium uppercase tracking-[0.04em]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      background: newPaymentType === pt.value ? 'var(--charcoal)' : 'var(--surface)',
                      color: newPaymentType === pt.value ? '#fff' : 'var(--muted)',
                      border: `1px solid ${newPaymentType === pt.value ? 'var(--charcoal)' : 'var(--border)'}`,
                    }}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-[0.08em] mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Category (optional)</label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as ExpenseCategory | '')} className="w-full h-10 px-3 text-sm" style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--charcoal)', outline: 'none' }}>
                <option value="">Assign later...</option>
                {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Work Order */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-[0.08em] mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Work Order ID</label>
              <input
                type="text"
                value={newWoId}
                onChange={(e) => setNewWoId(e.target.value)}
                placeholder="e.g. WO-2026-001"
                className="w-full h-10 px-3 text-sm"
                style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--charcoal)', outline: 'none' }}
              />
            </div>

            {/* Crew Member */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-[0.08em] mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Crew Member</label>
              <input
                type="text"
                value={newCrewMemberId}
                onChange={(e) => setNewCrewMemberId(e.target.value)}
                placeholder="Name or ID"
                className="w-full h-10 px-3 text-sm"
                style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--charcoal)', outline: 'none' }}
              />
            </div>

            {/* Receipt */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setNewReceipt(!newReceipt)}
                className="w-5 h-5 flex items-center justify-center text-[10px]"
                style={{
                  border: '1px solid var(--border)',
                  background: newReceipt ? 'var(--charcoal)' : '#fff',
                  color: newReceipt ? '#fff' : 'transparent',
                }}
              >
                ✓
              </button>
              <span className="text-[10px] font-medium uppercase tracking-[0.08em]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Receipt Uploaded</span>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-[0.08em] mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Notes (optional)</label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Additional details..."
                rows={2}
                className="w-full px-3 py-2 text-sm"
                style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--charcoal)', outline: 'none', resize: 'vertical' }}
              />
            </div>

            {/* Personal payment reimbursement note */}
            {newPaymentType === 'personal' && (
              <div
                className="flex items-center gap-2 px-3 py-2 text-[10px]"
                style={{ fontFamily: 'var(--font-mono)', background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)', color: 'var(--amber)' }}
              >
                ⚠ Personal expenses are automatically flagged for reimbursement
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 h-10 text-[11px] font-medium" style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}>Cancel</button>
              <button
                onClick={handleCreate}
                disabled={!newVendorId || !newAmount || createExpense.isPending}
                className="flex-1 h-10 text-[11px] font-medium text-white"
                style={{ fontFamily: 'var(--font-mono)', background: 'var(--charcoal)', border: 'none', opacity: newVendorId && newAmount ? 1 : 0.5 }}
              >
                {createExpense.isPending ? 'Logging...' : 'Log Expense'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
