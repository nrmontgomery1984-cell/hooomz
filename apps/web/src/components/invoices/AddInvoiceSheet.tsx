'use client';

/**
 * AddInvoiceSheet — Bottom sheet for creating an invoice on a project.
 * Fields: Invoice Type, Due Date, Tax Rate, Notes.
 */

import { useState, useEffect } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useCreateInvoice } from '@/lib/hooks/useInvoices';
import { useToast } from '@/components/ui/Toast';
import type { InvoiceType } from '@hooomz/shared-contracts';

interface AddInvoiceSheetProps {
  projectId: string;
  customerId: string;
  isOpen: boolean;
  onClose: () => void;
}

const INVOICE_TYPE_OPTIONS: { value: InvoiceType; label: string }[] = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'progress', label: 'Progress' },
  { value: 'final', label: 'Final' },
];

export function AddInvoiceSheet({ projectId, customerId, isOpen, onClose }: AddInvoiceSheetProps) {
  const createInvoice = useCreateInvoice();
  const { showToast } = useToast();

  const [invoiceType, setInvoiceType] = useState<InvoiceType>('deposit');
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState('15');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInvoiceType('deposit');
      const defaultDue = new Date();
      defaultDue.setDate(defaultDue.getDate() + 30);
      setDueDate(defaultDue.toISOString().split('T')[0]);
      setTaxRate('15');
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!dueDate) {
      setError('Due date is required.');
      return;
    }
    const parsedRate = parseFloat(taxRate);
    if (isNaN(parsedRate) || parsedRate < 0) {
      setError('Enter a valid tax rate.');
      return;
    }
    try {
      const inv = await createInvoice.mutateAsync({
        projectId,
        customerId,
        invoiceType,
        dueDate,
        taxRate: parsedRate / 100,
        notes: notes.trim() || undefined,
      });
      showToast({ message: `Invoice ${inv.invoiceNumber} created`, variant: 'success', duration: 2000 });
      onClose();
    } catch {
      setError('Failed to create invoice — try again.');
    }
  };

  const labelStyle = {
    fontFamily: 'var(--font-cond)',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#6B7280',
    display: 'block',
    marginBottom: 4,
  };

  const inputStyle = {
    width: '100%',
    minHeight: 44,
    padding: '0 12px',
    fontFamily: 'var(--font)',
    fontSize: 13,
    color: '#111827',
    background: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    outline: 'none',
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="New Invoice">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Type + Due Date row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label>
            <span style={labelStyle}>Invoice Type</span>
            <select
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value as InvoiceType)}
              style={{ ...inputStyle, appearance: 'auto' }}
            >
              {INVOICE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span style={labelStyle}>Due Date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>

        {/* Tax Rate */}
        <label>
          <span style={labelStyle}>Tax Rate (%)</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            max="100"
            value={taxRate}
            onChange={(e) => { setTaxRate(e.target.value); setError(''); }}
            style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
          />
        </label>

        {/* Notes */}
        <label>
          <span style={labelStyle}>Notes</span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. 30% deposit upon signing"
            style={inputStyle}
          />
        </label>

        {error && (
          <span style={{ fontSize: 11, color: '#EF4444' }}>{error}</span>
        )}

        <button
          onClick={handleSubmit}
          disabled={createInvoice.isPending}
          style={{
            width: '100%',
            minHeight: 44,
            fontFamily: 'var(--font-cond)',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: '#FFFFFF',
            background: '#0F766E',
            borderRadius: 8,
            border: 'none',
            cursor: createInvoice.isPending ? 'not-allowed' : 'pointer',
            opacity: createInvoice.isPending ? 0.6 : 1,
          }}
        >
          {createInvoice.isPending ? 'CREATING…' : 'CREATE INVOICE'}
        </button>
      </div>
    </BottomSheet>
  );
}
