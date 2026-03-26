'use client';

/**
 * Operator Expense Review — /production/jobs/[id]/expenses
 * 3 tabs: Expenses, Purchase Orders, Reimbursements.
 * Summary cards + insight banner.
 */

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  useJobExpenses,
  useJobPurchaseOrders,
  useVendors,
} from '@/lib/hooks/useExpenseTracker';
import { ExpensesTab } from '@/components/expenses/ExpensesTab';
import { PurchaseOrdersTab } from '@/components/expenses/PurchaseOrdersTab';
import { ReimbursementsTab } from '@/components/expenses/ReimbursementsTab';

function fmt(n: number) {
  return '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type TabKey = 'expenses' | 'pos' | 'reimburse';

export default function JobExpensesPage() {
  const params = useParams();
  const jobId = params.id as string;

  const { data: expenses = [] } = useJobExpenses(jobId);
  const { data: pos = [] } = useJobPurchaseOrders(jobId);
  useVendors(); // warm cache

  const [activeTab, setActiveTab] = useState<TabKey>('expenses');

  // Summary counts
  const pendingCount = expenses.filter((e) => e.status === 'pending').length;
  const reimbOwing = expenses.filter((e) => e.reimbursementOwing && !e.reimbursementPaidAt);
  const reimbTotal = reimbOwing.reduce((s, e) => s + e.amount, 0);
  const approvedTotal = expenses.filter((e) => e.status === 'approved').reduce((s, e) => s + e.amount, 0);
  const retroPending = pos.filter((po) => po.status === 'retroactive' && po.approvalStatus === 'pending').length;

  // Insight: unplanned material count
  const unplannedMaterials = expenses.filter((e) => e.category === 'materials-unplanned');
  const unplannedTotal = unplannedMaterials.reduce((s, e) => s + e.amount, 0);

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'expenses', label: 'Expenses', count: pendingCount || undefined },
    { key: 'pos', label: 'Purchase Orders', count: retroPending || undefined },
    { key: 'reimburse', label: 'Reimbursements', count: reimbOwing.length || undefined },
  ];

  return (
    <PageErrorBoundary>
      <div className="min-h-screen pb-20" style={{ background: 'var(--bg)' }}>
        <div className="max-w-[1000px] mx-auto px-8 pt-8">

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-3 mb-8" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <SummaryCard label="Pending Review" value={String(pendingCount)} sub="expenses awaiting category" accent="var(--amber)" />
            <SummaryCard label="Reimbursements Owing" value={fmt(reimbTotal)} sub={`${reimbOwing.length} crew member${reimbOwing.length !== 1 ? 's' : ''}`} accent="var(--red)" />
            <SummaryCard label="Total Approved Spend" value={fmt(approvedTotal)} sub="this job" accent="var(--blue)" />
            <SummaryCard label="POs This Job" value={String(pos.length)} sub={retroPending > 0 ? `${retroPending} retroactive pending` : 'all approved'} accent="var(--green)" />
          </div>

          {/* Insight Banner */}
          {unplannedMaterials.length >= 2 && (
            <div
              className="flex items-start gap-2.5 px-4 py-3 mb-5 text-xs leading-relaxed"
              style={{
                background: 'rgba(217,119,6,0.06)',
                border: '1px solid rgba(217,119,6,0.2)',
                borderLeft: '3px solid var(--amber)',
                color: 'var(--warm-mid, var(--charcoal))',
              }}
            >
              <span
                className="text-[9px] font-medium uppercase tracking-[0.1em] flex-shrink-0 mt-0.5"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}
              >
                ⚠ Insight
              </span>
              <span>
                {unplannedMaterials.length} unplanned material purchases on this job totalling {fmt(unplannedTotal)}.
                Consider reviewing the estimate template for this trade.
              </span>
            </div>
          )}

          {/* Tab Nav */}
          <div className="flex mb-6" style={{ borderBottom: '1px solid var(--border)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase tracking-[0.06em] -mb-px"
                style={{
                  fontFamily: 'var(--font-mono)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab.key ? 'var(--charcoal)' : 'transparent'}`,
                  color: activeTab === tab.key ? 'var(--charcoal)' : 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 text-white"
                    style={{
                      background: activeTab === tab.key ? 'var(--charcoal)' : 'var(--amber)',
                      borderRadius: 2,
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'expenses' && <ExpensesTab jobId={jobId} />}
          {activeTab === 'pos' && <PurchaseOrdersTab jobId={jobId} />}
          {activeTab === 'reimburse' && <ReimbursementsTab jobId={jobId} />}
        </div>
      </div>
    </PageErrorBoundary>
  );
}

// ── Summary Card ──
function SummaryCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="px-5 py-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `3px solid ${accent}` }}>
      <div className="text-[9px] font-medium uppercase tracking-[0.1em] mb-1.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
        {label}
      </div>
      <div className="text-2xl font-medium leading-none" style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}>
        {value}
      </div>
      <div className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>{sub}</div>
    </div>
  );
}
