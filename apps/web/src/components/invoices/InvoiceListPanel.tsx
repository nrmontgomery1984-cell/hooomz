'use client';

/**
 * InvoiceListPanel — Compact invoice summary for project detail page.
 *
 * Shows total outstanding, invoice count, each invoice as a row
 * with number, type pill, status badge, balance, due date.
 * Click → navigate to /invoices/{id}.
 * "+ New" button opens AddInvoiceSheet.
 */

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useInvoices } from '@/lib/hooks/useInvoices';
import { AddInvoiceSheet } from './AddInvoiceSheet';
import { PanelSection } from '@/components/ui/PanelSection';
import type { InvoiceRecord, InvoiceStatus } from '@hooomz/shared-contracts';

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

interface InvoiceListPanelProps {
  projectId: string;
  customerId: string;
}

export function InvoiceListPanel({ projectId, customerId }: InvoiceListPanelProps) {
  const { data: invoices = [] } = useInvoices(projectId);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const router = useRouter();

  const totalOutstanding = useMemo(() => {
    return invoices
      .filter((inv: InvoiceRecord) => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum: number, inv: InvoiceRecord) => sum + inv.balanceDue, 0);
  }, [invoices]);

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
      <Plus size={9} /> New
    </button>
  );

  return (
    <>
      <PanelSection label="Invoices" action={action}>
        {invoices.length === 0 ? (
          <div style={{ padding: '6px 12px' }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>No invoices yet</span>
          </div>
        ) : (
          <>
            {/* Total outstanding */}
            <div style={{ padding: '4px 12px 6px', display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                {formatCurrency(totalOutstanding)}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                outstanding
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>
                {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'}
              </span>
            </div>

            {/* Invoice rows */}
            {invoices.map((inv: InvoiceRecord) => {
              const statusColor = STATUS_COLORS[inv.status] || STATUS_COLORS.draft;
              return (
                <div
                  key={inv.id}
                  onClick={() => router.push(`/invoices/${inv.id}`)}
                  className="hover-surface"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    cursor: 'pointer',
                    borderRadius: 6,
                  }}
                >
                  {/* Invoice number */}
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--text-2)',
                    width: 80,
                    flexShrink: 0,
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
                    flexShrink: 0,
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
                    flexShrink: 0,
                  }}>
                    {inv.status}
                  </span>

                  {/* Spacer */}
                  <span style={{ flex: 1 }} />

                  {/* Balance */}
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: inv.status === 'paid' ? '#059669' : 'var(--text)',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {formatCurrency(inv.status === 'paid' ? inv.totalAmount : inv.balanceDue)}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </PanelSection>

      <AddInvoiceSheet
        projectId={projectId}
        customerId={customerId}
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
      />
    </>
  );
}
