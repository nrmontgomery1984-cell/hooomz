'use client';

import { useState, useCallback, useMemo } from 'react';
import { useLocalProjects } from '@/lib/hooks/useLocalData';

// ============================================================================
// CONSTANTS
// ============================================================================

const MONO = "'DM Mono', monospace";
const FIG = "'Figtree', sans-serif";

// ============================================================================
// TYPES
// ============================================================================

type PerformanceColour = 'green' | 'amber' | 'red';
type TradeTag = 'FL' | 'PT' | 'TR';
type ScriptPhase = 'shield' | 'clear' | 'ready' | 'install' | 'punch' | 'turnover';
type ScriptPhaseStatus = 'complete' | 'active' | 'upcoming' | 'locked';
type CheckItemType = 'auto' | 'killer' | 'normal';

interface ChecklistItem {
  id: number;
  type: CheckItemType;
  label: string;
  note: string;
  checked: boolean;
}

interface ScriptPhaseEntry {
  status: ScriptPhaseStatus;
  performanceColour?: PerformanceColour;
  startDate?: string;
  completedDate?: string;
}

interface Project {
  id: string;
  clientName: string;
  address: string;
  trades: TradeTag[];
  sqft: number;
  rooms: number;
  startDate: string;
  endDate: string;
  phases: Record<ScriptPhase, ScriptPhaseEntry>;
  margin?: number;
  quotedValue: number;
  actualValue?: number;
  pmAssigned?: string;
  foremanAssigned?: string;
  notes?: string;
}

// ============================================================================
// PHASE CONSTANTS
// ============================================================================

const SCRIPT_PHASE_KEYS: ScriptPhase[] = ['shield', 'clear', 'ready', 'install', 'punch', 'turnover'];
const SCRIPT_PHASE_LABELS = ['S', 'C', 'R', 'I', 'P', 'T'] as const;
const SCRIPT_PHASE_WORDS = ['Shield', 'Clear', 'Ready', 'Install', 'Punch', 'Turnover'] as const;

const TRADE_COLORS: Record<TradeTag, string> = { FL: '#4A7FA5', PT: '#7C3AED', TR: '#D97706' };

const PERF_COLOURS: Record<PerformanceColour, string> = {
  green: '#2D7A4F', amber: '#D4830A', red: '#C0392B',
};

const CURRENT_PHASE: ScriptPhase = 'clear';

// ============================================================================
// IDB → PROJECT MAPPER
// ============================================================================

const SCRIPT_PHASE_ORDER: ScriptPhase[] = ['shield', 'clear', 'ready', 'install', 'punch', 'turnover'];

function mapIDBProject(p: Record<string, unknown>): Project {
  const addr = p.address as { street?: string; city?: string } | undefined;
  const dates = p.dates as { startDate?: string; estimatedEndDate?: string } | undefined;
  const budget = p.budget as { estimatedCost?: number; actualCost?: number } | undefined;
  const jobStage = (p.jobStage as string) || '';

  const currentIdx = SCRIPT_PHASE_ORDER.indexOf(jobStage as ScriptPhase);
  const isComplete = jobStage === 'complete';
  const phases = {} as Record<ScriptPhase, ScriptPhaseEntry>;

  SCRIPT_PHASE_ORDER.forEach((phase, i) => {
    if (isComplete || i < currentIdx) {
      phases[phase] = { status: 'complete', performanceColour: 'green' };
    } else if (i === currentIdx) {
      phases[phase] = { status: 'active' };
    } else {
      phases[phase] = { status: 'locked' };
    }
  });

  if (currentIdx === -1 && !isComplete) {
    SCRIPT_PHASE_ORDER.forEach(phase => { phases[phase] = { status: 'locked' }; });
  }

  const estimated = budget?.estimatedCost || 0;
  const actual = budget?.actualCost || 0;

  return {
    id: p.id as string,
    clientName: (p.name as string) || 'Unnamed',
    address: addr ? `${addr.street || ''}, ${addr.city || ''}`.replace(/^, |, $/g, '') : '',
    trades: ['FL'],
    sqft: 0,
    rooms: 0,
    startDate: dates?.startDate ? new Date(dates.startDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '',
    endDate: dates?.estimatedEndDate ? new Date(dates.estimatedEndDate).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '',
    phases,
    margin: estimated > 0 ? Math.round(((estimated - actual) / estimated) * 100) : undefined,
    quotedValue: estimated,
    actualValue: actual > 0 ? actual : undefined,
    notes: '',
  };
}

// ============================================================================
// CLEAR CHECKLIST TEMPLATE
// ============================================================================

const CLEAR_CHECKLIST: ChecklistItem[] = [
  { id: 1, type: 'normal', label: 'Existing flooring removed — all rooms in scope', note: '', checked: false },
  { id: 2, type: 'normal', label: 'Existing trim and moulding removed if in scope', note: '', checked: false },
  { id: 3, type: 'normal', label: 'Debris removed from site — no material left overnight', note: '', checked: false },
  { id: 4, type: 'killer', label: 'Subfloor moisture reading taken and logged', note: '⚑ Do not proceed to Ready if moisture exceeds threshold', checked: false },
  { id: 5, type: 'normal', label: 'Any rot, damage, or anomalies photographed and reported', note: '', checked: false },
  { id: 6, type: 'normal', label: 'Subfloor swept and vacuumed', note: '', checked: false },
  { id: 7, type: 'normal', label: 'Lock C phase with performance colour → advance to Ready', note: '🟢 Clean demo + moisture logged · 🟡 Minor issues noted · 🔴 Problems found', checked: false },
];

// ============================================================================
// HELPERS
// ============================================================================

function fmtCad(n: number): string {
  return `$${n.toLocaleString('en-CA')}`;
}

function phaseTabColour(e: ScriptPhaseEntry): string {
  if (e.status === 'active') return '#111010';
  if (e.status === 'complete' && e.performanceColour) return PERF_COLOURS[e.performanceColour];
  return '#9C9690';
}

function phaseDotStyle(e: ScriptPhaseEntry): { background: string; borderColor: string; color: string } {
  if (e.status === 'active') return { background: '#111010', borderColor: '#111010', color: '#FFFFFF' };
  if (e.status === 'complete' && e.performanceColour === 'green') return { background: '#EEF5F1', borderColor: '#90C4A8', color: '#2D7A4F' };
  if (e.status === 'complete' && e.performanceColour === 'amber') return { background: '#FDF7EE', borderColor: '#E8C98A', color: '#D4830A' };
  if (e.status === 'complete' && e.performanceColour === 'red') return { background: '#FDF2F1', borderColor: '#E8B4AF', color: '#C0392B' };
  return { background: '#E8E4DE', borderColor: '#D0CBC3', color: '#9C9690' };
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
          {isAuto && !item.checked && <span style={{ marginRight: 4 }}>⚡</span>}
          {isKiller && !item.checked && <span style={{ marginRight: 4 }}>⚑</span>}
          {item.label}
        </div>
        {item.note && (
          <div style={{ fontFamily: MONO, fontSize: 8.5, color: '#6B6560', marginTop: 2, lineHeight: 1.4 }}>
            {item.note}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// JOB CARD
// ============================================================================

function JobCard({ project, selected, onClick }: { project: Project; selected: boolean; onClick: () => void }) {
  const phaseEntry = project.phases[CURRENT_PHASE];
  const isActive = phaseEntry.status === 'active';
  const borderColor = selected ? '#111010' : isActive ? '#3B82F6' : '#90C4A8';

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
        <span style={{ fontFamily: FIG, fontWeight: 600, fontSize: 12.5, color: '#1A1714' }}>{project.clientName}</span>
        <span style={{ fontFamily: MONO, fontSize: 9.5, color: '#5C5349' }}>{fmtCad(project.quotedValue)}</span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 8, color: '#9C9690', marginTop: 3 }}>
        {project.address}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {project.trades.map((t) => (
            <span key={t} style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, letterSpacing: '0.06em', color: '#fff', background: TRADE_COLORS[t], borderRadius: 3, padding: '1px 5px' }}>{t}</span>
          ))}
        </div>
        <span style={{ fontFamily: MONO, fontSize: 8, color: '#9A8E84' }}>{project.sqft} sqft · {project.rooms} rm</span>
      </div>
      <div style={{ display: 'flex', gap: 3, marginTop: 7 }}>
        {SCRIPT_PHASE_KEYS.map((key, i) => {
          const ds = phaseDotStyle(project.phases[key]);
          return (
            <div
              key={key}
              title={`${SCRIPT_PHASE_LABELS[i]} — ${project.phases[key].status}`}
              style={{
                width: 15, height: 15, borderRadius: 0,
                background: ds.background, border: `1px solid ${ds.borderColor}`, color: ds.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: MONO, fontSize: 7, fontWeight: 500,
              }}
            >
              {SCRIPT_PHASE_LABELS[i]}
            </div>
          );
        })}
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
// EMPTY DETAIL
// ============================================================================

function EmptyDetail() {
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9C9690" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 10, opacity: 0.6 }}>
        <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" />
      </svg>
      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9C9690' }}>
        Select a job to open project
      </div>
    </div>
  );
}

// ============================================================================
// PROJECT DETAIL
// ============================================================================

function ProjectDetail({ project, onCheckToggle }: { project: Project & { checklist: ChecklistItem[] }; onCheckToggle: (projectId: string, itemId: number) => void }) {
  const [activeTab, setActiveTab] = useState<ScriptPhase>(CURRENT_PHASE);

  const tradesLabel = project.trades.join(' / ');
  const checkedCount = project.checklist.filter((c) => c.checked).length;
  const totalCount = project.checklist.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 14px', background: '#FAF8F5', borderBottom: '1px solid #E0DCD7', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FIG, fontWeight: 700, fontSize: 19, color: '#1A1714', lineHeight: 1.2 }}>{project.clientName}</div>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6560', marginTop: 4 }}>
              {project.address}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6560', marginTop: 2 }}>
              {project.sqft} SQFT · {project.rooms} ROOMS · {tradesLabel} · {project.startDate} — {project.endDate}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 2 }}>
            {project.foremanAssigned && (
              <span style={{ fontFamily: MONO, fontSize: 8, color: '#6B6560', background: '#F0EDE8', borderRadius: 4, padding: '2px 8px' }}>
                {project.foremanAssigned}
              </span>
            )}
            {project.margin != null && (
              <span style={{ fontFamily: MONO, fontSize: 8, color: project.margin >= 35 ? '#2D7A4F' : project.margin >= 15 ? '#D4830A' : '#C0392B', background: '#F0EDE8', borderRadius: 4, padding: '2px 8px' }}>
                {project.margin}% margin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* S·C·R·I·P·T Tab Bar */}
      <div style={{ display: 'flex', alignItems: 'stretch', background: '#FAF8F5', borderBottom: '1px solid #E0DCD7', flexShrink: 0, paddingLeft: 20, paddingRight: 20 }}>
        {SCRIPT_PHASE_KEYS.map((key, i) => {
          const entry = project.phases[key];
          const isAct = activeTab === key;
          const tc = isAct ? '#111010' : phaseTabColour(entry);
          const bb = isAct
            ? '3px solid #111010'
            : (entry.status === 'complete' && entry.performanceColour)
              ? `3px solid ${PERF_COLOURS[entry.performanceColour]}`
              : '3px solid transparent';
          return (
            <button key={key} onClick={() => setActiveTab(key)} style={{ background: 'none', border: 'none', borderBottom: bb, cursor: 'pointer', padding: '10px 12px 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 500, color: tc, lineHeight: 1 }}>{SCRIPT_PHASE_LABELS[i]}</span>
              <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: tc, lineHeight: 1 }}>{SCRIPT_PHASE_WORDS[i]}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {activeTab === CURRENT_PHASE ? (
          <SectionCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6560' }}>
                Clear — READ-DO Checklist
              </span>
              <span style={{ fontFamily: MONO, fontSize: 8, color: '#fff', background: '#111010', borderRadius: 4, padding: '2px 8px' }}>
                {checkedCount === totalCount ? 'Complete' : 'In Progress'} {checkedCount}/{totalCount}
              </span>
            </div>

            {project.checklist.map((item) => (
              <ChecklistRow
                key={item.id}
                item={item}
                onToggle={() => {
                  if (item.type === 'auto') return;
                  if (item.type === 'killer' && !item.checked) {
                    const ok = window.confirm('⚑ STOP & CONFIRM — This is a killer item. Verify before marking complete. Proceed?');
                    if (!ok) return;
                  }
                  onCheckToggle(project.id, item.id);
                }}
              />
            ))}
          </SectionCard>
        ) : (
          <SectionCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 500, color: '#1A1714' }}>
                {SCRIPT_PHASE_LABELS[SCRIPT_PHASE_KEYS.indexOf(activeTab)]}
              </span>
              <span style={{ fontFamily: FIG, fontSize: 14, fontWeight: 600, color: '#1A1714' }}>
                {SCRIPT_PHASE_WORDS[SCRIPT_PHASE_KEYS.indexOf(activeTab)]}
              </span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6560' }}>
              Status: {project.phases[activeTab].status}
              {project.phases[activeTab].completedDate && ` · Completed ${project.phases[activeTab].completedDate}`}
              {project.phases[activeTab].startDate && project.phases[activeTab].status === 'active' && ` · Started ${project.phases[activeTab].startDate}`}
            </div>
            {project.phases[activeTab].performanceColour && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PERF_COLOURS[project.phases[activeTab].performanceColour!] }} />
                <span style={{ fontFamily: MONO, fontSize: 9, color: PERF_COLOURS[project.phases[activeTab].performanceColour!], textTransform: 'capitalize' }}>
                  {project.phases[activeTab].performanceColour}
                </span>
              </div>
            )}
          </SectionCard>
        )}

        {/* Notes & Details */}
        <div style={{ marginTop: 16 }}>
          <SectionCard>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6560', marginBottom: 10 }}>
              Job Details
            </div>
            <DetailRow label="Quoted" value={fmtCad(project.quotedValue)} />
            {project.actualValue != null && <DetailRow label="Actual" value={fmtCad(project.actualValue)} />}
            {project.pmAssigned && <DetailRow label="PM" value={project.pmAssigned} />}
            {project.foremanAssigned && <DetailRow label="Foreman" value={project.foremanAssigned} />}
            {project.notes && (
              <div style={{ fontFamily: FIG, fontSize: 11.5, color: '#5C5349', marginTop: 10, lineHeight: 1.5 }}>
                {project.notes}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CLEAR PAGE
// ============================================================================

export default function ClearPage() {
  const { data: projectData, isLoading: projectsLoading } = useLocalProjects();
  const allProjects = useMemo(() => {
    if (!projectData?.projects) return [];
    return projectData.projects.map(p => mapIDBProject(p as Record<string, unknown>));
  }, [projectData]);

  // Filter to jobs relevant to this phase (active or complete in CURRENT_PHASE)
  const relevantJobs = useMemo(() =>
    allProjects.filter(p => p.phases[CURRENT_PHASE].status === 'active' || p.phases[CURRENT_PHASE].status === 'complete'),
    [allProjects]
  );

  const [projects, setProjects] = useState<(Project & { checklist: ChecklistItem[] })[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Sync relevantJobs into local state with checklists (preserve checked state)
  useMemo(() => {
    setProjects(prev => {
      const prevMap = new Map(prev.map(p => [p.id, p]));
      return relevantJobs.map(p => {
        const existing = prevMap.get(p.id);
        return { ...p, checklist: existing?.checklist ?? CLEAR_CHECKLIST.map(c => ({ ...c })) };
      });
    });
  }, [relevantJobs]);

  const selectedProject = projects.find((p) => p.id === selectedId) ?? null;

  const handleCheckToggle = useCallback((projectId: string, itemId: number) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          checklist: p.checklist.map((c) =>
            c.id === itemId ? { ...c, checked: !c.checked } : c,
          ),
        };
      }),
    );
  }, []);

  if (projectsLoading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', background: '#F0EDE8' }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9C9690' }}>Loading projects...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#F0EDE8' }}>
      {/* Jobs Panel */}
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
            Clear — Active Jobs
          </span>
          <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, color: '#fff', background: '#111010', borderRadius: 8, padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>
            {projects.length}
          </span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {projects.map((project) => (
            <JobCard key={project.id} project={project} selected={selectedId === project.id} onClick={() => setSelectedId(project.id)} />
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedProject ? (
          <ProjectDetail key={selectedProject.id} project={selectedProject} onCheckToggle={handleCheckToggle} />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyDetail />
          </div>
        )}
      </div>
    </div>
  );
}
