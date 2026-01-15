'use client';

/**
 * LineItemForm Component
 *
 * Modal form for adding or editing estimate line items.
 */

import React, { useState, useEffect } from 'react';
import type { EstimateLineItem, CreateEstimateLineItemInput } from '@hooomz/shared-contracts';
import { Modal, Input, Select, Button, Badge } from '@/components/ui';

interface LineItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (lineItem: CreateEstimateLineItemInput) => void;
  lineItem?: EstimateLineItem;
  mode?: 'add' | 'edit';
}

const CATEGORIES = [
  { value: 'materials', label: 'Materials' },
  { value: 'labor', label: 'Labor' },
  { value: 'subcontractors', label: 'Subcontractors' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Other' },
];

const COMMON_UNITS = ['ea', 'sq ft', 'sq m', 'lin ft', 'lin m', 'hour', 'day', 'load'];

export function LineItemForm({
  isOpen,
  onClose,
  onSubmit,
  lineItem,
  mode = 'add',
}: LineItemFormProps) {
  const [formData, setFormData] = useState<CreateEstimateLineItemInput>({
    category: lineItem?.category || 'materials',
    description: lineItem?.description || '',
    quantity: lineItem?.quantity || 1,
    unit: lineItem?.unit || 'ea',
    unitCost: lineItem?.unitCost || 0,
    notes: lineItem?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lineItem) {
      setFormData({
        category: lineItem.category,
        description: lineItem.description,
        quantity: lineItem.quantity,
        unit: lineItem.unit,
        unitCost: lineItem.unitCost,
        notes: lineItem.notes || '',
      });
    }
  }, [lineItem]);

  const calculateTotal = (): number => {
    return formData.quantity * formData.unitCost;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    if (formData.unitCost < 0) {
      newErrors.unitCost = 'Unit cost cannot be negative';
    }
    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      category: 'materials',
      description: '',
      quantity: 1,
      unit: 'ea',
      unitCost: 0,
      notes: '',
    });
    setErrors({});
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'add' ? 'Add Line Item' : 'Edit Line Item'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <Select
          label="Category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          required
          fullWidth
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </Select>

        {/* Description */}
        <Input
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          error={errors.description}
          placeholder="Enter item description"
          required
          fullWidth
        />

        {/* Quantity and Unit */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })
            }
            error={errors.quantity}
            min="0"
            step="0.01"
            required
            fullWidth
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit <span className="text-red-500">*</span>
            </label>
            <input
              list="common-units"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="ea, sq ft, etc."
              required
            />
            <datalist id="common-units">
              {COMMON_UNITS.map((unit) => (
                <option key={unit} value={unit} />
              ))}
            </datalist>
            {errors.unit && (
              <p className="mt-1 text-sm text-red-600">{errors.unit}</p>
            )}
          </div>
        </div>

        {/* Unit Cost */}
        <Input
          label="Unit Cost"
          type="number"
          value={formData.unitCost}
          onChange={(e) =>
            setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })
          }
          error={errors.unitCost}
          min="0"
          step="0.01"
          required
          fullWidth
        />

        {/* Calculated Total */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Line Total:</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(calculateTotal())}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {formData.quantity} {formData.unit} × {formatCurrency(formData.unitCost)}
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Additional notes or specifications..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="ghost" onClick={handleClose} fullWidth>
            Cancel
          </Button>
          <Button type="submit" variant="primary" fullWidth>
            {mode === 'add' ? 'Add Item' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
