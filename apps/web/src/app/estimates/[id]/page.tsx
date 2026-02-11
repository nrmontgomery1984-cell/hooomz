'use client';

/**
 * Estimate Detail Page — Line item CRUD + Approve button
 *
 * The [id] parameter is the projectId.
 * Line items are the estimate. Approval fires the pipeline.
 */

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  RefreshCw,
  Repeat,
  Clock,
  Search,
  BookOpen,
} from 'lucide-react';
import { useLocalProject } from '@/lib/hooks/useLocalData';
import { useServicesContext } from '@/lib/services/ServicesContext';
import {
  useProjectLineItems,
  useCreateLineItem,
  useUpdateLineItem,
  useDeleteLineItem,
} from '@/lib/hooks/useEstimateLocal';
import { useApproveEstimateWithPipeline } from '@/lib/hooks/useApproveWithPipeline';
import { useSops } from '@/lib/hooks/useLabsData';
import { CostCategory, UnitOfMeasure } from '@hooomz/shared-contracts';
import type { CreateLineItem, LineItem, Sop } from '@hooomz/shared-contracts';
import type { CatalogItem } from '@hooomz/estimating';

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_LABELS: Record<string, string> = {
  'site-work': 'Site Work',
  foundation: 'Foundation',
  framing: 'Framing',
  exterior: 'Exterior',
  roofing: 'Roofing',
  'windows-doors': 'Windows & Doors',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  hvac: 'HVAC',
  insulation: 'Insulation',
  drywall: 'Drywall',
  'interior-trim': 'Interior Trim',
  flooring: 'Flooring',
  painting: 'Painting',
  'cabinets-countertops': 'Cabinets & Countertops',
  appliances: 'Appliances',
  fixtures: 'Fixtures',
  landscaping: 'Landscaping',
  'permits-fees': 'Permits & Fees',
  labor: 'Labor',
  materials: 'Materials',
  'equipment-rental': 'Equipment Rental',
  subcontractors: 'Subcontractors',
  contingency: 'Contingency',
  other: 'Other',
};

const UNIT_LABELS: Record<string, string> = {
  sqft: 'sq ft',
  lf: 'lin ft',
  cy: 'cu yd',
  each: 'each',
  hour: 'hour',
  day: 'day',
  lot: 'lot',
  gal: 'gal',
  lb: 'lb',
  ton: 'ton',
  bundle: 'bundle',
  box: 'box',
  bag: 'bag',
};

// ============================================================================
// Types
// ============================================================================

interface LineItemFormData {
  description: string;
  category: CostCategory;
  quantity: number;
  unit: UnitOfMeasure;
  unitCost: number;
  isLabor: boolean;
  sopCodes: string[];
  isLooped: boolean;
  loopContextLabel: string;
  estimatedHoursPerUnit: number;
}

// Catalog category → CostCategory mapping
const CATALOG_TO_COST_CATEGORY: Record<string, CostCategory> = {
  flooring: CostCategory.FLOORING,
  paint: CostCategory.PAINTING,
  trim: CostCategory.INTERIOR_TRIM,
  drywall: CostCategory.DRYWALL,
  tile: CostCategory.FLOORING,
  doors: CostCategory.WINDOWS_DOORS,
  general: CostCategory.MATERIALS,
  carpentry: CostCategory.LABOR,
};

// Catalog unit → UnitOfMeasure mapping
const CATALOG_TO_UNIT: Record<string, UnitOfMeasure> = {
  sqft: UnitOfMeasure.SQUARE_FOOT,
  lf: UnitOfMeasure.LINEAR_FOOT,
  each: UnitOfMeasure.EACH,
  hour: UnitOfMeasure.HOUR,
  gal: UnitOfMeasure.GALLON,
  bag: UnitOfMeasure.BAG,
  box: UnitOfMeasure.BOX,
  bundle: UnitOfMeasure.BUNDLE,
  lb: UnitOfMeasure.POUND,
  day: UnitOfMeasure.DAY,
};

// Category display labels for catalog picker
const CATALOG_CATEGORY_LABELS: Record<string, string> = {
  flooring: 'Flooring',
  paint: 'Paint',
  trim: 'Trim',
  drywall: 'Drywall',
  tile: 'Tile',
  doors: 'Doors',
  general: 'General',
  carpentry: 'Carpentry',
};

const EMPTY_FORM: LineItemFormData = {
  description: '',
  category: CostCategory.FLOORING,
  quantity: 1,
  unit: UnitOfMeasure.EACH,
  unitCost: 0,
  isLabor: false,
  sopCodes: [],
  isLooped: false,
  loopContextLabel: '',
  estimatedHoursPerUnit: 0,
};

// ============================================================================
// Page Component
// ============================================================================

export default function EstimateDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  // Data hooks
  const { data: project, isLoading: projectLoading } = useLocalProject(projectId);
  const { data: lineItems = [], isLoading: itemsLoading } = useProjectLineItems(projectId);
  const { data: sops = [] } = useSops();

  // Mutation hooks
  const createLineItem = useCreateLineItem();
  const updateLineItem = useUpdateLineItem();
  const deleteLineItem = useDeleteLineItem();
  const { approveAndGenerate } = useApproveEstimateWithPipeline();

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [matchedLabor, setMatchedLabor] = useState<CatalogItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LineItemFormData>(EMPTY_FORM);
  const [approving, setApproving] = useState(false);
  const [approveResult, setApproveResult] = useState<{
    blueprintsCreated: number;
    tasksDeployed: number;
  } | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  const isLoading = projectLoading || itemsLoading;

  // Totals
  const totals = useMemo(() => {
    const laborTotal = lineItems
      .filter((i) => i.isLabor)
      .reduce((sum, i) => sum + i.totalCost, 0);
    const materialTotal = lineItems
      .filter((i) => !i.isLabor)
      .reduce((sum, i) => sum + i.totalCost, 0);
    return { laborTotal, materialTotal, total: laborTotal + materialTotal };
  }, [lineItems]);

  // Current SOPs for the picker
  const currentSops = useMemo(
    () => (sops as Sop[]).filter((s) => s.isCurrent),
    [sops]
  );

  // ---- Form handlers ----

  function openAddForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(item: LineItem) {
    setForm({
      description: item.description,
      category: item.category as CostCategory,
      quantity: item.quantity,
      unit: item.unit as UnitOfMeasure,
      unitCost: item.unitCost,
      isLabor: item.isLabor,
      sopCodes: item.sopCodes || [],
      isLooped: item.isLooped || false,
      loopContextLabel: item.loopContextLabel || '',
      estimatedHoursPerUnit: item.estimatedHoursPerUnit || 0,
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setMatchedLabor(null);
  }

  async function handleSave() {
    const totalCost = form.quantity * form.unitCost;
    const data: CreateLineItem = {
      projectId,
      description: form.description,
      category: form.category,
      quantity: form.quantity,
      unit: form.unit,
      unitCost: form.unitCost,
      totalCost,
      isLabor: form.isLabor,
      ...(form.sopCodes.length > 0 ? { sopCodes: form.sopCodes } : {}),
      ...(form.isLooped ? { isLooped: true, loopContextLabel: form.loopContextLabel || 'Per Room' } : {}),
      ...(form.estimatedHoursPerUnit > 0
        ? { estimatedHoursPerUnit: form.estimatedHoursPerUnit }
        : {}),
    };

    if (editingId) {
      await updateLineItem.mutateAsync({
        projectId,
        lineItemId: editingId,
        data,
      });
    } else {
      await createLineItem.mutateAsync({ projectId, data });

      // Auto-create matched labor line item (from Material + Labor selection)
      if (matchedLabor) {
        const laborUnit = CATALOG_TO_UNIT[matchedLabor.unit] || UnitOfMeasure.EACH;
        const laborCategory = CATALOG_TO_COST_CATEGORY[matchedLabor.category] || CostCategory.LABOR;
        const laborTotal = form.quantity * matchedLabor.unitCost;
        const laborData: CreateLineItem = {
          projectId,
          description: matchedLabor.name,
          category: laborCategory,
          quantity: form.quantity,
          unit: laborUnit,
          unitCost: matchedLabor.unitCost,
          totalCost: laborTotal,
          isLabor: true,
        };
        await createLineItem.mutateAsync({ projectId, data: laborData });
      }
    }

    closeForm();
  }

  async function handleDelete(itemId: string) {
    await deleteLineItem.mutateAsync({ projectId, lineItemId: itemId });
  }

  async function handleApprove() {
    setApproving(true);
    setApproveError(null);
    try {
      const result = await approveAndGenerate(projectId, projectId, {
        total_amount: totals.total,
      });
      setApproveResult(result);
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setApproving(false);
    }
  }

  function handleCatalogSelect(item: CatalogItem, labor?: CatalogItem) {
    setForm((prev) => ({
      ...prev,
      description: item.name,
      unitCost: item.unitCost,
      unit: CATALOG_TO_UNIT[item.unit] || UnitOfMeasure.EACH,
      isLabor: item.type === 'labor',
      category: CATALOG_TO_COST_CATEGORY[item.category] || CostCategory.MATERIALS,
    }));
    setMatchedLabor(labor ?? null);
    setShowCatalog(false);
    setEditingId(null);
    setShowForm(true);
  }

  function toggleSopCode(code: string) {
    setForm((prev) => ({
      ...prev,
      sopCodes: prev.sopCodes.includes(code)
        ? prev.sopCodes.filter((c) => c !== code)
        : [...prev.sopCodes, code],
    }));
  }

  // ============================================================================
  // Render
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        <div className="text-center py-16">
          <div
            className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }}
          />
          <p className="text-sm text-gray-400">Loading estimate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/estimates"
              className="flex items-center gap-1 text-sm hover:underline"
              style={{ color: '#0F766E' }}
            >
              <ArrowLeft size={14} />
              Estimates
            </Link>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>
            {project?.name || projectId}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            {lineItems.length} line item{lineItems.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {/* Summary Card */}
        {lineItems.length > 0 && (
          <div
            className="bg-white rounded-xl p-4"
            style={{ border: '1px solid #E5E7EB' }}
          >
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs" style={{ color: '#6B7280' }}>
                  Labor
                </div>
                <div className="text-sm font-bold" style={{ color: '#3B82F6' }}>
                  ${totals.laborTotal.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs" style={{ color: '#6B7280' }}>
                  Materials
                </div>
                <div className="text-sm font-bold" style={{ color: '#F59E0B' }}>
                  ${totals.materialTotal.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs" style={{ color: '#6B7280' }}>
                  Total
                </div>
                <div className="text-lg font-bold" style={{ color: '#111827' }}>
                  ${totals.total.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Line Items */}
        {lineItems.map((item) => (
          <LineItemCard
            key={item.id}
            item={item}
            onEdit={() => openEditForm(item)}
            onDelete={() => handleDelete(item.id)}
          />
        ))}

        {/* Add Line Item Buttons */}
        {!showForm && !approveResult && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowCatalog(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white"
              style={{ background: '#0F766E', minHeight: '48px' }}
            >
              <BookOpen size={16} />
              Browse Catalog
            </button>
            <button
              onClick={openAddForm}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border-2 border-dashed"
              style={{
                borderColor: '#D1D5DB',
                color: '#6B7280',
                minHeight: '48px',
              }}
            >
              <Plus size={16} />
              Manual
            </button>
          </div>
        )}

        {/* Line Item Form */}
        {showForm && (
          <>
            {matchedLabor && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: '#F0FDFA', border: '1px solid #99F6E4' }}
              >
                <Check size={14} style={{ color: '#0F766E' }} />
                <span style={{ color: '#0F766E' }}>
                  Also adds: <strong>{matchedLabor.name}</strong> at ${matchedLabor.unitCost.toFixed(2)}/{matchedLabor.unit}
                </span>
              </div>
            )}
            <LineItemForm
              form={form}
              setForm={setForm}
              sops={currentSops}
              onSave={handleSave}
              onCancel={closeForm}
              onToggleSop={toggleSopCode}
              isSaving={createLineItem.isPending || updateLineItem.isPending}
              isEditing={!!editingId}
            />
          </>
        )}

        {/* Approve Button */}
        {lineItems.length > 0 && !showForm && !approveResult && (
          <div className="pt-4">
            <button
              onClick={handleApprove}
              disabled={approving}
              className="w-full py-3 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
              style={{ background: '#0F766E', minHeight: '48px' }}
            >
              {approving ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin" />
                  Approving...
                </span>
              ) : (
                'Approve Estimate'
              )}
            </button>
            {approveError && (
              <p className="text-xs text-center mt-2" style={{ color: '#EF4444' }}>
                {approveError}
              </p>
            )}
          </div>
        )}

        {/* Approval Result */}
        {approveResult && (
          <div
            className="bg-white rounded-xl p-4"
            style={{ border: '2px solid #10B981' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: '#D1FAE5' }}
              >
                <Check size={16} style={{ color: '#065F46' }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: '#065F46' }}>
                Estimate Approved
              </span>
            </div>
            <div className="space-y-1 text-sm" style={{ color: '#374151' }}>
              <p>{approveResult.blueprintsCreated} blueprint{approveResult.blueprintsCreated !== 1 ? 's' : ''} generated</p>
              <p>{approveResult.tasksDeployed} task{approveResult.tasksDeployed !== 1 ? 's' : ''} auto-deployed</p>
            </div>
            {approveResult.blueprintsCreated > approveResult.tasksDeployed && (
              <Link
                href={`/labs/structure/deploy?projectId=${projectId}`}
                className="inline-block mt-3 text-xs font-medium hover:underline"
                style={{ color: '#0F766E' }}
              >
                Deploy looped blueprints →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Catalog Picker Modal */}
      {showCatalog && (
        <CatalogPickerModal
          onSelect={handleCatalogSelect}
          onClose={() => setShowCatalog(false)}
        />
      )}
    </div>
  );
}

// ============================================================================
// Line Item Card
// ============================================================================

function LineItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: LineItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="bg-white rounded-xl p-4"
      style={{ border: '1px solid #E5E7EB' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <span className="text-sm font-semibold" style={{ color: '#111827' }}>
            {item.description}
          </span>
          {item.sopCodes && item.sopCodes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.sopCodes.map((code) => (
                <span
                  key={code}
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: '#F0FDFA', color: '#0F766E' }}
                >
                  {code}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ minWidth: '32px', minHeight: '32px' }}
          >
            <Pencil size={14} style={{ color: '#6B7280' }} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            style={{ minWidth: '32px', minHeight: '32px' }}
          >
            <Trash2 size={14} style={{ color: '#EF4444' }} />
          </button>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: '#6B7280' }}>
        <span>{CATEGORY_LABELS[item.category] || item.category}</span>
        <span>
          {item.quantity} {UNIT_LABELS[item.unit] || item.unit} &times; $
          {item.unitCost.toLocaleString()}
        </span>
        <span
          className="font-semibold"
          style={{ color: item.isLabor ? '#3B82F6' : '#F59E0B' }}
        >
          {item.isLabor ? 'Labor' : 'Material'}
        </span>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {item.isLooped && (
            <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ background: '#F3E8FF', color: '#6B21A8' }}>
              <Repeat size={10} />
              {item.loopContextLabel || 'Looped'}
            </span>
          )}
          {item.estimatedHoursPerUnit && item.estimatedHoursPerUnit > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ background: '#EFF6FF', color: '#1E40AF' }}>
              <Clock size={10} />
              {item.estimatedHoursPerUnit}h/unit
            </span>
          )}
        </div>
        <span className="text-sm font-bold" style={{ color: '#111827' }}>
          ${item.totalCost.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Line Item Form
// ============================================================================

function LineItemForm({
  form,
  setForm,
  sops,
  onSave,
  onCancel,
  onToggleSop,
  isSaving,
  isEditing,
}: {
  form: LineItemFormData;
  setForm: React.Dispatch<React.SetStateAction<LineItemFormData>>;
  sops: Sop[];
  onSave: () => void;
  onCancel: () => void;
  onToggleSop: (code: string) => void;
  isSaving: boolean;
  isEditing: boolean;
}) {
  const calculatedTotal = form.quantity * form.unitCost;
  const canSave = form.description.trim() && form.quantity > 0 && form.unitCost > 0;

  return (
    <div
      className="bg-white rounded-xl p-4 space-y-4"
      style={{ border: '2px solid #0F766E' }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>
          {isEditing ? 'Edit Line Item' : 'Add Line Item'}
        </h3>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100">
          <X size={16} style={{ color: '#6B7280' }} />
        </button>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: '#374151' }}>
          Description *
        </label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="e.g., Install LVP flooring"
          className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
          style={{ borderColor: '#D1D5DB', minHeight: '44px' }}
        />
      </div>

      {/* Category + Labor toggle */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: '#374151' }}>
            Category *
          </label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, category: e.target.value as CostCategory }))
            }
            className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            style={{ borderColor: '#D1D5DB', minHeight: '44px' }}
          >
            {Object.values(CostCategory).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat] || cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: '#374151' }}>
            Type *
          </label>
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: '#D1D5DB', minHeight: '44px' }}>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, isLabor: true }))}
              className="flex-1 text-sm font-medium transition-colors"
              style={{
                background: form.isLabor ? '#3B82F6' : '#FFFFFF',
                color: form.isLabor ? '#FFFFFF' : '#6B7280',
              }}
            >
              Labor
            </button>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, isLabor: false }))}
              className="flex-1 text-sm font-medium transition-colors"
              style={{
                background: !form.isLabor ? '#F59E0B' : '#FFFFFF',
                color: !form.isLabor ? '#FFFFFF' : '#6B7280',
              }}
            >
              Material
            </button>
          </div>
        </div>
      </div>

      {/* Quantity + Unit + Unit Cost */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: '#374151' }}>
            Qty *
          </label>
          <input
            type="number"
            value={form.quantity || ''}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))
            }
            min={0}
            step="any"
            className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
            style={{ borderColor: '#D1D5DB', minHeight: '44px' }}
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: '#374151' }}>
            Unit *
          </label>
          <select
            value={form.unit}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, unit: e.target.value as UnitOfMeasure }))
            }
            className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            style={{ borderColor: '#D1D5DB', minHeight: '44px' }}
          >
            {Object.values(UnitOfMeasure).map((u) => (
              <option key={u} value={u}>
                {UNIT_LABELS[u] || u}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: '#374151' }}>
            $/Unit *
          </label>
          <input
            type="number"
            value={form.unitCost || ''}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))
            }
            min={0}
            step="any"
            className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
            style={{ borderColor: '#D1D5DB', minHeight: '44px' }}
          />
        </div>
      </div>

      {/* Calculated total */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: '#F9FAFB' }}>
        <span className="text-xs" style={{ color: '#6B7280' }}>
          {form.quantity} &times; ${form.unitCost.toLocaleString()} =
        </span>
        <span className="text-sm font-bold" style={{ color: '#111827' }}>
          ${calculatedTotal.toLocaleString()}
        </span>
      </div>

      {/* Estimated Hours (for labor items) */}
      {form.isLabor && (
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: '#374151' }}>
            Est. Hours per Unit
          </label>
          <input
            type="number"
            value={form.estimatedHoursPerUnit || ''}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                estimatedHoursPerUnit: parseFloat(e.target.value) || 0,
              }))
            }
            min={0}
            step="0.5"
            placeholder="e.g., 4"
            className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
            style={{ borderColor: '#D1D5DB', minHeight: '44px' }}
          />
        </div>
      )}

      {/* SOP Code Picker */}
      {sops.length > 0 && (
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: '#374151' }}>
            SOP Codes (enables pipeline)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {sops.map((sop) => {
              const selected = form.sopCodes.includes(sop.sopCode);
              return (
                <button
                  key={sop.id}
                  type="button"
                  onClick={() => onToggleSop(sop.sopCode)}
                  className="text-[11px] font-medium px-2 py-1 rounded-full transition-colors"
                  style={{
                    background: selected ? '#0F766E' : '#F3F4F6',
                    color: selected ? '#FFFFFF' : '#6B7280',
                    minHeight: '28px',
                  }}
                >
                  {sop.sopCode} — {sop.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Looped toggle (only when SOP codes selected) */}
      {form.sopCodes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, isLooped: !prev.isLooped }))}
              className="w-10 h-6 rounded-full transition-colors relative"
              style={{ background: form.isLooped ? '#0F766E' : '#D1D5DB' }}
            >
              <div
                className="w-4 h-4 rounded-full bg-white absolute top-1 transition-transform"
                style={{ left: form.isLooped ? '20px' : '4px' }}
              />
            </button>
            <span className="text-xs font-medium" style={{ color: '#374151' }}>
              Looped (per-room deploy)
            </span>
          </div>

          {form.isLooped && (
            <input
              type="text"
              value={form.loopContextLabel}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, loopContextLabel: e.target.value }))
              }
              placeholder="Per Room"
              className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
              style={{ borderColor: '#D1D5DB', minHeight: '44px' }}
            />
          )}
        </div>
      )}

      {/* Save / Cancel */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm font-medium rounded-xl border"
          style={{ borderColor: '#D1D5DB', color: '#6B7280', minHeight: '44px' }}
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!canSave || isSaving}
          className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
          style={{ background: '#0F766E', minHeight: '44px' }}
        >
          {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Add'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Catalog Picker Modal
// ============================================================================

function CatalogPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (item: CatalogItem, matchedLabor?: CatalogItem) => void;
  onClose: () => void;
}) {
  const { services } = useServicesContext();
  const [tabMode, setTabMode] = useState<'material' | 'labor' | 'both'>('both');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Query materials (used by 'material' and 'both' tabs)
  const queryType = tabMode === 'labor' ? 'labor' : 'material';
  const { data, isLoading } = useQuery({
    queryKey: ['catalog', 'picker', queryType, categoryFilter, searchQuery],
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');
      return services.estimating.catalog.findAll({
        type: queryType,
        category: categoryFilter || undefined,
        search: searchQuery || undefined,
        isActive: true,
        sortBy: 'name',
      });
    },
    enabled: !!services,
    staleTime: 30_000,
  });

  const items = data?.items ?? [];

  // Query all labor items (for 'both' tab pairing)
  const { data: laborData } = useQuery({
    queryKey: ['catalog', 'labor-all'],
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');
      return services.estimating.catalog.findAll({ type: 'labor', isActive: true });
    },
    enabled: !!services && tabMode === 'both',
    staleTime: 60_000,
  });

  // Build category → primary labor item map
  const laborByCategory = useMemo(() => {
    const map = new Map<string, CatalogItem>();
    if (!laborData?.items) return map;
    for (const item of laborData.items) {
      if (!map.has(item.category)) {
        map.set(item.category, item);
      }
    }
    return map;
  }, [laborData]);

  // Derive available categories from current query type
  const { data: allForType } = useQuery({
    queryKey: ['catalog', 'categories', queryType],
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');
      return services.estimating.catalog.findAll({ type: queryType, isActive: true });
    },
    enabled: !!services,
    staleTime: 60_000,
  });

  const availableCategories = useMemo(() => {
    if (!allForType?.items) return [];
    const cats = new Set(allForType.items.map((i) => i.category));
    return Array.from(cats).sort();
  }, [allForType]);

  function handleTabChange(mode: 'material' | 'labor' | 'both') {
    setTabMode(mode);
    setCategoryFilter('');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl flex flex-col"
        style={{ background: '#FFFFFF', maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }}>
          <h2 className="text-base font-bold" style={{ color: '#111827' }}>Browse Catalog</h2>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={20} style={{ color: '#6B7280' }} />
          </button>
        </div>

        {/* Type tabs */}
        <div className="flex px-4 pt-3 gap-1.5">
          {([
            { key: 'both' as const, label: 'Material + Labor' },
            { key: 'material' as const, label: 'Materials' },
            { key: 'labor' as const, label: 'Labor' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className="flex-1 min-h-[40px] rounded-lg text-xs font-medium transition-colors"
              style={{
                background: tabMode === key ? '#0F766E' : '#F3F4F6',
                color: tabMode === key ? '#FFFFFF' : '#6B7280',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-4 pt-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: '#9CA3AF' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full min-h-[40px] pl-9 pr-3 rounded-lg text-sm"
              style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', color: '#111827' }}
            />
          </div>
        </div>

        {/* Category pills */}
        {availableCategories.length > 1 && (
          <div className="px-4 pt-2 pb-1">
            <div className="flex gap-1.5 overflow-x-auto">
              <button
                onClick={() => setCategoryFilter('')}
                className="min-h-[32px] px-2.5 rounded-lg text-xs font-medium whitespace-nowrap"
                style={{
                  background: !categoryFilter ? '#0F766E' : '#F3F4F6',
                  color: !categoryFilter ? '#FFFFFF' : '#6B7280',
                }}
              >
                All
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className="min-h-[32px] px-2.5 rounded-lg text-xs font-medium whitespace-nowrap"
                  style={{
                    background: categoryFilter === cat ? '#0F766E' : '#F3F4F6',
                    color: categoryFilter === cat ? '#FFFFFF' : '#6B7280',
                  }}
                >
                  {CATALOG_CATEGORY_LABELS[cat] || cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Item list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ minHeight: '200px' }}>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div
                className="w-8 h-8 border-3 rounded-full animate-spin"
                style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }}
              />
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: '#9CA3AF' }}>
                {searchQuery ? 'No items match your search' : 'No items in this category'}
              </p>
            </div>
          )}

          {items.map((item) => {
            const matched = tabMode === 'both' ? laborByCategory.get(item.category) : undefined;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item, matched)}
                className="w-full text-left p-3 rounded-xl transition-colors hover:bg-gray-50"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#111827' }}>
                      {item.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                      {CATALOG_CATEGORY_LABELS[item.category] || item.category}
                      {item.supplier && ` · ${item.supplier}`}
                    </p>
                    {matched && (
                      <p className="text-xs mt-0.5" style={{ color: '#0F766E' }}>
                        + {matched.name} ${matched.unitCost.toFixed(2)}/{matched.unit}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-semibold" style={{ color: '#0F766E' }}>
                      ${item.unitCost.toFixed(2)}
                    </p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                      /{item.unit}
                    </p>
                    {matched && (
                      <p className="text-[10px] font-medium mt-0.5" style={{ color: '#0F766E' }}>
                        ${(item.unitCost + matched.unitCost).toFixed(2)} total
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
