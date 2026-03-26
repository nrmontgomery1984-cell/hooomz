import { useState, useCallback } from 'react';

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
// MOCK DATA
// ============================================================================

const MOCK_LEADS: Lead[] = [
  {
    id: 'lead-1',
    clientName: 'Henderson, K.',
    clientFullName: 'Karen Henderson',
    status: 'active',
    source: 'Referral',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    budgetMin: 8500,
    budgetMax: 12000,
    trades: ['FL'],
    sqft: 1240,
    roomCount: 4,
    timeline: 'Apr 14 – May 2',
    phases: {
      discover: { status: 'complete', performanceColour: 'green' },
      estimate: { status: 'complete', performanceColour: 'green' },
      survey: { status: 'active' },
      iterations: { status: 'future' },
      goAhead: { status: 'future' },
      notify: { status: 'future' },
    },
    jobTemp: 'positive',
    estimateSent: true,
    scriptStarted: false,
    phone: '(604) 555-0142',
    email: 'karen.h@gmail.com',
    preferredContact: 'Text',
    referredBy: 'Mike Torres',
    scope: 'LVT install — main floor + stairs',
    checklist: DISCOVER_CHECKLIST.map((c) => ({ ...c, checked: true })),
    intakeEstimate: [
      { trade: 'Flooring — LVT', description: '1,240 sqft Shaw Endura Plus, includes underlay', amount: 9800 },
      { trade: 'Stairs', description: '14 risers, bull-nose trim', amount: 1400 },
    ],
  },
  {
    id: 'lead-2',
    clientName: 'Patel, R.',
    clientFullName: 'Ravi Patel',
    status: 'new',
    source: 'Website',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    budgetMin: 14000,
    budgetMax: 18000,
    trades: ['FL', 'TR'],
    sqft: 1860,
    roomCount: 6,
    timeline: 'TBD',
    phases: {
      discover: { status: 'active' },
      estimate: { status: 'future' },
      survey: { status: 'future' },
      iterations: { status: 'future' },
      goAhead: { status: 'future' },
      notify: { status: 'future' },
    },
    jobTemp: 'neutral',
    estimateSent: false,
    scriptStarted: false,
    phone: '(604) 555-0198',
    email: 'ravi.patel@outlook.com',
    preferredContact: 'Email',
    referredBy: '—',
    scope: 'Full main floor + trim replacement',
    checklist: DISCOVER_CHECKLIST.map((c, i) => ({ ...c, checked: i < 3 })),
    intakeEstimate: [
      { trade: 'Flooring — Hardwood', description: '1,860 sqft engineered oak', amount: 14200 },
      { trade: 'Trim', description: 'Baseboards + casing, 6 rooms', amount: 2800 },
    ],
  },
  {
    id: 'lead-3',
    clientName: 'Morrison, T.',
    clientFullName: 'Theresa Morrison',
    status: 'new',
    source: 'Home Show',
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    budgetMin: 22000,
    budgetMax: 30000,
    trades: ['FL', 'PT', 'TR'],
    sqft: 2400,
    roomCount: 8,
    timeline: 'May – Jun',
    phases: {
      discover: { status: 'active' },
      estimate: { status: 'future' },
      survey: { status: 'future' },
      iterations: { status: 'future' },
      goAhead: { status: 'future' },
      notify: { status: 'future' },
    },
    jobTemp: 'neutral',
    estimateSent: false,
    scriptStarted: false,
    phone: '(778) 555-0311',
    email: 'tmorrison@shaw.ca',
    preferredContact: 'Call',
    referredBy: 'Home Show 2026',
    scope: 'Whole home reno — floors, paint, trim',
    checklist: DISCOVER_CHECKLIST.map((c, i) => ({ ...c, checked: i < 1 })),
    intakeEstimate: [
      { trade: 'Flooring — LVT', description: '1,800 sqft main + bedrooms', amount: 14400 },
      { trade: 'Paint', description: '8 rooms, ceilings included', amount: 6200 },
      { trade: 'Trim', description: 'Full baseboard + casing replacement', amount: 4800 },
    ],
  },
  {
    id: 'lead-4',
    clientName: 'Chen, W.',
    clientFullName: 'Wei Chen',
    status: 'active',
    source: 'Referral',
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    budgetMin: 6000,
    budgetMax: 9000,
    trades: ['FL'],
    sqft: 780,
    roomCount: 3,
    timeline: 'Apr 7 – Apr 18',
    phases: {
      discover: { status: 'complete', performanceColour: 'green' },
      estimate: { status: 'complete', performanceColour: 'amber' },
      survey: { status: 'complete', performanceColour: 'green' },
      iterations: { status: 'warning' },
      goAhead: { status: 'future' },
      notify: { status: 'future' },
    },
    jobTemp: 'warning',
    estimateSent: true,
    scriptStarted: false,
    phone: '(604) 555-0267',
    email: 'wei.chen@gmail.com',
    preferredContact: 'Text',
    referredBy: 'Karen Henderson',
    scope: 'Condo — LVT living + 2 bedrooms',
    checklist: DISCOVER_CHECKLIST.map((c) => ({ ...c, checked: true })),
    intakeEstimate: [
      { trade: 'Flooring — LVT', description: '780 sqft, strata-approved underlay', amount: 7200 },
    ],
  },
  {
    id: 'lead-5',
    clientName: 'Dubois, M.',
    clientFullName: 'Marie Dubois',
    status: 'quoted',
    source: 'Website',
    createdAt: new Date(Date.now() - 96 * 3600000).toISOString(),
    budgetMin: 11000,
    budgetMax: 15000,
    trades: ['FL', 'PT'],
    sqft: 1520,
    roomCount: 5,
    timeline: 'Apr 21 – May 9',
    phases: {
      discover: { status: 'complete', performanceColour: 'green' },
      estimate: { status: 'complete', performanceColour: 'green' },
      survey: { status: 'complete', performanceColour: 'amber' },
      iterations: { status: 'complete', performanceColour: 'red' },
      goAhead: { status: 'complete', performanceColour: 'green' },
      notify: { status: 'active' },
    },
    jobTemp: 'positive',
    estimateSent: true,
    scriptStarted: false,
    phone: '(604) 555-0089',
    email: 'marie.dubois@gmail.com',
    preferredContact: 'Email',
    referredBy: '—',
    scope: 'Townhouse — hardwood + paint refresh',
    checklist: DISCOVER_CHECKLIST.map((c) => ({ ...c, checked: true })),
    intakeEstimate: [
      { trade: 'Flooring — Hardwood', description: '1,120 sqft engineered maple', amount: 8960 },
      { trade: 'Paint', description: '5 rooms, accent walls', amount: 3800 },
    ],
  },
];

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
  // future / default
  return { background: '#E8E4DE', borderColor: '#D0CBC3', color: '#9C9690' };
}

// ============================================================================
// SHIMMER KEYFRAMES — injected once
// ============================================================================

const SHIMMER_ID = 'hooomz-shimmer-keyframes';

function ensureShimmerCSS() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(SHIMMER_ID)) return;
  const style = document.createElement('style');
  style.id = SHIMMER_ID;
  style.textContent = `@keyframes hooomzShimmer{0%,100%{opacity:1}50%{opacity:0.5}}`;
  document.head.appendChild(style);
}

// ============================================================================
// DISCOVER PAGE
// ============================================================================

export default function DiscoverPage() {
  // Mutable copy of mock leads for checklist toggling
  const [leads, setLeads] = useState<Lead[]>(() => MOCK_LEADS.map((l) => ({ ...l, checklist: l.checklist.map((c) => ({ ...c })) })));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const newCount = leads.filter((l) => l.status === 'new').length;
  const selectedLead = leads.find((l) => l.id === selectedId) ?? null;

  const handleCheckToggle = useCallback((leadId: string, itemId: number) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== leadId) return l;
        return {
          ...l,
          checklist: l.checklist.map((c) =>
            c.id === itemId ? { ...c, checked: !c.checked } : c,
          ),
        };
      }),
    );
  }, []);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#F0EDE8' }}>
      {/* ── Leads Panel ── */}
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
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} selected={selectedId === lead.id} onClick={() => setSelectedId(lead.id)} />
          ))}
        </div>
      </div>

      {/* ── Project Detail Panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedLead ? (
          <ProjectDetail key={selectedLead.id} lead={selectedLead} onCheckToggle={handleCheckToggle} />
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

function ProjectDetail({ lead, onCheckToggle }: { lead: Lead; onCheckToggle: (leadId: string, itemId: number) => void }) {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const active = PHASE_KEYS.find((k) => lead.phases[k].status === 'active');
    return active ?? 'discover';
  });

  const tradesLabel = lead.trades.join(' / ');
  const goAheadComplete = lead.phases.goAhead.status === 'complete';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ── Header ── */}
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
            <ActionButton label="Edit" border="#D0CBC3" color="#111010" />
            {!lead.estimateSent && <ActionButton label="↗ Send Estimate" border="#D0CBC3" color="#111010" />}
            {goAheadComplete && <ActionButton label="Convert to Job" border="#111010" color="#fff" fill="#111010" hoverBg="#2A2826" />}
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
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

      {/* ── Tab Content ── */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'discover' && <DiscoverTab lead={lead} onCheckToggle={onCheckToggle} />}
        {activeTab === 'script' && <ScriptTab />}
        {activeTab !== 'discover' && activeTab !== 'script' && (
          <PhaseSkeleton label={PHASE_WORDS[PHASE_KEYS.indexOf(activeTab as PhaseKey)]} />
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
                if (item.type === 'auto') return; // auto items not manually toggleable
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
// E–N PHASE SKELETON
// ============================================================================

function PhaseSkeleton({ label }: { label: string }) {
  ensureShimmerCSS();

  const shimmer: React.CSSProperties = {
    background: '#E0DCD7', borderRadius: 4,
    animation: 'hooomzShimmer 1.5s ease-in-out infinite',
  };

  return (
    <div style={{ display: 'flex', gap: 16, padding: 20, minHeight: '100%' }}>
      {/* Left — checklist skeleton */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#FAF8F5', border: '1px solid #E0DCD7', borderRadius: 6, padding: 16, flex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6560', marginBottom: 16 }}>
            {label} — Checklist
          </div>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ ...shimmer, width: 15, height: 15, flexShrink: 0, animationDelay: `${n * 0.1}s` }} />
              <div style={{ flex: 1 }}>
                <div style={{ ...shimmer, height: 10, width: `${70 + (n * 5) % 30}%`, marginBottom: 6, animationDelay: `${n * 0.1}s` }} />
                <div style={{ ...shimmer, height: 7, width: `${50 + (n * 7) % 40}%`, animationDelay: `${n * 0.1 + 0.05}s` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Right — side panel skeleton */}
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#FAF8F5', border: '1px solid #E0DCD7', borderRadius: 6, padding: 16, flex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6560', marginBottom: 16 }}>
            {label} — Details
          </div>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ ...shimmer, height: 8, width: 60, animationDelay: `${n * 0.12}s` }} />
              <div style={{ ...shimmer, height: 8, width: `${40 + (n * 11) % 50}%`, animationDelay: `${n * 0.12 + 0.06}s` }} />
            </div>
          ))}
        </div>
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

function ActionButton({ label, border, color, fill, hoverBg }: { label: string; border: string; color: string; fill?: string; hoverBg?: string }) {
  const bg = fill ?? 'white';
  return (
    <button
      style={{
        fontFamily: MONO, fontSize: '8.5px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
        color, background: bg, border: `1px solid ${border}`,
        borderRadius: 4, padding: '6px 13px', cursor: 'pointer', whiteSpace: 'nowrap',
        flexShrink: 0, transition: 'background 0.12s, opacity 0.12s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg ?? bg; e.currentTarget.style.opacity = '0.9'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = bg; e.currentTarget.style.opacity = '1'; }}
    >
      {label}
    </button>
  );
}
