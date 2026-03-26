'use client';

/**
 * ReimbursementsTab — List of expenses where reimbursementOwing=true and not paid.
 * Matches hooomz-expense-tracker.html artifact (operator view, reimburse panel).
 */

import { useMemo } from 'react';
import {
  useJobExpenses,
  useUpdateExpense,
  useVendors,
} from '@/lib/hooks/useExpenseTracker';

function fmt(n: number) {
  return '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

interface ReimbursementsTabProps {
  jobId: string;
}

export function ReimbursementsTab({ jobId }: ReimbursementsTabProps) {
  const { data: expenses = [] } = useJobExpenses(jobId);
  const { data: vendors = [] } = useVendors();
  const updateExpense = useUpdateExpense();

  const vendorMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const v of vendors) m.set(v.id, v.name);
    return m;
  }, [vendors]);

  const owing = expenses.filter((e) => e.reimbursementOwing && !e.reimbursementPaidAt);

  const handleMarkPaid = async (id: string) => {
    await updateExpense.mutateAsync({
      id,
      data: { reimbursementPaidAt: new Date().toISOString() },
    });
  };

  return (
    <div>
      {owing.length > 0 ? (
        <div className="flex flex-col gap-2">
          {owing.map((exp) => (
            <div
              key={exp.id}
              className="flex items-center justify-between gap-4 px-4 py-3.5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--amber)' }}
            >
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>
                  {exp.crewMemberId}
                </div>
                <div className="text-[10px] mt-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                  {vendorMap.get(exp.vendorId) || exp.vendorId} · {fmtDate(exp.createdAt)} · Personal payment
                  {exp.receiptUploaded ? ' · Receipt uploaded' : ''}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>
                  {fmt(exp.amount)}
                </div>
              </div>
              <button
                onClick={() => handleMarkPaid(exp.id)}
                disabled={updateExpense.isPending}
                className="text-[10px] font-medium uppercase tracking-[0.06em] px-3.5 py-1.5 flex-shrink-0"
                style={{
                  fontFamily: 'var(--font-mono)',
                  border: '1px solid var(--amber)',
                  background: 'transparent',
                  color: 'var(--amber)',
                  whiteSpace: 'nowrap',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'var(--amber)'; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--amber)'; }}
              >
                Mark Paid
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>No outstanding reimbursements.</p>
        </div>
      )}

      {/* Policy note */}
      <div className="mt-6 px-4 py-3.5 text-xs leading-relaxed" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
        <strong className="text-sm" style={{ color: 'var(--charcoal)' }}>Reimbursement policy</strong><br />
        Personal payments are flagged automatically when crew log an expense as &ldquo;Personal.&rdquo;
        Mark as paid once settled — this creates an audit trail and removes the item from the owing list.
        Reimbursements are tracked per job and roll up to the Finance dashboard.
      </div>
    </div>
  );
}
