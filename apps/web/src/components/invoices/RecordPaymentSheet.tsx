'use client';

/**
 * RecordPaymentSheet — Bottom sheet for recording a payment against an invoice.
 * Fields: Amount (pre-fill balanceDue), Method, Date, Reference, Notes.
 */

import { useState, useEffect } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useRecordPayment } from '@/lib/hooks/usePayments';
import { useToast } from '@/components/ui/Toast';
import type { PaymentMethod, InvoiceRecord } from '@hooomz/shared-contracts';

interface RecordPaymentSheetProps {
  invoice: InvoiceRecord;
  isOpen: boolean;
  onClose: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'etransfer', label: 'E-Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit', label: 'Credit Card' },
];

export function RecordPaymentSheet({ invoice, isOpen, onClose }: RecordPaymentSheetProps) {
  const recordPayment = useRecordPayment();
  const { showToast } = useToast();

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('etransfer');
  const [date, setDate] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount(invoice.balanceDue.toFixed(2));
      setMethod('etransfer');
      setDate(new Date().toISOString().split('T')[0]);
      setReference('');
      setNotes('');
      setError('');
    }
  }, [isOpen, invoice.balanceDue]);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    if (parsedAmount > invoice.balanceDue) {
      setError(`Amount exceeds balance due ($${invoice.balanceDue.toFixed(2)}).`);
      return;
    }
    try {
      await recordPayment.mutateAsync({
        invoiceId: invoice.id,
        projectId: invoice.projectId,
        amount: parsedAmount,
        method,
        date,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      showToast({ message: `Payment of $${parsedAmount.toFixed(2)} recorded`, variant: 'success', duration: 2000 });
      onClose();
    } catch {
      setError('Failed to record payment — try again.');
    }
  };

  const labelStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'var(--muted)',
    display: 'block',
    marginBottom: 4,
  };

  const inputStyle = {
    width: '100%',
    minHeight: 44,
    padding: '0 12px',
    fontFamily: 'var(--font)',
    fontSize: 13,
    color: 'var(--charcoal)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    outline: 'none',
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Record Payment">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Amount + Method row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label>
            <span style={labelStyle}>Amount ($)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
              autoFocus
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
            />
          </label>
          <label>
            <span style={labelStyle}>Method</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              style={{ ...inputStyle, appearance: 'auto' }}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Date + Reference row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label>
            <span style={labelStyle}>Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label>
            <span style={labelStyle}>Reference #</span>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. CHQ-1234"
              style={inputStyle}
            />
          </label>
        </div>

        {/* Notes */}
        <label>
          <span style={labelStyle}>Notes</span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
            style={inputStyle}
          />
        </label>

        {error && (
          <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>
        )}

        <button
          onClick={handleSubmit}
          disabled={recordPayment.isPending}
          style={{
            width: '100%',
            minHeight: 44,
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: '#fff',
            background: 'var(--accent)',
            borderRadius: 8,
            border: 'none',
            cursor: recordPayment.isPending ? 'not-allowed' : 'pointer',
            opacity: recordPayment.isPending ? 0.6 : 1,
          }}
        >
          {recordPayment.isPending ? 'RECORDING…' : 'RECORD PAYMENT'}
        </button>
      </div>
    </BottomSheet>
  );
}
