'use client';

/**
 * EstimateSummary Component
 *
 * Display estimate totals with markup and tax configuration.
 * Real-time calculation of subtotals and grand total.
 */

import React, { useState } from 'react';
import type { Estimate, EstimateLineItem } from '@hooomz/shared-contracts';
import { Card, Input, Button, Badge } from '@/components/ui';

interface EstimateSummaryProps {
  estimate: Estimate;
  lineItems: EstimateLineItem[];
  onUpdateMarkup?: (markupPercentage: number) => void;
  onUpdateTax?: (taxRate: number) => void;
  onExportPDF?: () => void;
}

interface CategoryTotal {
  category: string;
  total: number;
}

export function EstimateSummary({
  estimate,
  lineItems,
  onUpdateMarkup,
  onUpdateTax,
  onExportPDF,
}: EstimateSummaryProps) {
  const [isEditingMarkup, setIsEditingMarkup] = useState(false);
  const [isEditingTax, setIsEditingTax] = useState(false);
  const [markupValue, setMarkupValue] = useState(estimate.markupPercentage || 0);
  const [taxValue, setTaxValue] = useState(estimate.taxRate || 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const getCategoryTotals = (): CategoryTotal[] => {
    const totals = new Map<string, number>();

    lineItems.forEach((item) => {
      const current = totals.get(item.category) || 0;
      totals.set(item.category, current + item.total);
    });

    return Array.from(totals.entries()).map(([category, total]) => ({
      category,
      total,
    }));
  };

  const calculateSubtotal = (): number => {
    return lineItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateMarkupAmount = (): number => {
    const subtotal = calculateSubtotal();
    return (subtotal * (estimate.markupPercentage || 0)) / 100;
  };

  const calculateSubtotalWithMarkup = (): number => {
    return calculateSubtotal() + calculateMarkupAmount();
  };

  const calculateTaxAmount = (): number => {
    const subtotalWithMarkup = calculateSubtotalWithMarkup();
    return (subtotalWithMarkup * (estimate.taxRate || 0)) / 100;
  };

  const calculateGrandTotal = (): number => {
    return calculateSubtotalWithMarkup() + calculateTaxAmount();
  };

  const handleSaveMarkup = () => {
    if (onUpdateMarkup) {
      onUpdateMarkup(markupValue);
    }
    setIsEditingMarkup(false);
  };

  const handleSaveTax = () => {
    if (onUpdateTax) {
      onUpdateTax(taxValue);
    }
    setIsEditingTax(false);
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

  const categoryTotals = getCategoryTotals();

  return (
    <div className="space-y-4">
      {/* Category Breakdown */}
      {categoryTotals.length > 0 && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Category Breakdown</h3>
          <div className="space-y-2">
            {categoryTotals.map(({ category, total }) => (
              <div
                key={category}
                className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <Badge variant={getCategoryVariant(category)} size="sm">
                    {category}
                  </Badge>
                </div>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(total)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Totals Summary */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Estimate Summary</h3>

        <div className="space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-700">Subtotal</span>
            <span className="font-semibold text-gray-900 text-lg">
              {formatCurrency(calculateSubtotal())}
            </span>
          </div>

          {/* Markup */}
          <div className="flex justify-between items-center py-2 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-gray-700">Markup</span>
              {isEditingMarkup ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={markupValue}
                    onChange={(e) => setMarkupValue(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">%</span>
                  <Button size="sm" onClick={handleSaveMarkup}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setMarkupValue(estimate.markupPercentage || 0);
                      setIsEditingMarkup(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <span className="text-sm text-gray-600">
                    ({estimate.markupPercentage || 0}%)
                  </span>
                  {onUpdateMarkup && (
                    <button
                      onClick={() => setIsEditingMarkup(true)}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      Edit
                    </button>
                  )}
                </>
              )}
            </div>
            <span className="font-semibold text-gray-900">
              {formatCurrency(calculateMarkupAmount())}
            </span>
          </div>

          {/* Subtotal with Markup */}
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-700">Subtotal with Markup</span>
            <span className="font-semibold text-gray-900 text-lg">
              {formatCurrency(calculateSubtotalWithMarkup())}
            </span>
          </div>

          {/* Tax */}
          <div className="flex justify-between items-center py-2 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-gray-700">Tax (HST)</span>
              {isEditingTax ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={taxValue}
                    onChange={(e) => setTaxValue(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">%</span>
                  <Button size="sm" onClick={handleSaveTax}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setTaxValue(estimate.taxRate || 0);
                      setIsEditingTax(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <span className="text-sm text-gray-600">
                    ({estimate.taxRate || 0}%)
                  </span>
                  {onUpdateTax && (
                    <button
                      onClick={() => setIsEditingTax(true)}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      Edit
                    </button>
                  )}
                </>
              )}
            </div>
            <span className="font-semibold text-gray-900">
              {formatCurrency(calculateTaxAmount())}
            </span>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 bg-primary-50 -mx-6 px-6 rounded">
            <span className="text-lg font-bold text-gray-900">Grand Total</span>
            <span className="text-2xl font-bold text-primary-700">
              {formatCurrency(calculateGrandTotal())}
            </span>
          </div>
        </div>

        {/* Export Button */}
        {onExportPDF && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={onExportPDF} fullWidth>
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export to PDF
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
