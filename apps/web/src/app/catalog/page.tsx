'use client';

/**
 * Catalog Management Page
 *
 * Manage materials and labor rate catalog for estimating.
 */

import React, { useEffect, useState } from 'react';
import type { CatalogItem, CreateCatalogItemInput } from '@hooomz/shared-contracts';
import { useEstimateService } from '@/lib/services/ServicesContext';
import { Button, Card, Badge, LoadingSpinner, Modal, Input, Select } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

export default function CatalogPage() {
  const estimateService = useEstimateService();
  const { showToast } = useToast();
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setIsLoading(true);
    try {
      const response = await estimateService.listCatalog();
      if (response.success && response.data) {
        setCatalogItems(response.data);
      }
    } catch (error) {
      console.error('Failed to load catalog:', error);
      showToast('Failed to load catalog', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setShowAddForm(true);
  };

  const handleEditItem = (item: CatalogItem) => {
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this catalog item?')) return;

    try {
      const response = await estimateService.deleteCatalogItem(id);
      if (response.success) {
        setCatalogItems(catalogItems.filter((item) => item.id !== id));
        showToast('Catalog item deleted', 'success');
      }
    } catch (error) {
      console.error('Failed to delete catalog item:', error);
      showToast('Failed to delete catalog item', 'error');
    }
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

  const getFilteredItems = (): CatalogItem[] => {
    let filtered = catalogItems;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.supplier?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredItems = getFilteredItems();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" text="Loading catalog..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catalog</h1>
          <p className="text-gray-600 mt-1">Manage materials and labor rates</p>
        </div>
        <Button variant="primary" onClick={handleAddItem}>
          + Add Item
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search catalog..."
              fullWidth
            />
          </div>

          {/* Category Filter */}
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            fullWidth
          >
            <option value="all">All Categories</option>
            <option value="materials">Materials</option>
            <option value="labor">Labor</option>
            <option value="subcontractors">Subcontractors</option>
            <option value="equipment">Equipment</option>
          </Select>
        </div>

        <div className="text-sm text-gray-500 mt-3">
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
        </div>
      </Card>

      {/* Catalog Items */}
      {filteredItems.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No catalog items found</div>
            <p className="text-gray-500 mb-6">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add items to your catalog to speed up estimating'}
            </p>
            <Button variant="secondary" onClick={handleAddItem}>
              Add First Item
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Item Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant={getCategoryVariant(item.category)} size="sm">
                      {item.category}
                    </Badge>
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div>
                      Default: {item.defaultQuantity} {item.unit}
                    </div>
                    {item.supplier && <div>Supplier: {item.supplier}</div>}
                    {item.sku && <div>SKU: {item.sku}</div>}
                  </div>
                </div>

                {/* Price and Actions */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(item.unitCost)}
                    </div>
                    <div className="text-sm text-gray-500">per {item.unit}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEditItem(item)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      <CatalogItemForm
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setEditingItem(null);
        }}
        onSubmit={async (data) => {
          try {
            let response;
            if (editingItem) {
              response = await estimateService.updateCatalogItem(editingItem.id, data);
            } else {
              response = await estimateService.createCatalogItem(data);
            }

            if (response.success) {
              await loadCatalog();
              showToast(
                editingItem ? 'Catalog item updated' : 'Catalog item added',
                'success'
              );
              setShowAddForm(false);
              setEditingItem(null);
            }
          } catch (error) {
            console.error('Failed to save catalog item:', error);
            showToast('Failed to save catalog item', 'error');
          }
        }}
        item={editingItem}
      />
    </div>
  );
}

interface CatalogItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCatalogItemInput) => void;
  item?: CatalogItem | null;
}

function CatalogItemForm({ isOpen, onClose, onSubmit, item }: CatalogItemFormProps) {
  const [formData, setFormData] = useState<CreateCatalogItemInput>({
    category: item?.category || 'materials',
    name: item?.name || '',
    description: item?.description || '',
    unitCost: item?.unitCost || 0,
    unit: item?.unit || 'ea',
    defaultQuantity: item?.defaultQuantity || 1,
    supplier: item?.supplier || '',
    sku: item?.sku || '',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        category: item.category,
        name: item.name,
        description: item.description || '',
        unitCost: item.unitCost,
        unit: item.unit,
        defaultQuantity: item.defaultQuantity,
        supplier: item.supplier || '',
        sku: item.sku || '',
      });
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Edit Catalog Item' : 'Add Catalog Item'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          required
          fullWidth
        >
          <option value="materials">Materials</option>
          <option value="labor">Labor</option>
          <option value="subcontractors">Subcontractors</option>
          <option value="equipment">Equipment</option>
        </Select>

        <Input
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          fullWidth
        />

        <Input
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          fullWidth
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Unit Cost"
            type="number"
            value={formData.unitCost}
            onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
            min="0"
            step="0.01"
            required
            fullWidth
          />
          <Input
            label="Unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            required
            fullWidth
          />
        </div>

        <Input
          label="Default Quantity"
          type="number"
          value={formData.defaultQuantity}
          onChange={(e) => setFormData({ ...formData, defaultQuantity: parseFloat(e.target.value) || 1 })}
          min="0"
          step="0.01"
          required
          fullWidth
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Supplier (Optional)"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            fullWidth
          />
          <Input
            label="SKU (Optional)"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            fullWidth
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="ghost" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button type="submit" variant="primary" fullWidth>
            {item ? 'Save Changes' : 'Add Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
