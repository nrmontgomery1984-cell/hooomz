import { useState, useEffect } from 'react';
import type { Material, FlooringType } from '../../types/database';
import {
  getProjectMaterials,
  getFlooringTypes,
  createMaterial,
  deleteMaterial,
  startAcclimation,
} from '../../services/api/flooring';
import { AcclimationTimer } from './AcclimationTimer';

// ============================================================================
// TYPES
// ============================================================================

interface MaterialTrackerProps {
  projectId: string;
  onMaterialChange?: () => void;
}

interface AddMaterialFormState {
  product_name: string;
  manufacturer: string;
  sku: string;
  lot_number: string;
  flooring_type_id: string;
  quantity: string;
  unit: string;
  coverage_per_unit: string;
  notes: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const UNIT_OPTIONS = [
  { value: 'box', label: 'Box' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'bag', label: 'Bag' },
  { value: 'roll', label: 'Roll' },
  { value: 'each', label: 'Each' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function MaterialTracker({ projectId, onMaterialChange }: MaterialTrackerProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [flooringTypes, setFlooringTypes] = useState<FlooringType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<AddMaterialFormState>({
    product_name: '',
    manufacturer: '',
    sku: '',
    lot_number: '',
    flooring_type_id: '',
    quantity: '',
    unit: 'box',
    coverage_per_unit: '',
    notes: '',
  });

  // Load data
  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [materialsData, typesData] = await Promise.all([
        getProjectMaterials(projectId),
        getFlooringTypes(),
      ]);
      setMaterials(materialsData);
      setFlooringTypes(typesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load materials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.product_name.trim()) {
      setError('Product name is required');
      return;
    }

    if (!form.lot_number.trim()) {
      setError('Lot number is required for warranty tracking');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const selectedType = flooringTypes.find(t => t.id === form.flooring_type_id);

      await createMaterial({
        project_id: projectId,
        location_id: null,
        product_name: form.product_name,
        manufacturer: form.manufacturer || null,
        sku: form.sku || null,
        lot_number: form.lot_number,
        flooring_type_id: form.flooring_type_id || null,
        quantity: parseFloat(form.quantity) || 1,
        unit: form.unit,
        coverage_per_unit: form.coverage_per_unit ? parseFloat(form.coverage_per_unit) : null,
        received_at: new Date().toISOString(),
        acclimation_start: null,
        acclimation_required_hours: selectedType?.acclimation_hours || null,
        photo_url: null,
        notes: form.notes || null,
        metadata: {},
        created_by: null,
      });

      // Reset form and reload
      setForm({
        product_name: '',
        manufacturer: '',
        sku: '',
        lot_number: '',
        flooring_type_id: '',
        quantity: '',
        unit: 'box',
        coverage_per_unit: '',
        notes: '',
      });
      setShowAddForm(false);
      await loadData();
      onMaterialChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add material');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartAcclimation = async (materialId: string) => {
    try {
      const material = materials.find(m => m.id === materialId);
      const flooringType = material?.flooring_type_id
        ? flooringTypes.find(t => t.id === material.flooring_type_id)
        : null;

      await startAcclimation(materialId, flooringType?.acclimation_hours);
      await loadData();
      onMaterialChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start acclimation');
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      await deleteMaterial(materialId);
      await loadData();
      onMaterialChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete material');
    }
  };

  const getFlooringTypeName = (typeId: string | null) => {
    if (!typeId) return 'Not specified';
    return flooringTypes.find(t => t.id === typeId)?.name || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Materials</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors min-h-[44px]"
        >
          {showAddForm ? 'Cancel' : '+ Add Material'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-sm text-red-600 underline mt-1">
            Dismiss
          </button>
        </div>
      )}

      {/* Add Material Form */}
      {showAddForm && (
        <form onSubmit={handleAddMaterial} className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                value={form.product_name}
                onChange={e => setForm({ ...form, product_name: e.target.value })}
                placeholder="e.g., Shaw Endura Plus LVT - Warm Oak"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <input
                type="text"
                value={form.manufacturer}
                onChange={e => setForm({ ...form, manufacturer: e.target.value })}
                placeholder="e.g., Shaw"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lot Number *</label>
              <input
                type="text"
                value={form.lot_number}
                onChange={e => setForm({ ...form, lot_number: e.target.value })}
                placeholder="Required for warranty"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Flooring Type</label>
              <select
                value={form.flooring_type_id}
                onChange={e => setForm({ ...form, flooring_type_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select type...</option>
                {flooringTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={e => setForm({ ...form, sku: e.target.value })}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                  placeholder="0"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={form.unit}
                  onChange={e => setForm({ ...form, unit: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {UNIT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coverage/Unit (sqft)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.coverage_per_unit}
                onChange={e => setForm({ ...form, coverage_per_unit: e.target.value })}
                placeholder="e.g., 23.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors min-h-[48px]"
          >
            {isSubmitting ? 'Adding...' : 'Add Material'}
          </button>
        </form>
      )}

      {/* Materials List */}
      {materials.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No materials added yet.</p>
          <p className="text-sm mt-1">Add materials to track lot numbers and acclimation.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map(material => {
            const flooringType = material.flooring_type_id
              ? flooringTypes.find(t => t.id === material.flooring_type_id)
              : null;

            return (
              <div
                key={material.id}
                className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{material.product_name}</h4>
                    <p className="text-sm text-gray-500">
                      {material.manufacturer && `${material.manufacturer} • `}
                      {getFlooringTypeName(material.flooring_type_id)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteMaterial(material.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete material"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Details Row */}
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    Lot: {material.lot_number || 'N/A'}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {material.quantity} {material.unit}
                    {material.coverage_per_unit && ` (${material.coverage_per_unit} sqft ea)`}
                  </span>
                </div>

                {/* Acclimation Section */}
                {flooringType && flooringType.acclimation_hours > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {!material.acclimation_start ? (
                      <button
                        onClick={() => handleStartAcclimation(material.id)}
                        className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-medium rounded-lg transition-colors min-h-[44px]"
                      >
                        Start Acclimation ({flooringType.acclimation_hours}h required)
                      </button>
                    ) : (
                      <AcclimationTimer
                        startTime={material.acclimation_start}
                        requiredHours={material.acclimation_required_hours || flooringType.acclimation_hours}
                        compact
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MaterialTracker;
