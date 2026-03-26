'use client';

/**
 * CrewExpenseSheet — Bottom sheet for crew to log job expenses from the field.
 * 5 fields: Amount, Vendor, Payment Type, Receipt, Notes.
 * Matches hooomz-expense-tracker.html artifact (crew view).
 */

import { useState, useCallback } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';
import {
  useVendors,
  useCreateVendor,
  useCreateExpense,
} from '@/lib/hooks/useExpenseTracker';
import type { PaymentType } from '@/lib/repositories/jobExpense.repository';

interface CrewExpenseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  woId: string;
  crewMemberId: string;
}

export function CrewExpenseSheet({
  isOpen,
  onClose,
  jobId,
  woId,
  crewMemberId,
}: CrewExpenseSheetProps) {
  const { showToast } = useToast();
  const { data: vendors = [] } = useVendors();
  const createVendor = useCreateVendor();
  const createExpense = useCreateExpense();

  const [amount, setAmount] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType | null>(null);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [addingVendor, setAddingVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');

  const parsedAmount = parseFloat(amount) || 0;

  const resetForm = useCallback(() => {
    setAmount('');
    setVendorId('');
    setPaymentType(null);
    setReceiptUploaded(false);
    setReceiptUrl('');
    setNotes('');
    setAddingVendor(false);
    setNewVendorName('');
  }, []);

  const handleVendorChange = (val: string) => {
    if (val === '__new__') {
      setAddingVendor(true);
      setVendorId('');
    } else {
      setVendorId(val);
      setAddingVendor(false);
    }
  };

  const handleAddVendor = async () => {
    if (!newVendorName.trim()) return;
    const v = await createVendor.mutateAsync({
      name: newVendorName.trim(),
      type: 'retailer',
      createdBy: crewMemberId,
    });
    setVendorId(v.id);
    setAddingVendor(false);
    setNewVendorName('');
  };

  const handleSubmit = async () => {
    if (!parsedAmount || !vendorId || !paymentType) return;
    await createExpense.mutateAsync({
      jobId,
      woId,
      crewMemberId,
      amount: parsedAmount,
      vendorId,
      paymentType,
      receiptUploaded,
      receiptUrl: receiptUploaded && receiptUrl ? receiptUrl : undefined,
      notes: notes.trim() || undefined,
    });
    showToast({ message: 'Expense logged', variant: 'success', duration: 2000 });
    resetForm();
    onClose();
  };

  const canSubmit = parsedAmount > 0 && vendorId && paymentType;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Log Expense">
      <div className="space-y-4 pb-4">

        {/* Amount */}
        <div>
          <label
            className="block text-[10px] font-medium uppercase tracking-[0.08em] mb-1.5"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          >
            Amount
          </label>
          <div
            className="flex items-center"
            style={{ border: '2px solid var(--border)', background: '#fff' }}
          >
            <span
              className="text-xl font-medium px-3 h-[52px] flex items-center"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', background: 'var(--bg)', borderRight: '1px solid var(--border)' }}
            >
              $
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-full h-[52px] px-4 text-2xl font-medium"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--charcoal)', border: 'none', outline: 'none', background: 'transparent' }}
            />
          </div>
        </div>

        {/* Vendor */}
        <div>
          <label
            className="block text-[10px] font-medium uppercase tracking-[0.08em] mb-1.5"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          >
            Vendor
          </label>
          {!addingVendor ? (
            <select
              value={vendorId}
              onChange={(e) => handleVendorChange(e.target.value)}
              className="w-full h-10 px-3 text-sm"
              style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--charcoal)', outline: 'none' }}
            >
              <option value="">Select vendor...</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
              <option value="__new__">+ Add new vendor</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                placeholder="Vendor name..."
                className="flex-1 h-10 px-3 text-sm"
                style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--charcoal)', outline: 'none' }}
                autoFocus
              />
              <button
                onClick={handleAddVendor}
                disabled={!newVendorName.trim() || createVendor.isPending}
                className="h-10 px-3 text-[10px] font-medium uppercase text-white"
                style={{ fontFamily: 'var(--font-mono)', background: 'var(--green)', border: 'none', opacity: newVendorName.trim() ? 1 : 0.5 }}
              >
                {createVendor.isPending ? '...' : 'Add'}
              </button>
              <button
                onClick={() => { setAddingVendor(false); setNewVendorName(''); }}
                className="h-10 px-2 text-[10px]"
                style={{ fontFamily: 'var(--font-mono)', background: 'none', border: '1px solid var(--border)', color: 'var(--muted)' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Payment Type */}
        <div>
          <label
            className="block text-[10px] font-medium uppercase tracking-[0.08em] mb-1.5"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          >
            Payment Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: 'company-card' as PaymentType, label: 'Company\nCard' },
              { key: 'personal' as PaymentType, label: 'Personal\n/ Reimburse' },
              { key: 'cash' as PaymentType, label: 'Cash' },
            ]).map(({ key, label }) => {
              const isActive = paymentType === key;
              const isPersonal = key === 'personal' && isActive;
              return (
                <button
                  key={key}
                  onClick={() => setPaymentType(key)}
                  className="py-3 px-2 text-[10px] font-medium tracking-[0.06em] uppercase text-center whitespace-pre-line leading-tight"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    minHeight: 48,
                    border: `1px solid ${isActive ? (isPersonal ? 'var(--amber)' : 'var(--charcoal)') : 'var(--border)'}`,
                    background: isActive ? (isPersonal ? 'var(--amber)' : 'var(--charcoal)') : 'var(--surface)',
                    color: isActive ? '#fff' : 'var(--muted)',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {/* Reimbursement notice */}
          {paymentType === 'personal' && (
            <div
              className="mt-2 px-3.5 py-2.5 text-xs leading-relaxed"
              style={{ background: 'rgba(217,119,6,0.08)', borderLeft: '3px solid var(--amber)', color: 'var(--warm-mid, var(--charcoal))' }}
            >
              {parsedAmount > 0
                ? `You'll be reimbursed $${parsedAmount.toFixed(2)}. Nathan will see it as an outstanding reimbursement.`
                : "You'll be reimbursed for this amount. Nathan will see it as an outstanding reimbursement."}
            </div>
          )}
        </div>

        {/* Receipt */}
        <div>
          <label
            className="block text-[10px] font-medium uppercase tracking-[0.08em] mb-1.5"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          >
            Receipt
          </label>
          <button
            onClick={() => setReceiptUploaded(!receiptUploaded)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5"
            style={{
              border: `1px solid ${receiptUploaded ? 'var(--green)' : 'var(--border)'}`,
              background: receiptUploaded ? 'rgba(22,163,74,0.06)' : 'var(--surface)',
            }}
          >
            <div
              className="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0"
              style={{
                border: `2px solid ${receiptUploaded ? 'var(--green)' : 'var(--border)'}`,
                background: receiptUploaded ? 'var(--green)' : 'transparent',
              }}
            >
              {receiptUploaded && <span className="text-[11px] text-white">✓</span>}
            </div>
            <span className="text-sm" style={{ color: 'var(--charcoal)' }}>Uploaded to Google Drive</span>
          </button>
          {receiptUploaded && (
            <input
              type="text"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="Drive link (optional)"
              className="w-full h-9 px-3 mt-1.5 text-[11px]"
              style={{ fontFamily: 'var(--font-mono)', background: '#fff', border: '1px solid var(--border)', color: 'var(--charcoal)', outline: 'none' }}
            />
          )}
        </div>

        {/* Notes */}
        <div>
          <label
            className="block text-[10px] font-medium uppercase tracking-[0.08em] mb-1.5"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          >
            Notes <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What was this for?"
            className="w-full h-[60px] px-3 py-2.5 text-sm resize-none"
            style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--charcoal)', outline: 'none' }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || createExpense.isPending}
          className="w-full h-12 text-[11px] font-medium tracking-[0.1em] uppercase text-white"
          style={{
            fontFamily: 'var(--font-mono)',
            background: canSubmit ? 'var(--green)' : 'var(--charcoal)',
            border: 'none',
            opacity: canSubmit ? 1 : 0.5,
          }}
        >
          {createExpense.isPending ? 'Logging...' : 'Log Expense'}
        </button>
      </div>
    </BottomSheet>
  );
}
