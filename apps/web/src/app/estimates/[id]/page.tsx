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
  Plus,
  Pencil,
  Check,
  X,
  Search,
  BookOpen,
  MapPin,
  Send,
  Hammer,
  ChevronRight,
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
import { useSops } from '@/lib/hooks/useLabsData';
import { useEffectiveCatalog } from '@/lib/hooks/useCostCatalog';
import {
  resolveThreeAxes,
  getTradeDisplayName,
  getTradeOrder,
  inferWorkCategoryCode,
} from '@/lib/utils/axisMapping';
import { TRADE_CODES, STAGE_CODES, ROOM_LOCATIONS } from '@/lib/types/intake.types';
// Retained for potential future mobile/list view
// import { EstimateFilterBar, type GroupMode, type EstimateFilterValues } from '@/components/estimates/EstimateFilterBar';
// import { EstimateGroupSection } from '@/components/estimates/EstimateGroupSection';
import {
  BrandHeader,
  StatusProgressBar,
  EditBanner,
  TradeSection,
  InternalNotes,
  SummaryPanel,
} from '@/components/estimates/detail';
import type { TradeSectionLineItem } from '@/components/estimates/detail';
import { CostCategory, UnitOfMeasure, ProjectStatus } from '@hooomz/shared-contracts';
import type { CreateLineItem, Sop } from '@hooomz/shared-contracts';
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

/** Work category code → default SOP codes for auto-assignment from catalog */
const WORK_CATEGORY_DEFAULT_SOP: Record<string, string[]> = {
  FL: ['HI-SOP-FL-004'],
  PT: ['HI-SOP-PT-002'],
  FC: ['HI-SOP-FC-003'],
  DR: ['HI-SOP-DR-001'],
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

  // Cost catalog (for materials breakdown — used by CatalogPickerModal)
  useEffectiveCatalog();

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

  // ── Document layout state ──
  const [isDocEditing, setIsDocEditing] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');

  // Estimate number — derived from project
  const estNumber = useMemo(() => {
    if (!project) return 'EST-0000-000';
    const year = project.metadata.createdAt ? new Date(project.metadata.createdAt).getFullYear() : new Date().getFullYear();
    // Use last 3 chars of projectId as sequence (placeholder until real sequential numbering)
    const seq = projectId.slice(-3).replace(/\D/g, '0').padStart(3, '0');
    return `EST-${year}-${seq}`;
  }, [project, projectId]);

  // Map project status → estimate document status
  const estimateStatusKey = useMemo(() => {
    if (!project) return 'draft';
    const s = project.status as string;
    if (['lead', 'discovery'].includes(s)) return 'draft';
    if (s === 'site-visit') return 'sent';
    if (s === 'quoted') return 'iterations';
    return 'approved'; // approved, in-progress, complete
  }, [project]);

  const ESTIMATE_STATUS_STEPS = [
    { key: 'draft', label: 'Draft' },
    { key: 'sent', label: 'Sent' },
    { key: 'iterations', label: 'Iterations' },
    { key: 'approved', label: 'Approved' },
  ];

  // Trade-grouped items for document layout (group by workCategoryCode)
  const tradeGroups = useMemo(() => {
    const groups = new Map<string, typeof enrichedItems>();
    for (const item of enrichedItems) {
      const key = item.workCategoryCode || 'OTHER';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => getTradeOrder(a) - getTradeOrder(b))
      .map(([code, items]) => {
        const name = getTradeDisplayName(code);
        const subtotal = items.reduce((sum, i) => sum + i.totalCost, 0);
        const mapped: TradeSectionLineItem[] = items.map((i) => ({
          id: i.id,
          description: i.description,
          spec: i.isLabor ? 'Labor' : (CATEGORY_LABELS[i.category] || ''),
          quantity: i.quantity,
          unit: i.unit,
          unitCost: i.unitCost,
          totalCost: i.totalCost,
        }));
        return { code, name, items: mapped, subtotal } as const;
      });
  }, [enrichedItems]);

  // Inline edit handler for TradeSection
  const handleInlineEdit = useCallback(async (id: string, field: string, value: string | number) => {
    const item = lineItems.find((i) => i.id === id);
    if (!item) return;
    const updates: Partial<Record<string, unknown>> = {};
    if (field === 'description') updates.description = value;
    else if (field === 'quantity') {
      updates.quantity = value;
      updates.totalCost = (value as number) * item.unitCost;
    } else if (field === 'unitCost') {
      updates.unitCost = value;
      updates.totalCost = item.quantity * (value as number);
    }
    await updateLineItem.mutateAsync({
      projectId,
      lineItemId: id,
      data: { ...item, ...updates } as any,
    });
  }, [lineItems, projectId, updateLineItem]);

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
        const laborWcc = inferWorkCategoryCode(laborCategory);
        const laborSop = WORK_CATEGORY_DEFAULT_SOP[laborWcc] || [];
        const laborData: CreateLineItem = {
          projectId,
          description: matchedLabor.name,
          category: laborCategory,
          quantity: form.quantity,
          unit: laborUnit,
          unitCost: matchedLabor.unitCost,
          totalCost: laborTotal,
          isLabor: true,
          workCategoryCode: laborWcc,
          ...(laborSop.length > 0 ? { sopCodes: laborSop } : {}),
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
    const wcc = inferWorkCategoryCode(costCat);
    // Auto-assign sopCodes for labor items based on work category
    const inferredSop = item.type === 'labor' ? (WORK_CATEGORY_DEFAULT_SOP[wcc] || []) : [];
    setForm((prev) => ({
      ...prev,
      description: item.name,
      unitCost: item.unitCost,
      unit: CATALOG_TO_UNIT[item.unit] || UnitOfMeasure.EACH,
      isLabor: item.type === 'labor',
      category: costCat,
      workCategoryCode: wcc,
      sopCodes: inferredSop,
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
      <div className="min-h-screen pb-24" style={{ background: 'var(--surface-2)' }}>
        <div className="text-center py-16">
          <div
            className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
          />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading estimate...</p>
        </div>
      </div>
    );
  }

  // Status badge colors
  const STATUS_BADGE_STYLES: Record<string, { bg: string; borderColor: string; color: string; dotBg: string }> = {
    lead: { bg: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--muted)', dotBg: 'var(--muted)' },
    discovery: { bg: 'var(--blue-bg)', borderColor: 'rgba(74,127,165,0.2)', color: 'var(--blue)', dotBg: 'var(--blue)' },
    'site-visit': { bg: 'var(--amber-bg)', borderColor: 'rgba(217,119,6,0.2)', color: 'var(--amber)', dotBg: 'var(--amber)' },
    quoted: { bg: 'var(--amber-bg)', borderColor: 'rgba(217,119,6,0.2)', color: 'var(--amber)', dotBg: 'var(--amber)' },
    approved: { bg: 'var(--green-bg)', borderColor: 'rgba(22,163,74,0.2)', color: 'var(--green)', dotBg: 'var(--green)' },
    'in-progress': { bg: 'var(--green-bg)', borderColor: 'rgba(22,163,74,0.2)', color: 'var(--green)', dotBg: 'var(--green)' },
    complete: { bg: 'var(--green-bg)', borderColor: 'rgba(22,163,74,0.2)', color: 'var(--green)', dotBg: 'var(--green)' },
  };
  const badgeStyle = STATUS_BADGE_STYLES[project?.status as string] || STATUS_BADGE_STYLES.lead;
  const statusLabel = project?.status ? (project.status as string).replace(/-/g, ' ') : 'draft';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* ── Brand Header ── */}
      <BrandHeader docType={pricingLabel} />

      {/* ── Status Progress Bar ── */}
      <StatusProgressBar steps={ESTIMATE_STATUS_STEPS} currentStepKey={estimateStatusKey} />

      {/* ── Edit Banner ── */}
      {isDocEditing && (
        <EditBanner
          docNumber={estNumber}
          onSave={() => setIsDocEditing(false)}
          onCancel={() => setIsDocEditing(false)}
          isSaving={updateLineItem.isPending}
        />
      )}

      {/* ── Header ── */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="px-6 py-5" style={{ maxWidth: 1200 }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div
                className="text-[11px] font-medium tracking-[0.06em]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
              >
                {estNumber}
              </div>
              <h1 className="text-xl font-bold mt-0.5 leading-tight" style={{ color: 'var(--charcoal)' }}>
                {project?.name || projectId}
              </h1>
              <div className="flex gap-5 mt-2 flex-wrap items-center">
                <div className="text-xs" style={{ color: 'var(--mid)' }}>
                  Created{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--charcoal)', fontWeight: 500 }}>
                    {project?.metadata.createdAt ? new Date(project.metadata.createdAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                  </span>
                </div>
                <div className="text-xs" style={{ color: 'var(--mid)' }}>
                  Items{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--charcoal)', fontWeight: 500 }}>
                    {lineItems.length}
                  </span>
                </div>
                <span
                  className="inline-flex items-center gap-[5px] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.06em]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    background: badgeStyle.bg,
                    border: `1px solid ${badgeStyle.borderColor}`,
                    color: badgeStyle.color,
                  }}
                >
                  <span className="w-[5px] h-[5px] rounded-full" style={{ background: badgeStyle.dotBg }} />
                  {statusLabel}
                </span>
              </div>
            </div>
            {!isDocEditing && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setIsDocEditing(true)}
                  className="text-[11px] font-medium tracking-[0.04em] px-4 py-2 flex items-center gap-1.5"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--charcoal)',
                  }}
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  className="text-[11px] font-medium tracking-[0.04em] px-4 py-2 flex items-center gap-1.5"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--charcoal)',
                  }}
                >
                  <Send size={12} /> Send to Homeowner
                </button>
                <button
                  className="text-[11px] font-medium tracking-[0.04em] px-4 py-2 text-white"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--charcoal)',
                    border: '1px solid var(--charcoal)',
                  }}
                >
                  Convert to Quote
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content Grid ── */}
      <div
        className="grid gap-4 px-6 py-4"
        style={{ gridTemplateColumns: '1fr 300px', maxWidth: 1200 }}
      >
        {/* ── Left Column: Trade Sections ── */}
        <div>
          {tradeGroups.length > 0 ? (
            tradeGroups.map((group) => (
              <TradeSection
                key={group.code}
                title={group.name}
                items={group.items}
                subtotal={group.subtotal}
                isEditing={isDocEditing}
                onEditItem={handleInlineEdit}
                onRemoveItem={(id) => handleDelete(id)}
                onAddItem={() => { openAddForm(); }}
              />
            ))
          ) : (
            <div
              className="px-4 py-8 text-center mb-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                No line items yet. Add items to build this estimate.
              </p>
            </div>
          )}

          {/* Add Line Item (outside edit mode) */}
          {!isDocEditing && !showForm && !approveResult && !isPostQuote && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setShowCatalog(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-medium tracking-[0.04em]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--charcoal)',
                  color: '#fff',
                  border: '1px solid var(--charcoal)',
                }}
              >
                <BookOpen size={13} /> Browse Catalog
              </button>
              <button
                onClick={openAddForm}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-medium tracking-[0.04em]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  border: '1px dashed var(--border)',
                  background: 'none',
                  color: 'var(--muted)',
                }}
              >
                <Plus size={13} /> Manual
              </button>
            </div>
          )}

          {/* Post-quote change order notice */}
          {isPostQuote && !showForm && !approveResult && (
            <div
              className="flex items-center gap-2 px-4 py-3 mb-3 text-xs"
              style={{ background: 'var(--amber-bg)', border: '1px solid rgba(217,119,6,0.2)', color: 'var(--amber)' }}
            >
              <span className="font-medium">New items require a change order.</span>
            </div>
          )}

          {/* Internal Notes */}
          <InternalNotes
            notes={internalNotes}
            isEditing={isDocEditing}
            onNotesChange={setInternalNotes}
          />
        </div>

        {/* ── Right Column: Summary Panel ── */}
        <SummaryPanel
          homeowner={project ? [
            { label: 'Project', value: project.name || '—' },
          ] : undefined}
          job={project ? [
            { label: 'Status', value: statusLabel },
            { label: 'Items', value: String(lineItems.length) },
          ] : undefined}
          trades={tradeGroups.map((g) => ({ name: g.name, total: g.subtotal }))}
          subtotal={totals.total}
          total={totals.total * 1.15}
          history={project?.metadata.createdAt ? [
            { label: 'Created', date: new Date(project.metadata.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) },
          ] : undefined}
        />
      </div>

      {/* ── Line Item Form Modal ── */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl sm:rounded-xl max-h-[85vh] overflow-y-auto"
            style={{ background: 'var(--surface)' }}
          >
            <div className="p-4" id="line-item-form">
              {matchedLabor && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs mb-3"
                  style={{ background: 'var(--green-bg)', border: '1px solid var(--accent-border)' }}
                >
                  <Check size={14} style={{ color: 'var(--accent)' }} />
                  <span style={{ color: 'var(--accent)' }}>
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
          </div>
        </div>
      )}

      {/* ── Approve Error ── */}
      {approveError && (
        <div className="px-6 py-2" style={{ maxWidth: 1200 }}>
          <p className="text-xs text-center" style={{ color: 'var(--red)' }}>
            {approveError}
          </p>
        </div>
      )}

      {/* ── Approval Result ── */}
      {approveResult && (
        <div className="px-6 py-4" style={{ maxWidth: 1200 }}>
          <div
            className="p-4"
            style={{
              background: 'var(--surface)',
              border: `2px solid ${approveResult.missingSopCodes.length > 0 && approveResult.blueprintsCreated === 0 ? 'var(--amber)' : 'var(--green)'}`,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: approveResult.missingSopCodes.length > 0 && approveResult.blueprintsCreated === 0 ? 'var(--amber-bg)' : 'var(--green-bg)' }}
              >
                <Check size={16} style={{ color: approveResult.missingSopCodes.length > 0 && approveResult.blueprintsCreated === 0 ? 'var(--amber)' : 'var(--green)' }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: approveResult.missingSopCodes.length > 0 && approveResult.blueprintsCreated === 0 ? 'var(--amber)' : 'var(--green)' }}>
                {pricingLabel} Approved
              </span>
            </div>
            <div className="space-y-1 text-sm" style={{ color: 'var(--mid)' }}>
              <p>{approveResult.blueprintsCreated} blueprint{approveResult.blueprintsCreated !== 1 ? 's' : ''} generated</p>
              <p>{approveResult.tasksDeployed} task{approveResult.tasksDeployed !== 1 ? 's' : ''} auto-deployed</p>
            </div>
            {approveResult.missingSopCodes.length > 0 && (
              <div className="mt-3 p-2.5" style={{ background: 'var(--amber-bg)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--amber)' }}>
                  {approveResult.missingSopCodes.length} SOP{approveResult.missingSopCodes.length !== 1 ? 's' : ''} not found
                </p>
                <p className="text-[11px]" style={{ color: 'var(--amber)' }}>{approveResult.missingSopCodes.join(', ')}</p>
                <Link href="/labs/seed" className="inline-block mt-1.5 text-[11px] font-medium hover:underline" style={{ color: 'var(--accent)' }}>
                  Load seed data →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Next Steps ── */}
      {project && project.status !== 'complete' && project.status !== 'cancelled' && (
        <div className="px-6 pb-8" style={{ maxWidth: 1200 }}>
          <NextStepsCard
            projectStatus={project.status as string}
            projectId={projectId}
            onAdvance={advanceStatus}
            isUpdating={statusUpdating}
          />
        </div>
      )}

      {/* ── Catalog Picker Modal ── */}
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
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--surface-2)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          Next Steps
        </p>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--surface-2)' }}>
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
                  background: isComplete ? 'var(--green-bg)' : isCurrent ? 'var(--green-bg)' : 'var(--surface-2)',
                  border: isCurrent ? '2px solid var(--accent)' : 'none',
                }}
              >
                {isComplete ? (
                  <Check size={14} style={{ color: 'var(--green)' }} />
                ) : (
                  <Icon size={14} style={{ color: isCurrent ? 'var(--accent)' : 'var(--muted)' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium"
                  style={{ color: isComplete ? 'var(--muted)' : 'var(--charcoal)' }}
                >
                  {step.label}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {step.description}
                </p>
              </div>
              {isCurrent && (
                <button
                  onClick={() => onAdvance(step.targetStatus)}
                  disabled={isUpdating}
                  className="min-h-[36px] px-3 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 flex-shrink-0"
                  style={{ background: isUpdating ? 'var(--muted)' : 'var(--accent)' }}
                >
                  {isUpdating ? 'Updating...' : step.actionLabel}
                  {!isUpdating && <ChevronRight size={14} />}
                </button>
              )}
              {isComplete && (
                <Check size={16} style={{ color: 'var(--green)' }} className="flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Project link */}
      {projectStatus === 'in-progress' && (
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--surface-2)', background: 'var(--surface)' }}>
          <Link
            href={`/projects/${projectId}`}
            className="text-xs font-medium flex items-center gap-1 hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            View Project <ChevronRight size={14} />
          </Link>
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
      style={{ border: '2px solid var(--accent)' }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>
          {isEditing ? 'Edit Line Item' : 'Add Line Item'}
        </h3>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-[var(--surface)]">
          <X size={16} style={{ color: 'var(--muted)' }} />
        </button>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--mid)' }}>
          Description *
        </label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="e.g., Install LVP flooring"
          className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{ borderColor: 'var(--border)', minHeight: '44px' }}
        />
      </div>

      {/* Category + Labor toggle */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--mid)' }}>
            Category *
          </label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, category: e.target.value as CostCategory }))
            }
            className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-white"
            style={{ borderColor: 'var(--border)', minHeight: '44px' }}
          >
            {Object.values(CostCategory).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat] || cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--mid)' }}>
            Type *
          </label>
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)', minHeight: '44px' }}>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, isLabor: true }))}
              className="flex-1 text-sm font-medium transition-colors"
              style={{
                background: form.isLabor ? 'var(--blue)' : 'var(--surface)',
                color: form.isLabor ? '#fff' : 'var(--muted)',
              }}
            >
              Labor
            </button>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, isLabor: false }))}
              className="flex-1 text-sm font-medium transition-colors"
              style={{
                background: !form.isLabor ? 'var(--yellow)' : 'var(--surface)',
                color: !form.isLabor ? '#fff' : 'var(--muted)',
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
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--mid)' }}>
            Trade
          </label>
          <select
            value={form.workCategoryCode}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, workCategoryCode: e.target.value }))
            }
            className="w-full px-2 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-white"
            style={{ borderColor: 'var(--border)', minHeight: '44px' }}
          >
            {Object.entries(TRADE_CODES).map(([code, meta]) => (
              <option key={code} value={code}>
                {meta.icon} {meta.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--mid)' }}>
            Stage
          </label>
          <select
            value={form.stageCode}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, stageCode: e.target.value }))
            }
            className="w-full px-2 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-white"
            style={{ borderColor: 'var(--border)', minHeight: '44px' }}
          >
            {Object.entries(STAGE_CODES).map(([code, meta]) => (
              <option key={code} value={code}>
                {meta.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--mid)' }}>
            Location
          </label>
          <select
            value={form.locationLabel}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, locationLabel: e.target.value }))
            }
            className="w-full px-2 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-white"
            style={{ borderColor: 'var(--border)', minHeight: '44px' }}
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
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--mid)' }}>
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
            className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{ borderColor: 'var(--border)', minHeight: '44px' }}
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--mid)' }}>
            Unit *
          </label>
          <select
            value={form.unit}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, unit: e.target.value as UnitOfMeasure }))
            }
            className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-white"
            style={{ borderColor: 'var(--border)', minHeight: '44px' }}
          >
            {Object.values(UnitOfMeasure).map((u) => (
              <option key={u} value={u}>
                {UNIT_LABELS[u] || u}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--mid)' }}>
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
            className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{ borderColor: 'var(--border)', minHeight: '44px' }}
          />
        </div>
      </div>

      {/* Calculated total */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: 'var(--surface)' }}>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {form.quantity} &times; ${form.unitCost.toLocaleString()} =
        </span>
        <span className="text-sm font-bold" style={{ color: 'var(--charcoal)' }}>
          ${calculatedTotal.toLocaleString()}
        </span>
      </div>

      {/* Estimated Hours (for labor items) */}
      {form.isLabor && (
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--mid)' }}>
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
            className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{ borderColor: 'var(--border)', minHeight: '44px' }}
          />
        </div>
      )}

      {/* SOP Code Picker */}
      {sops.length > 0 && (
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--mid)' }}>
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
                    background: selected ? 'var(--accent)' : 'var(--surface-2)',
                    color: selected ? '#fff' : 'var(--muted)',
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
              style={{ background: form.isLooped ? 'var(--accent)' : 'var(--border)' }}
            >
              <div
                className="w-4 h-4 rounded-full bg-white absolute top-1 transition-transform"
                style={{ left: form.isLooped ? '20px' : '4px' }}
              />
            </button>
            <span className="text-xs font-medium" style={{ color: 'var(--mid)' }}>
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
              className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ borderColor: 'var(--border)', minHeight: '44px' }}
            />
          )}
        </div>
      )}

      {/* Save / Cancel */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm font-medium rounded-xl border"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)', minHeight: '44px' }}
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!canSave || isSaving}
          className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
          style={{ background: 'var(--accent)', minHeight: '44px' }}
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
        style={{ background: 'var(--surface)', maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--charcoal)' }}>Browse Catalog</h2>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={20} style={{ color: 'var(--muted)' }} />
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
                background: tabMode === key ? 'var(--accent)' : 'var(--surface-2)',
                color: tabMode === key ? '#fff' : 'var(--muted)',
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
              style={{ color: 'var(--muted)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full min-h-[40px] pl-9 pr-3 rounded-lg text-sm"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--charcoal)' }}
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
                  background: !categoryFilter ? 'var(--accent)' : 'var(--surface-2)',
                  color: !categoryFilter ? '#fff' : 'var(--muted)',
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
                    background: categoryFilter === cat ? 'var(--accent)' : 'var(--surface-2)',
                    color: categoryFilter === cat ? '#fff' : 'var(--muted)',
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
                style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
              />
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
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
                className="w-full text-left p-3 rounded-xl transition-colors hover:bg-[var(--surface)]"
                style={{ border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--charcoal)' }}>
                      {item.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {CATALOG_CATEGORY_LABELS[item.category] || item.category}
                      {item.supplier && ` · ${item.supplier}`}
                    </p>
                    {matched && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>
                        + {matched.name} ${matched.unitCost.toFixed(2)}/{matched.unit}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                      ${item.unitCost.toFixed(2)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      /{item.unit}
                    </p>
                    {matched && (
                      <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--accent)' }}>
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
