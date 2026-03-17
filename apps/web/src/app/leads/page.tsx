'use client';

/**
 * Lead Pipeline — /leads
 *
 * 7-stage pipeline: New → Contacted → Discovery → Site Visit → Quote Sent → Won → Lost.
 * Cards show temperature, scope badges, budget range, instant estimate, one-tap actions.
 * Sorted by temperature (hot first) then age within each stage.
 */

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

// ── Temperature → left border accent colours ──
const TEMP_BORDER: Record<string, string> = {
  hot:  '#c2410c',
  warm: '#d97706',
  cool: '#3b82f6',
};

// ── Design tokens — Hooomz Digital Brand & Design System v1.0 ──
const FIG = "'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "'DM Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace";

// Surfaces
const BG = '#F0EDE8';                       // --bg: warm linen
const CARD = '#FAF8F5';                     // --surface: card bg
const SURFACE2 = '#E8E4DE';                 // --surface-2: tab bars, deeper surface

// Text
const INK = '#1A1714';                      // --charcoal: primary text
const INK2 = '#5C5349';                     // --mid: body text
const INK3 = '#9A8E84';                     // --muted: labels, secondary
const FAINT = '#D4CEC7';                    // --faint: decorative lines

// Borders
const BORDER = 'rgba(0,0,0,.10)';           // --border: default
const BORDER_S = 'rgba(0,0,0,.18)';         // --border-s: stronger (outline btns)

// Accent
const ACCENT = '#6B6560';                   // --accent
const ACCENT_BG = 'rgba(107,101,96,.09)';   // --accent-bg
const ACCENT_BORDER = 'rgba(107,101,96,.22)'; // --accent-border

// Layout
const RADIUS = 10;                          // --radius: cards, large containers
const RADIUS_SM = 6;                        // --radius-sm: buttons, badges

/** Outline button — mono 9.5px, per brand spec */
const actionBtn: Record<string, string | number> = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '12px 24px',
  fontFamily: MONO, fontSize: 9.5, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase',
  color: INK2, background: 'transparent',
  border: `1px solid ${BORDER_S}`, borderRadius: RADIUS_SM,
  cursor: 'pointer', textDecoration: 'none',
  transition: 'background 0.15s',
};

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


const SOURCE_LABELS: Record<string, string> = {
  home_show: 'Home Show',
  referral: 'Referral',
  website: 'Website',
  google: 'Google',
  social: 'Social',
  ritchies: 'Ritchies',
  repeat: 'Repeat',
  'home-show': 'Home Show',
  homeowner_intake: 'Website',
  HOMEOWNER_INTAKE: 'Website',
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
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const pipeline = useLeadPipeline();
  const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all');
  const [collapsedStages, setCollapsedStages] = useState<Set<LeadStage>>(
    new Set()
  );

  // Auto-expand the stage containing the highlighted lead
  useEffect(() => {
    if (!highlightId || pipeline.isLoading) return;
    const match = pipeline.leads.find((l) => l.customer.id === highlightId);
    if (match) {
      setCollapsedStages((prev) => {
        const next = new Set(prev);
        next.delete(match.stage);
        return next;
      });
    }
  }, [highlightId, pipeline.isLoading, pipeline.leads]);

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 28, height: 28, border: `2px solid ${BORDER}`, borderTopColor: INK, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 10px' }} />
          <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: INK3 }}>Loading&hellip;</p>
        </div>
      </div>
    );
  }

  const hotCount = pipeline.leads.filter((l) => l.temperature === 'hot' && l.stage !== 'won' && l.stage !== 'lost').length;
  const warmCount = pipeline.leads.filter((l) => l.temperature === 'warm' && l.stage !== 'won' && l.stage !== 'lost').length;

  return (
    <PageErrorBoundary>
    <div style={{ minHeight: '100vh', paddingBottom: 80, background: BG }}>

      {/* ── Header ── */}
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 40px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontFamily: FIG, fontSize: 'clamp(28px, 3.2vw, 46px)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.05, color: INK, margin: 0 }}>
                Lead Pipeline
              </h1>
              <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 400, color: INK3, marginTop: 8, letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
                {pipeline.leads.length} lead{pipeline.leads.length !== 1 ? 's' : ''}
                {hotCount > 0 && <span> · <span style={{ color: TEMPERATURE_CONFIG.hot.color }}>{hotCount} hot</span></span>}
                {warmCount > 0 && <span> · <span style={{ color: TEMPERATURE_CONFIG.warm.color }}>{warmCount} warm</span></span>}
              </p>
            </div>
            <button
              onClick={() => router.push('/leads/new')}
              style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS_SM, background: INK, border: 'none', cursor: 'pointer' }}
            >
              <Plus size={16} color="#fff" strokeWidth={2.5} />
            </button>
          </div>

          {/* ── Filter tabs — outlined pills ── */}
          <div style={{ display: 'flex', gap: 6, paddingBottom: 16, overflowX: 'auto' }}>
            <StageTab label="All" count={pipeline.leads.length} active={stageFilter === 'all'} onClick={() => setStageFilter('all')} />
            {STAGE_ORDER.map((stage) => {
              const count = pipeline.counts[stage];
              if (count === 0 && stage !== 'new') return null;
              return <StageTab key={stage} label={STAGE_LABELS[stage]} count={count} active={stageFilter === stage} onClick={() => setStageFilter(stage)} />;
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>

        {/* Empty state */}
        {filteredLeads.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 56, padding: '0 20px' }}>
            <p style={{ fontFamily: FIG, fontSize: 16, fontWeight: 600, color: INK, marginBottom: 8, lineHeight: 1.05 }}>No leads yet</p>
            <p style={{ fontFamily: FIG, fontSize: 14, color: INK2, marginBottom: 24, lineHeight: 1.65 }}>Capture your first lead at a home show or from a referral.</p>
            <button
              onClick={() => router.push('/leads/new')}
              style={{ minHeight: 40, padding: '13px 24px', borderRadius: RADIUS_SM, fontFamily: MONO, fontSize: 9.5, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase' as const, background: INK, color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
            >
              Capture a Lead
            </button>
          </div>
        )}

        {/* Pipeline bar — removed (was rendering as purple line) */}

        {/* ── Stage groups ── */}
        {grouped.map(({ stage, leads }) => (
          <div key={stage} style={{ marginTop: 28 }}>
            {/* Section header */}
            <button
              onClick={() => toggleCollapse(stage)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {collapsedStages.has(stage)
                ? <ChevronRight size={12} style={{ color: INK3 }} />
                : <ChevronDown size={12} style={{ color: INK3 }} />}
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: STAGE_COLORS[stage] }} />
              <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 400, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: INK3 }}>
                {STAGE_LABELS[stage]}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 400, letterSpacing: '0.14em', color: INK3 }}>
                {leads.length}
              </span>
            </button>

            {/* Card list */}
            {!collapsedStages.has(stage) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {leads.map((lead) => (
                  <LeadCard key={lead.customer.id} lead={lead} defaultExpanded={lead.customer.id === highlightId} />
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

function StageTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 18px',
        fontFamily: MONO,
        fontSize: 9.5,
        fontWeight: 500,
        letterSpacing: '0.10em',
        textTransform: 'uppercase' as const,
        whiteSpace: 'nowrap' as const,
        background: active ? INK : 'transparent',
        border: `1px solid ${active ? INK : BORDER_S}`,
        borderRadius: RADIUS_SM,
        color: active ? '#fff' : INK2,
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      {label}{count > 0 ? ` ${count}` : ''}
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

function LeadCard({ lead, defaultExpanded = false }: { lead: LeadRecord; defaultExpanded?: boolean }) {
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
  const [expanded, setExpanded] = useState(defaultExpanded);
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
      style={{
        padding: '14px 16px',
        background: '#ffffff',
        border: '1px solid #ddd9d3',
        borderLeft: `3px solid ${TEMP_BORDER[temperature] || '#3b82f6'}`,
        borderRadius: 2,
        opacity: stage === 'lost' ? 0.6 : 1,
      }}
    >
      {/* Tappable content area */}
      <div onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
        {/* Row 1: Name + phone + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: tempConfig.color, flexShrink: 0 }} title={`${tempConfig.label} lead`} />
            <span style={{ fontFamily: FIG, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
              {fullName}
            </span>
            {lead.isOverdueFollowUp && (
              <span style={{ fontFamily: MONO, fontSize: 7, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '2px 7px', borderRadius: 3, background: 'rgba(220,38,38,.08)', color: '#DC2626', border: '1px solid rgba(220,38,38,.2)', flexShrink: 0 }}>
                Overdue
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 8 }}>
            {customer.phone && (
              <a href={`tel:${customer.phone}`} style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: INK3, textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                {customer.phone}
              </a>
            )}
            <ChevronDown size={14} style={{ color: INK3, transition: 'transform 150ms', transform: expanded ? 'rotate(180deg)' : undefined }} />
          </div>
        </div>

        {/* Row 2: Scope tags + metadata — clean, monochrome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {displayScopes.map((scope) => (
            <span key={scope} style={{ fontFamily: MONO, fontSize: 7, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '2px 7px', borderRadius: 3, background: ACCENT_BG, color: ACCENT, border: `1px solid ${ACCENT_BORDER}` }}>
              {SCOPE_LABELS[scope] || scope}
            </span>
          ))}
          {displayScopes.length > 0 && (totalSqft || sourceLabel || budgetLabel) && (
            <span style={{ color: FAINT, fontSize: 10 }}>&middot;</span>
          )}
          {totalSqft !== null && totalSqft > 0 && (
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: INK3 }}>
              {totalSqft.toLocaleString()} sqft
            </span>
          )}
          {roomCount !== null && roomCount > 0 && (
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: INK3 }}>
              {roomCount} rm{roomCount !== 1 ? 's' : ''}
            </span>
          )}
          {sourceLabel && (
            <span style={{ fontFamily: MONO, fontSize: 7, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '2px 7px', borderRadius: 3, background: ACCENT_BG, color: ACCENT, border: `1px solid ${ACCENT_BORDER}` }}>
              {sourceLabel}
            </span>
          )}
          <span style={{ color: FAINT, fontSize: 10 }}>&middot;</span>
          <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: INK3 }}>
            {timeLabel}
          </span>
        </div>

        {/* Row 3: Estimate (if exists) */}
        {instantEstimate && (
          <div style={{ marginTop: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', color: INK }}>
              ${instantEstimate.low.toLocaleString()} – ${instantEstimate.high.toLocaleString()}
            </span>
          </div>
        )}

        {customer.notes && !expanded && (
          <p style={{ fontFamily: FIG, fontSize: 11, fontStyle: 'italic', color: INK3, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            &ldquo;{customer.notes}&rdquo;
          </p>
        )}
      </div>{/* end clickable area */}

      {/* Expanded detail panel — EDIT MODE */}
      {expanded && editing && editData && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {/* Edit header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: INK2, margin: 0 }}>
              Editing Intake
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleCancelEdit}
                style={{ ...actionBtn, background: BG }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updateLead.isPending}
                style={{ ...actionBtn, background: INK, color: '#fff', border: `1px solid ${INK}`, opacity: updateLead.isPending ? 0.6 : 1 }}
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EDIT_SCOPE_OPTIONS.map((opt) => {
                const isSelected = editData.scopeTags.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleEditScope(opt.value)}
                    style={{ minHeight: 30, padding: '0 10px', borderRadius: RADIUS_SM, fontFamily: MONO, fontSize: 10, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' as const, cursor: 'pointer', transition: 'all 150ms', background: isSelected ? ACCENT_BG : CARD, color: isSelected ? ACCENT : INK3, border: isSelected ? `1px solid ${ACCENT_BORDER}` : `1px solid ${BORDER}` }}
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
                <div key={trade} style={{ marginBottom: 8 }}>
                  <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, color: INK3, marginBottom: 4, margin: 0, marginTop: 0 }}>
                    {TRADE_FULL_LABELS[trade] || trade}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {EDIT_MATERIAL_OPTIONS[trade].map((opt) => {
                      const isSelected = trade === 'trim'
                        ? (editData.materialPrefs[trade] || '').split(',').includes(opt.value)
                        : editData.materialPrefs[trade] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => updateEditMaterial(trade, opt.value)}
                          style={{ minHeight: 28, padding: '0 8px', borderRadius: RADIUS_SM, fontFamily: MONO, fontSize: 10, fontWeight: 500, cursor: 'pointer', transition: 'all 150ms', background: isSelected ? ACCENT_BG : CARD, color: isSelected ? ACCENT : INK3, border: isSelected ? `1px solid ${ACCENT_BORDER}` : `1px solid ${BORDER}` }}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <EditCounterField label="Exterior" value={editData.doorWindows.exteriorDoors} onChange={(v) => setEditData({ ...editData, doorWindows: { ...editData.doorWindows, exteriorDoors: v } })} />
              <EditCounterField label="Interior" value={editData.doorWindows.interiorDoors} onChange={(v) => setEditData({ ...editData, doorWindows: { ...editData.doorWindows, interiorDoors: v } })} />
              <EditCounterField label="Closet" value={editData.doorWindows.closetDoors} onChange={(v) => setEditData({ ...editData, doorWindows: { ...editData.doorWindows, closetDoors: v } })} />
              <EditCounterField label="Patio" value={editData.doorWindows.patioDoors} onChange={(v) => setEditData({ ...editData, doorWindows: { ...editData.doorWindows, patioDoors: v } })} />
            </div>
            <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, color: INK3, marginTop: 8, marginBottom: 4 }}>Windows</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <EditCounterField label="Small" value={editData.doorWindows.windowsSmall} onChange={(v) => setEditData({ ...editData, doorWindows: { ...editData.doorWindows, windowsSmall: v } })} />
              <EditCounterField label="Medium" value={editData.doorWindows.windowsMedium} onChange={(v) => setEditData({ ...editData, doorWindows: { ...editData.doorWindows, windowsMedium: v } })} />
              <EditCounterField label="Large" value={editData.doorWindows.windowsLarge} onChange={(v) => setEditData({ ...editData, doorWindows: { ...editData.doorWindows, windowsLarge: v } })} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => setEditData({ ...editData, doorWindows: { ...editData.doorWindows, replaceHardware: !editData.doorWindows.replaceHardware } })}
                style={{ flex: 1, minHeight: 28, padding: '0 8px', borderRadius: RADIUS_SM, fontFamily: MONO, fontSize: 10, fontWeight: 500, cursor: 'pointer', background: editData.doorWindows.replaceHardware ? ACCENT_BG : CARD, color: editData.doorWindows.replaceHardware ? ACCENT : INK2, border: editData.doorWindows.replaceHardware ? `1px solid ${ACCENT_BORDER}` : `1px solid ${BORDER}` }}
              >
                Hardware
              </button>
              <button
                onClick={() => setEditData({ ...editData, doorWindows: { ...editData.doorWindows, replaceKnobs: !editData.doorWindows.replaceKnobs } })}
                style={{ flex: 1, minHeight: 28, padding: '0 8px', borderRadius: RADIUS_SM, fontFamily: MONO, fontSize: 10, fontWeight: 500, cursor: 'pointer', background: editData.doorWindows.replaceKnobs ? ACCENT_BG : CARD, color: editData.doorWindows.replaceKnobs ? ACCENT : INK2, border: editData.doorWindows.replaceKnobs ? `1px solid ${ACCENT_BORDER}` : `1px solid ${BORDER}` }}
              >
                Knobs
              </button>
            </div>
          </EditSection>

          {/* Property */}
          <EditSection title="Property Details">
            <div style={{ display: 'flex', gap: 12 }}>
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
              style={{ width: '100%', padding: '8px 12px', borderRadius: RADIUS_SM, fontFamily: FIG, fontSize: 12, background: SURFACE2, border: `1px solid ${BORDER}`, color: INK, resize: 'vertical' as const }}
            />
          </EditSection>

          {/* Bottom Save/Cancel */}
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button
              onClick={handleCancelEdit}
              style={{ ...actionBtn, flex: 1, justifyContent: 'center', background: BG }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={updateLead.isPending}
              style={{ ...actionBtn, flex: 1, justifyContent: 'center', background: INK, color: '#fff', border: `1px solid ${INK}`, opacity: updateLead.isPending ? 0.6 : 1 }}
            >
              <Save size={12} /> {updateLead.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Expanded detail panel — READ MODE */}
      {expanded && !editing && (
        <div style={{ marginTop: 12, padding: 12, background: '#F0EDE8', borderTop: '1px solid #ddd9d3', display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
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
                style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase' as const, color: '#aaa', marginBottom: 8 }}
              >
                Estimate Breakdown
              </h4>

              {/* Line items table */}
              <div style={{ borderRadius: RADIUS, overflow: 'hidden', marginBottom: 8, border: `1px solid ${BORDER}` }}>
                {breakdown.lines.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 10px',
                      background: i % 2 === 0 ? CARD : SURFACE2,
                      borderTop: i > 0 ? `1px solid ${BORDER}` : undefined,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: FIG, fontSize: 11, fontWeight: 500, color: INK, margin: 0 }}>
                        {line.trade}
                      </p>
                      <p style={{ fontFamily: MONO, fontSize: 10, color: INK3, margin: 0 }}>
                        {line.material} &middot; {line.quantity.toLocaleString()} {line.unit} @ ${line.rate.toFixed(2)}/{line.unit}
                      </p>
                    </div>
                    <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: INK2, flexShrink: 0, marginLeft: 12, margin: 0 }}>
                      ${line.total.toLocaleString()}
                    </p>
                  </div>
                ))}

                {/* Total row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 10px 8px', borderTop: '1px solid #ddd9d3' }}>
                  <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#111010', margin: 0 }}>
                    Estimated Total
                  </p>
                  <p style={{ fontFamily: FIG, fontSize: 15, fontWeight: 700, color: '#111010', margin: 0 }}>
                    ${breakdown.totalMid.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Range bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: MONO, fontSize: 10, color: '#888', marginBottom: 4 }}>
                <span>${breakdown.low.toLocaleString()}</span>
                <span style={{ fontWeight: 500, color: '#888' }}>
                  Range ({breakdown.totalSqft.toLocaleString()} sqft, {breakdown.roomCount} rm{breakdown.roomCount !== 1 ? 's' : ''})
                </span>
                <span>${breakdown.high.toLocaleString()}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, overflow: 'hidden', background: '#ddd9d3' }}>
                <div style={{ height: '100%', borderRadius: 2, background: '#111010', width: '100%' }} />
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
        <div style={{ marginTop: 12, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
          {/* Stage selector row */}
          {stage !== 'won' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <label style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, color: INK3 }}>Stage</label>
              {(stage === 'new' || stage === 'contacted' || stage === 'lost') ? (
                <select
                  value={stage}
                  onChange={(e) => handleStageChange(e.target.value)}
                  disabled={updateStage.isPending || passLead.isPending}
                  style={{ minHeight: 30, padding: '4px 24px 4px 8px', borderRadius: 2, fontFamily: MONO, fontSize: 10, fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' as const, appearance: 'none' as const, cursor: 'pointer', background: 'transparent', color: '#111010', border: '1px solid #ddd9d3', opacity: (updateStage.isPending || passLead.isPending) ? 0.6 : 1 }}
                >
                  {(['new', 'contacted', 'lost'] as LeadStage[]).map((s) => (
                    <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                  ))}
                </select>
              ) : (
                <span style={{ minHeight: 30, padding: '4px 10px', borderRadius: 2, fontFamily: MONO, fontSize: 10, fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' as const, display: 'inline-flex', alignItems: 'center', background: 'transparent', color: '#111010', border: '1px solid #ddd9d3' }}>
                  {STAGE_LABELS[stage]}
                </span>
              )}

              {/* Follow-up date */}
              {stage !== 'lost' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                  {lead.followUpDate && !showFollowUpPicker && (
                    <button
                      onClick={() => { setShowFollowUpPicker(true); setFollowUpInput(lead.followUpDate || ''); }}
                      style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, padding: '4px 8px', borderRadius: RADIUS_SM, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3, background: lead.isOverdueFollowUp ? '#FEF2F2' : BG, color: lead.isOverdueFollowUp ? '#EF4444' : INK3 }}
                    >
                      <Clock size={10} />
                      {lead.followUpDate}
                    </button>
                  )}
                  {!lead.followUpDate && !showFollowUpPicker && (
                    <button
                      onClick={() => setShowFollowUpPicker(true)}
                      style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, padding: '4px 8px', borderRadius: RADIUS_SM, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3, background: BG, color: INK3 }}
                    >
                      <Clock size={10} />
                      Follow-up
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Follow-up date picker (inline) */}
          {showFollowUpPicker && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <input
                type="date"
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                style={{ minHeight: 30, padding: '0 8px', borderRadius: RADIUS_SM, fontFamily: MONO, fontSize: 11, background: SURFACE2, border: `1px solid ${BORDER}`, color: INK }}
              />
              <button onClick={handleSetFollowUp} disabled={!followUpInput || setFollowUp.isPending} style={{ ...actionBtn, background: INK, color: '#fff', border: `1px solid ${INK}`, opacity: (!followUpInput || setFollowUp.isPending) ? 0.5 : 1 }}>
                Set
              </button>
              {lead.followUpDate && (
                <button onClick={handleClearFollowUp} disabled={setFollowUp.isPending} style={{ ...actionBtn, background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}>
                  Clear
                </button>
              )}
              <button onClick={() => setShowFollowUpPicker(false)} style={{ ...actionBtn, background: BG }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions (hidden during edit) — stage-appropriate */}
      {!editing && <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {/* Call + Text — all non-lost stages */}
        {stage !== 'lost' && stage !== 'won' && customer.phone && (
          <a href={`tel:${customer.phone}`} style={actionBtn}>
            <Phone size={11} /> Call
          </a>
        )}
        {stage !== 'lost' && stage !== 'won' && customer.phone && (
          <a href={`sms:${customer.phone}`} style={actionBtn}>
            <MessageCircle size={11} /> Text
          </a>
        )}

        {/* New / Contacted — Start Discovery */}
        {(stage === 'new' || stage === 'contacted') && !linkedProject && (
          <button onClick={handleStartDiscovery} disabled={createProject.isPending} style={{ ...actionBtn, color: INK }}>
            <Compass size={11} /> {createProject.isPending ? 'Creating...' : 'Start Discovery'}
          </button>
        )}

        {/* Discovery — Continue Discovery */}
        {stage === 'discovery' && linkedProject && (
          <button onClick={() => router.push(`/discovery/${linkedProject.id}`)} style={{ ...actionBtn, color: INK }}>
            <Compass size={11} /> Continue Discovery
          </button>
        )}

        {/* Site Visit — Mark Done + Build Quote */}
        {stage === 'site_visit' && linkedProject && (
          <>
            <button onClick={() => markSiteVisitDone.mutate({ projectId: linkedProject.id, customerName: fullName })} disabled={markSiteVisitDone.isPending} style={{ ...actionBtn, color: INK, opacity: markSiteVisitDone.isPending ? 0.6 : 1 }}>
              <CheckCircle2 size={11} /> {markSiteVisitDone.isPending ? 'Saving...' : 'Site Visit Done'}
            </button>
            <button onClick={() => router.push(`/estimates/${linkedProject.id}`)} style={{ ...actionBtn, color: INK }}>
              <FileText size={11} /> Build Quote
            </button>
          </>
        )}

        {/* Quote Sent — View Quote + View Project */}
        {stage === 'quote_sent' && linkedProject && (
          <>
            <button onClick={() => router.push(`/estimates/${linkedProject.id}`)} style={{ ...actionBtn, color: INK }}>
              <Eye size={11} /> View Quote
            </button>
            <button onClick={() => router.push(`/projects/${linkedProject.id}`)} style={actionBtn}>
              View Project <ArrowRight size={11} />
            </button>
          </>
        )}

        {/* Won — View Project */}
        {stage === 'won' && linkedProject && (
          <button onClick={() => router.push(`/projects/${linkedProject.id}`)} style={{ ...actionBtn, color: INK }}>
            View Project <ArrowRight size={11} />
          </button>
        )}

        {/* Lost — Restore */}
        {stage === 'lost' && (
          <button onClick={handleRestore} disabled={restoreLead.isPending} style={actionBtn}>
            <RotateCcw size={11} /> Restore
          </button>
        )}

        {/* Edit button — all active stages */}
        {expanded && stage !== 'won' && stage !== 'lost' && (
          <button onClick={handleStartEdit} style={actionBtn}>
            <Pencil size={11} /> Edit
          </button>
        )}

        <button onClick={() => setShowDeleteConfirm(true)} style={{ ...actionBtn, border: 'none', marginLeft: 'auto', color: INK3, padding: '0 4px' }}>
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
        <div style={{ marginTop: 8, borderRadius: RADIUS, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <p style={{ fontFamily: FIG, fontSize: 11, fontWeight: 500, color: '#991B1B', margin: 0 }}>
            Delete {fullName}?{linkedProject ? ' Project will also be removed.' : ''}
          </p>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
            <button onClick={() => setShowDeleteConfirm(false)} style={{ ...actionBtn, background: CARD }}>
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleteLead.isPending} style={{ ...actionBtn, background: '#EF4444', color: '#fff', border: '1px solid #EF4444' }}>
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

  const pillStyle = (isSelected: boolean, selBg = INK, selColor = CARD) => ({
    minHeight: 26, padding: '0 8px', borderRadius: RADIUS_SM,
    fontFamily: MONO, fontSize: 10, fontWeight: 500, cursor: 'pointer',
    background: isSelected ? selBg : CARD,
    color: isSelected ? selColor : INK2,
    border: isSelected ? `1px solid ${selBg}` : `1px solid ${BORDER}`,
  });

  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
      {/* Header + Add Note toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h4 style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: INK3, margin: 0 }}>
          Activity
        </h4>
        {stage !== 'lost' && !showNoteInput && (
          <button
            onClick={() => setShowNoteInput(true)}
            style={{ ...actionBtn, background: ACCENT_BG, color: INK2 }}
          >
            <PlusCircle size={10} /> Log Activity
          </button>
        )}
      </div>

      {/* Structured note input */}
      {showNoteInput && (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: RADIUS, background: SURFACE2, border: `1px solid ${BORDER}` }}>
          {/* Row 1: Activity type pills */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontFamily: MONO, fontSize: 9, fontWeight: 500, color: INK3, marginBottom: 4 }}>Type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {LEAD_ACTIVITY_TYPE_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setNoteActivityType(opt.value)} style={pillStyle(noteActivityType === opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Topic pills */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontFamily: MONO, fontSize: 9, fontWeight: 500, color: INK3, marginBottom: 4 }}>Topic</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {LEAD_TOPIC_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setNoteTopic(opt.value)} style={pillStyle(noteTopic === opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Outcome pills */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontFamily: MONO, fontSize: 9, fontWeight: 500, color: INK3, marginBottom: 4 }}>Outcome</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {LEAD_OUTCOME_OPTIONS.map((opt) => {
                const isSelected = noteOutcome === opt.value;
                const colors = OUTCOME_COLORS[opt.value] || OUTCOME_COLORS.neutral;
                return (
                  <button key={opt.value} onClick={() => setNoteOutcome(opt.value)}
                    style={{ minHeight: 26, padding: '0 8px', borderRadius: RADIUS_SM, fontFamily: MONO, fontSize: 10, fontWeight: 500, cursor: 'pointer', background: isSelected ? colors.bg : CARD, color: isSelected ? colors.text : INK2, border: isSelected ? `1px solid ${colors.text}40` : `1px solid ${BORDER}` }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail + actions */}
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={noteDetail}
              onChange={(e) => setNoteDetail(e.target.value)}
              placeholder="Detail (optional)"
              style={{ flex: 1, minHeight: 30, padding: '0 8px', borderRadius: RADIUS_SM, fontFamily: FIG, fontSize: 11, background: CARD, border: `1px solid ${BORDER}`, color: INK }}
              onKeyDown={(e) => { if (e.key === 'Enter') onAddNote(); }}
            />
            <button onClick={onAddNote} disabled={isAddingNote} style={{ ...actionBtn, background: INK, color: '#fff', border: `1px solid ${INK}`, opacity: isAddingNote ? 0.6 : 1 }}>
              {isAddingNote ? '...' : 'Log'}
            </button>
            <button onClick={() => setShowNoteInput(false)} style={{ ...actionBtn, background: BG }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Timeline list */}
      {timelineLoading && (
        <p style={{ fontFamily: MONO, fontSize: 10, padding: '8px 0', color: INK3, margin: 0 }}>Loading timeline...</p>
      )}
      {!timelineLoading && events.length === 0 && (
        <p style={{ fontFamily: MONO, fontSize: 10, padding: '8px 0', color: INK3, margin: 0 }}>No activity yet</p>
      )}
      {!timelineLoading && visibleEvents.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
          {visibleEvents.map((event) => (
            <TimelineEventRow key={event.id} event={event} />
          ))}
          {events.length > 5 && !showAllTimeline && (
            <button onClick={() => setShowAllTimeline(true)} style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, padding: '4px 0', color: INK2, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
              Show all ({events.length})
            </button>
          )}
          {showAllTimeline && events.length > 5 && (
            <button onClick={() => setShowAllTimeline(false)} style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, padding: '4px 0', color: INK2, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
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
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0' }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, background: outcomeColor?.bg || SURFACE2 }}>
        <IconComponent size={10} style={{ color: outcomeColor?.text || INK3 }} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <p style={{ fontFamily: FIG, fontSize: 11, fontWeight: 500, color: INK2, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {event.summary}
          </p>
          <span style={{ fontFamily: MONO, fontSize: 9, flexShrink: 0, color: INK3 }}>
            {timeLabel}
          </span>
        </div>
        {detail && (
          <p style={{ fontFamily: FIG, fontSize: 10, color: INK3, margin: 0, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {detail}
          </p>
        )}
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ paddingBottom: 12, borderBottom: '1px solid #ddd9d3' }}>
      <h4
        style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase' as const, color: '#aaa', margin: 0, marginBottom: 6 }}
      >
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 400, color: '#888' }}>
        {label}
      </span>
      <span style={{ fontFamily: FIG, fontSize: 13, fontWeight: 400, textAlign: 'right' as const, color: '#111010' }}>
        {value}
      </span>
    </div>
  );
}

// ── Edit Mode Sub-components ──

function EditSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: INK3, margin: 0, marginBottom: 6 }}>
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>{children}</div>
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
      <label style={{ display: 'block', fontFamily: MONO, fontSize: 9, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: INK3, marginBottom: 4 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', minHeight: 34, padding: '0 12px', borderRadius: RADIUS_SM, fontFamily: FIG, fontSize: 13, background: CARD, border: `1px solid ${BORDER}`, color: INK }}
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
      <label style={{ display: 'block', fontFamily: MONO, fontSize: 9, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: INK3, marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              style={{ padding: '7px 14px', borderRadius: RADIUS_SM, fontFamily: MONO, fontSize: 9.5, fontWeight: 500, letterSpacing: '0.06em', cursor: 'pointer', transition: 'background 0.15s', background: isSelected ? ACCENT_BG : CARD, color: isSelected ? ACCENT : INK2, border: isSelected ? `1px solid ${ACCENT_BORDER}` : `1px solid ${BORDER}` }}
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: RADIUS_SM, padding: '4px 8px', background: SURFACE2, border: `1px solid ${BORDER}` }}>
      <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, color: INK2 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          style={{ minHeight: 24, minWidth: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontFamily: MONO, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: CARD, color: value > 0 ? INK2 : INK3, border: `1px solid ${BORDER}` }}
        >
          −
        </button>
        <span style={{ width: 20, textAlign: 'center' as const, fontFamily: MONO, fontSize: 11, fontWeight: 600, color: value > 0 ? INK : INK3 }}>
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          style={{ minHeight: 24, minWidth: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontFamily: MONO, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: ACCENT_BG, color: ACCENT, border: `1px solid ${ACCENT_BORDER}` }}
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
