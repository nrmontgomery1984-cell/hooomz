'use client';

/**
 * Estimate Detail Page — Line item CRUD + Approve button
 *
 * The [id] parameter is the projectId.
 * Line items are the estimate. Approval fires the pipeline.
 */

import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Repeat,
  Clock,
  Search,
  BookOpen,
  ChevronDown,
  MapPin,
  Send,
  Hammer,
  ChevronRight,
  Camera,
  Package,
  Wrench,
  Compass,
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
import { useSops, useSopByCode, useSopChecklistItems, useLabsKnowledgeItems, useLabsActiveExperiments, useCreateKnowledgeItem, useCreateExperiment } from '@/lib/hooks/useLabsData';
import { useEffectiveCatalog } from '@/lib/hooks/useCostCatalog';
import { getSOPById } from '@/lib/data/sops';
import { resolveLineItemBreakdown } from '@/lib/utils/lineItemMaterials';
import {
  resolveThreeAxes,
  getTradeDisplayName,
  getStageDisplayName,
  getTradeIcon,
  getStageColor,
  getLocationIcon,
  getTradeOrder,
  getStageOrder,
  inferWorkCategoryCode,
} from '@/lib/utils/axisMapping';
import { TRADE_CODES, STAGE_CODES, ROOM_LOCATIONS } from '@/lib/types/intake.types';
import { EstimateFilterBar, type GroupMode, type EstimateFilterValues } from '@/components/estimates/EstimateFilterBar';
import { EstimateGroupSection } from '@/components/estimates/EstimateGroupSection';
import type { CostCatalog } from '@/lib/types/costCatalog.types';
import { CostCategory, UnitOfMeasure, ProjectStatus } from '@hooomz/shared-contracts';
import type { CreateLineItem, LineItem, Sop } from '@hooomz/shared-contracts';
import type { CatalogItem } from '@hooomz/estimating';
import { useProjectMutations } from '@/lib/hooks/useActivityMutations';

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
  workCategoryCode: string;
  stageCode: string;
  locationLabel: string;
}

type ViewMode = 'project' | 'labs';
type TypeFilter = 'all' | 'material' | 'labor';

interface ProjectAnnotation {
  type: 'warning' | 'info' | 'risk';
  label: string;
}

interface LabsAnnotation {
  category: 'recent' | 'ongoing' | 'upcoming';
  label: string;
  detail?: string;
  actionHref?: string;
  actionLabel?: string;
}

interface SummaryFlag {
  key: string;
  type: ProjectAnnotation['type'];
  label: string;
  actionLabel: string;
  affectedItemIds: string[];
  acknowledgeOptions: string[];
}

interface FlagAcknowledgement {
  reason: string;
  note?: string;
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
  workCategoryCode: 'FL',
  stageCode: 'ST-FN',
  locationLabel: 'General',
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
  const { updateProjectStatus } = useProjectMutations();
  const queryClient = useQueryClient();

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [matchedLabor, setMatchedLabor] = useState<CatalogItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LineItemFormData>(EMPTY_FORM);
  const [approveResult, setApproveResult] = useState<{
    blueprintsCreated: number;
    tasksDeployed: number;
    missingSopCodes: string[];
    loopedPending: number;
    totalLineItems: number;
    pipelineEligible: number;
  } | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  const isLoading = projectLoading || itemsLoading;

  // Filter state
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('project');

  // Three-axis grouping & filtering
  const [groupMode, setGroupMode] = useState<GroupMode>('location');
  const [axisFilters, setAxisFilters] = useState<EstimateFilterValues>({
    workCategoryCode: null,
    stageCode: null,
    locationLabel: null,
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Interactive flags
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);
  const [acknowledgedFlags, setAcknowledgedFlags] = useState<Record<string, FlagAcknowledgement>>({});
  const [showAckPrompt, setShowAckPrompt] = useState<string | null>(null);

  // Cost catalog (for materials breakdown)
  const catalog = useEffectiveCatalog();

  // Labs data
  const { data: knowledgeItems = [] } = useLabsKnowledgeItems();
  const { data: activeExperiments = [] } = useLabsActiveExperiments();
  const createKnowledge = useCreateKnowledgeItem();
  const createExperiment = useCreateExperiment();

  // Totals (must come before advanceStatus which references totals.total)
  const totals = useMemo(() => {
    const laborTotal = lineItems
      .filter((i) => i.isLabor)
      .reduce((sum, i) => sum + i.totalCost, 0);
    const materialTotal = lineItems
      .filter((i) => !i.isLabor)
      .reduce((sum, i) => sum + i.totalCost, 0);
    return { laborTotal, materialTotal, total: laborTotal + materialTotal };
  }, [lineItems]);

  // Status advancement
  const [statusUpdating, setStatusUpdating] = useState(false);
  const advanceStatus = useCallback(async (newStatus: ProjectStatus) => {
    if (!project || statusUpdating) return;
    setStatusUpdating(true);
    setApproveError(null);
    try {
      // Only QUOTED → APPROVED triggers the full pipeline (generates tasks from SOPs)
      if (newStatus === ProjectStatus.APPROVED) {
        const result = await approveAndGenerate(projectId, projectId, {
          total_amount: totals.total,
        });
        setApproveResult(result);
      } else {
        await updateProjectStatus(projectId, newStatus, project.status as ProjectStatus);
      }
      queryClient.invalidateQueries({ queryKey: ['local', 'projects'] });
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : 'Status update failed');
    } finally {
      setStatusUpdating(false);
    }
  }, [project, projectId, updateProjectStatus, approveAndGenerate, queryClient, statusUpdating, totals.total]);

  // Expanded line item
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const toggleExpand = useCallback((id: string) => {
    setExpandedItemId(prev => prev === id ? null : id);
  }, []);

  // Change order gate — post-quote additions require a change order
  const POST_QUOTE_STATUSES = [ProjectStatus.QUOTED, ProjectStatus.APPROVED, ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETE];
  const isPostQuote = !!project && POST_QUOTE_STATUSES.includes(project.status as ProjectStatus);

  // Context-aware labeling: "Estimate" early in pipeline, "Quote" after site visit
  const QUOTE_STAGE_STATUSES = [ProjectStatus.SITE_VISIT, ProjectStatus.QUOTED, ProjectStatus.APPROVED, ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETE];
  const isQuoteStage = !!project && QUOTE_STAGE_STATUSES.includes(project.status as ProjectStatus);
  const pricingLabel = isQuoteStage ? 'Quote' : 'Estimate';

  // Enriched items — resolve three-axis values (backwards compat)
  const enrichedItems = useMemo(() => {
    return lineItems.map((item) => ({
      ...item,
      ...resolveThreeAxes(item as Parameters<typeof resolveThreeAxes>[0]),
    }));
  }, [lineItems]);

  // Filtered items — type filter + axis filters
  const materialCount = lineItems.filter(i => !i.isLabor).length;
  const laborCount = lineItems.length - materialCount;
  const filteredItems = useMemo(() => {
    let items = enrichedItems;
    // Type filter
    if (typeFilter === 'material') items = items.filter(i => !i.isLabor);
    else if (typeFilter === 'labor') items = items.filter(i => i.isLabor);
    // Axis filters (AND logic)
    if (axisFilters.workCategoryCode) items = items.filter(i => i.workCategoryCode === axisFilters.workCategoryCode);
    if (axisFilters.stageCode) items = items.filter(i => i.stageCode === axisFilters.stageCode);
    if (axisFilters.locationLabel) items = items.filter(i => i.locationLabel === axisFilters.locationLabel);
    return items;
  }, [enrichedItems, typeFilter, axisFilters]);

  // Grouped items — group by selected axis, sort groups + items within
  const groupedItems = useMemo(() => {
    const groups = new Map<string, typeof filteredItems>();
    for (const item of filteredItems) {
      const key = groupMode === 'location' ? item.locationLabel
        : groupMode === 'category' ? item.workCategoryCode
        : item.stageCode;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    // Sort groups
    const sorted = Array.from(groups.entries()).sort(([a], [b]) => {
      if (groupMode === 'category') return getTradeOrder(a) - getTradeOrder(b);
      if (groupMode === 'stage') return getStageOrder(a) - getStageOrder(b);
      return a.localeCompare(b); // location: alphabetical
    });
    // Sort items within each group by the other two axes
    for (const [, items] of sorted) {
      items.sort((a, b) => {
        if (groupMode !== 'category') {
          const d = getTradeOrder(a.workCategoryCode) - getTradeOrder(b.workCategoryCode);
          if (d !== 0) return d;
        }
        if (groupMode !== 'stage') {
          const d = getStageOrder(a.stageCode) - getStageOrder(b.stageCode);
          if (d !== 0) return d;
        }
        if (groupMode !== 'location') {
          return a.locationLabel.localeCompare(b.locationLabel);
        }
        return 0;
      });
    }
    return sorted;
  }, [filteredItems, groupMode]);

  const toggleGroupCollapse = useCallback((key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

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
    const axes = resolveThreeAxes(item as Parameters<typeof resolveThreeAxes>[0]);
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
      workCategoryCode: axes.workCategoryCode,
      stageCode: axes.stageCode,
      locationLabel: axes.locationLabel,
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
      workCategoryCode: form.workCategoryCode,
      stageCode: form.stageCode,
      locationLabel: form.locationLabel,
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

  function handleCatalogSelect(item: CatalogItem, labor?: CatalogItem) {
    const costCat = CATALOG_TO_COST_CATEGORY[item.category] || CostCategory.MATERIALS;
    setForm((prev) => ({
      ...prev,
      description: item.name,
      unitCost: item.unitCost,
      unit: CATALOG_TO_UNIT[item.unit] || UnitOfMeasure.EACH,
      isLabor: item.type === 'labor',
      category: costCat,
      workCategoryCode: inferWorkCategoryCode(costCat),
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
              {pricingLabel}s
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

      <div className="max-w-lg mx-auto px-4 mt-3 space-y-2">
        {/* Summary Card */}
        {lineItems.length > 0 && (
          <div
            className="bg-white rounded-xl px-4 py-2.5"
            style={{ border: '1px solid #E5E7EB' }}
          >
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>Labor</div>
                <div className="text-sm font-bold" style={{ color: '#3B82F6' }}>${totals.laborTotal.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>Materials</div>
                <div className="text-sm font-bold" style={{ color: '#F59E0B' }}>${totals.materialTotal.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>Total</div>
                <div className="text-base font-bold" style={{ color: '#111827' }}>${totals.total.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        {lineItems.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {/* Type filter */}
              <div className="flex gap-1">
                {([
                  { key: 'all' as TypeFilter, label: 'All', count: lineItems.length },
                  { key: 'material' as TypeFilter, label: 'Material', count: materialCount },
                  { key: 'labor' as TypeFilter, label: 'Labor', count: laborCount },
                ]).map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setTypeFilter(key)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors"
                    style={{
                      background: typeFilter === key ? '#111827' : '#F3F4F6',
                      color: typeFilter === key ? '#FFFFFF' : '#6B7280',
                    }}
                  >
                    {label} {count}
                  </button>
                ))}
              </div>
              {/* View toggle */}
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                {([
                  { key: 'project' as ViewMode, label: 'Project' },
                  { key: 'labs' as ViewMode, label: 'Labs' },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setViewMode(key)}
                    className="text-[11px] font-medium px-2.5 py-1 transition-colors"
                    style={{
                      background: viewMode === key ? '#0F766E' : '#FFFFFF',
                      color: viewMode === key ? '#FFFFFF' : '#6B7280',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Three-axis grouping + filtering */}
            <EstimateFilterBar
              items={enrichedItems as Parameters<typeof EstimateFilterBar>[0]['items']}
              groupMode={groupMode}
              onGroupModeChange={setGroupMode}
              filters={axisFilters}
              onFiltersChange={setAxisFilters}
            />
          </div>
        )}

        {/* Project view — interactive summary flags */}
        {viewMode === 'project' && (() => {
          const flags = getEstimateSummaryFlags(lineItems);
          if (flags.length === 0) return null;
          return (
            <div className="space-y-1.5">
              {flags.map(flag => {
                const isAcked = !!acknowledgedFlags[flag.key];
                const isExpanded = expandedFlag === flag.key;
                const isPrompting = showAckPrompt === flag.key;
                const affected = lineItems.filter(i => flag.affectedItemIds.includes(i.id));
                return (
                  <div
                    key={flag.key}
                    className="rounded-xl overflow-hidden"
                    style={{
                      background: isAcked ? '#F0FDF4' : '#FFFBEB',
                      border: `1px solid ${isAcked ? '#BBF7D0' : '#FDE68A'}`,
                    }}
                  >
                    {/* Flag header — tap to expand */}
                    <button
                      onClick={() => setExpandedFlag(isExpanded ? null : flag.key)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left"
                      style={{ minHeight: '40px' }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: isAcked ? '#10B981' : '#F59E0B' }}
                      />
                      <div className="flex-1 min-w-0">
                        <span
                          className="text-[11px] font-medium"
                          style={{
                            color: isAcked ? '#065F46' : '#92400E',
                            textDecoration: isAcked ? 'line-through' : 'none',
                          }}
                        >
                          {flag.label}
                        </span>
                        {!isAcked && (
                          <span className="text-[10px] ml-1" style={{ color: '#B45309' }}>
                            — {flag.actionLabel}
                          </span>
                        )}
                        {isAcked && (
                          <span className="text-[10px] ml-1" style={{ color: '#065F46' }}>
                            — {acknowledgedFlags[flag.key].reason}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] flex-shrink-0" style={{ color: '#9CA3AF' }}>
                        {isExpanded ? '\u25B2' : '\u25BC'}
                      </span>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        {/* Affected items */}
                        <div className="space-y-0.5 pt-1">
                          {affected.map(item => (
                            <div key={item.id} className="flex items-center gap-2 py-1">
                              <span
                                className="w-1 h-4 rounded-full flex-shrink-0"
                                style={{ background: item.isLabor ? '#3B82F6' : '#F59E0B' }}
                              />
                              <span className="text-[11px] flex-1 truncate" style={{ color: '#374151' }}>
                                {item.description}
                              </span>
                              <span className="text-[10px] flex-shrink-0" style={{ color: '#9CA3AF' }}>
                                ${item.totalCost.toLocaleString()}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditForm(item);
                                  setExpandedFlag(null);
                                  // Scroll to form after React render
                                  setTimeout(() => {
                                    document.getElementById('line-item-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }, 100);
                                }}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded"
                                style={{ background: '#0F766E', color: '#FFFFFF', minHeight: '24px' }}
                              >
                                Edit
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Acknowledge prompt */}
                        {!isAcked && !isPrompting && (
                          <button
                            onClick={() => setShowAckPrompt(flag.key)}
                            className="w-full text-[11px] font-medium py-1.5 rounded-lg"
                            style={{ background: '#F3F4F6', color: '#6B7280', minHeight: '32px' }}
                          >
                            Acknowledge — proceed anyway
                          </button>
                        )}

                        {/* Reason picker */}
                        {isPrompting && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold" style={{ color: '#374151' }}>
                              Why proceed?
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {flag.acknowledgeOptions.map(reason => (
                                <button
                                  key={reason}
                                  onClick={() => {
                                    setAcknowledgedFlags(prev => ({ ...prev, [flag.key]: { reason } }));
                                    setShowAckPrompt(null);
                                  }}
                                  className="text-[10px] font-medium px-2.5 py-1 rounded-full"
                                  style={{ background: '#E5E7EB', color: '#374151', minHeight: '28px' }}
                                >
                                  {reason}
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => setShowAckPrompt(null)}
                              className="text-[10px] py-1"
                              style={{ color: '#9CA3AF' }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* Undo acknowledge */}
                        {isAcked && (
                          <button
                            onClick={() => {
                              setAcknowledgedFlags(prev => {
                                const next = { ...prev };
                                delete next[flag.key];
                                return next;
                              });
                            }}
                            className="text-[10px] font-medium py-1"
                            style={{ color: '#991B1B' }}
                          >
                            Reopen this flag
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Line Items — grouped by axis */}
        {groupedItems.length > 0 ? (
          <div className="space-y-2">
            {groupedItems.map(([groupKey, items]) => {
              const icon = groupMode === 'category' ? getTradeIcon(groupKey)
                : groupMode === 'location' ? getLocationIcon(groupKey)
                : '';
              const label = groupMode === 'category' ? getTradeDisplayName(groupKey)
                : groupMode === 'stage' ? getStageDisplayName(groupKey)
                : groupKey;
              const accentColor = groupMode === 'stage' ? getStageColor(groupKey) : undefined;
              const subtotal = items.reduce((sum, i) => sum + i.totalCost, 0);
              const isCollapsed = collapsedGroups.has(groupKey);

              return (
                <EstimateGroupSection
                  key={groupKey}
                  label={label}
                  icon={icon}
                  itemCount={items.length}
                  subtotal={subtotal}
                  accentColor={accentColor}
                  isCollapsed={isCollapsed}
                  onToggleCollapse={() => toggleGroupCollapse(groupKey)}
                >
                  <div className="bg-white rounded-b-xl overflow-hidden" style={{ border: '1px solid #E5E7EB', borderTop: 'none' }}>
                    {items.map((item, i) => (
                      <LineItemRow
                        key={item.id}
                        item={item}
                        isLast={i === items.length - 1}
                        onEdit={() => openEditForm(item)}
                        onDelete={() => handleDelete(item.id)}
                        viewMode={viewMode}
                        catalog={catalog}
                        projectAnnotations={viewMode === 'project' ? getProjectAnnotations(item, lineItems) : undefined}
                        labsAnnotations={viewMode === 'labs' ? getLabsAnnotations(item, knowledgeItems, activeExperiments) : undefined}
                        isExpanded={expandedItemId === item.id}
                        onToggleExpand={() => toggleExpand(item.id)}
                        onCreateKnowledge={createKnowledge.mutateAsync}
                        onCreateExperiment={createExperiment.mutateAsync}
                      />
                    ))}
                  </div>
                </EstimateGroupSection>
              );
            })}
          </div>
        ) : lineItems.length > 0 ? (
          <div className="bg-white rounded-xl p-4 text-center" style={{ border: '1px solid #E5E7EB' }}>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              No matching items
            </p>
          </div>
        ) : null}

        {/* Add Line Item Buttons */}
        {!showForm && !approveResult && (
          isPostQuote ? (
            <div
              className="flex items-center gap-2 px-3 py-3 rounded-xl text-xs"
              style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}
            >
              <span className="font-medium">New items require a change order.</span>
              <span className="text-[10px]" style={{ color: '#B45309' }}>
                Quote has been generated — modifications to scope need approval.
              </span>
            </div>
          ) : (
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
          )
        )}

        {/* Line Item Form */}
        {showForm && (
          <div id="line-item-form">
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
          </div>
        )}

        {/* Approve error (shown if NextSteps quote approval fails) */}
        {approveError && (
          <div className="pt-4">
            <p className="text-xs text-center" style={{ color: '#EF4444' }}>
              {approveError}
            </p>
          </div>
        )}

        {/* Approval Result */}
        {approveResult && (
          <div
            className="bg-white rounded-xl p-4"
            style={{ border: `2px solid ${approveResult.missingSopCodes.length > 0 && approveResult.blueprintsCreated === 0 ? '#F59E0B' : '#10B981'}` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: approveResult.missingSopCodes.length > 0 && approveResult.blueprintsCreated === 0 ? '#FEF3C7' : '#D1FAE5' }}
              >
                <Check size={16} style={{ color: approveResult.missingSopCodes.length > 0 && approveResult.blueprintsCreated === 0 ? '#92400E' : '#065F46' }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: approveResult.missingSopCodes.length > 0 && approveResult.blueprintsCreated === 0 ? '#92400E' : '#065F46' }}>
                {pricingLabel} Approved
              </span>
            </div>
            <div className="space-y-1 text-sm" style={{ color: '#374151' }}>
              <p>{approveResult.blueprintsCreated} blueprint{approveResult.blueprintsCreated !== 1 ? 's' : ''} generated</p>
              <p>{approveResult.tasksDeployed} task{approveResult.tasksDeployed !== 1 ? 's' : ''} auto-deployed</p>
              {approveResult.loopedPending > 0 && (
                <p className="text-xs" style={{ color: '#6B7280' }}>
                  {approveResult.loopedPending} looped blueprint{approveResult.loopedPending !== 1 ? 's' : ''} pending deployment
                </p>
              )}
            </div>

            {/* Warning: missing SOP records */}
            {approveResult.missingSopCodes.length > 0 && (
              <div
                className="mt-3 rounded-lg p-2.5"
                style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: '#92400E' }}>
                  {approveResult.missingSopCodes.length} SOP{approveResult.missingSopCodes.length !== 1 ? 's' : ''} not found in database
                </p>
                <p className="text-[11px]" style={{ color: '#A16207' }}>
                  {approveResult.missingSopCodes.join(', ')}
                </p>
                <Link
                  href="/labs/seed"
                  className="inline-block mt-1.5 text-[11px] font-medium hover:underline"
                  style={{ color: '#0F766E' }}
                >
                  Load seed data to create SOP records →
                </Link>
              </div>
            )}

            {/* Warning: no pipeline-eligible items */}
            {approveResult.pipelineEligible === 0 && approveResult.totalLineItems > 0 && (
              <div
                className="mt-3 rounded-lg p-2.5"
                style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
              >
                <p className="text-xs font-semibold" style={{ color: '#92400E' }}>
                  No line items have SOP codes linked
                </p>
                <p className="text-[11px]" style={{ color: '#A16207' }}>
                  {approveResult.totalLineItems} line item{approveResult.totalLineItems !== 1 ? 's' : ''} found but none have SOP codes. Link SOPs to enable task generation.
                </p>
              </div>
            )}

            {approveResult.blueprintsCreated > approveResult.tasksDeployed && approveResult.blueprintsCreated > 0 && (
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

        {/* Next Steps — project lifecycle progression */}
        {project && project.status !== 'complete' && project.status !== 'cancelled' && (
          <NextStepsCard
            projectStatus={project.status as string}
            projectId={projectId}
            onAdvance={advanceStatus}
            isUpdating={statusUpdating}
          />
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
// Next Steps Card — project lifecycle progression after estimate approval
// ============================================================================

const LIFECYCLE_STEPS: {
  status: string;
  label: string;
  description: string;
  actionLabel: string;
  targetStatus: ProjectStatus;
  icon: typeof MapPin;
}[] = [
  {
    status: 'lead',
    label: 'Start Discovery',
    description: 'Review intake data, begin client discovery process',
    actionLabel: 'Begin Discovery',
    targetStatus: ProjectStatus.DISCOVERY,
    icon: Compass,
  },
  {
    status: 'discovery',
    label: 'Schedule Site Visit',
    description: 'Discovery complete — schedule on-site visit to verify scope and take measurements',
    actionLabel: 'Site Visit Done',
    targetStatus: ProjectStatus.SITE_VISIT,
    icon: MapPin,
  },
  {
    status: 'site-visit',
    label: 'Build Quote',
    description: 'Refine line items from site visit measurements, finalize pricing',
    actionLabel: 'Mark as Quoted',
    targetStatus: ProjectStatus.QUOTED,
    icon: Send,
  },
  {
    status: 'quoted',
    label: 'Client Approval',
    description: 'Quote sent to homeowner — waiting for sign-off',
    actionLabel: 'Quote Approved',
    targetStatus: ProjectStatus.APPROVED,
    icon: Check,
  },
  {
    status: 'approved',
    label: 'Start Construction',
    description: 'Order materials, schedule crew, begin work',
    actionLabel: 'Begin Construction',
    targetStatus: ProjectStatus.IN_PROGRESS,
    icon: Hammer,
  },
];

function NextStepsCard({
  projectStatus,
  projectId,
  onAdvance,
  isUpdating,
}: {
  projectStatus: string;
  projectId: string;
  onAdvance: (status: ProjectStatus) => void;
  isUpdating: boolean;
}) {
  // Determine current step index
  const statusOrder = ['lead', 'discovery', 'site-visit', 'quoted', 'approved', 'in-progress', 'complete'];
  const currentIdx = statusOrder.indexOf(projectStatus);

  // Find the next actionable step
  const nextStep = LIFECYCLE_STEPS.find((step) => {
    const stepIdx = statusOrder.indexOf(step.status);
    return stepIdx >= currentIdx;
  });

  if (!nextStep && projectStatus !== 'in-progress') return null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
          Next Steps
        </p>
      </div>

      <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
        {LIFECYCLE_STEPS.map((step) => {
          const stepIdx = statusOrder.indexOf(step.status);
          const isComplete = stepIdx < currentIdx;
          const isCurrent = stepIdx === currentIdx;
          const isFuture = stepIdx > currentIdx;
          const Icon = step.icon;

          return (
            <div
              key={step.status}
              className="px-4 py-3 flex items-center gap-3"
              style={{ opacity: isFuture ? 0.45 : 1 }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: isComplete ? '#D1FAE5' : isCurrent ? '#F0FDFA' : '#F3F4F6',
                  border: isCurrent ? '2px solid #0F766E' : 'none',
                }}
              >
                {isComplete ? (
                  <Check size={14} style={{ color: '#065F46' }} />
                ) : (
                  <Icon size={14} style={{ color: isCurrent ? '#0F766E' : '#9CA3AF' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium"
                  style={{ color: isComplete ? '#6B7280' : '#111827' }}
                >
                  {step.label}
                </p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>
                  {step.description}
                </p>
              </div>
              {isCurrent && (
                <button
                  onClick={() => onAdvance(step.targetStatus)}
                  disabled={isUpdating}
                  className="min-h-[36px] px-3 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 flex-shrink-0"
                  style={{ background: isUpdating ? '#9CA3AF' : '#0F766E' }}
                >
                  {isUpdating ? 'Updating...' : step.actionLabel}
                  {!isUpdating && <ChevronRight size={14} />}
                </button>
              )}
              {isComplete && (
                <Check size={16} style={{ color: '#10B981' }} className="flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Project link */}
      {projectStatus === 'in-progress' && (
        <div className="px-4 py-3" style={{ borderTop: '1px solid #F3F4F6', background: '#F9FAFB' }}>
          <Link
            href={`/projects/${projectId}`}
            className="text-xs font-medium flex items-center gap-1 hover:underline"
            style={{ color: '#0F766E' }}
          >
            View Project <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Annotation Helpers
// ============================================================================

function getProjectAnnotations(item: LineItem, allItems: LineItem[]): ProjectAnnotation[] {
  const annotations: ProjectAnnotation[] = [];

  // Determine what's "normal" for this estimate — only flag outliers
  const sopCount = allItems.filter(i => i.sopCodes && i.sopCodes.length > 0).length;
  const mostHaveSops = sopCount > allItems.length / 2;
  const laborItems = allItems.filter(i => i.isLabor);
  const laborWithHours = laborItems.filter(i => i.estimatedHoursPerUnit && i.estimatedHoursPerUnit > 0).length;
  const mostLaborHasHours = laborWithHours > laborItems.length / 2;

  // --- Confirmation flags (true outliers — always check) ---
  if (item.quantity % 1 !== 0 && !['sqft', 'lf', 'cy', 'gal', 'lb', 'ton'].includes(item.unit)) {
    annotations.push({ type: 'warning', label: 'Fractional qty — confirm' });
  }
  if (allItems.some(o => o.id !== item.id && o.description.toLowerCase() === item.description.toLowerCase())) {
    annotations.push({ type: 'warning', label: 'Possible duplicate' });
  }

  // --- Lead time (threshold-based) ---
  if (!item.isLabor && item.totalCost >= 2000) {
    annotations.push({ type: 'info', label: 'Verify lead time' });
  }

  // --- Risk (only flag when this item is the EXCEPTION, not the norm) ---
  if (mostHaveSops && (!item.sopCodes || item.sopCodes.length === 0)) {
    annotations.push({ type: 'risk', label: 'No SOP linked' });
  }
  if (mostLaborHasHours && item.isLabor && (!item.estimatedHoursPerUnit || item.estimatedHoursPerUnit === 0)) {
    annotations.push({ type: 'risk', label: 'No hours estimate' });
  }

  return annotations;
}

/** Summary-level flags shown as interactive expandable rows above line items */
function getEstimateSummaryFlags(items: LineItem[]): SummaryFlag[] {
  const flags: SummaryFlag[] = [];

  const noSopItems = items.filter(i => !i.sopCodes || i.sopCodes.length === 0);
  if (noSopItems.length > 0 && noSopItems.length >= items.length / 2) {
    flags.push({
      key: 'no-sop',
      type: 'info',
      label: `${noSopItems.length} of ${items.length} items need SOP codes`,
      actionLabel: 'Link SOPs to enable task pipeline',
      affectedItemIds: noSopItems.map(i => i.id),
      acknowledgeOptions: ['Not applicable for this work', 'Will add before approval', 'Using alternative procedure'],
    });
  }

  const laborItems = items.filter(i => i.isLabor);
  const noHoursItems = laborItems.filter(i => !i.estimatedHoursPerUnit || i.estimatedHoursPerUnit === 0);
  if (noHoursItems.length > 0 && noHoursItems.length >= laborItems.length / 2) {
    flags.push({
      key: 'no-hours',
      type: 'info',
      label: `${noHoursItems.length} of ${laborItems.length} labor items need hours estimates`,
      actionLabel: 'Required for budgeting',
      affectedItemIds: noHoursItems.map(i => i.id),
      acknowledgeOptions: ['Fixed-price contract', 'Will estimate during work', 'Hours included in material cost'],
    });
  }

  const highValueItems = items.filter(i => !i.isLabor && i.totalCost >= 2000);
  if (highValueItems.length > 0) {
    flags.push({
      key: 'lead-time',
      type: 'warning',
      label: `${highValueItems.length} material${highValueItems.length > 1 ? 's' : ''} over $2k`,
      actionLabel: 'Confirm lead times before scheduling',
      affectedItemIds: highValueItems.map(i => i.id),
      acknowledgeOptions: ['Confirmed with supplier', 'In stock locally', 'Acceptable delay'],
    });
  }

  return flags;
}

function getLabsAnnotations(
  item: LineItem,
  knowledgeItems: { title: string; category: string; status: string; confidenceScore: number; tags?: string[]; nextReviewDate?: string }[],
  experiments: { title: string; status: string; matchCriteria: { workCategories?: string[] } }[],
): LabsAnnotation[] {
  const annotations: LabsAnnotation[] = [];
  const cat = item.category.replace(/[-_]/g, ' ').toLowerCase();
  const catLabel = CATEGORY_LABELS[item.category] || item.category;
  const sopCodes = item.sopCodes || [];

  const matchesCategory = (wcs: string[] | undefined) =>
    wcs?.some(wc => {
      const w = wc.replace(/[-_]/g, ' ').toLowerCase();
      return w.includes(cat) || cat.includes(w);
    });

  // --- Recent: published knowledge items matching category or SOP tags ---
  const relevant = knowledgeItems.filter(k =>
    k.status === 'published' && (
      k.category?.toLowerCase().includes(cat) ||
      cat.includes(k.category?.toLowerCase() || '') ||
      k.tags?.some(t => sopCodes.includes(t))
    )
  ).slice(0, 2);

  if (relevant.length > 0) {
    for (const k of relevant) {
      annotations.push({ category: 'recent', label: k.title, detail: `${k.confidenceScore}%` });
    }
  } else {
    annotations.push({
      category: 'recent',
      label: `No research data for ${catLabel}`,
      detail: 'gap',
      actionLabel: 'Track',
      actionHref: `/labs/knowledge?category=${encodeURIComponent(cat)}&action=new`,
    });
  }

  // --- Ongoing: active experiments ---
  const ongoing = experiments.filter(e =>
    e.status === 'active' && matchesCategory(e.matchCriteria?.workCategories)
  ).slice(0, 1);

  if (ongoing.length > 0) {
    for (const e of ongoing) {
      annotations.push({ category: 'ongoing', label: e.title });
    }
  } else {
    annotations.push({
      category: 'ongoing',
      label: `No active experiments for ${catLabel}`,
      detail: 'gap',
      actionLabel: 'Create',
      actionHref: `/labs/experiments?category=${encodeURIComponent(cat)}&action=new`,
    });
  }

  // --- Upcoming: draft experiments + knowledge items due for review ---
  const upcoming = experiments.filter(e =>
    e.status === 'draft' && matchesCategory(e.matchCriteria?.workCategories)
  ).slice(0, 1);
  for (const e of upcoming) {
    annotations.push({ category: 'upcoming', label: e.title });
  }

  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const dueForReview = knowledgeItems.filter(k =>
    k.nextReviewDate && new Date(k.nextReviewDate) <= thirtyDays &&
    (k.category?.toLowerCase().includes(cat) || cat.includes(k.category?.toLowerCase() || ''))
  ).slice(0, 1);
  for (const k of dueForReview) {
    annotations.push({
      category: 'upcoming',
      label: `Review: ${k.title}`,
      detail: new Date(k.nextReviewDate!).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
    });
  }

  if (upcoming.length === 0 && dueForReview.length === 0) {
    annotations.push({
      category: 'upcoming',
      label: `Consider testing ${catLabel}`,
      detail: 'gap',
      actionLabel: 'Plan',
      actionHref: `/labs/experiments?category=${encodeURIComponent(cat)}&action=plan`,
    });
  }

  return annotations;
}

// ============================================================================
// Line Item Row — compact list row
// ============================================================================

function LineItemRow({
  item,
  isLast,
  onEdit,
  onDelete,
  viewMode = 'project',
  catalog,
  projectAnnotations,
  labsAnnotations,
  isExpanded = false,
  onToggleExpand,
  onCreateKnowledge,
  onCreateExperiment,
}: {
  item: LineItem;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  viewMode?: ViewMode;
  catalog: CostCatalog;
  projectAnnotations?: ProjectAnnotation[];
  labsAnnotations?: LabsAnnotation[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onCreateKnowledge?: (data: any) => Promise<any>;
  onCreateExperiment?: (data: any) => Promise<any>;
}) {
  const [quickCreateMode, setQuickCreateMode] = useState<'knowledge' | 'experiment' | null>(null);
  const [quickCreateTitle, setQuickCreateTitle] = useState('');
  const [quickCreateSaving, setQuickCreateSaving] = useState(false);
  const [quickCreateDone, setQuickCreateDone] = useState<string | null>(null);

  const annColors = {
    warning: { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' },
    info: { bg: '#F0F9FF', text: '#1E40AF', dot: '#3B82F6' },
    risk: { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' },
  };
  const labsColors = {
    recent: { text: '#065F46', dot: '#10B981' },
    ongoing: { text: '#5B21B6', dot: '#7C3AED' },
    upcoming: { text: '#1E40AF', dot: '#3B82F6' },
  };

  const catLabel = CATEGORY_LABELS[item.category] || item.category;

  async function handleQuickCreate() {
    if (!quickCreateTitle.trim()) return;
    setQuickCreateSaving(true);
    try {
      if (quickCreateMode === 'knowledge' && onCreateKnowledge) {
        await onCreateKnowledge({
          knowledgeType: 'material' as const,
          category: item.category,
          title: quickCreateTitle.trim(),
          summary: `Tracking ${catLabel} data from estimate line item: ${item.description}`,
          confidenceScore: 0,
          lastConfidenceUpdate: new Date().toISOString(),
          observationCount: 0,
          experimentCount: 0,
          status: 'draft' as const,
          createdBy: 'estimate-page',
          tags: item.sopCodes || [],
        });
        setQuickCreateDone('Knowledge item created');
      } else if (quickCreateMode === 'experiment' && onCreateExperiment) {
        await onCreateExperiment({
          title: quickCreateTitle.trim(),
          knowledgeType: 'material' as const,
          status: 'draft' as const,
          testVariables: [],
          matchCriteria: { workCategories: [item.category] },
          requiredSampleSize: 3,
          currentSampleCounts: {},
          checkpoints: [],
          designedBy: 'estimate-page',
        });
        setQuickCreateDone('Experiment created');
      }
      setTimeout(() => {
        setQuickCreateDone(null);
        setQuickCreateMode(null);
        setQuickCreateTitle('');
      }, 2000);
    } catch {
      setQuickCreateDone('Error — try again');
      setTimeout(() => setQuickCreateDone(null), 2000);
    } finally {
      setQuickCreateSaving(false);
    }
  }

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid #F3F4F6' }}>
      {/* Main row — tap to expand */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        style={{ minHeight: '44px' }}
      >
        {/* Labor/Material indicator */}
        <div
          className="w-1 h-8 rounded-full flex-shrink-0"
          style={{ background: item.isLabor ? '#3B82F6' : '#F59E0B' }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[13px] font-medium truncate" style={{ color: '#111827' }}>
              {item.description}
            </span>
            {item.sopCodes && item.sopCodes.length > 0 && (
              <span className="text-[9px] font-medium px-1 rounded" style={{ background: '#F0FDFA', color: '#0F766E', flexShrink: 0 }}>
                {item.sopCodes[0]}{item.sopCodes.length > 1 ? ` +${item.sopCodes.length - 1}` : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#9CA3AF' }}>
            <span>{item.quantity} {UNIT_LABELS[item.unit] || item.unit} &times; ${item.unitCost.toLocaleString()}</span>
            {item.isLooped && (
              <span className="flex items-center gap-0.5" style={{ color: '#6B21A8' }}>
                <Repeat size={8} />
                {item.loopContextLabel || 'Looped'}
              </span>
            )}
            {item.estimatedHoursPerUnit && item.estimatedHoursPerUnit > 0 && (
              <span className="flex items-center gap-0.5" style={{ color: '#1E40AF' }}>
                <Clock size={8} />
                {item.estimatedHoursPerUnit}h/u
              </span>
            )}
          </div>
        </div>

        {/* Total */}
        <span className="text-[13px] font-semibold flex-shrink-0" style={{ color: '#111827' }}>
          ${item.totalCost.toLocaleString()}
        </span>

        {/* Expand chevron */}
        <ChevronDown
          size={14}
          className="flex-shrink-0 transition-transform"
          style={{
            color: '#9CA3AF',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 ml-3 space-y-2" style={{ borderTop: '1px solid #F9FAFB' }}>
          {/* Actions bar */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg"
              style={{ background: '#0F766E', color: '#FFFFFF', minHeight: '32px' }}
            >
              <Pencil size={10} /> Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg"
              style={{ background: '#FEF2F2', color: '#991B1B', minHeight: '32px' }}
            >
              <Trash2 size={10} /> Remove
            </button>
          </div>

          {/* Project view annotations */}
          {viewMode === 'project' && projectAnnotations && projectAnnotations.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {projectAnnotations.map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{ background: annColors[a.type].bg, color: annColors[a.type].text }}
                >
                  <span className="w-1 h-1 rounded-full" style={{ background: annColors[a.type].dot }} />
                  {a.label}
                </span>
              ))}
            </div>
          )}

          {/* Project view — item details */}
          {viewMode === 'project' && (
            <div className="space-y-1 text-[11px]" style={{ color: '#6B7280' }}>
              <div className="flex justify-between">
                <span>Category</span>
                <span style={{ color: '#111827' }}>{catLabel}</span>
              </div>
              <div className="flex justify-between">
                <span>Type</span>
                <span style={{ color: item.isLabor ? '#3B82F6' : '#F59E0B' }}>
                  {item.isLabor ? 'Labor' : 'Material'}
                </span>
              </div>
              {item.sopCodes && item.sopCodes.length > 0 && (
                <div className="flex justify-between">
                  <span>SOPs</span>
                  <span style={{ color: '#0F766E' }}>{item.sopCodes.join(', ')}</span>
                </div>
              )}
              {item.isLabor && (
                <div className="flex justify-between">
                  <span>Hours/Unit</span>
                  <span style={{ color: item.estimatedHoursPerUnit ? '#111827' : '#EF4444' }}>
                    {item.estimatedHoursPerUnit ? `${item.estimatedHoursPerUnit}h` : 'Not set'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Procedure Steps — read-only SOP checklist */}
          {item.sopCodes && item.sopCodes.length > 0 && (
            <div className="space-y-2">
              {item.sopCodes.map((code) => (
                <ProcedureStepsSection key={code} sopCode={code} />
              ))}
            </div>
          )}

          {/* Materials & Tools — assembly breakdown */}
          <MaterialsToolsSection item={item} catalog={catalog} />

          {/* Labs view annotations */}
          {viewMode === 'labs' && labsAnnotations && labsAnnotations.length > 0 && (
            <div className="space-y-1">
              {labsAnnotations.map((a, i) => {
                const isGap = a.detail === 'gap';
                return (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: isGap ? '#D1D5DB' : labsColors[a.category].dot }}
                    />
                    <span
                      className="text-[9px] font-semibold uppercase w-12 flex-shrink-0"
                      style={{ color: isGap ? '#9CA3AF' : labsColors[a.category].text }}
                    >
                      {a.category === 'recent' ? 'Recent' : a.category === 'ongoing' ? 'Active' : 'Soon'}
                    </span>
                    <span
                      className="flex-1 truncate"
                      style={{ color: isGap ? '#9CA3AF' : '#374151', fontStyle: isGap ? 'italic' : 'normal' }}
                    >
                      {a.label}
                    </span>
                    {a.detail && !isGap && (
                      <span className="font-semibold flex-shrink-0" style={{ color: labsColors[a.category].text }}>
                        {a.detail}
                      </span>
                    )}
                    {isGap && a.actionLabel && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (a.actionLabel === 'Track') {
                            setQuickCreateMode('knowledge');
                            setQuickCreateTitle(`${catLabel} — ${item.description}`);
                          } else {
                            setQuickCreateMode('experiment');
                            setQuickCreateTitle(`Test: ${catLabel} — ${item.description}`);
                          }
                        }}
                        className="font-semibold flex-shrink-0 px-1.5 py-0.5 rounded"
                        style={{ background: '#0F766E', color: '#FFFFFF', fontSize: '9px' }}
                      >
                        + {a.actionLabel}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick-create inline form */}
          {quickCreateMode && !quickCreateDone && (
            <div
              className="rounded-lg p-3 space-y-2"
              style={{ background: '#F0FDFA', border: '1px solid #99F6E4' }}
            >
              <p className="text-[11px] font-semibold" style={{ color: '#0F766E' }}>
                {quickCreateMode === 'knowledge' ? 'Track Knowledge' : 'Create Experiment'}
              </p>
              <input
                type="text"
                value={quickCreateTitle}
                onChange={(e) => setQuickCreateTitle(e.target.value)}
                placeholder={quickCreateMode === 'knowledge' ? 'Knowledge item title...' : 'Experiment title...'}
                className="w-full px-2.5 py-1.5 text-[12px] border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
                style={{ borderColor: '#D1D5DB', minHeight: '36px' }}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleQuickCreate(); }}
                  disabled={!quickCreateTitle.trim() || quickCreateSaving}
                  className="flex-1 text-[11px] font-semibold py-1.5 rounded-lg text-white disabled:opacity-50"
                  style={{ background: '#0F766E', minHeight: '32px' }}
                >
                  {quickCreateSaving ? 'Saving...' : 'Create'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setQuickCreateMode(null); setQuickCreateTitle(''); }}
                  className="text-[11px] font-medium px-3 py-1.5 rounded-lg"
                  style={{ background: '#F3F4F6', color: '#6B7280', minHeight: '32px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Quick-create success */}
          {quickCreateDone && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium"
              style={{ background: '#D1FAE5', color: '#065F46' }}
            >
              <Check size={12} />
              {quickCreateDone}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Procedure Steps — read-only SOP checklist for planning
// ============================================================================

function ProcedureStepsSection({ sopCode }: { sopCode: string }) {
  const [expanded, setExpanded] = useState(false);

  // Try database SOP first
  const { data: dbSop } = useSopByCode(sopCode);
  const sopId = dbSop?.id || '';
  const { data: dbChecklist } = useSopChecklistItems(sopId);

  // Normalize: database checklist items OR hardcoded SOP steps
  const steps = useMemo(() => {
    if (dbChecklist && dbChecklist.length > 0) {
      return dbChecklist
        .sort((a, b) => a.stepNumber - b.stepNumber)
        .map((item) => ({
          number: item.stepNumber,
          title: item.title,
          isCritical: item.isCritical,
          requiresPhoto: item.requiresPhoto,
        }));
    }

    // Fallback to hardcoded SOP
    const hardcoded = getSOPById(sopCode);
    if (hardcoded) {
      return hardcoded.quick_steps.map((step) => ({
        number: step.order,
        title: step.action,
        isCritical: false,
        requiresPhoto: /photo|document|capture/i.test(step.action),
      }));
    }

    return [];
  }, [dbChecklist, sopCode]);

  if (steps.length === 0) return null;

  const sopTitle = dbSop?.title || getSOPById(sopCode)?.title || sopCode;

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        style={{ minHeight: '36px' }}
      >
        <BookOpen size={12} style={{ color: '#6B7280' }} />
        <span className="text-[11px] font-medium flex-1 truncate" style={{ color: '#374151' }}>
          {sopTitle}
        </span>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: '#E5E7EB', color: '#6B7280' }}>
          {steps.length} steps
        </span>
        <ChevronDown
          size={12}
          className="transition-transform"
          style={{ color: '#9CA3AF', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {expanded && (
        <div className="px-3 pb-2 space-y-1" style={{ borderTop: '1px solid #E5E7EB' }}>
          {steps.map((step) => (
            <div key={step.number} className="flex items-start gap-2 py-1">
              <span
                className="text-[10px] font-semibold w-4 text-center flex-shrink-0 mt-0.5"
                style={{ color: '#9CA3AF' }}
              >
                {step.number}
              </span>
              <span className="text-[11px] flex-1" style={{ color: '#374151' }}>
                {step.title}
              </span>
              {step.isCritical && (
                <span
                  className="text-[8px] font-bold px-1 py-0.5 rounded flex-shrink-0"
                  style={{ background: '#FEF2F2', color: '#DC2626' }}
                >
                  CRITICAL
                </span>
              )}
              {step.requiresPhoto && (
                <Camera size={10} className="flex-shrink-0 mt-0.5" style={{ color: '#9CA3AF' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Materials & Tools — assembly component breakdown
// ============================================================================

function MaterialsToolsSection({ item, catalog }: { item: LineItem; catalog: CostCatalog }) {
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [checkedMaterials, setCheckedMaterials] = useState<Set<number>>(new Set());
  const [checkedTools, setCheckedTools] = useState<Set<number>>(new Set());

  const breakdown = useMemo(() => {
    return resolveLineItemBreakdown(item.description, item.category, item.quantity, catalog);
  }, [item.description, item.category, item.quantity, catalog]);

  if (!breakdown) {
    return (
      <div className="rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
        <Package size={12} style={{ color: '#D1D5DB' }} />
        <span className="text-[11px]" style={{ color: '#9CA3AF' }}>No assembly data for this item</span>
      </div>
    );
  }

  const toggleMat = (idx: number) => {
    setCheckedMaterials((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const toggleTool = (idx: number) => {
    setCheckedTools((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  return (
    <div className="space-y-1.5">
      {/* Materials list */}
      {breakdown.materials.length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMaterialsOpen(!materialsOpen); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left"
            style={{ minHeight: '36px' }}
          >
            <Package size={12} style={{ color: '#F59E0B' }} />
            <span className="text-[11px] font-medium flex-1" style={{ color: '#374151' }}>
              Materials
            </span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#92400E' }}>
              {breakdown.materials.length}
            </span>
            <ChevronDown
              size={12}
              className="transition-transform"
              style={{ color: '#9CA3AF', transform: materialsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {materialsOpen && (
            <div className="px-3 pb-2 space-y-1 pt-1" style={{ borderTop: '1px solid #E5E7EB' }}>
              {breakdown.materials.map((mat, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); toggleMat(idx); }}
                  className="w-full flex items-center gap-2 py-1 text-left"
                  style={{ minHeight: '32px' }}
                >
                  <div
                    className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center"
                    style={{
                      borderColor: checkedMaterials.has(idx) ? '#0F766E' : '#D1D5DB',
                      background: checkedMaterials.has(idx) ? '#0F766E' : 'transparent',
                    }}
                  >
                    {checkedMaterials.has(idx) && <Check size={10} style={{ color: '#FFFFFF' }} />}
                  </div>
                  <span
                    className="text-[11px] font-medium flex-1 truncate"
                    style={{
                      color: checkedMaterials.has(idx) ? '#9CA3AF' : '#374151',
                      textDecoration: checkedMaterials.has(idx) ? 'line-through' : 'none',
                    }}
                  >
                    {mat.name}
                  </span>
                  <span className="text-[10px] flex-shrink-0" style={{ color: '#6B7280' }}>
                    {mat.quantityNeeded} {mat.unit}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tools checklist */}
      {breakdown.tools.length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setToolsOpen(!toolsOpen); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left"
            style={{ minHeight: '36px' }}
          >
            <Wrench size={12} style={{ color: '#6B7280' }} />
            <span className="text-[11px] font-medium flex-1" style={{ color: '#374151' }}>
              Tools
            </span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: '#F3F4F6', color: '#6B7280' }}>
              {breakdown.tools.length}
            </span>
            <ChevronDown
              size={12}
              className="transition-transform"
              style={{ color: '#9CA3AF', transform: toolsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {toolsOpen && (
            <div className="px-3 pb-2 space-y-1 pt-1" style={{ borderTop: '1px solid #E5E7EB' }}>
              {breakdown.tools.map((tool, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); toggleTool(idx); }}
                  className="w-full flex items-center gap-2 py-1 text-left"
                  style={{ minHeight: '32px' }}
                >
                  <div
                    className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center"
                    style={{
                      borderColor: checkedTools.has(idx) ? '#0F766E' : '#D1D5DB',
                      background: checkedTools.has(idx) ? '#0F766E' : 'transparent',
                    }}
                  >
                    {checkedTools.has(idx) && <Check size={10} style={{ color: '#FFFFFF' }} />}
                  </div>
                  <span
                    className="text-[11px] truncate"
                    style={{
                      color: checkedTools.has(idx) ? '#9CA3AF' : '#374151',
                      textDecoration: checkedTools.has(idx) ? 'line-through' : 'none',
                    }}
                  >
                    {tool}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
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

      {/* Three-axis pickers: Trade / Stage / Location */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: '#374151' }}>
            Trade
          </label>
          <select
            value={form.workCategoryCode}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, workCategoryCode: e.target.value }))
            }
            className="w-full px-2 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            style={{ borderColor: '#D1D5DB', minHeight: '44px' }}
          >
            {Object.entries(TRADE_CODES).map(([code, meta]) => (
              <option key={code} value={code}>
                {meta.icon} {meta.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: '#374151' }}>
            Stage
          </label>
          <select
            value={form.stageCode}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, stageCode: e.target.value }))
            }
            className="w-full px-2 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            style={{ borderColor: '#D1D5DB', minHeight: '44px' }}
          >
            {Object.entries(STAGE_CODES).map(([code, meta]) => (
              <option key={code} value={code}>
                {meta.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: '#374151' }}>
            Location
          </label>
          <select
            value={form.locationLabel}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, locationLabel: e.target.value }))
            }
            className="w-full px-2 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            style={{ borderColor: '#D1D5DB', minHeight: '44px' }}
          >
            <option value="General">General</option>
            {Object.entries(ROOM_LOCATIONS).map(([key, meta]) => (
              <option key={key} value={meta.name}>
                {meta.icon} {meta.name}
              </option>
            ))}
          </select>
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
