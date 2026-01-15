'use client';

/**
 * LineItemRow Component
 *
 * Editable row for an estimate line item.
 * Supports inline editing with real-time total calculation.
 */

import React, { useState, useEffect } from 'react';
import type { EstimateLineItem } from '@hooomz/shared-contracts';
import { Input, Button, Badge } from '@/components/ui';

interface LineItemRowProps {
  lineItem: EstimateLineItem;
  onUpdate: (id: string, updates: Partial<EstimateLineItem>) => void;
  onDelete: (id: string) => void;
  isEditing?: boolean;
}

export function LineItemRow({ lineItem, onUpdate, onDelete, isEditing = false }: LineItemRowProps) {
  const [editMode, setEditMode] = useState(isEditing);
  const [editedItem, setEditedItem] = useState(lineItem);

  useEffect(() => {
    setEditedItem(lineItem);
  }, [lineItem]);

  const calculateTotal = (quantity: number, unitCost: number): number => {
    return quantity * unitCost;
  };

  const handleSave = () => {
    onUpdate(lineItem.id, {
      description: editedItem.description,
      quantity: editedItem.quantity,
      unit: editedItem.unit,
      unitCost: editedItem.unitCost,
      total: calculateTotal(editedItem.quantity, editedItem.unitCost),
    });
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditedItem(lineItem);
    setEditMode(false);
  };

  const handleQuantityChange = (value: string) => {
    const quantity = parseFloat(value) || 0;
    setEditedItem({
      ...editedItem,
      quantity,
      total: calculateTotal(quantity, editedItem.unitCost),
    });
  };

  const handleUnitCostChange = (value: string) => {
    const unitCost = parseFloat(value) || 0;
    setEditedItem({
      ...editedItem,
      unitCost,
      total: calculateTotal(editedItem.quantity, unitCost),
    });
  };

  const getCategoryVariant = (category: string) => {
    switch (category) {
      case 'materials':
        return 'primary' as const;
      case 'labor':
        return 'warning' as const;
      case 'subcontractors':
        return 'info' as const;
      case 'equipment':
        return 'neutral' as const;
      default:
        return 'neutral' as const;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  if (editMode) {
    return (
      <tr className="bg-primary-50 border-l-4 border-primary-500">
        <td className="px-4 py-3">
          <Badge variant={getCategoryVariant(lineItem.category)} size="sm">
            {lineItem.category}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <Input
            value={editedItem.description}
            onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
            placeholder="Description"
            fullWidth
          />
        </td>
        <td className="px-4 py-3">
          <Input
            type="number"
            value={editedItem.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            min="0"
            step="0.01"
            fullWidth
          />
        </td>
        <td className="px-4 py-3">
          <Input
            value={editedItem.unit}
            onChange={(e) => setEditedItem({ ...editedItem, unit: e.target.value })}
            placeholder="ea"
            fullWidth
          />
        </td>
        <td className="px-4 py-3">
          <Input
            type="number"
            value={editedItem.unitCost}
            onChange={(e) => handleUnitCostChange(e.target.value)}
            min="0"
            step="0.01"
            fullWidth
          />
        </td>
        <td className="px-4 py-3 text-right font-semibold text-gray-900">
          {formatCurrency(editedItem.total)}
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2 justify-end">
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50 border-b border-gray-200">
      <td className="px-4 py-3">
        <Badge variant={getCategoryVariant(lineItem.category)} size="sm">
          {lineItem.category}
        </Badge>
      </td>
      <td className="px-4 py-3 text-gray-900">
        {lineItem.description}
      </td>
      <td className="px-4 py-3 text-right text-gray-900">
        {lineItem.quantity}
      </td>
      <td className="px-4 py-3 text-gray-600">
        {lineItem.unit}
      </td>
      <td className="px-4 py-3 text-right text-gray-900">
        {formatCurrency(lineItem.unitCost)}
      </td>
      <td className="px-4 py-3 text-right font-semibold text-gray-900">
        {formatCurrency(lineItem.total)}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setEditMode(true)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm('Delete this line item?')) {
                onDelete(lineItem.id);
              }
            }}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
