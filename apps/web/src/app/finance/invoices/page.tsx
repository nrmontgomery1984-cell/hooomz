'use client';

/**
 * Invoices Management Page — /finance/invoices
 *
 * Full invoice list with aging summary cards, status filter tabs,
 * and clickable rows that navigate to /invoices/{id}.
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react';
import { SECTION_COLORS } from '@/lib/viewmode';
import { useAllInvoices } from '@/lib/hooks/useInvoices';
import { useInvoiceAging } from '@/lib/hooks/useInvoiceAging';
import { useLocalProjects } from '@/lib/hooks/useLocalData';
import type { InvoiceRecord, InvoiceStatus } from '@hooomz/shared-contracts';

const COLOR = SECTION_COLORS.finance;

// ============================================================================
// Constants
// ============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string }> = {
  draft: { bg: '#F3F4F6', text: '#6B7280' },
  sent: { bg: '#DBEAFE', text: '#2563EB' },
  viewed: { bg: '#DBEAFE', text: '#2563EB' },
  partial: { bg: '#FEF3C7', text: '#D97706' },
  paid: { bg: '#D1FAE5', text: '#059669' },
  overdue: { bg: '#FEE2E2', text: '#DC2626' },
  cancelled: { bg: '#F3F4F6', text: '#9CA3AF' },
};

const TYPE_LABELS: Record<string, string> = {
  deposit: 'DEP',
  progress: 'PROG',
  final: 'FIN',
};

type FilterKey = 'all' | InvoiceStatus;

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'partial', label: 'Partial' },
  { key: 'paid', label: 'Paid' },
  { key: 'cancelled', label: 'Cancelled' },
];

// ============================================================================
// Page
// ============================================================================

export default function InvoicesPage() {
  const router = useRouter();
  const { data: allInvoices, isLoading } = useAllInvoices();
  const aging = useInvoiceAging(allInvoices);
  const { data: projectsResult } = useLocalProjects();
  const [filter, setFilter] = useState<FilterKey>('all');

  // Build project name lookup
  const projectNameMap = useMemo(() => {
    const map = new Map<string, string>();
    const projects = projectsResult?.projects;
    if (Array.isArray(projects)) {
      for (const p of projects) {
        if (p.id && p.name) map.set(p.id, p.name);
      }
    }
    return map;
  }, [projectsResult]);

  // Filter invoices by status
  const filteredInvoices = useMemo(() => {
    if (!allInvoices) return [];
    if (filter === 'all') return allInvoices;
    return allInvoices.filter((inv: InvoiceRecord) => inv.status === filter);
  }, [allInvoices, filter]);

  // Sort: overdue first, then by due date ascending
  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [filteredInvoices]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const totalCount = allInvoices?.length ?? 0;

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => router.push('/finance')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, minWidth: 28, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-cond)', letterSpacing: '0.02em' }}>
                  Invoices
                </h1>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                  {totalCount} invoice{totalCount !== 1 ? 's' : ''} &middot; {formatCurrency(aging.totalOutstanding)} outstanding
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

          {/* Aging Summary Cards */}
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            <AgingCard label="Current" amount={aging.current} color="#10B981" />
            <AgingCard label="1-30 Days" amount={aging.days30} color="#F59E0B" />
            <AgingCard label="31-60 Days" amount={aging.days60} color="#F97316" />
            <AgingCard label="61+ Days" amount={aging.days90plus} color="#EF4444" />
          </div>

          {/* Status Filter Tabs */}
          <div style={{ marginTop: 16, display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {FILTER_TABS.map((tab) => {
              const isActive = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 99,
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: 'var(--font-cond)',
                    letterSpacing: '0.04em',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    background: isActive ? `${COLOR}18` : 'var(--surface-1)',
                    color: isActive ? COLOR : 'var(--text-3)',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Invoice List */}
          <div style={{ marginTop: 12 }}>
            {sortedInvoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                <FileText size={24} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                  {filter === 'all' ? 'No invoices yet' : `No ${filter} invoices`}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                  {filter === 'all'
                    ? 'Create invoices from project detail pages'
                    : 'Try a different filter'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sortedInvoices.map((inv: InvoiceRecord) => {
                  const statusColor = STATUS_COLORS[inv.status] || STATUS_COLORS.draft;
                  const projectName = projectNameMap.get(inv.projectId) || 'Unknown project';
                  const dueDate = new Date(inv.dueDate);
                  const dueDateStr = dueDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });

                  return (
                    <button
                      key={inv.id}
                      onClick={() => router.push(`/invoices/${inv.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 14px',
                        borderRadius: 'var(--radius)',
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-card)',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                      }}
                    >
                      {/* Invoice number + project */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--text)',
                          }}>
                            {inv.invoiceNumber}
                          </span>
                          {/* Type pill */}
                          <span style={{
                            fontFamily: 'var(--font-cond)',
                            fontSize: 8,
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            color: 'var(--text-3)',
                            background: 'var(--surface-2)',
                            padding: '1px 5px',
                            borderRadius: 3,
                          }}>
                            {TYPE_LABELS[inv.invoiceType] || inv.invoiceType.toUpperCase()}
                          </span>
                          {/* Status badge */}
                          <span style={{
                            fontFamily: 'var(--font-cond)',
                            fontSize: 8,
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: statusColor.text,
                            background: statusColor.bg,
                            padding: '1px 5px',
                            borderRadius: 3,
                          }}>
                            {inv.status}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 10,
                          color: 'var(--text-3)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                          marginTop: 2,
                        }}>
                          {projectName}
                        </span>
                      </div>

                      {/* Amounts + due date */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          fontWeight: 700,
                          color: inv.status === 'paid' ? '#059669' : inv.status === 'overdue' ? '#DC2626' : 'var(--text)',
                          display: 'block',
                        }}>
                          {formatCurrency(inv.status === 'paid' ? inv.totalAmount : inv.balanceDue)}
                        </span>
                        <span style={{ fontSize: 9, color: 'var(--text-3)' }}>
                          {inv.status === 'paid' ? 'paid' : `due ${dueDateStr}`}
                        </span>
                      </div>

                      <ChevronRight size={14} style={{ color: 'var(--border-strong, #d1d5db)', flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function AgingCard({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <div style={{
      padding: '10px 8px',
      borderRadius: 'var(--radius)',
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-card)',
      textAlign: 'center',
    }}>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 16,
        fontWeight: 700,
        color: amount > 0 ? color : 'var(--text-3)',
        lineHeight: 1,
      }}>
        {amount > 0 ? formatCurrency(amount) : '$0'}
      </p>
      <p style={{
        fontFamily: 'var(--font-cond)',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-3)',
        marginTop: 6,
      }}>
        {label}
      </p>
    </div>
  );
}
