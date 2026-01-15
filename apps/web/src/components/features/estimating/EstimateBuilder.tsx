'use client';

/**
 * EstimateBuilder Component
 *
 * Main estimate editing interface with line items management.
 * Includes catalog search, inline editing, and real-time calculations.
 */

import React, { useState, useEffect } from 'react';
import type { Estimate, EstimateLineItem, CatalogItem, CreateEstimateLineItemInput } from '@hooomz/shared-contracts';
import { useEstimatingService } from '@/lib/services/ServicesContext';
import { Card, Button, Tabs, TabsList, TabsTrigger, TabsContent, Badge } from '@/components/ui';
import { LineItemRow } from './LineItemRow';
import { LineItemForm } from './LineItemForm';
import { CatalogSearch } from './CatalogSearch';
import { EstimateSummary } from './EstimateSummary';
import { useToast } from '@/components/ui/Toast';

interface EstimateBuilderProps {
  estimate: Estimate;
  onUpdate?: (estimate: Estimate) => void;
}

export function EstimateBuilder({ estimate, onUpdate }: EstimateBuilderProps) {
  const estimatingService = useEstimatingService();
  const { showToast } = useToast();
  const [lineItems, setLineItems] = useState<EstimateLineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLineItemForm, setShowLineItemForm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadLineItems();
  }, [estimate.id]);

  const loadLineItems = async () => {
    setIsLoading(true);
    try {
      const response = await estimatingService.getLineItems(estimate.id);
      if (response.success && response.data) {
        setLineItems(response.data);
      }
    } catch (error) {
      console.error('Failed to load line items:', error);
      showToast('Failed to load line items', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLineItem = async (lineItemData: CreateEstimateLineItemInput) => {
    try {
      const response = await estimatingService.addLineItem(estimate.id, {
        ...lineItemData,
        total: lineItemData.quantity * lineItemData.unitCost,
      });

      if (response.success && response.data) {
        setLineItems([...lineItems, response.data]);
        showToast('Line item added', 'success');
        await updateEstimateTotal();
      }
    } catch (error) {
      console.error('Failed to add line item:', error);
      showToast('Failed to add line item', 'error');
    }
  };

  const handleAddFromCatalog = async (catalogItem: CatalogItem) => {
    const lineItemData: CreateEstimateLineItemInput = {
      category: catalogItem.category,
      description: catalogItem.name,
      quantity: catalogItem.defaultQuantity,
      unit: catalogItem.unit,
      unitCost: catalogItem.unitCost,
      notes: catalogItem.description || '',
    };

    await handleAddLineItem(lineItemData);
    showToast(`Added ${catalogItem.name} to estimate`, 'success');
  };

  const handleUpdateLineItem = async (id: string, updates: Partial<EstimateLineItem>) => {
    try {
      const response = await estimatingService.updateLineItem(id, updates);

      if (response.success && response.data) {
        setLineItems(lineItems.map((item) => (item.id === id ? response.data! : item)));
        showToast('Line item updated', 'success');
        await updateEstimateTotal();
      }
    } catch (error) {
      console.error('Failed to update line item:', error);
      showToast('Failed to update line item', 'error');
    }
  };

  const handleDeleteLineItem = async (id: string) => {
    try {
      const response = await estimatingService.deleteLineItem(id);

      if (response.success) {
        setLineItems(lineItems.filter((item) => item.id !== id));
        showToast('Line item deleted', 'success');
        await updateEstimateTotal();
      }
    } catch (error) {
      console.error('Failed to delete line item:', error);
      showToast('Failed to delete line item', 'error');
    }
  };

  const handleUpdateMarkup = async (markupPercentage: number) => {
    try {
      const response = await estimatingService.updateEstimate(estimate.id, {
        markupPercentage,
      });

      if (response.success && response.data && onUpdate) {
        onUpdate(response.data);
        showToast('Markup updated', 'success');
      }
    } catch (error) {
      console.error('Failed to update markup:', error);
      showToast('Failed to update markup', 'error');
    }
  };

  const handleUpdateTax = async (taxRate: number) => {
    try {
      const response = await estimatingService.updateEstimate(estimate.id, {
        taxRate,
      });

      if (response.success && response.data && onUpdate) {
        onUpdate(response.data);
        showToast('Tax rate updated', 'success');
      }
    } catch (error) {
      console.error('Failed to update tax rate:', error);
      showToast('Failed to update tax rate', 'error');
    }
  };

  const handleExportPDF = async () => {
    try {
      // Prepare data for PDF export (actual PDF generation would be done server-side or in future)
      const exportData = {
        estimate,
        lineItems,
        subtotal: lineItems.reduce((sum, item) => sum + item.total, 0),
        markup: estimate.markupPercentage || 0,
        tax: estimate.taxRate || 0,
      };

      showToast('PDF export prepared (implementation pending)', 'success');
      console.log('Export data:', exportData);

      // Future: Call API endpoint to generate PDF
      // const response = await estimatingService.exportToPDF(estimate.id);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      showToast('Failed to export PDF', 'error');
    }
  };

  const updateEstimateTotal = async () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const markupAmount = (subtotal * (estimate.markupPercentage || 0)) / 100;
    const subtotalWithMarkup = subtotal + markupAmount;
    const taxAmount = (subtotalWithMarkup * (estimate.taxRate || 0)) / 100;
    const total = subtotalWithMarkup + taxAmount;

    try {
      const response = await estimatingService.updateEstimate(estimate.id, { total });
      if (response.success && response.data && onUpdate) {
        onUpdate(response.data);
      }
    } catch (error) {
      console.error('Failed to update estimate total:', error);
    }
  };

  const getFilteredLineItems = (): EstimateLineItem[] => {
    if (activeTab === 'all') {
      return lineItems;
    }
    return lineItems.filter((item) => item.category === activeTab);
  };

  const getCategoryCount = (category: string): number => {
    return lineItems.filter((item) => item.category === category).length;
  };

  const filteredLineItems = getFilteredLineItems();

  return (
    <div className="space-y-6">
      {/* Quick Add from Catalog */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Add from Catalog</h3>
        <CatalogSearch onSelect={handleAddFromCatalog} />
      </Card>

      {/* Line Items */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Line Items</h3>
          <Button variant="primary" onClick={() => setShowLineItemForm(true)}>
            + Add Line Item
          </Button>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              All ({lineItems.length})
            </TabsTrigger>
            <TabsTrigger value="materials">
              Materials ({getCategoryCount('materials')})
            </TabsTrigger>
            <TabsTrigger value="labor">
              Labor ({getCategoryCount('labor')})
            </TabsTrigger>
            <TabsTrigger value="subcontractors">
              Subcontractors ({getCategoryCount('subcontractors')})
            </TabsTrigger>
            <TabsTrigger value="equipment">
              Equipment ({getCategoryCount('equipment')})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">Loading line items...</div>
            ) : filteredLineItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  {activeTab === 'all'
                    ? 'No line items yet'
                    : `No ${activeTab} items yet`}
                </p>
                <Button variant="secondary" onClick={() => setShowLineItemForm(true)}>
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Unit Cost
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLineItems.map((lineItem) => (
                      <LineItemRow
                        key={lineItem.id}
                        lineItem={lineItem}
                        onUpdate={handleUpdateLineItem}
                        onDelete={handleDeleteLineItem}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Summary */}
      <EstimateSummary
        estimate={estimate}
        lineItems={lineItems}
        onUpdateMarkup={handleUpdateMarkup}
        onUpdateTax={handleUpdateTax}
        onExportPDF={handleExportPDF}
      />

      {/* Line Item Form Modal */}
      <LineItemForm
        isOpen={showLineItemForm}
        onClose={() => setShowLineItemForm(false)}
        onSubmit={handleAddLineItem}
        mode="add"
      />
    </div>
  );
}
