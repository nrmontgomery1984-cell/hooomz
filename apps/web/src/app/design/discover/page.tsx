'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLeadPipeline } from '@/lib/hooks/useLeadData';
import type { LeadRecord } from '@/lib/hooks/useLeadData';

// ============================================================================
// TYPES
// ============================================================================

type LeadStatus = 'new' | 'active' | 'quoted' | 'won' | 'lost';
type Trade = 'FL' | 'PT' | 'TR';
type PhaseStatus = 'complete' | 'active' | 'warning' | 'future';
type PerformanceColour = 'green' | 'amber' | 'red';
type CheckItemType = 'auto' | 'killer' | 'normal';

interface PhaseEntry {
  status: PhaseStatus;
  performanceColour?: PerformanceColour;
}

interface LeadPhases {
  discover: PhaseEntry;
  estimate: PhaseEntry;
  survey: PhaseEntry;
  iterations: PhaseEntry;
  goAhead: PhaseEntry;
  notify: PhaseEntry;
}

interface ChecklistItem {
  id: number;
  type: CheckItemType;
  label: string;
  note: string;
  checked: boolean;
}

interface EstimateLine {
  trade: string;
  description: string;
  amount: number;
}

interface Lead {
  id: string;
  clientName: string;
  clientFullName: string;
  status: LeadStatus;
  source: string;
  createdAt: string;
  budgetMin: number;
  budgetMax: number;
  trades: Trade[];
  sqft: number;
  roomCount: number;
  timeline: string;
  phases: LeadPhases;
  jobTemp: 'positive' | 'warning' | 'neutral';
  estimateSent: boolean;
  scriptStarted: boolean;
  phone: string;
  email: string;
  preferredContact: string;
  referredBy: string;
  scope: string;
  checklist: ChecklistItem[];
  intakeEstimate: EstimateLine[];
}

// ============================================================================
// DISCOVER CHECKLIST TEMPLATE
// ============================================================================

const DISCOVER_CHECKLIST: ChecklistItem[] = [
  { id: 1, type: 'auto', label: 'Intake received — CRM lead + draft estimate auto-created', note: '⚡ Automated — fires on form submit', checked: false },
  { id: 2, type: 'auto', label: 'Intake confirmation sent to client', note: '⚡ Automated — branded email + SMS on receipt', checked: false },
  { id: 3, type: 'auto', label: 'New lead notification sent to manager', note: '⚡ Automated — email + in-app alert with CRM link', checked: false },
  { id: 4, type: 'killer', label: 'Draft estimate reviewed by manager', note: '⚑ Only manual step — review for accuracy before sending', checked: false },
  { id: 5, type: 'killer', label: 'Estimate sent to client within 24 hours of intake', note: '⚑ Includes survey booking link. Speed = conversion.', checked: false },
  { id: 6, type: 'normal', label: 'Client opened estimate — confirmed via tracking', note: '⚡ Drip fires if survey not booked within 48h', checked: false },
  { id: 7, type: 'normal', label: 'Survey booked by client via booking link', note: '⚡ Calendar confirmation auto-sent both parties', checked: false },
  { id: 8, type: 'normal', label: 'Survey reminder sent 24h before visit', note: '⚡ Automated — SMS + email with prep checklist', checked: false },
  { id: 9, type: 'normal', label: 'Lock D phase with performance colour → advance to Estimate', note: '🟢 Estimate <24h + survey booked · 🟡 <48h · 🔴 Manual follow-up required', checked: false },
];

// ============================================================================
// LEAD RECORD → LEAD MAPPING
// ============================================================================

const SCOPE_TO_TRADE: Record<string, Trade> = {
  floors: 'FL', flooring: 'FL', lvp: 'FL', hardwood: 'FL', laminate: 'FL', tile: 'FL',
  paint: 'PT', painting: 'PT', walls: 'PT',
  trim: 'TR', baseboard: 'TR', moulding: 'TR', casing: 'TR',
};

const BUDGET_RANGES: Record<string, [number, number]> = {
  'under-5k': [2000, 5000],
  '5k-10k': [5000, 10000],
  '10k-20k': [10000, 20000],
  '20k+': [20000, 40000],
  'unknown': [0, 0],
};

// Map lead stage to DESIGN phase progression
const STAGE_TO_PHASE_INDEX: Record<string, number> = {
  new: 0, contacted: 0, discovery: 1, site_visit: 2, quote_sent: 3, won: 5, lost: -1,
};

function mapLeadRecord(rec: LeadRecord): Lead {
  const c = rec.customer;
  const lastName = c.lastName || '';
  const firstInitial = c.firstName ? c.firstName[0] + '.' : '';
  const clientName = lastName ? `${lastName}, ${firstInitial}` : c.firstName || 'Unknown';
  const clientFullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown';

  // Trades from scope tags
  const trades: Trade[] = [];
  const seenTrades = new Set<Trade>();
  for (const tag of rec.scopeTags) {
    const t = SCOPE_TO_TRADE[tag];
    if (t && !seenTrades.has(t)) { seenTrades.add(t); trades.push(t); }
  }
  // Fallback: legacy interests
  if (trades.length === 0) {
    for (const interest of rec.interests) {
      const t = SCOPE_TO_TRADE[interest];
      if (t && !seenTrades.has(t)) { seenTrades.add(t); trades.push(t); }
    }
  }
  if (trades.length === 0) trades.push('FL'); // default

  // Budget
  const range = BUDGET_RANGES[rec.budgetRange] || BUDGET_RANGES['unknown'];
  let budgetMin = range[0];
  let budgetMax = range[1];
  if (rec.instantEstimate) {
    budgetMin = rec.instantEstimate.low;
    budgetMax = rec.instantEstimate.high;
  }

  // Phases from stage
  const phaseKeys: (keyof LeadPhases)[] = ['discover', 'estimate', 'survey', 'iterations', 'goAhead', 'notify'];
  const activeIdx = STAGE_TO_PHASE_INDEX[rec.stage] ?? 0;
  const phases: LeadPhases = {} as LeadPhases;
  phaseKeys.forEach((key, i) => {
    if (rec.stage === 'lost') {
      phases[key] = { status: 'future' };
    } else if (i < activeIdx) {
      phases[key] = { status: 'complete', performanceColour: 'green' };
    } else if (i === activeIdx) {
      phases[key] = { status: 'active' };
    } else {
      phases[key] = { status: 'future' };
    }
  });

  // Status
  let status: LeadStatus = 'new';
  if (rec.stage === 'won') status = 'won';
  else if (rec.stage === 'lost') status = 'lost';
  else if (rec.stage === 'quote_sent') status = 'quoted';
  else if (rec.stage !== 'new') status = 'active';

  // Scope description
  const scopeParts = rec.scopeTags.length > 0 ? rec.scopeTags : rec.interests;
  const scope = scopeParts.map(s => s.replace(/_/g, ' ')).join(', ') || 'General inquiry';

  // Estimate lines from instant estimate
  const intakeEstimate: EstimateLine[] = [];
  if (rec.instantEstimate) {
    if (trades.includes('FL')) intakeEstimate.push({ trade: 'Flooring', description: `${rec.totalSqft || '—'} sqft`, amount: Math.round(rec.instantEstimate.mid * 0.6) });
    if (trades.includes('PT')) intakeEstimate.push({ trade: 'Paint', description: `${rec.roomCount || '—'} rooms`, amount: Math.round(rec.instantEstimate.mid * 0.25) });
    if (trades.includes('TR')) intakeEstimate.push({ trade: 'Trim', description: 'Baseboards + casing', amount: Math.round(rec.instantEstimate.mid * 0.15) });
    if (intakeEstimate.length === 0) intakeEstimate.push({ trade: 'General', description: 'Estimate', amount: rec.instantEstimate.mid });
  }

  // Temperature → jobTemp
  const jobTemp: Lead['jobTemp'] = rec.temperature === 'hot' ? 'positive' : rec.temperature === 'cool' ? 'neutral' : 'warning';

  return {
    id: c.id,
    clientName,
    clientFullName,
    status,
    source: rec.source || 'Direct',
    createdAt: c.metadata?.createdAt || new Date().toISOString(),
    budgetMin,
    budgetMax,
    trades,
    sqft: rec.totalSqft || 0,
    roomCount: rec.roomCount || 0,
    timeline: rec.timeline || 'TBD',
    phases,
    jobTemp,
    estimateSent: rec.stage === 'quote_sent' || rec.stage === 'won',
    scriptStarted: false,
    phone: c.phone || '',
    email: c.email || '',
    preferredContact: rec.preferredContact || '',
    referredBy: rec.referralSource || '—',
    scope,
    checklist: DISCOVER_CHECKLIST.map(item => ({ ...item })),
    intakeEstimate,
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TRADE_COLORS: Record<Trade, string> = { FL: '#4A7FA5', PT: '#7C3AED', TR: '#D97706' };

const BORDER_COLORS: Record<string, string> = {
  selected: '#111010', positive: '#16A34A', warning: '#DC2626', neutral: '#E0DCD7',
};

const PERF_COLOURS: Record<PerformanceColour, string> = {
  green: '#2D7A4F', amber: '#D4830A', red: '#C0392B',
};

type PhaseKey = keyof LeadPhases;
type TabId = PhaseKey | 'script';

const PHASE_LABELS = ['D', 'E', 'S', 'I', 'G', 'N'] as const;
const PHASE_WORDS = ['Discover', 'Estimate', 'Survey', 'Iterations', 'Go-Ahead', 'Notify'] as const;
const PHASE_KEYS: PhaseKey[] = ['discover', 'estimate', 'survey', 'iterations', 'goAhead', 'notify'];

const SCRIPT_PHASES = [
  { letter: 'S', name: 'Shield', desc: 'Site protection, floor prep, dust walls' },
  { letter: 'C', name: 'Clear', desc: 'Demolition, furniture move, subfloor exposed' },
  { letter: 'R', name: 'Ready', desc: 'Subfloor prep, levelling, acclimation start' },
  { letter: 'I', name: 'Install', desc: 'Material installation, transitions, trim' },
  { letter: 'P', name: 'Punch', desc: 'Deficiency walk, client snag list, touch-ups' },
  { letter: 'T', name: 'Turnover', desc: 'Final clean, client sign-off, warranty docs' },
];

// ============================================================================
// PHASE CHECKLISTS (E–N)
// ============================================================================

const PHASE_CHECKLISTS: Record<string, ChecklistItem[]> = {
  estimate: [
    { id: 1, type: 'auto', label: 'Draft estimate auto-generated from intake data', note: '⚡ Automated — pulls room/sqft/trade data from intake', checked: false },
    { id: 2, type: 'killer', label: 'Manager reviews and adjusts line items', note: '⚑ Verify quantities, rates, and material selections', checked: false },
    { id: 3, type: 'normal', label: 'Material costs confirmed with supplier', note: 'Check current pricing — quotes valid 30 days', checked: false },
    { id: 4, type: 'normal', label: 'Labour hours estimated per trade', note: 'Use historical data from similar projects', checked: false },
    { id: 5, type: 'killer', label: 'Margin meets minimum threshold (35%+)', note: '⚑ Do not proceed below margin floor without approval', checked: false },
    { id: 6, type: 'normal', label: 'Estimate PDF generated and reviewed', note: 'Check formatting, spelling, and line item totals', checked: false },
    { id: 7, type: 'auto', label: 'Estimate sent to client via portal link', note: '⚡ Automated — client receives email with view/accept link', checked: false },
    { id: 8, type: 'normal', label: 'Lock E phase with performance colour → advance to Survey', note: '🟢 Sent <24h · 🟡 <48h · 🔴 Manual follow-up required', checked: false },
  ],
  survey: [
    { id: 1, type: 'auto', label: 'Survey appointment confirmed in calendar', note: '⚡ Automated — syncs to company + client calendar', checked: false },
    { id: 2, type: 'normal', label: 'Pre-survey prep checklist sent to client', note: 'Clear furniture, access requirements, parking', checked: false },
    { id: 3, type: 'killer', label: 'On-site measurements completed', note: '⚑ Laser measure all rooms — record in survey tool', checked: false },
    { id: 4, type: 'normal', label: 'Subfloor condition assessed', note: 'Check for moisture, level, and structural issues', checked: false },
    { id: 5, type: 'normal', label: 'Moisture readings taken and recorded', note: 'Pin meter + RH probe — log all readings by room', checked: false },
    { id: 6, type: 'normal', label: 'Site photos captured (all rooms + details)', note: 'Minimum 3 per room — overview, floor, transitions', checked: false },
    { id: 7, type: 'killer', label: 'Survey report uploaded to project', note: '⚑ Must include measurements, photos, and notes', checked: false },
    { id: 8, type: 'normal', label: 'Estimate updated with survey findings', note: 'Adjust for actual conditions vs intake assumptions', checked: false },
    { id: 9, type: 'normal', label: 'Lock S phase with performance colour → advance to Iterations', note: '🟢 Survey complete + estimate updated · 🟡 Partial data · 🔴 Re-survey needed', checked: false },
  ],
  iterations: [
    { id: 1, type: 'auto', label: 'Updated estimate sent to client for review', note: '⚡ Automated — client notified of revised estimate', checked: false },
    { id: 2, type: 'normal', label: 'Client feedback received and documented', note: 'Record all requested changes in project notes', checked: false },
    { id: 3, type: 'normal', label: 'Material selections finalized with client', note: 'Confirm colours, brands, and grades — get sign-off', checked: false },
    { id: 4, type: 'normal', label: 'Scope changes documented and priced', note: 'Any additions/removals reflected in estimate', checked: false },
    { id: 5, type: 'killer', label: 'Final estimate approved by client', note: '⚑ Written confirmation required before Go-Ahead', checked: false },
    { id: 6, type: 'normal', label: 'Material lead times confirmed', note: 'Check availability — flag any backorder items', checked: false },
    { id: 7, type: 'normal', label: 'Lock I phase with performance colour → advance to Go-Ahead', note: '🟢 Approved first round · 🟡 2+ rounds · 🔴 3+ rounds or scope disputes', checked: false },
  ],
  goAhead: [
    { id: 1, type: 'killer', label: 'Contract/quote signed by client', note: '⚑ Digital signature via portal or wet signature on PDF', checked: false },
    { id: 2, type: 'killer', label: 'Deposit received and confirmed', note: '⚑ Minimum 50% deposit before scheduling', checked: false },
    { id: 3, type: 'auto', label: 'Payment confirmation sent to client', note: '⚡ Automated — receipt + next steps email', checked: false },
    { id: 4, type: 'normal', label: 'Material order placed with supplier', note: 'Confirm delivery date aligns with project start', checked: false },
    { id: 5, type: 'normal', label: 'Project scheduled in production calendar', note: 'Assign crew, confirm availability, block dates', checked: false },
    { id: 6, type: 'normal', label: 'Client notified of project start date', note: 'Include prep instructions and contact info', checked: false },
    { id: 7, type: 'normal', label: 'Lock G phase with performance colour → advance to Notify', note: '🟢 Signed + deposit <48h · 🟡 <1wk · 🔴 Delays or payment issues', checked: false },
  ],
  notify: [
    { id: 1, type: 'auto', label: 'Production brief auto-generated from project data', note: '⚡ Automated — compiles scope, materials, schedule, notes', checked: false },
    { id: 2, type: 'killer', label: 'Production brief reviewed by manager', note: '⚑ Verify all details before handoff to production', checked: false },
    { id: 3, type: 'auto', label: 'Brief sent to production team lead', note: '⚡ Automated — email + in-app notification', checked: false },
    { id: 4, type: 'auto', label: 'Client portal access enabled', note: '⚡ Automated — client can now track progress', checked: false },
    { id: 5, type: 'normal', label: 'Pre-start client call completed', note: 'Confirm dates, access, pets, parking, expectations', checked: false },
    { id: 6, type: 'auto', label: 'Project moves to SCRIPT → Shield phase', note: '⚡ Automated — triggers production workflow', checked: false },
    { id: 7, type: 'normal', label: 'Lock N phase with performance colour → handoff complete', note: '🟢 Handoff <24h after Go-Ahead · 🟡 <48h · 🔴 Delays', checked: false },
  ],
};

const MONO = "'DM Mono', monospace";
const FIG = "'Figtree', sans-serif";

// ============================================================================
// HELPERS
// ============================================================================

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatBudget(min: number, max: number): string {
  const f = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  return `${f(min)}–${f(max)}`;
}

function fmtCad(n: number): string {
  return `$${n.toLocaleString('en-CA')}`;
}

function phaseTabColour(e: PhaseEntry): string {
  if (e.status === 'active') return '#111010';
  if (e.status === 'complete' && e.performanceColour) return PERF_COLOURS[e.performanceColour];
  if (e.status === 'warning') return PERF_COLOURS.amber;
  return '#9C9690';
}

function phaseDotStyle(e: PhaseEntry): { background: string; borderColor: string; color: string } {
  if (e.status === 'active') return { background: '#111010', borderColor: '#111010', color: '#FFFFFF' };
  if (e.status === 'complete' && e.performanceColour === 'green') return { background: '#EEF5F1', borderColor: '#90C4A8', color: '#2D7A4F' };
  if (e.status === 'complete' && e.performanceColour === 'amber') return { background: '#FDF7EE', borderColor: '#E8C98A', color: '#D4830A' };
  if (e.status === 'complete' && e.performanceColour === 'red') return { background: '#FDF2F1', borderColor: '#E8B4AF', color: '#C0392B' };
  if (e.status === 'warning') return { background: '#FDF7EE', borderColor: '#E8C98A', color: '#D4830A' };
  return { background: '#E8E4DE', borderColor: '#D0CBC3', color: '#9C9690' };
}

// ============================================================================
// DISCOVER PAGE
// ============================================================================

export default function DiscoverPage() {
  const router = useRouter();
  const pipeline = useLeadPipeline();
  const mappedLeads = useMemo(() => pipeline.leads.map(mapLeadRecord), [pipeline.leads]);

  // Checklist state stored in a ref so pipeline re-fetches don't clobber it
  const checklistStateRef = useRef<Map<string, Map<number, boolean>>>(new Map());

  const leads = useMemo(() => {
    return mappedLeads.map((ml) => {
      const savedChecks = checklistStateRef.current.get(ml.id);
      if (savedChecks) {
        return { ...ml, checklist: ml.checklist.map((c) => ({ ...c, checked: savedChecks.get(c.id) ?? c.checked })) };
      }
      return ml;
    });
  }, [mappedLeads]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const newCount = leads.filter((l) => l.status === 'new').length;
  const selectedLead = leads.find((l) => l.id === selectedId) ?? null;

  const [, forceRender] = useState(0);
  const handleCheckToggle = useCallback((leadId: string, itemId: number) => {
    const leadChecks = checklistStateRef.current.get(leadId) ?? new Map<number, boolean>();
    const current = leadChecks.get(itemId) ?? false;
    leadChecks.set(itemId, !current);
    checklistStateRef.current.set(leadId, leadChecks);
    forceRender((n) => n + 1);
  }, []);

  // Loading state
  if (pipeline.isLoading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', background: '#F0EDE8' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 28, height: 28, border: '3px solid #E0DCD7', borderTopColor: '#111010',
              borderRadius: '50%', margin: '0 auto 12px',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9C9690' }}>
            Loading leads...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#F0EDE8' }}>
      {/* Leads Panel */}
      <div
        style={{
          width: 296, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: '#FAF8F5', borderRight: '1px solid #E0DCD7',
        }}
      >
        <div
          style={{
            padding: '14px 16px 10px', borderBottom: '1px solid #E0DCD7',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6560' }}>
            Discover — Leads
          </span>
          {newCount > 0 && (
            <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, color: '#fff', background: '#C0392B', borderRadius: 8, padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>
              {newCount}
            </span>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {leads.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9C9690" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 10, opacity: 0.5 }}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em', color: '#9C9690', lineHeight: 1.6 }}>
                No leads yet — create one from<br />the intake form or /leads/new
              </div>
            </div>
          ) : (
            leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} selected={selectedId === lead.id} onClick={() => setSelectedId(lead.id)} />
            ))
          )}
        </div>
      </div>

      {/* Project Detail Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedLead ? (
          <ProjectDetail key={selectedLead.id} lead={selectedLead} onCheckToggle={handleCheckToggle} onEdit={() => router.push(`/leads`)} />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyDetail />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// LEAD CARD
// ============================================================================

function LeadCard({ lead, selected, onClick }: { lead: Lead; selected: boolean; onClick: () => void }) {
  const borderColor = selected ? BORDER_COLORS.selected : BORDER_COLORS[lead.jobTemp] ?? BORDER_COLORS.neutral;
  const isUnseen = lead.status === 'new';

  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 12px', borderLeft: `3px solid ${borderColor}`,
        borderBottom: '1px solid #E0DCD7', cursor: 'pointer',
        background: selected ? 'rgba(17,16,16,0.04)' : 'transparent', transition: 'background 0.12s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: FIG, fontWeight: 600, fontSize: 12.5, color: '#1A1714' }}>{lead.clientName}</span>
          {isUnseen && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626', flexShrink: 0 }} />}
        </div>
        <span style={{ fontFamily: MONO, fontSize: 9.5, color: '#5C5349' }}>{formatBudget(lead.budgetMin, lead.budgetMax)}</span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 8, color: '#9C9690', marginTop: 3 }}>
        {timeAgo(lead.createdAt)} · {lead.source}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {lead.trades.map((t) => (
            <span key={t} style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, letterSpacing: '0.06em', color: '#fff', background: TRADE_COLORS[t], borderRadius: 3, padding: '1px 5px' }}>{t}</span>
          ))}
        </div>
        <span style={{ fontFamily: MONO, fontSize: 8, color: '#9A8E84' }}>{lead.sqft} sqft · {lead.roomCount} rm</span>
      </div>
      <div style={{ display: 'flex', gap: 3, marginTop: 7 }}>
        {PHASE_KEYS.map((key, i) => {
          const ds = phaseDotStyle(lead.phases[key]);
          return (
            <div
              key={key}
              title={`${PHASE_LABELS[i]} — ${lead.phases[key].status}`}
              style={{
                width: 15, height: 15, borderRadius: 0,
                background: ds.background, border: `1px solid ${ds.borderColor}`, color: ds.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: MONO, fontSize: 7, fontWeight: 500,
              }}
            >
              {PHASE_LABELS[i]}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY DETAIL
// ============================================================================

function EmptyDetail() {
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9C9690" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 10, opacity: 0.6 }}>
        <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" />
      </svg>
      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9C9690' }}>
        Select a lead to open project
      </div>
    </div>
  );
}

// ============================================================================
// PROJECT DETAIL
// ============================================================================

function ProjectDetail({ lead, onCheckToggle, onEdit }: { lead: Lead; onCheckToggle: (leadId: string, itemId: number) => void; onEdit: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const active = PHASE_KEYS.find((k) => lead.phases[k].status === 'active');
    return active ?? 'discover';
  });

  const tradesLabel = lead.trades.join(' / ');
  const goAheadComplete = lead.phases.goAhead.status === 'complete';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 14px', background: '#FAF8F5', borderBottom: '1px solid #E0DCD7', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FIG, fontWeight: 700, fontSize: 19, color: '#1A1714', lineHeight: 1.2 }}>{lead.clientFullName}</div>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6560', marginTop: 4 }}>
              {lead.sqft} SQFT · {lead.roomCount} ROOMS · {tradesLabel} · {lead.timeline}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0, marginTop: 2 }}>
            <ActionButton label="📞 Call" border="#111010" color="#F0EDE8" fill="#111010" hoverBg="#2A2826" />
            <ActionButton label="💬 Text" border="#111010" color="#F0EDE8" fill="#111010" hoverBg="#2A2826" />
            <ActionButton label="Edit" border="#D0CBC3" color="#111010" onClick={onEdit} />
            {!lead.estimateSent && <ActionButton label="↗ Send Estimate" border="#D0CBC3" color="#111010" />}
            {goAheadComplete && <ActionButton label="Convert to Job" border="#111010" color="#fff" fill="#111010" hoverBg="#2A2826" />}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', alignItems: 'stretch', background: '#FAF8F5', borderBottom: '1px solid #E0DCD7', flexShrink: 0, paddingLeft: 20, paddingRight: 20 }}>
        {PHASE_KEYS.map((key, i) => {
          const entry = lead.phases[key];
          const isAct = activeTab === key;
          const tc = isAct ? '#111010' : phaseTabColour(entry);
          const bb = isAct ? '3px solid #111010' : (entry.status === 'complete' && entry.performanceColour) ? `3px solid ${PERF_COLOURS[entry.performanceColour]}` : '3px solid transparent';
          return (
            <button key={key} onClick={() => setActiveTab(key)} style={{ background: 'none', border: 'none', borderBottom: bb, cursor: 'pointer', padding: '10px 12px 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 500, color: tc, lineHeight: 1 }}>{PHASE_LABELS[i]}</span>
              <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: tc, lineHeight: 1 }}>{PHASE_WORDS[i]}</span>
            </button>
          );
        })}
        <div style={{ width: 1, alignSelf: 'center', height: 24, background: '#E0DCD7', margin: '0 8px', flexShrink: 0 }} />
        {(() => {
          const isAct = activeTab === 'script';
          const tc = isAct ? '#111010' : '#9C9690';
          return (
            <button onClick={() => setActiveTab('script')} style={{ background: 'none', border: 'none', borderBottom: isAct ? '3px solid #111010' : '3px solid transparent', cursor: 'pointer', padding: '10px 12px 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: tc, lineHeight: 1 }}>SCRIPT Production</span>
            </button>
          );
        })()}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'discover' && <DiscoverTab lead={lead} onCheckToggle={onCheckToggle} />}
        {activeTab === 'script' && <ScriptTab />}
        {activeTab !== 'discover' && activeTab !== 'script' && (
          <PhaseTab
            key={activeTab}
            phaseKey={activeTab as PhaseKey}
            label={PHASE_WORDS[PHASE_KEYS.indexOf(activeTab as PhaseKey)]}
            lead={lead}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// D — DISCOVER TAB (fully built)
// ============================================================================

function DiscoverTab({ lead, onCheckToggle }: { lead: Lead; onCheckToggle: (leadId: string, itemId: number) => void }) {
  const checkedCount = lead.checklist.filter((c) => c.checked).length;
  const totalCount = lead.checklist.length;
  const estimateTotal = lead.intakeEstimate.reduce((s, l) => s + l.amount, 0);
  const budgetRange = lead.budgetMax - lead.budgetMin;
  const estimatePos = budgetRange > 0 ? Math.min(1, Math.max(0, (estimateTotal - lead.budgetMin) / budgetRange)) : 0.5;

  return (
    <div style={{ display: 'flex', gap: 16, padding: 20, height: '100%', overflow: 'hidden' }}>
      {/* Left column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto', minWidth: 0 }}>
        {/* Checklist card */}
        <SectionCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6560' }}>
              Discover — READ-DO Checklist
            </span>
            <span style={{ fontFamily: MONO, fontSize: 8, color: '#fff', background: '#111010', borderRadius: 4, padding: '2px 8px' }}>
              {checkedCount === totalCount ? 'Complete' : 'In Progress'} {checkedCount}/{totalCount}
            </span>
          </div>

          {/* Automation banner */}
          <div
            style={{
              background: '#EEF3F8', borderLeft: '3px solid #2C5F8A', borderRadius: 4,
              padding: '8px 12px', marginBottom: 14,
              fontFamily: MONO, fontSize: 8.5, color: '#2C5F8A', lineHeight: 1.5,
            }}
          >
            Automation Phase — No live contact required until Survey. System handles confirmations and booking automatically.
          </div>

          {/* Items */}
          {lead.checklist.map((item) => (
            <ChecklistRow
              key={item.id}
              item={item}
              onToggle={() => {
                if (item.type === 'auto') return;
                if (item.type === 'killer' && !item.checked) {
                  const ok = window.confirm('⚑ STOP & CONFIRM — This is a killer item. Verify before marking complete. Proceed?');
                  if (!ok) return;
                }
                onCheckToggle(lead.id, item.id);
              }}
            />
          ))}
        </SectionCard>

        {/* Activity log card */}
        <SectionCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6560' }}>Activity Log</span>
            <button
              style={{
                fontFamily: MONO, fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: '#5C5349', background: 'transparent', border: '1px solid #E0DCD7',
                borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
              }}
            >
              + Log
            </button>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: '#9C9690', textAlign: 'center', padding: '24px 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            No activity logged yet
          </div>
        </SectionCard>
      </div>

      {/* Right column */}
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' }}>
        {/* Lead details card */}
        <SectionCard>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6560', marginBottom: 12 }}>Lead Details</div>
          <DetailRow label="Phone" value={lead.phone} />
          <DetailRow label="Email" value={lead.email} />
          <DetailRow label="Prefers" value={lead.preferredContact} />
          <DetailRow label="Source" value={lead.source} />
          <DetailRow label="Referred by" value={lead.referredBy} />
          <DetailRow label="Scope" value={lead.scope} />
          <DetailRow label="Area" value={`${lead.sqft} sqft · ${lead.roomCount} rooms`} />
          <DetailRow label="Timeline" value={lead.timeline} />
          <DetailRow label="Budget" value={formatBudget(lead.budgetMin, lead.budgetMax)} />
        </SectionCard>

        {/* Intake estimate card */}
        <SectionCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6560' }}>Intake Estimate</span>
            <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6560' }}>Auto-Generated</span>
          </div>
          {lead.intakeEstimate.map((line, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: FIG, fontWeight: 600, fontSize: 12, color: '#1A1714' }}>{line.trade}</span>
                <span style={{ fontFamily: MONO, fontSize: 12, color: '#1A1714' }}>{fmtCad(line.amount)}</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 8.5, color: '#6B6560', marginTop: 2 }}>{line.description}</div>
            </div>
          ))}
          {/* Total */}
          <div style={{ borderTop: '2px solid #1A1714', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: FIG, fontWeight: 700, fontSize: 12, color: '#1A1714' }}>Total</span>
            <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 500, color: '#1A1714' }}>{fmtCad(estimateTotal)}</span>
          </div>
          {/* Budget range bar */}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontFamily: MONO, fontSize: 7, color: '#9A8E84' }}>{fmtCad(lead.budgetMin)}</span>
              <span style={{ fontFamily: MONO, fontSize: 7, color: '#9A8E84' }}>{fmtCad(lead.budgetMax)}</span>
            </div>
            <div style={{ height: 3, background: '#E0DCD7', borderRadius: 2, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${estimatePos * 100}%`, background: '#16A34A', borderRadius: 2 }} />
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ============================================================================
// CHECKLIST ROW
// ============================================================================

function ChecklistRow({ item, onToggle }: { item: ChecklistItem; onToggle: () => void }) {
  const isAuto = item.type === 'auto';
  const isKiller = item.type === 'killer';

  const checkboxBorder = item.checked
    ? '2px solid #16A34A'
    : isKiller
      ? '2px solid #C0392B'
      : isAuto
        ? '2px solid #2C5F8A'
        : '2px solid #D4CEC7';

  const checkboxBg = item.checked
    ? '#16A34A'
    : isAuto
      ? 'rgba(44,95,138,0.08)'
      : 'transparent';

  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', gap: 10, padding: '7px 8px', borderRadius: 4,
        cursor: isAuto ? 'default' : 'pointer',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { if (!isAuto) e.currentTarget.style.background = '#F0EDE8'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Checkbox */}
      <div
        style={{
          width: 15, height: 15, borderRadius: 3, border: checkboxBorder,
          background: checkboxBg, flexShrink: 0, marginTop: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {item.checked && (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2,6 5,9 10,3" />
          </svg>
        )}
      </div>

      {/* Label + note */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FIG, fontSize: 12, color: item.checked ? '#9C9690' : isKiller ? '#C0392B' : '#1A1714',
            textDecoration: item.checked ? 'line-through' : 'none', lineHeight: 1.4,
          }}
        >
          {isAuto && !item.checked && <span style={{ marginRight: 4 }}>{'⚡'}</span>}
          {isKiller && !item.checked && <span style={{ marginRight: 4 }}>{'⚑'}</span>}
          {item.label}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 8.5, color: '#6B6560', marginTop: 2, lineHeight: 1.4 }}>
          {item.note}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DETAIL ROW
// ============================================================================

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0', borderBottom: '1px solid rgba(224,220,215,0.5)' }}>
      <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B6560' }}>{label}</span>
      <span style={{ fontFamily: FIG, fontSize: 12, color: '#1A1714', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

// ============================================================================
// SECTION CARD
// ============================================================================

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#FAF8F5', border: '1px solid #E0DCD7', borderRadius: 6, padding: 16 }}>
      {children}
    </div>
  );
}

// ============================================================================
// E–N PHASE TAB (full checklist)
// ============================================================================

function PhaseTab({ phaseKey, label, lead }: { phaseKey: PhaseKey; label: string; lead: Lead }) {
  const template = PHASE_CHECKLISTS[phaseKey];
  const [items, setItems] = useState<ChecklistItem[]>(() =>
    template ? template.map((c) => ({ ...c })) : [],
  );

  const handleToggle = useCallback((itemId: number, type: CheckItemType) => {
    if (type === 'auto') return;
    if (type === 'killer') {
      const ok = window.confirm('⚑ STOP & CONFIRM — This is a killer item. Verify before marking complete. Proceed?');
      if (!ok) return;
    }
    setItems((prev) => prev.map((c) => (c.id === itemId ? { ...c, checked: !c.checked } : c)));
  }, []);

  if (!template) return null;

  const checkedCount = items.filter((c) => c.checked).length;
  const totalCount = items.length;

  return (
    <div style={{ display: 'flex', gap: 16, padding: 20, height: '100%', overflow: 'hidden' }}>
      {/* Left column — checklist */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto', minWidth: 0 }}>
        <SectionCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6560' }}>
              {label} — READ-DO Checklist
            </span>
            <span style={{ fontFamily: MONO, fontSize: 8, color: '#fff', background: '#111010', borderRadius: 4, padding: '2px 8px' }}>
              {checkedCount === totalCount ? 'Complete' : 'In Progress'} {checkedCount}/{totalCount}
            </span>
          </div>
          {items.map((item) => (
            <ChecklistRow
              key={item.id}
              item={item}
              onToggle={() => handleToggle(item.id, item.type)}
            />
          ))}
        </SectionCard>
      </div>

      {/* Right column — lead details */}
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' }}>
        <SectionCard>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6560', marginBottom: 12 }}>Lead Details</div>
          <DetailRow label="Phone" value={lead.phone} />
          <DetailRow label="Email" value={lead.email} />
          <DetailRow label="Prefers" value={lead.preferredContact} />
          <DetailRow label="Source" value={lead.source} />
          <DetailRow label="Scope" value={lead.scope} />
          <DetailRow label="Area" value={`${lead.sqft} sqft · ${lead.roomCount} rooms`} />
          <DetailRow label="Timeline" value={lead.timeline} />
          <DetailRow label="Budget" value={formatBudget(lead.budgetMin, lead.budgetMax)} />
        </SectionCard>
      </div>
    </div>
  );
}


// ============================================================================
// SCRIPT TAB
// ============================================================================

function ScriptTab() {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {SCRIPT_PHASES.map((p, i) => {
          const isFirst = i === 0;
          return (
            <div
              key={p.letter}
              style={{
                background: '#FAF8F5', border: '1px solid #E0DCD7', borderRadius: 6,
                borderLeft: isFirst ? '3px solid #111010' : '3px solid transparent',
                padding: 16, opacity: isFirst ? 1 : 0.4,
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 500, color: '#1A1714', marginBottom: 4 }}>{p.letter}</div>
              <div style={{ fontFamily: FIG, fontWeight: 600, fontSize: 13, color: '#1A1714', marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontFamily: MONO, fontSize: 8.5, color: '#6B6560', lineHeight: 1.4 }}>{p.desc}</div>
            </div>
          );
        })}
      </div>
      {/* Locked banner */}
      <div
        style={{
          background: 'rgba(224,220,215,0.4)', border: '1px solid #E0DCD7', borderRadius: 6,
          padding: '12px 16px', textAlign: 'center',
          fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9C9690',
        }}
      >
        SCRIPT activates after Go-Ahead signed
      </div>
    </div>
  );
}

// ============================================================================
// ACTION BUTTON
// ============================================================================

function ActionButton({ label, border, color, fill, hoverBg, onClick }: { label: string; border: string; color: string; fill?: string; hoverBg?: string; onClick?: () => void }) {
  const bg = fill ?? 'white';
  return (
    <button
      style={{
        fontFamily: MONO, fontSize: '8.5px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
        color, background: bg, border: `1px solid ${border}`,
        borderRadius: 4, padding: '6px 13px', cursor: 'pointer', whiteSpace: 'nowrap',
        flexShrink: 0, transition: 'background 0.12s, opacity 0.12s',
      }}
      onClick={onClick}
      onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg ?? bg; e.currentTarget.style.opacity = '0.9'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = bg; e.currentTarget.style.opacity = '1'; }}
    >
      {label}
    </button>
  );
}
