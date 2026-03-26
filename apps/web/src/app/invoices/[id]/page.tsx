'use client';

/**
 * Invoice Detail Page — Full-page invoice view.
 * Shows header, line items, totals, payment history, actions, PDF download.
 */

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Send, XCircle, DollarSign } from 'lucide-react';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { useInvoice, useUpdateInvoiceStatus } from '@/lib/hooks/useInvoices';
import { usePayments } from '@/lib/hooks/usePayments';
import { useCustomer } from '@/lib/hooks/useCustomersV2';
import { useToast } from '@/components/ui/Toast';
import { RecordPaymentSheet } from '@/components/invoices/RecordPaymentSheet';
import dynamic from 'next/dynamic';
const DownloadInvoicePDF = dynamic(
  () => import('@/components/invoices/InvoicePDF').then(mod => mod.DownloadInvoicePDF),
  { ssr: false }
);
import type { InvoiceStatus, PaymentRecord } from '@hooomz/shared-contracts';
import {
  BrandHeader,
  StatusProgressBar,
  InternalNotes,
} from '@/components/estimates/detail';
import { PartiesCards } from '@/components/quotes/detail';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string }> = {
  draft: { bg: 'var(--surface-2)', text: 'var(--muted)' },
  sent: { bg: 'var(--blue-bg)', text: 'var(--blue)' },
  viewed: { bg: 'var(--blue-bg)', text: 'var(--blue)' },
  partial: { bg: 'var(--yellow-bg)', text: 'var(--yellow)' },
  paid: { bg: 'var(--green-bg)', text: 'var(--green)' },
  overdue: { bg: 'var(--red-bg)', text: 'var(--red)' },
  cancelled: { bg: 'var(--surface-2)', text: 'var(--muted)' },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const { data: payments = [] } = usePayments(invoiceId);
  const { data: customer } = useCustomer(invoice?.customerId ?? '');
  const updateStatus = useUpdateInvoiceStatus();
  const { showToast } = useToast();
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Loading invoice…</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Invoice not found</p>
        <a
          href="/finance/invoices"
          style={{ marginTop: 12, fontSize: 12, color: 'var(--accent)', display: 'inline-block' }}
        >
          Go back
        </a>
      </div>
    );
  }

  const handleSend = async () => {
    try {
      await updateStatus.mutateAsync({ id: invoice.id, action: 'send', projectId: invoice.projectId });
      showToast({ message: 'Invoice marked as sent', variant: 'success', duration: 2000 });
    } catch {
      showToast({ message: 'Failed to update status', variant: 'error', duration: 3000 });
    }
  };

  const handleCancel = async () => {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }
    try {
      await updateStatus.mutateAsync({ id: invoice.id, action: 'cancel', projectId: invoice.projectId });
      showToast({ message: 'Invoice cancelled', variant: 'success', duration: 2000 });
      setConfirmCancel(false);
    } catch {
      showToast({ message: 'Failed to cancel invoice', variant: 'error', duration: 3000 });
      setConfirmCancel(false);
    }
  };

  // ── Derived values ──
  const INVOICE_STEPS = [
    { key: 'draft', label: 'Draft' },
    { key: 'sent', label: 'Sent' },
    { key: 'paid', label: 'Paid' },
  ];

  const invoiceStatusKey = (() => {
    if (invoice.status === 'paid') return 'paid';
    if (['sent', 'viewed', 'partial', 'overdue'].includes(invoice.status)) return 'sent';
    return 'draft';
  })();

  const statusColor = STATUS_COLORS[invoice.status] || STATUS_COLORS.draft;

  const daysUntilDue = Math.ceil((new Date(invoice.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const daysLabel = daysUntilDue > 0
    ? `${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} remaining`
    : daysUntilDue === 0 ? 'Due today'
    : `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''} overdue`;

  return (
    <PageErrorBoundary>
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

        {/* ── Brand Header ── */}
        <BrandHeader docType="Invoice" />

        {/* ── Status Progress Bar ── */}
        <StatusProgressBar steps={INVOICE_STEPS} currentStepKey={invoiceStatusKey} />

        {/* ── Header ── */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="px-6 py-5" style={{ maxWidth: 1200 }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  className="text-[11px] font-medium tracking-[0.06em]"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
                >
                  {invoice.invoiceNumber}
                </div>
                <h1 className="text-xl font-bold mt-0.5 leading-tight" style={{ color: 'var(--charcoal)' }}>
                  {invoice.invoiceType.charAt(0).toUpperCase() + invoice.invoiceType.slice(1)} — {customer ? `${customer.firstName} ${customer.lastName}`.trim() : 'Invoice'}
                </h1>
                <div className="flex gap-5 mt-2 flex-wrap items-center">
                  <div className="text-xs" style={{ color: 'var(--mid)' }}>
                    Issued{' '}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--charcoal)', fontWeight: 500 }}>
                      {formatDate(invoice.sentAt || invoice.dueDate)}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--mid)' }}>
                    Due{' '}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--charcoal)', fontWeight: 500 }}>
                      {formatDate(invoice.dueDate)}
                    </span>
                  </div>
                  <span
                    className="inline-flex items-center gap-[5px] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.06em]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      background: statusColor.bg,
                      color: statusColor.text,
                    }}
                  >
                    <span className="w-[5px] h-[5px] rounded-full" style={{ background: statusColor.text }} />
                    {invoice.status}
                  </span>
                </div>
              </div>
              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                {invoice.status === 'draft' && (
                  <button
                    onClick={handleSend}
                    disabled={updateStatus.isPending}
                    className="text-[11px] font-medium tracking-[0.04em] px-4 py-2 flex items-center gap-1.5 text-white"
                    style={{ fontFamily: 'var(--font-mono)', background: 'var(--blue)', border: 'none' }}
                  >
                    <Send size={12} /> Mark Sent
                  </button>
                )}
                {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                  <button
                    onClick={() => setShowPaymentSheet(true)}
                    className="text-[11px] font-medium tracking-[0.04em] px-4 py-2 flex items-center gap-1.5 text-white"
                    style={{ fontFamily: 'var(--font-mono)', background: 'var(--green)', border: 'none' }}
                  >
                    <DollarSign size={12} /> Record Payment
                  </button>
                )}
                <DownloadInvoicePDF
                  invoice={invoice}
                  payments={payments}
                  customerName={customer ? `${customer.firstName} ${customer.lastName}`.trim() : undefined}
                  customerAddress={customer ? [customer.propertyAddress, customer.propertyCity, customer.propertyProvince, customer.propertyPostalCode].filter(Boolean).join(', ') : undefined}
                />
                {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                  <button
                    onClick={handleCancel}
                    disabled={updateStatus.isPending}
                    className="text-[11px] font-medium tracking-[0.04em] px-4 py-2 flex items-center gap-1.5"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      border: confirmCancel ? 'none' : '1px solid var(--red-bg, rgba(220,38,38,0.15))',
                      background: confirmCancel ? 'var(--red)' : 'none',
                      color: confirmCancel ? '#fff' : 'var(--red)',
                    }}
                  >
                    <XCircle size={12} /> {confirmCancel ? 'Confirm' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Content Grid ── */}
        <div
          className="grid gap-4 px-6 py-4"
          style={{ gridTemplateColumns: '1fr 300px', maxWidth: 1200 }}
        >
          {/* ── Left Column ── */}
          <div>
            {/* Parties */}
            <PartiesCards
              preparedFor={customer ? {
                name: `${customer.firstName} ${customer.lastName}`.trim(),
                address: [customer.propertyAddress, customer.propertyCity, customer.propertyProvince].filter(Boolean).join(', ') || undefined,
                phone: customer.phone,
                email: customer.email,
              } : undefined}
              preparedBy={{
                name: 'Hooomz Interiors',
                company: 'Nathan Montgomery',
                address: 'Moncton, NB',
                email: 'nathan@hooomz.ca',
              }}
            />

            {/* Amount Due Block */}
            <div
              className="flex items-center justify-between px-6 py-5 mb-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--charcoal)' }}
            >
              <div>
                <div className="text-[9px] font-medium uppercase tracking-[0.12em] mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                  Amount Due
                </div>
                <div className="text-[32px] font-medium tracking-tight" style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}>
                  {formatCurrency(invoice.balanceDue)}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--mid)' }}>
                  Total{' '}
                  <strong style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--charcoal)' }}>
                    {formatCurrency(invoice.totalAmount)}
                  </strong>
                  {invoice.amountPaid > 0 && (
                    <> &middot; Paid <span style={{ color: 'var(--green)' }}>{formatCurrency(invoice.amountPaid)}</span></>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-medium uppercase tracking-[0.1em] mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                  Due Date
                </div>
                <div className="text-base font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}>
                  {new Date(invoice.dueDate).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-[10px] mt-1" style={{ fontFamily: 'var(--font-mono)', color: daysUntilDue < 0 ? 'var(--red)' : 'var(--amber, var(--yellow))' }}>
                  {daysLabel}
                </div>
              </div>
            </div>

            {/* Line Items */}
            {invoice.lineItems.length > 0 && (
              <div className="mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-sm font-bold" style={{ color: 'var(--charcoal)' }}>
                    Line Items
                  </span>
                  <span className="text-[10px] tracking-[0.04em]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                    {invoice.lineItems.length} item{invoice.lineItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th className="text-left text-[9px] font-medium uppercase tracking-[0.1em] px-4 py-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', background: 'var(--bg)', borderBottom: '1px solid var(--border)', width: '45%' }}>Description</th>
                      <th className="text-right text-[9px] font-medium uppercase tracking-[0.1em] px-4 py-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>Qty</th>
                      <th className="text-right text-[9px] font-medium uppercase tracking-[0.1em] px-4 py-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>Rate</th>
                      <th className="text-right text-[9px] font-medium uppercase tracking-[0.1em] px-4 py-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map((li, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5 text-[13px]" style={{ color: 'var(--charcoal)', fontWeight: 500, borderBottom: i < invoice.lineItems.length - 1 ? '1px solid var(--border)' : 'none' }}>{li.description}</td>
                        <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap" style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)', borderBottom: i < invoice.lineItems.length - 1 ? '1px solid var(--border)' : 'none' }}>{li.quantity}</td>
                        <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap" style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)', borderBottom: i < invoice.lineItems.length - 1 ? '1px solid var(--border)' : 'none' }}>{formatCurrency(li.unitCost)}</td>
                        <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap" style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)', fontWeight: 600, borderBottom: i < invoice.lineItems.length - 1 ? '1px solid var(--border)' : 'none' }}>{formatCurrency(li.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Totals footer */}
                <div className="flex justify-end items-center gap-6 px-4 py-2.5" style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] uppercase tracking-[0.06em]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Subtotal</span>
                    <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] uppercase tracking-[0.06em]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Tax ({(invoice.taxRate * 100).toFixed(0)}%)</span>
                    <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}>{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] uppercase tracking-[0.06em] font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}>Total</span>
                    <span className="text-base font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}>{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Methods */}
            <div className="mb-3 px-4 py-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--green)' }}>
              <div className="text-[9px] font-medium uppercase tracking-[0.12em] mb-2.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                Payment Methods
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex gap-3 p-2.5" style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}>
                  <span className="text-base w-6 text-center flex-shrink-0" style={{ color: 'var(--mid)' }}>&#9745;</span>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: 'var(--charcoal)' }}>E-Transfer</div>
                    <div className="text-[11px] leading-relaxed" style={{ fontFamily: 'var(--font-mono)', color: 'var(--mid)' }}>Send to: payments@hooomz.ca<br />Auto-deposit enabled</div>
                  </div>
                </div>
                <div className="flex gap-3 p-2.5" style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}>
                  <span className="text-base w-6 text-center flex-shrink-0" style={{ color: 'var(--mid)' }}>&#9744;</span>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: 'var(--charcoal)' }}>Cheque</div>
                    <div className="text-[11px] leading-relaxed" style={{ fontFamily: 'var(--font-mono)', color: 'var(--mid)' }}>Payable to: Hooomz Interiors Inc.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Internal Notes */}
            <InternalNotes
              notes={invoice.notes || ''}
            />

            {/* Payment History */}
            {payments.length > 0 && (
              <div className="mb-3 px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="text-[9px] font-medium uppercase tracking-[0.12em] mb-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                  Payment History
                </div>
                {payments.map((p: PaymentRecord, i: number) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2.5 py-2"
                    style={{ borderBottom: i < payments.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 11 }}
                  >
                    <span className="font-semibold w-20" style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>
                      {formatCurrency(p.amount)}
                    </span>
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.06em] px-1.5 py-0.5"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', background: 'var(--surface-2, var(--bg))' }}
                    >
                      {p.method}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{formatDate(p.date)}</span>
                    {p.reference && (
                      <span className="text-[9px] ml-auto" style={{ color: 'var(--muted)' }}>#{p.reference}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right Column ── */}
          <div>
            {/* Invoice Details */}
            <div className="mb-3 px-4 py-3.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-[9px] font-medium uppercase tracking-[0.12em] mb-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                Invoice Details
              </div>
              {[
                { label: 'Invoice #', value: invoice.invoiceNumber },
                { label: 'Type', value: invoice.invoiceType.charAt(0).toUpperCase() + invoice.invoiceType.slice(1) },
                { label: 'Due', value: formatDate(invoice.dueDate) },
                { label: 'Status', value: invoice.status },
              ].map((row, i) => (
                <div key={i} className="flex justify-between py-1">
                  <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{row.label}</span>
                  <span className="text-[11px] font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Job Payment Progress */}
            <div className="mb-3 px-4 py-3.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-[9px] font-medium uppercase tracking-[0.12em] mb-2.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                Job Payment Progress
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full mb-2" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full"
                  style={{
                    background: 'var(--green)',
                    width: invoice.totalAmount > 0 ? `${Math.min(100, (invoice.amountPaid / invoice.totalAmount) * 100)}%` : '0%',
                  }}
                />
              </div>
              <div className="flex justify-between mb-3">
                <div>
                  <div className="text-[10px]" style={{ color: 'var(--muted)' }}>Paid</div>
                  <div className="text-[11px] font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}>{formatCurrency(invoice.amountPaid)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px]" style={{ color: 'var(--muted)' }}>Total</div>
                  <div className="text-[11px] font-medium" style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)' }}>{formatCurrency(invoice.totalAmount)}</div>
                </div>
              </div>
              <div className="flex justify-between text-[11px]">
                <span style={{ color: 'var(--mid)' }}>Balance Due</span>
                <span className="font-medium" style={{ fontFamily: 'var(--font-mono)', color: invoice.balanceDue > 0 ? 'var(--red)' : 'var(--green)' }}>
                  {formatCurrency(invoice.balanceDue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Record Payment Sheet ── */}
        {showPaymentSheet && (
          <RecordPaymentSheet
            invoice={invoice}
            isOpen={showPaymentSheet}
            onClose={() => setShowPaymentSheet(false)}
          />
        )}
      </div>
    </PageErrorBoundary>
  );
}
