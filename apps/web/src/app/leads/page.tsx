'use client';

/**
 * Lead Pipeline — /leads
 *
 * 7-stage pipeline: New → Contacted → Discovery → Site Visit → Quote Sent → Won → Lost.
 * Cards show temperature, scope badges, budget range, instant estimate, one-tap actions.
 * Sorted by temperature (hot first) then age within each stage.
 */

import { useState, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  Plus,
  Phone,
  MessageCircle,
  FileText,
  XCircle,
  RotateCcw,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Trash2,
  Compass,
  Pencil,
  Save,
  Clock,
  PlusCircle,
  Mail,
  MapPin,
  Users,
  StickyNote,
  ArrowRightLeft,
  AlertCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  useLeadPipeline,
  usePassLead,
  useRestoreLead,
  useDeleteLead,
  useUpdateLeadStage,
  useCreateProjectFromLead,
  useMarkSiteVisitDone,
  useUpdateLead,
  useAddLeadNote,
  useLeadTimeline,
  useSetFollowUp,
  LEAD_ACTIVITY_TYPE_OPTIONS,
  LEAD_TOPIC_OPTIONS,
  LEAD_OUTCOME_OPTIONS,
} from '@/lib/hooks/useLeadData';
import type {
  LeadRecord,
  LeadStage,
  LeadActivityType,
  LeadNoteTopic,
  LeadNoteOutcome,
} from '@/lib/hooks/useLeadData';
import { TEMPERATURE_CONFIG } from '@/lib/leadTemperature';
import { useEffectiveCatalog } from '@/lib/hooks/useCostCatalog';
import { calculateEstimateBreakdown } from '@/lib/instantEstimate';
import type { DoorWindowInput } from '@/lib/instantEstimate';
import type { ActivityEvent } from '@/lib/repositories/activity.repository';

// ============================================================================
// Constants
// ============================================================================

const STAGE_ORDER: LeadStage[] = ['new', 'contacted', 'discovery', 'site_visit', 'quote_sent', 'won', 'lost'];

const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  discovery: 'Discovery',
  site_visit: 'Site Visit',
  quote_sent: 'Quote Sent',
  won: 'Won',
  lost: 'Lost',
};

const STAGE_COLORS: Record<LeadStage, string> = {
  new: '#8B5CF6',
  contacted: '#F59E0B',
  discovery: '#3B82F6',
  site_visit: '#6366F1',
  quote_sent: '#0F766E',
  won: '#10B981',
  lost: '#9CA3AF',
};

const STAGE_BG: Record<LeadStage, string> = {
  new: '#F5F3FF',
  contacted: '#FFFBEB',
  discovery: '#EFF6FF',
  site_visit: '#EDE9FE',
  quote_sent: '#F0FDFA',
  won: '#ECFDF5',
  lost: '#F9FAFB',
};

const SOURCE_LABELS: Record<string, string> = {
  home_show: 'Home Show',
  referral: 'Referral',
  website: 'Website',
  google: 'Google',
  social: 'Social',
  ritchies: 'Ritchies',
  repeat: 'Repeat',
  'home-show': 'Home Show',
  other: 'Other',
  unknown: '',
};

const SCOPE_LABELS: Record<string, string> = {
  floors: 'FL',
  paint: 'PT',
  trim: 'TM',
  tile: 'TL',
  drywall: 'DW',
  full_refresh: 'Full',
  not_sure: '?',
  flooring: 'FL',
};

const BUDGET_LABELS: Record<string, string> = {
  'under-5k': '<$5K',
  '5k-10k': '$5-10K',
  '10k-20k': '$10-20K',
  '20k+': '$20K+',
  unknown: '',
};

const MATERIAL_SHORT_LABELS: Record<string, string> = {
  lvp: 'LVP',
  hardwood: 'Hardwood',
  laminate: 'Laminate',
  carpet: 'Carpet',
  tile: 'Tile',
  not_sure: 'TBD',
  walls: 'Walls',
  walls_ceiling: 'Walls+Ceil',
  full: 'Full Paint',
  baseboard: 'Baseboard',
  casing: 'Casing',
  crown: 'Crown',
  other: 'Other Trim',
  floor: 'Floor Tile',
  backsplash: 'Backsplash',
  shower: 'Shower',
  patches: 'Patches',
  accent: 'Accent',
  full_room: 'Full DW',
};

const SCOPE_FULL_LABELS: Record<string, string> = {
  floors: 'New Floors',
  paint: 'Interior Paint',
  trim: 'Trim & Moulding',
  tile: 'Tile',
  drywall: 'Drywall',
  full_refresh: 'Full Refresh',
  not_sure: 'Not Sure Yet',
  flooring: 'New Floors',
};

const TIMELINE_LABELS: Record<string, string> = {
  asap: 'Ready Now',
  few_months: 'Next Few Months',
  exploring: 'Just Exploring',
};

const BUDGET_FULL_LABELS: Record<string, string> = {
  'under-5k': 'Under $5,000',
  '5k-10k': '$5,000 – $10,000',
  '10k-20k': '$10,000 – $20,000',
  '20k+': '$20,000+',
  unknown: 'Not Sure',
};

const CONTACT_LABELS: Record<string, string> = {
  call: 'Phone Call',
  text: 'Text Message',
  email: 'Email',
};

const TRADE_FULL_LABELS: Record<string, string> = {
  floors: 'Flooring',
  paint: 'Paint',
  trim: 'Trim',
  tile: 'Tile',
  drywall: 'Drywall',
};

const MATERIAL_FULL_LABELS: Record<string, Record<string, string>> = {
  floors: { lvp: 'LVP Flooring', hardwood: 'Hardwood', laminate: 'Laminate', carpet: 'Carpet', tile: 'Tile', not_sure: 'Not Sure' },
  paint: { walls: 'Walls Only', walls_ceiling: 'Walls + Ceiling', full: 'Full Paint' },
  trim: { baseboard: 'Baseboard', casing: 'Casing', crown: 'Crown', other: 'Other' },
  tile: { floor: 'Floor Tile', backsplash: 'Backsplash', shower: 'Shower / Tub', not_sure: 'Not Sure' },
  drywall: { patches: 'Patches', accent: 'Accent Wall', full_room: 'Full Room' },
};

// ============================================================================
// Page
// ============================================================================

export default function LeadPipelinePage() {
  const router = useRouter();
  const pipeline = useLeadPipeline();
  const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all');
  const [collapsedStages, setCollapsedStages] = useState<Set<LeadStage>>(
    new Set(['won', 'lost'])
  );

  const toggleCollapse = (stage: LeadStage) => {
    setCollapsedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  const filteredLeads =
    stageFilter === 'all'
      ? pipeline.leads
      : pipeline.leads.filter((l) => l.stage === stageFilter);

  const grouped = STAGE_ORDER.map((stage) => ({
    stage,
    leads: filteredLeads.filter((l) => l.stage === stage),
  })).filter((g) => g.leads.length > 0);

  if (pipeline.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F3F4F6' }}>
        <div className="text-center">
          <div
            className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }}
          />
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Loading pipeline...</p>
        </div>
      </div>
    );
  }

  const hotCount = pipeline.leads.filter((l) => l.temperature === 'hot' && l.stage !== 'won' && l.stage !== 'lost').length;
  const warmCount = pipeline.leads.filter((l) => l.temperature === 'warm' && l.stage !== 'won' && l.stage !== 'lost').length;

  return (
    <PageErrorBoundary>
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-bold" style={{ color: '#111827' }}>
              Lead Pipeline
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>
              {pipeline.leads.length} lead{pipeline.leads.length !== 1 ? 's' : ''}
              {hotCount > 0 && (
                <span>
                  {' '}&middot;{' '}
                  <span style={{ color: TEMPERATURE_CONFIG.hot.color }}>{hotCount} hot</span>
                </span>
              )}
              {warmCount > 0 && (
                <span>
                  {' '}&middot;{' '}
                  <span style={{ color: TEMPERATURE_CONFIG.warm.color }}>{warmCount} warm</span>
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => router.push('/leads/new')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl"
            style={{ background: '#0F766E' }}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2} />
          </button>
        </div>

        {/* Stage filter strip */}
        <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 pb-3">
          <div className="flex gap-2 overflow-x-auto">
            <FilterPill
              label="All"
              count={pipeline.leads.length}
              active={stageFilter === 'all'}
              color="#374151"
              onClick={() => setStageFilter('all')}
            />
            {STAGE_ORDER.map((stage) => {
              const count = pipeline.counts[stage];
              if (count === 0 && stage !== 'new') return null;
              return (
                <FilterPill
                  key={stage}
                  label={STAGE_LABELS[stage]}
                  count={count}
                  active={stageFilter === stage}
                  color={STAGE_COLORS[stage]}
                  onClick={() => setStageFilter(stage)}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8">
        {/* Empty state */}
        {filteredLeads.length === 0 && (
          <div className="mt-8 text-center">
            <div
              className="w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center"
              style={{ background: '#F0FDFA' }}
            >
              <FileText size={24} style={{ color: '#0F766E' }} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: '#111827' }}>
              No leads yet
            </p>
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
              Capture your first lead at a home show or from a referral
            </p>
            <button
              onClick={() => router.push('/leads/new')}
              className="min-h-[44px] px-5 rounded-xl font-medium text-sm text-white"
              style={{ background: '#0F766E' }}
            >
              Capture a Lead
            </button>
          </div>
        )}

        {/* Pipeline bar */}
        {pipeline.leads.length > 0 && stageFilter === 'all' && (
          <div className="mt-4 mb-2">
            <div className="flex rounded-lg overflow-hidden h-2">
              {STAGE_ORDER.map((stage) => {
                const count = pipeline.counts[stage];
                if (count === 0) return null;
                const pct = (count / pipeline.leads.length) * 100;
                return (
                  <div
                    key={stage}
                    style={{ width: `${pct}%`, background: STAGE_COLORS[stage], minWidth: '4px' }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Stage groups */}
        {grouped.map(({ stage, leads }) => (
          <div key={stage} className="mt-4">
            <button
              onClick={() => toggleCollapse(stage)}
              className="flex items-center gap-2 mb-2 min-h-[28px]"
            >
              {collapsedStages.has(stage) ? (
                <ChevronRight size={14} style={{ color: '#9CA3AF' }} />
              ) : (
                <ChevronDown size={14} style={{ color: '#9CA3AF' }} />
              )}
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: STAGE_COLORS[stage] }}
              />
              <h2
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: '#6B7280' }}
              >
                {STAGE_LABELS[stage]}
              </h2>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ background: STAGE_BG[stage], color: STAGE_COLORS[stage] }}
              >
                {leads.length}
              </span>
            </button>

            {!collapsedStages.has(stage) && (
              <div className="space-y-2">
                {leads.map((lead) => (
                  <LeadCard key={lead.customer.id} lead={lead} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    </PageErrorBoundary>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function FilterPill({
  label,
  count,
  active,
  color,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="min-h-[32px] px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
      style={{
        background: active ? color : '#F3F4F6',
        color: active ? '#FFFFFF' : '#6B7280',
      }}
    >
      {label} {count > 0 && `(${count})`}
    </button>
  );
}

// ── Edit Mode Data Shape ──

interface EditData {
  name: string;
  phone: string;
  email: string;
  scopeTags: string[];
  budgetRange: string;
  timeline: string;
  roomCount: number;
  totalSqft: number;
  materialPrefs: Record<string, string>;
  doorWindows: DoorWindowInput;
  preferredContact: string;
  source: string;
  referralSource: string;
  notes: string;
}

const EDIT_SCOPE_OPTIONS = [
  { value: 'floors', label: 'Floors' },
  { value: 'paint', label: 'Paint' },
  { value: 'trim', label: 'Trim' },
  { value: 'tile', label: 'Tile' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'full_refresh', label: 'Full Refresh' },
  { value: 'not_sure', label: 'Not Sure' },
];

const EDIT_BUDGET_OPTIONS = [
  { value: 'under-5k', label: '<$5K' },
  { value: '5k-10k', label: '$5-10K' },
  { value: '10k-20k', label: '$10-20K' },
  { value: '20k+', label: '$20K+' },
  { value: 'unknown', label: 'Not Sure' },
];

const EDIT_TIMELINE_OPTIONS = [
  { value: 'asap', label: 'ASAP' },
  { value: 'few_months', label: 'Few Months' },
  { value: 'exploring', label: 'Exploring' },
];

const EDIT_CONTACT_OPTIONS = [
  { value: 'call', label: 'Call' },
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
];

const EDIT_SOURCE_OPTIONS = [
  { value: 'home_show', label: 'Home Show' },
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'google', label: 'Google' },
  { value: 'social', label: 'Social' },
  { value: 'ritchies', label: 'Ritchies' },
  { value: 'repeat', label: 'Repeat' },
];

const EDIT_MATERIAL_OPTIONS: Record<string, { value: string; label: string }[]> = {
  floors: [
    { value: 'lvp', label: 'LVP' },
    { value: 'hardwood', label: 'Hardwood' },
    { value: 'laminate', label: 'Laminate' },
    { value: 'carpet', label: 'Carpet' },
    { value: 'tile', label: 'Tile' },
    { value: 'not_sure', label: 'Not Sure' },
  ],
  paint: [
    { value: 'walls', label: 'Walls' },
    { value: 'walls_ceiling', label: 'Walls+Ceil' },
    { value: 'full', label: 'Full' },
  ],
  trim: [
    { value: 'baseboard', label: 'Baseboard' },
    { value: 'casing', label: 'Casing' },
    { value: 'crown', label: 'Crown' },
    { value: 'other', label: 'Other' },
  ],
  tile: [
    { value: 'floor', label: 'Floor' },
    { value: 'backsplash', label: 'Backsplash' },
    { value: 'shower', label: 'Shower' },
    { value: 'not_sure', label: 'Not Sure' },
  ],
  drywall: [
    { value: 'patches', label: 'Patches' },
    { value: 'accent', label: 'Accent' },
    { value: 'full_room', label: 'Full Room' },
  ],
};

function LeadCard({ lead }: { lead: LeadRecord }) {
  const router = useRouter();
  const passLead = usePassLead();
  const restoreLead = useRestoreLead();
  const deleteLead = useDeleteLead();
  const updateStage = useUpdateLeadStage();
  const createProject = useCreateProjectFromLead();
  const markSiteVisitDone = useMarkSiteVisitDone();
  const updateLead = useUpdateLead();
  const addNote = useAddLeadNote();
  const setFollowUp = useSetFollowUp();
  const catalog = useEffectiveCatalog();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<EditData | null>(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteActivityType, setNoteActivityType] = useState<LeadActivityType>('call');
  const [noteTopic, setNoteTopic] = useState<LeadNoteTopic>('scope');
  const [noteOutcome, setNoteOutcome] = useState<LeadNoteOutcome>('neutral');
  const [noteDetail, setNoteDetail] = useState('');
  const [showAllTimeline, setShowAllTimeline] = useState(false);
  const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);
  const [followUpInput, setFollowUpInput] = useState(lead.followUpDate || '');

  const { customer, stage, scopeTags, interests, source, linkedProject, temperature, budgetRange, roomCount, totalSqft, materialPrefs, instantEstimate, timeline, preferredContact, referralSource } = lead;

  // Timeline query — only when expanded
  const timelineQuery = useLeadTimeline(
    expanded ? customer.id : null,
    linkedProject?.id
  );
  const fullName = `${customer.firstName} ${customer.lastName}`.trim();
  const sourceLabel = SOURCE_LABELS[source] || source;
  const budgetLabel = BUDGET_LABELS[budgetRange] || '';
  const createdAt = new Date(customer.metadata.createdAt);
  const timeLabel = formatRelativeDate(createdAt);
  const stageColor = STAGE_COLORS[stage];
  const tempConfig = TEMPERATURE_CONFIG[temperature];

  const displayScopes = scopeTags.length > 0 ? scopeTags : interests;

  // Derive per-trade estimate breakdown for expanded view
  const breakdown = useMemo(() => {
    if (!expanded) return null;
    if (scopeTags.length === 0 && interests.length === 0) return null;
    return calculateEstimateBreakdown({
      scopeTags: scopeTags.length > 0 ? scopeTags : interests,
      roomCount: roomCount ?? 3,
      totalSqft,
      materialPrefs,
      doorWindows: lead.doorWindows,
    }, catalog);
  }, [expanded, scopeTags, interests, roomCount, totalSqft, materialPrefs, lead.doorWindows, catalog]);

  const handleStartDiscovery = async () => {
    if (linkedProject) {
      router.push(`/discovery/${linkedProject.id}`);
      return;
    }
    if (createProject.isPending) return;
    const project = await createProject.mutateAsync(lead);
    router.push(`/discovery/${project.id}`);
  };

  const handlePass = () => {
    if (passLead.isPending) return;
    passLead.mutate(customer.id);
  };

  const handleRestore = () => {
    if (restoreLead.isPending) return;
    restoreLead.mutate(customer.id);
  };

  const handleDelete = () => {
    if (deleteLead.isPending) return;
    deleteLead.mutate({
      customerId: customer.id,
      projectId: linkedProject?.id,
      customerName: fullName,
    });
    setShowDeleteConfirm(false);
  };

  const handleStageChange = (newStage: string) => {
    if (newStage === 'lost') {
      handlePass();
    } else if (updateStage.isPending) {
      return;
    } else {
      updateStage.mutate({ customerId: customer.id, targetStage: newStage, customerName: fullName });
    }
  };

  const handleAddNote = () => {
    if (addNote.isPending) return;
    addNote.mutate({
      customerId: customer.id,
      customerName: fullName,
      linkedProjectId: linkedProject?.id,
      activityType: noteActivityType,
      topic: noteTopic,
      outcome: noteOutcome,
      detail: noteDetail.trim() || undefined,
    });
    setNoteDetail('');
    setShowNoteInput(false);
  };

  const handleSetFollowUp = () => {
    if (!followUpInput || setFollowUp.isPending) return;
    setFollowUp.mutate({ customerId: customer.id, date: followUpInput, customerName: fullName });
    setShowFollowUpPicker(false);
  };

  const handleClearFollowUp = () => {
    if (setFollowUp.isPending) return;
    setFollowUp.mutate({ customerId: customer.id, date: null, customerName: fullName });
    setFollowUpInput('');
    setShowFollowUpPicker(false);
  };

  const handleStartEdit = () => {
    const displayEmail = (customer.email || '').includes('@noemail.') ? '' : (customer.email || '');
    setEditData({
      name: fullName,
      phone: customer.phone || '',
      email: displayEmail,
      scopeTags: scopeTags.length > 0 ? [...scopeTags] : [...interests],
      budgetRange: budgetRange || '',
      timeline: timeline || '',
      roomCount: roomCount ?? 0,
      totalSqft: totalSqft ?? 0,
      materialPrefs: { ...materialPrefs },
      doorWindows: lead.doorWindows ?? {
        exteriorDoors: 0, interiorDoors: 0, closetDoors: 0, patioDoors: 0,
        windowsSmall: 0, windowsMedium: 0, windowsLarge: 0,
        replaceHardware: false, replaceKnobs: false,
      },
      preferredContact: preferredContact || 'text',
      source: source || '',
      referralSource: referralSource || '',
      notes: customer.notes || '',
    });
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditData(null);
  };

  const handleSaveEdit = async () => {
    if (!editData || updateLead.isPending) return;
    await updateLead.mutateAsync({
      customerId: customer.id,
      customerName: fullName,
      name: editData.name,
      phone: editData.phone,
      email: editData.email,
      scopeTags: editData.scopeTags,
      budgetRange: editData.budgetRange,
      timeline: editData.timeline,
      roomCount: editData.roomCount,
      totalSqft: editData.totalSqft,
      materialPrefs: editData.materialPrefs,
      doorWindows: editData.doorWindows,
      preferredContact: editData.preferredContact,
      source: editData.source,
      referralSource: editData.referralSource,
      notes: editData.notes,
    });
    setEditing(false);
    setEditData(null);
  };

  const toggleEditScope = (value: string) => {
    if (!editData) return;
    setEditData((prev) => {
      if (!prev) return prev;
      if (value === 'not_sure') {
        return { ...prev, scopeTags: prev.scopeTags.includes('not_sure') ? [] : ['not_sure'] };
      }
      const without = prev.scopeTags.filter((v) => v !== 'not_sure');
      const next = without.includes(value)
        ? without.filter((v) => v !== value)
        : [...without, value];
      return { ...prev, scopeTags: next };
    });
  };

  const updateEditMaterial = (trade: string, value: string) => {
    if (!editData) return;
    setEditData((prev) => {
      if (!prev) return prev;
      // Trim supports multi-select (comma-separated)
      if (trade === 'trim') {
        const current = (prev.materialPrefs.trim || '').split(',').filter(Boolean);
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return { ...prev, materialPrefs: { ...prev.materialPrefs, trim: next.join(',') } };
      }
      return { ...prev, materialPrefs: { ...prev.materialPrefs, [trade]: value } };
    });
  };

  return (
    <div
      className="rounded-xl p-3 transition-all duration-150"
      style={{
        background: '#FFFFFF',
        boxShadow: expanded ? '0 2px 8px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.06)',
        borderLeft: `3px solid ${stageColor}`,
        opacity: stage === 'lost' ? 0.65 : 1,
      }}
    >
      {/* Tappable content area */}
      <div onClick={() => setExpanded(!expanded)} className="cursor-pointer">
        {/* Top row: temp dot + name + chevron */}
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: tempConfig.color }}
              title={`${tempConfig.label} lead`}
            />
            <h3 className="text-[13px] font-semibold truncate" style={{ color: '#111827' }}>
              {fullName}
            </h3>
            {lead.isOverdueFollowUp && (
              <span
                className="text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0"
                style={{ background: '#FEF2F2', color: '#EF4444' }}
              >
                Overdue
              </span>
            )}
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0"
              style={{ background: STAGE_BG[stage], color: stageColor }}
            >
              {STAGE_LABELS[stage]}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="text-xs font-medium"
                style={{ color: '#0F766E' }}
                onClick={(e) => e.stopPropagation()}
              >
                {customer.phone}
              </a>
            )}
            <ChevronDown
              size={14}
              style={{
                color: '#9CA3AF',
                transition: 'transform 150ms',
                transform: expanded ? 'rotate(180deg)' : undefined,
              }}
            />
          </div>
        </div>

      {/* Scope + source + budget + rooms + time */}
      <div className="flex items-center gap-1 flex-wrap mb-0.5">
        {displayScopes.map((scope) => (
          <span
            key={scope}
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: '#F3F4F6', color: '#6B7280' }}
          >
            {SCOPE_LABELS[scope] || scope}
          </span>
        ))}
        {sourceLabel && (
          <span
            className="text-[9px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: '#FEF3C7', color: '#92400E' }}
          >
            {sourceLabel}
          </span>
        )}
        {budgetLabel && (
          <span
            className="text-[9px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: '#F0FDFA', color: '#0F766E' }}
          >
            {budgetLabel}
          </span>
        )}
        {roomCount !== null && (
          <span className="text-[10px]" style={{ color: '#9CA3AF' }}>
            {roomCount === 0 ? 'Whole floor' : `${roomCount} rm${roomCount !== 1 ? 's' : ''}`}
          </span>
        )}
        {totalSqft !== null && totalSqft > 0 && (
          <span
            className="text-[9px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: '#EFF6FF', color: '#1D4ED8' }}
          >
            {totalSqft.toLocaleString()} sqft
          </span>
        )}
        {Object.entries(materialPrefs).flatMap(([trade, pref]) => {
          // Trim stores comma-separated multi-select values
          const values = trade === 'trim' ? pref.split(',').filter(Boolean) : [pref];
          return values.map((v) => (
            <span
              key={`${trade}-${v}`}
              className="text-[9px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: '#F5F3FF', color: '#6D28D9' }}
            >
              {MATERIAL_SHORT_LABELS[v] || v}
            </span>
          ));
        })}
        <span className="text-[10px]" style={{ color: '#D1D5DB' }}>
          &middot; {timeLabel}
        </span>
      </div>

      {/* Estimate range */}
      {instantEstimate && (
        <p className="text-[11px] font-medium mb-0.5" style={{ color: '#0F766E' }}>
          Est: ${instantEstimate.low.toLocaleString()} – ${instantEstimate.high.toLocaleString()}
        </p>
      )}

      {linkedProject && (
        <p className="text-[11px] mb-0.5" style={{ color: '#9CA3AF' }}>
          Project: {linkedProject.name} &middot; {linkedProject.status.replace(/-/g, ' ')}
        </p>
      )}

      {customer.notes && (
        <p className={`text-[11px] italic mb-0.5 ${expanded ? '' : 'truncate'}`} style={{ color: '#9CA3AF' }}>
          &ldquo;{customer.notes}&rdquo;
        </p>
      )}
      </div>{/* end clickable area */}

      {/* Expanded detail panel — EDIT MODE */}
      {expanded && editing && editData && (
        <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid #0F766E40' }}>
          {/* Edit header */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#0F766E' }}>
              Editing Intake
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={handleCancelEdit}
                className="min-h-[28px] px-2.5 rounded-md text-[11px] font-medium"
                style={{ background: '#F3F4F6', color: '#6B7280' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updateLead.isPending}
                className="min-h-[28px] px-3 rounded-md text-[11px] font-semibold flex items-center gap-1"
                style={{ background: '#0F766E', color: '#FFFFFF', opacity: updateLead.isPending ? 0.6 : 1 }}
              >
                <Save size={11} /> {updateLead.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Contact */}
          <EditSection title="Contact">
            <EditField label="Name" value={editData.name} onChange={(v) => setEditData({ ...editData, name: v })} />
            <EditField label="Phone" value={editData.phone} onChange={(v) => setEditData({ ...editData, phone: v })} type="tel" />
            <EditField label="Email" value={editData.email} onChange={(v) => setEditData({ ...editData, email: v })} type="email" />
            <EditPillGroup
              label="Preferred Contact"
              options={EDIT_CONTACT_OPTIONS}
              selected={editData.preferredContact}
              onSelect={(v) => setEditData({ ...editData, preferredContact: v })}
            />
          </EditSection>

          {/* Scope */}
          <EditSection title="Scope">
            <div className="flex flex-wrap gap-1.5">
              {EDIT_SCOPE_OPTIONS.map((opt) => {
                const isSelected = editData.scopeTags.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleEditScope(opt.value)}
                    className="min-h-[30px] px-2.5 rounded-lg text-[11px] font-medium transition-colors"
                    style={{
                      background: isSelected ? '#F0FDFA' : '#FFFFFF',
                      color: isSelected ? '#0F766E' : '#6B7280',
                      border: isSelected ? '2px solid #0F766E' : '1px solid #E5E7EB',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </EditSection>

          {/* Materials (only for active scopes) */}
          {editData.scopeTags.filter((s) => EDIT_MATERIAL_OPTIONS[s]).length > 0 && (
            <EditSection title="Materials">
              {editData.scopeTags.filter((s) => EDIT_MATERIAL_OPTIONS[s]).map((trade) => (
                <div key={trade} className="mb-2">
                  <p className="text-[10px] font-medium mb-1" style={{ color: '#9CA3AF' }}>
                    {TRADE_FULL_LABELS[trade] || trade}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {EDIT_MATERIAL_OPTIONS[trade].map((opt) => {
                      const isSelected = trade === 'trim'
                        ? (editData.materialPrefs[trade] || '').split(',').includes(opt.value)
                        : editData.materialPrefs[trade] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => updateEditMaterial(trade, opt.value)}
                          className="min-h-[28px] px-2 rounded-lg text-[10px] font-medium transition-colors"
                          style={{
                            background: isSelected ? '#F5F3FF' : '#FFFFFF',
                            color: isSelected ? '#6D28D9' : '#6B7280',
                            border: isSelected ? '2px solid #6D28D9' : '1px solid #E5E7EB',
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </EditSection>
          )}

          {/* Doors & Windows */}
          <EditSection title="Doors & Windows">
            <div className="grid grid-cols-2 gap-2">
              <EditCounterField label="Exterior" value={editData.doorWindows.exteriorDoors} onChange={(v) => setEditData({ ...editData, doorWindows: { ...editData.doorWindows, exteriorDoors: v } })} />
              <EditCounterField label="Interior" value={editData.doorWindows.interiorDoors} onChange={(v) => setEditData({ ...editData, doorWindows: { ...editData.doorWindows, interiorDoors: v } })} />
              <EditCounterField label="Closet" value={editData.doorWindows.closetDoors} onChange={(v) => setEditData({ ...editData, doorWindows: { ...editData.doorWindows, closetDoors: v } })} />
              <EditCounterField label="Patio" value={editData.doorWindows.patioDoors} onChange={(v) => setEditData({ ...editData, doorWindows: { ...editData.doorWindows, patioDoors: v } })} />
            </div>
            <p className="text-[10px] font-medium mt-2 mb-1" style={{ color: '#9CA3AF' }}>Windows</p>
            <div className="grid grid-cols-3 gap-2">
              <EditCounterField label="Small" value={editData.doorWindows.windowsSmall} onChange={(v) => setEditData({ ...editData, doorWindows: { ...editData.doorWindows, windowsSmall: v } })} />
              <EditCounterField label="Medium" value={editData.doorWindows.windowsMedium} onChange={(v) => setEditData({ ...editData, doorWindows: { ...editData.doorWindows, windowsMedium: v } })} />
              <EditCounterField label="Large" value={editData.doorWindows.windowsLarge} onChange={(v) => setEditData({ ...editData, doorWindows: { ...editData.doorWindows, windowsLarge: v } })} />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setEditData({ ...editData, doorWindows: { ...editData.doorWindows, replaceHardware: !editData.doorWindows.replaceHardware } })}
                className="flex-1 min-h-[28px] px-2 rounded-lg text-[10px] font-medium"
                style={{
                  background: editData.doorWindows.replaceHardware ? '#F0FDFA' : '#FFFFFF',
                  color: editData.doorWindows.replaceHardware ? '#0F766E' : '#6B7280',
                  border: editData.doorWindows.replaceHardware ? '2px solid #0F766E' : '1px solid #E5E7EB',
                }}
              >
                Hardware
              </button>
              <button
                onClick={() => setEditData({ ...editData, doorWindows: { ...editData.doorWindows, replaceKnobs: !editData.doorWindows.replaceKnobs } })}
                className="flex-1 min-h-[28px] px-2 rounded-lg text-[10px] font-medium"
                style={{
                  background: editData.doorWindows.replaceKnobs ? '#F0FDFA' : '#FFFFFF',
                  color: editData.doorWindows.replaceKnobs ? '#0F766E' : '#6B7280',
                  border: editData.doorWindows.replaceKnobs ? '2px solid #0F766E' : '1px solid #E5E7EB',
                }}
              >
                Knobs
              </button>
            </div>
          </EditSection>

          {/* Property */}
          <EditSection title="Property Details">
            <div className="flex gap-3">
              <EditField
                label="Rooms"
                value={String(editData.roomCount || '')}
                onChange={(v) => setEditData({ ...editData, roomCount: parseInt(v, 10) || 0 })}
                type="number"
              />
              <EditField
                label="Total sqft"
                value={String(editData.totalSqft || '')}
                onChange={(v) => setEditData({ ...editData, totalSqft: parseInt(v, 10) || 0 })}
                type="number"
              />
            </div>
            <EditPillGroup
              label="Budget"
              options={EDIT_BUDGET_OPTIONS}
              selected={editData.budgetRange}
              onSelect={(v) => setEditData({ ...editData, budgetRange: v })}
            />
            <EditPillGroup
              label="Timeline"
              options={EDIT_TIMELINE_OPTIONS}
              selected={editData.timeline}
              onSelect={(v) => setEditData({ ...editData, timeline: v })}
            />
          </EditSection>

          {/* Source */}
          <EditSection title="Source">
            <EditPillGroup
              label="Source"
              options={EDIT_SOURCE_OPTIONS}
              selected={editData.source}
              onSelect={(v) => setEditData({ ...editData, source: v })}
            />
            {editData.source === 'referral' && (
              <EditField
                label="Referred by"
                value={editData.referralSource}
                onChange={(v) => setEditData({ ...editData, referralSource: v })}
              />
            )}
          </EditSection>

          {/* Notes */}
          <EditSection title="Notes">
            <textarea
              value={editData.notes}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              rows={2}
              placeholder="Any notes about this lead..."
              className="w-full px-3 py-2 rounded-lg text-[12px]"
              style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827', resize: 'vertical' }}
            />
          </EditSection>

          {/* Bottom Save/Cancel */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCancelEdit}
              className="flex-1 min-h-[36px] rounded-lg text-[11px] font-medium"
              style={{ background: '#F3F4F6', color: '#6B7280' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={updateLead.isPending}
              className="flex-1 min-h-[36px] rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
              style={{ background: '#0F766E', color: '#FFFFFF', opacity: updateLead.isPending ? 0.6 : 1 }}
            >
              <Save size={12} /> {updateLead.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Expanded detail panel — READ MODE */}
      {expanded && !editing && (
        <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid #F3F4F6' }}>
          {/* Contact */}
          <DetailSection title="Contact">
            {customer.phone && <DetailRow label="Phone" value={customer.phone} />}
            {customer.email && !customer.email.includes('@noemail.') && (
              <DetailRow label="Email" value={customer.email} />
            )}
            {preferredContact && (
              <DetailRow label="Prefers" value={CONTACT_LABELS[preferredContact] || preferredContact} />
            )}
            {referralSource && (
              <DetailRow label="Referred by" value={referralSource} />
            )}
          </DetailSection>

          {/* Scope & Materials */}
          {(displayScopes.length > 0 || Object.keys(materialPrefs).length > 0) && (
            <DetailSection title="Scope & Materials">
              {displayScopes.length > 0 && (
                <DetailRow
                  label="Scope"
                  value={displayScopes.map((s) => SCOPE_FULL_LABELS[s] || s).join(', ')}
                />
              )}
              {Object.entries(materialPrefs).map(([trade, pref]) => {
                // Trim stores comma-separated multi-select values
                const values = trade === 'trim' ? pref.split(',').filter(Boolean) : [pref];
                const label = values
                  .map((v) => MATERIAL_FULL_LABELS[trade]?.[v] || MATERIAL_SHORT_LABELS[v] || v)
                  .join(', ');
                return (
                  <DetailRow
                    key={trade}
                    label={TRADE_FULL_LABELS[trade] || trade}
                    value={label}
                  />
                );
              })}
            </DetailSection>
          )}

          {/* Doors & Windows */}
          {lead.doorWindows && (
            <DetailSection title="Doors & Windows">
              {lead.doorWindows.exteriorDoors > 0 && (
                <DetailRow label="Exterior doors" value={String(lead.doorWindows.exteriorDoors)} />
              )}
              {lead.doorWindows.interiorDoors > 0 && (
                <DetailRow label="Interior doors" value={String(lead.doorWindows.interiorDoors)} />
              )}
              {lead.doorWindows.closetDoors > 0 && (
                <DetailRow label="Closet doors" value={String(lead.doorWindows.closetDoors)} />
              )}
              {lead.doorWindows.patioDoors > 0 && (
                <DetailRow label="Patio doors" value={String(lead.doorWindows.patioDoors)} />
              )}
              {lead.doorWindows.windowsSmall > 0 && (
                <DetailRow label="Small windows" value={String(lead.doorWindows.windowsSmall)} />
              )}
              {lead.doorWindows.windowsMedium > 0 && (
                <DetailRow label="Medium windows" value={String(lead.doorWindows.windowsMedium)} />
              )}
              {lead.doorWindows.windowsLarge > 0 && (
                <DetailRow label="Large windows" value={String(lead.doorWindows.windowsLarge)} />
              )}
              {lead.doorWindows.replaceHardware && (
                <DetailRow label="Upsell" value="Replace hardware" />
              )}
              {lead.doorWindows.replaceKnobs && (
                <DetailRow label="Upsell" value="Replace knobs" />
              )}
            </DetailSection>
          )}

          {/* Property */}
          <DetailSection title="Property Details">
            {roomCount !== null && (
              <DetailRow
                label="Rooms"
                value={roomCount === 0 ? 'Whole floor (~6 rooms)' : `${roomCount} room${roomCount !== 1 ? 's' : ''}`}
              />
            )}
            {totalSqft !== null && totalSqft > 0 && (
              <DetailRow label="Total Area" value={`${totalSqft.toLocaleString()} sqft`} />
            )}
            {budgetRange && budgetRange !== '' && (
              <DetailRow label="Budget" value={BUDGET_FULL_LABELS[budgetRange] || budgetRange} />
            )}
            {timeline && timeline !== '' && (
              <DetailRow label="Timeline" value={TIMELINE_LABELS[timeline] || timeline} />
            )}
          </DetailSection>

          {/* Estimate breakdown — line items + range */}
          {breakdown && breakdown.lines.length > 0 && (
            <div>
              <h4
                className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: '#6B7280' }}
              >
                Estimate Breakdown
              </h4>

              {/* Line items table */}
              <div
                className="rounded-lg overflow-hidden mb-2"
                style={{ border: '1px solid #E5E7EB' }}
              >
                {breakdown.lines.map((line, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-2.5 py-1.5"
                    style={{
                      background: i % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                      borderTop: i > 0 ? '1px solid #F3F4F6' : undefined,
                    }}
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium" style={{ color: '#1A1A1A' }}>
                        {line.trade}
                      </p>
                      <p className="text-[10px]" style={{ color: '#9CA3AF' }}>
                        {line.material} &middot; {line.quantity.toLocaleString()} {line.unit} @ ${line.rate.toFixed(2)}/{line.unit}
                      </p>
                    </div>
                    <p className="text-[11px] font-semibold flex-shrink-0 ml-3" style={{ color: '#374151' }}>
                      ${line.total.toLocaleString()}
                    </p>
                  </div>
                ))}

                {/* Total row */}
                <div
                  className="flex items-center justify-between px-2.5 py-2"
                  style={{ background: '#F0FDFA', borderTop: '1px solid #E5E7EB' }}
                >
                  <p className="text-[11px] font-semibold" style={{ color: '#0F766E' }}>
                    Estimated Total
                  </p>
                  <p className="text-sm font-bold" style={{ color: '#0F766E' }}>
                    ${breakdown.totalMid.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Range bar */}
              <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: '#9CA3AF' }}>
                <span>${breakdown.low.toLocaleString()}</span>
                <span className="font-medium" style={{ color: '#6B7280' }}>
                  Range ({breakdown.totalSqft.toLocaleString()} sqft, {breakdown.roomCount} rm{breakdown.roomCount !== 1 ? 's' : ''})
                </span>
                <span>${breakdown.high.toLocaleString()}</span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: '#F3F4F6' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #D1D5DB, #0F766E, #D1D5DB)',
                    width: '100%',
                  }}
                />
              </div>
            </div>
          )}

          {/* Created */}
          <DetailRow
            label="Created"
            value={createdAt.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          />
        </div>
      )}

      {/* Stage dropdown + actions (hidden during edit) */}
      {expanded && !editing && (
        <div className="mt-3 pt-2" style={{ borderTop: '1px solid #F3F4F6' }}>
          {/* Stage selector row */}
          {stage !== 'won' && (
            <div className="flex items-center gap-2 mb-2">
              <label className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>Stage</label>
              {/* Only manual stages are selectable — discovery/site_visit/quote_sent advance via project status */}
              {(stage === 'new' || stage === 'contacted' || stage === 'lost') ? (
                <select
                  value={stage}
                  onChange={(e) => handleStageChange(e.target.value)}
                  disabled={updateStage.isPending || passLead.isPending}
                  className="min-h-[30px] px-2 pr-6 rounded-lg text-[11px] font-semibold appearance-none cursor-pointer"
                  style={{
                    background: STAGE_BG[stage],
                    color: stageColor,
                    border: `1px solid ${stageColor}40`,
                    opacity: (updateStage.isPending || passLead.isPending) ? 0.6 : 1,
                  }}
                >
                  {(['new', 'contacted', 'lost'] as LeadStage[]).map((s) => (
                    <option key={s} value={s}>
                      {STAGE_LABELS[s]}
                    </option>
                  ))}
                </select>
              ) : (
                <span
                  className="min-h-[30px] px-2.5 rounded-lg text-[11px] font-semibold flex items-center"
                  style={{ background: STAGE_BG[stage], color: stageColor, border: `1px solid ${stageColor}40` }}
                >
                  {STAGE_LABELS[stage]}
                </span>
              )}

              {/* Follow-up date */}
              {stage !== 'lost' && (
                <div className="flex items-center gap-1 ml-auto">
                  {lead.followUpDate && !showFollowUpPicker && (
                    <button
                      onClick={() => { setShowFollowUpPicker(true); setFollowUpInput(lead.followUpDate || ''); }}
                      className="text-[10px] font-medium px-2 py-1 rounded-md"
                      style={{
                        background: lead.isOverdueFollowUp ? '#FEF2F2' : '#F3F4F6',
                        color: lead.isOverdueFollowUp ? '#EF4444' : '#6B7280',
                      }}
                    >
                      <Clock size={10} className="inline mr-0.5" style={{ marginTop: -1 }} />
                      {lead.followUpDate}
                    </button>
                  )}
                  {!lead.followUpDate && !showFollowUpPicker && (
                    <button
                      onClick={() => setShowFollowUpPicker(true)}
                      className="text-[10px] font-medium px-2 py-1 rounded-md"
                      style={{ background: '#F3F4F6', color: '#9CA3AF' }}
                    >
                      <Clock size={10} className="inline mr-0.5" style={{ marginTop: -1 }} />
                      Follow-up
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Follow-up date picker (inline) */}
          {showFollowUpPicker && (
            <div className="flex items-center gap-1.5 mb-2">
              <input
                type="date"
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                className="min-h-[30px] px-2 rounded-lg text-[11px]"
                style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827' }}
              />
              <button
                onClick={handleSetFollowUp}
                disabled={!followUpInput || setFollowUp.isPending}
                className="min-h-[30px] px-2.5 rounded-lg text-[10px] font-semibold"
                style={{ background: '#0F766E', color: '#FFFFFF', opacity: (!followUpInput || setFollowUp.isPending) ? 0.5 : 1 }}
              >
                Set
              </button>
              {lead.followUpDate && (
                <button
                  onClick={handleClearFollowUp}
                  disabled={setFollowUp.isPending}
                  className="min-h-[30px] px-2 rounded-lg text-[10px] font-medium"
                  style={{ background: '#FEF2F2', color: '#EF4444' }}
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setShowFollowUpPicker(false)}
                className="min-h-[30px] px-2 rounded-lg text-[10px] font-medium"
                style={{ background: '#F3F4F6', color: '#6B7280' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions (hidden during edit) — stage-appropriate */}
      {!editing && <div className="flex gap-1.5 mt-2 flex-wrap">
        {/* Call + Text — all non-lost stages */}
        {stage !== 'lost' && stage !== 'won' && customer.phone && (
          <a
            href={`tel:${customer.phone}`}
            className="min-h-[32px] px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-medium"
            style={{ background: '#F3F4F6', color: '#374151' }}
          >
            <Phone size={12} /> Call
          </a>
        )}
        {stage !== 'lost' && stage !== 'won' && customer.phone && (
          <a
            href={`sms:${customer.phone}`}
            className="min-h-[32px] px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-medium"
            style={{ background: '#F3F4F6', color: '#374151' }}
          >
            <MessageCircle size={12} /> Text
          </a>
        )}

        {/* New / Contacted — Start Discovery */}
        {(stage === 'new' || stage === 'contacted') && !linkedProject && (
          <button
            onClick={handleStartDiscovery}
            disabled={createProject.isPending}
            className="min-h-[32px] px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-medium"
            style={{ background: '#F0FDFA', color: '#0F766E' }}
          >
            <Compass size={12} /> {createProject.isPending ? 'Creating...' : 'Start Discovery'}
          </button>
        )}

        {/* Discovery — Continue Discovery */}
        {stage === 'discovery' && linkedProject && (
          <button
            onClick={() => router.push(`/discovery/${linkedProject.id}`)}
            className="min-h-[32px] px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-medium"
            style={{ background: '#F0FDFA', color: '#0F766E' }}
          >
            <Compass size={12} /> Continue Discovery
          </button>
        )}

        {/* Site Visit — Mark Done + Build Quote */}
        {stage === 'site_visit' && linkedProject && (
          <>
            <button
              onClick={() => markSiteVisitDone.mutate({ projectId: linkedProject.id, customerName: fullName })}
              disabled={markSiteVisitDone.isPending}
              className="min-h-[32px] px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-medium"
              style={{ background: '#EDE9FE', color: '#6366F1', opacity: markSiteVisitDone.isPending ? 0.6 : 1 }}
            >
              <CheckCircle2 size={12} /> {markSiteVisitDone.isPending ? 'Saving...' : 'Site Visit Done'}
            </button>
            <button
              onClick={() => router.push(`/estimates/${linkedProject.id}`)}
              className="min-h-[32px] px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-medium"
              style={{ background: '#F0FDFA', color: '#0F766E' }}
            >
              <FileText size={12} /> Build Quote
            </button>
          </>
        )}

        {/* Quote Sent — View Quote + View Project */}
        {stage === 'quote_sent' && linkedProject && (
          <>
            <button
              onClick={() => router.push(`/estimates/${linkedProject.id}`)}
              className="min-h-[32px] px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-medium"
              style={{ background: '#F0FDFA', color: '#0F766E' }}
            >
              <Eye size={12} /> View Quote
            </button>
            <button
              onClick={() => router.push(`/projects/${linkedProject.id}`)}
              className="min-h-[32px] px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-medium"
              style={{ background: '#F3F4F6', color: '#374151' }}
            >
              View Project <ArrowRight size={12} />
            </button>
          </>
        )}

        {/* Won — View Project */}
        {stage === 'won' && linkedProject && (
          <button
            onClick={() => router.push(`/projects/${linkedProject.id}`)}
            className="min-h-[32px] px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-medium"
            style={{ background: '#ECFDF5', color: '#10B981' }}
          >
            View Project <ArrowRight size={12} />
          </button>
        )}

        {/* Lost — Restore */}
        {stage === 'lost' && (
          <button
            onClick={handleRestore}
            disabled={restoreLead.isPending}
            className="min-h-[32px] px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-medium"
            style={{ background: '#F3F4F6', color: '#374151' }}
          >
            <RotateCcw size={12} /> Restore
          </button>
        )}

        {/* Edit button — all active stages */}
        {expanded && stage !== 'won' && stage !== 'lost' && (
          <button
            onClick={handleStartEdit}
            className="min-h-[32px] px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-medium"
            style={{ background: '#EFF6FF', color: '#1D4ED8' }}
          >
            <Pencil size={12} /> Edit
          </button>
        )}

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="min-h-[32px] px-2 flex items-center rounded-lg text-[11px] font-medium ml-auto"
          style={{ color: '#D1D5DB' }}
        >
          <Trash2 size={12} />
        </button>
      </div>}

      {/* Activity Timeline + Note Input (after actions, before delete) */}
      {expanded && !editing && (
        <LeadActivitySection
          timelineData={timelineQuery.data}
          timelineLoading={timelineQuery.isLoading}
          showNoteInput={showNoteInput}
          setShowNoteInput={setShowNoteInput}
          noteActivityType={noteActivityType}
          setNoteActivityType={setNoteActivityType}
          noteTopic={noteTopic}
          setNoteTopic={setNoteTopic}
          noteOutcome={noteOutcome}
          setNoteOutcome={setNoteOutcome}
          noteDetail={noteDetail}
          setNoteDetail={setNoteDetail}
          onAddNote={handleAddNote}
          isAddingNote={addNote.isPending}
          showAllTimeline={showAllTimeline}
          setShowAllTimeline={setShowAllTimeline}
          stage={stage}
        />
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div
          className="mt-2 rounded-lg p-2.5 flex items-center justify-between"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
        >
          <p className="text-[11px] font-medium" style={{ color: '#991B1B' }}>
            Delete {fullName}?{linkedProject ? ' Project will also be removed.' : ''}
          </p>
          <div className="flex gap-1.5 flex-shrink-0 ml-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="min-h-[28px] px-2.5 rounded-md text-[11px] font-medium"
              style={{ background: '#FFFFFF', color: '#6B7280', border: '1px solid #E5E7EB' }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteLead.isPending}
              className="min-h-[28px] px-2.5 rounded-md text-[11px] font-medium"
              style={{ background: '#EF4444', color: '#FFFFFF' }}
            >
              {deleteLead.isPending ? '...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Lead Activity Section (Note Input + Timeline) ──

const EVENT_ICONS: Record<string, typeof Phone> = {
  'lead.note': StickyNote,
  'lead.stage_changed': ArrowRightLeft,
  'lead.passed': XCircle,
  'lead.restored': RotateCcw,
  'lead.project_created': FileText,
  'lead.deleted': Trash2,
  'lead.intake_edited': Pencil,
  'lead.followup_set': Clock,
  'lead.followup_cleared': Clock,
};

const NOTE_EVENT_ICON_MAP: Record<string, typeof Phone> = {
  call: Phone,
  text: MessageCircle,
  email: Mail,
  site_visit: MapPin,
  meeting: Users,
  internal_note: StickyNote,
};

const OUTCOME_COLORS: Record<string, { bg: string; text: string }> = {
  positive: { bg: '#ECFDF5', text: '#10B981' },
  neutral: { bg: '#F3F4F6', text: '#6B7280' },
  needs_follow_up: { bg: '#FFFBEB', text: '#F59E0B' },
  no_answer: { bg: '#F3F4F6', text: '#9CA3AF' },
  declined: { bg: '#FEF2F2', text: '#EF4444' },
};

function LeadActivitySection({
  timelineData,
  timelineLoading,
  showNoteInput,
  setShowNoteInput,
  noteActivityType,
  setNoteActivityType,
  noteTopic,
  setNoteTopic,
  noteOutcome,
  setNoteOutcome,
  noteDetail,
  setNoteDetail,
  onAddNote,
  isAddingNote,
  showAllTimeline,
  setShowAllTimeline,
  stage,
}: {
  timelineData?: ActivityEvent[];
  timelineLoading: boolean;
  showNoteInput: boolean;
  setShowNoteInput: (v: boolean) => void;
  noteActivityType: LeadActivityType;
  setNoteActivityType: (v: LeadActivityType) => void;
  noteTopic: LeadNoteTopic;
  setNoteTopic: (v: LeadNoteTopic) => void;
  noteOutcome: LeadNoteOutcome;
  setNoteOutcome: (v: LeadNoteOutcome) => void;
  noteDetail: string;
  setNoteDetail: (v: string) => void;
  onAddNote: () => void;
  isAddingNote: boolean;
  showAllTimeline: boolean;
  setShowAllTimeline: (v: boolean) => void;
  stage: LeadStage;
}) {
  const events = timelineData || [];
  const visibleEvents = showAllTimeline ? events : events.slice(0, 5);

  return (
    <div className="mt-2 pt-2" style={{ borderTop: '1px solid #F3F4F6' }}>
      {/* Header + Add Note toggle */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>
          Activity
        </h4>
        {stage !== 'lost' && !showNoteInput && (
          <button
            onClick={() => setShowNoteInput(true)}
            className="min-h-[24px] px-2 flex items-center gap-1 rounded-md text-[10px] font-medium"
            style={{ background: '#F0FDFA', color: '#0F766E' }}
          >
            <PlusCircle size={10} /> Log Activity
          </button>
        )}
      </div>

      {/* Structured note input */}
      {showNoteInput && (
        <div className="mb-3 p-2.5 rounded-lg" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
          {/* Row 1: Activity type pills */}
          <div className="mb-2">
            <label className="block text-[9px] font-medium mb-1" style={{ color: '#9CA3AF' }}>Type</label>
            <div className="flex flex-wrap gap-1">
              {LEAD_ACTIVITY_TYPE_OPTIONS.map((opt) => {
                const isSelected = noteActivityType === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setNoteActivityType(opt.value)}
                    className="min-h-[26px] px-2 rounded-md text-[10px] font-medium"
                    style={{
                      background: isSelected ? '#0F766E' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#6B7280',
                      border: isSelected ? '1px solid #0F766E' : '1px solid #E5E7EB',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Topic pills */}
          <div className="mb-2">
            <label className="block text-[9px] font-medium mb-1" style={{ color: '#9CA3AF' }}>Topic</label>
            <div className="flex flex-wrap gap-1">
              {LEAD_TOPIC_OPTIONS.map((opt) => {
                const isSelected = noteTopic === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setNoteTopic(opt.value)}
                    className="min-h-[26px] px-2 rounded-md text-[10px] font-medium"
                    style={{
                      background: isSelected ? '#0F766E' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#6B7280',
                      border: isSelected ? '1px solid #0F766E' : '1px solid #E5E7EB',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Outcome pills */}
          <div className="mb-2">
            <label className="block text-[9px] font-medium mb-1" style={{ color: '#9CA3AF' }}>Outcome</label>
            <div className="flex flex-wrap gap-1">
              {LEAD_OUTCOME_OPTIONS.map((opt) => {
                const isSelected = noteOutcome === opt.value;
                const colors = OUTCOME_COLORS[opt.value] || OUTCOME_COLORS.neutral;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setNoteOutcome(opt.value)}
                    className="min-h-[26px] px-2 rounded-md text-[10px] font-medium"
                    style={{
                      background: isSelected ? colors.bg : '#FFFFFF',
                      color: isSelected ? colors.text : '#6B7280',
                      border: isSelected ? `1px solid ${colors.text}40` : '1px solid #E5E7EB',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail + actions */}
          <div className="flex gap-1.5">
            <input
              type="text"
              value={noteDetail}
              onChange={(e) => setNoteDetail(e.target.value)}
              placeholder="Detail (optional)"
              className="flex-1 min-h-[30px] px-2 rounded-lg text-[11px]"
              style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#111827' }}
              onKeyDown={(e) => { if (e.key === 'Enter') onAddNote(); }}
            />
            <button
              onClick={onAddNote}
              disabled={isAddingNote}
              className="min-h-[30px] px-3 rounded-lg text-[10px] font-semibold"
              style={{ background: '#0F766E', color: '#FFFFFF', opacity: isAddingNote ? 0.6 : 1 }}
            >
              {isAddingNote ? '...' : 'Log'}
            </button>
            <button
              onClick={() => setShowNoteInput(false)}
              className="min-h-[30px] px-2 rounded-lg text-[10px] font-medium"
              style={{ background: '#F3F4F6', color: '#6B7280' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Timeline list */}
      {timelineLoading && (
        <p className="text-[10px] py-2" style={{ color: '#9CA3AF' }}>Loading timeline...</p>
      )}
      {!timelineLoading && events.length === 0 && (
        <p className="text-[10px] py-2" style={{ color: '#D1D5DB' }}>No activity yet</p>
      )}
      {!timelineLoading && visibleEvents.length > 0 && (
        <div className="space-y-1">
          {visibleEvents.map((event) => (
            <TimelineEventRow key={event.id} event={event} />
          ))}
          {events.length > 5 && !showAllTimeline && (
            <button
              onClick={() => setShowAllTimeline(true)}
              className="text-[10px] font-medium py-1"
              style={{ color: '#0F766E' }}
            >
              Show all ({events.length})
            </button>
          )}
          {showAllTimeline && events.length > 5 && (
            <button
              onClick={() => setShowAllTimeline(false)}
              className="text-[10px] font-medium py-1"
              style={{ color: '#0F766E' }}
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TimelineEventRow({ event }: { event: ActivityEvent }) {
  const timestamp = new Date(event.timestamp);
  const timeLabel = formatRelativeDate(timestamp);
  const eventData = event.event_data as Record<string, unknown>;

  // Determine icon
  let IconComponent = EVENT_ICONS[event.event_type] || AlertCircle;
  if (event.event_type === 'lead.note' && eventData.activity_type) {
    IconComponent = NOTE_EVENT_ICON_MAP[eventData.activity_type as string] || StickyNote;
  }

  // Determine outcome color for notes
  const outcomeColor = event.event_type === 'lead.note' && eventData.outcome
    ? OUTCOME_COLORS[eventData.outcome as string] || OUTCOME_COLORS.neutral
    : null;

  // Extract detail text
  const detail = eventData.detail as string | null;

  return (
    <div className="flex items-start gap-2 py-1">
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: outcomeColor?.bg || '#F3F4F6' }}
      >
        <IconComponent size={10} style={{ color: outcomeColor?.text || '#9CA3AF' }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[11px] font-medium truncate" style={{ color: '#374151' }}>
            {event.summary}
          </p>
          <span className="text-[9px] flex-shrink-0" style={{ color: '#D1D5DB' }}>
            {timeLabel}
          </span>
        </div>
        {detail && (
          <p className="text-[10px] mt-0.5 truncate" style={{ color: '#9CA3AF' }}>
            {detail}
          </p>
        )}
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4
        className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: '#6B7280' }}
      >
        {title}
      </h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>
        {label}
      </span>
      <span className="text-[11px] font-medium text-right" style={{ color: '#374151' }}>
        {value}
      </span>
    </div>
  );
}

// ── Edit Mode Sub-components ──

function EditSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4
        className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: '#6B7280' }}
      >
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-medium mb-0.5" style={{ color: '#9CA3AF' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[34px] px-2.5 rounded-lg text-[12px]"
        style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827' }}
      />
    </div>
  );
}

function EditPillGroup({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] font-medium mb-1" style={{ color: '#9CA3AF' }}>
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className="min-h-[28px] px-2 rounded-lg text-[10px] font-medium transition-colors"
              style={{
                background: isSelected ? '#F0FDFA' : '#FFFFFF',
                color: isSelected ? '#0F766E' : '#6B7280',
                border: isSelected ? '2px solid #0F766E' : '1px solid #E5E7EB',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EditCounterField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg px-2 py-1" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
      <span className="text-[10px] font-medium" style={{ color: '#6B7280' }}>{label}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="min-h-[24px] min-w-[24px] flex items-center justify-center rounded text-xs font-medium"
          style={{ background: '#FFFFFF', color: value > 0 ? '#374151' : '#D1D5DB', border: '1px solid #E5E7EB' }}
        >
          −
        </button>
        <span className="w-5 text-center text-[11px] font-semibold" style={{ color: value > 0 ? '#111827' : '#D1D5DB' }}>
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="min-h-[24px] min-w-[24px] flex items-center justify-center rounded text-xs font-medium"
          style={{ background: '#F0FDFA', color: '#0F766E', border: '1px solid #0F766E40' }}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
