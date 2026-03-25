'use client';

/**
 * AddExpenseSheet — Bottom sheet for adding an expense to a project.
 *
 * Fields: Amount (required), Description (required), Category, Vendor, Task, Date.
 * Uses existing BottomSheet component.
 */

import { useState, useEffect, useMemo } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useCreateExpense } from '@/lib/hooks/useExpenses';
import { useToast } from '@/components/ui/Toast';
import { CostCategory } from '@hooomz/shared-contracts';
import type { Task } from '@hooomz/shared-contracts';

const CATEGORY_OPTIONS: { value: CostCategory; label: string }[] = [
  { value: CostCategory.FLOORING, label: 'Flooring' },
  { value: CostCategory.PAINTING, label: 'Painting' },
  { value: CostCategory.INTERIOR_TRIM, label: 'Trim' },
  { value: CostCategory.DRYWALL, label: 'Drywall' },
  { value: CostCategory.MATERIALS, label: 'Materials' },
  { value: CostCategory.LABOR, label: 'Labour' },
  { value: CostCategory.EQUIPMENT_RENTAL, label: 'Equipment Rental' },
  { value: CostCategory.SUBCONTRACTORS, label: 'Subcontractors' },
  { value: CostCategory.PERMITS_FEES, label: 'Permits & Fees' },
  { value: CostCategory.FIXTURES, label: 'Fixtures' },
  { value: CostCategory.CABINETS_COUNTERTOPS, label: 'Cabinets' },
  { value: CostCategory.PLUMBING, label: 'Plumbing' },
  { value: CostCategory.ELECTRICAL, label: 'Electrical' },
  { value: CostCategory.SITE_WORK, label: 'Site Work' },
  { value: CostCategory.OTHER, label: 'Other' },
];

interface AddExpenseSheetProps {
  projectId: string;
  tasks?: Task[];
  isOpen: boolean;
  onClose: () => void;
}

export function AddExpenseSheet({ projectId, tasks = [], isOpen, onClose }: AddExpenseSheetProps) {
  const createExpense = useCreateExpense();
  const { showToast } = useToast();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CostCategory>(CostCategory.MATERIALS);
  const [vendor, setVendor] = useState('');
  const [taskId, setTaskId] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDescription('');
      setCategory(CostCategory.MATERIALS);
      setVendor('');
      setTaskId('');
      setDate(new Date().toISOString().split('T')[0]);
      setError('');
    }
  }, [isOpen]);

  const taskOptions = useMemo(() => {
    return tasks.map((t) => ({ id: t.id, label: t.title }));
  }, [tasks]);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      setError('Description is required.');
      return;
    }
    try {
      await createExpense.mutateAsync({
        projectId,
        amount: parsedAmount,
        description: trimmedDesc,
        category,
        vendor: vendor.trim() || undefined,
        taskId: taskId || undefined,
        date,
      });
      showToast({ message: `Expense added: $${parsedAmount.toFixed(2)}`, variant: 'success', duration: 2000 });
      onClose();
    } catch {
      setError('Failed to save — try again.');
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
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Add Expense">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Amount + Date row */}
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
              placeholder="0.00"
              autoFocus
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
            />
          </label>
          <label>
            <span style={labelStyle}>Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>

        {/* Description */}
        <label>
          <span style={labelStyle}>Description</span>
          <input
            type="text"
            value={description}
            onChange={(e) => { setDescription(e.target.value); setError(''); }}
            placeholder="e.g. LVP underlay from Kent"
            style={inputStyle}
          />
        </label>

        {/* Category + Vendor row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label>
            <span style={labelStyle}>Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CostCategory)}
              style={{ ...inputStyle, appearance: 'auto' }}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span style={labelStyle}>Vendor</span>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g. Kent Building Supplies"
              style={inputStyle}
            />
          </label>
        </div>

        {/* Task link */}
        {taskOptions.length > 0 && (
          <label>
            <span style={labelStyle}>Link to Task</span>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              style={{ ...inputStyle, appearance: 'auto' }}
            >
              <option value="">Not linked to a task</option>
              {taskOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </label>
        )}

        {/* Error */}
        {error && (
          <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={createExpense.isPending}
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
            cursor: createExpense.isPending ? 'not-allowed' : 'pointer',
            opacity: createExpense.isPending ? 0.6 : 1,
          }}
        >
          {createExpense.isPending ? 'SAVING…' : 'ADD EXPENSE'}
        </button>
      </div>
    </BottomSheet>
  );
}
